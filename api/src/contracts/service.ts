import { adminSupabase } from "../supabase.js";
import { sanitizeContractHtml } from "./html.js";
import { buildContractHtmlFallback, buildContractPrompt } from "./prompt.js";
import { renderContractPdfBuffer } from "./pdfService.js";
import { generateContractHtmlWithOpenAi } from "./openaiService.js";
import type { AuthenticatedUser } from "../auth.js";
import type { ContractFormInput, ContractRecord, UploadedDocumentRecord } from "./types.js";

function sanitizeText(value: unknown, fieldName: string, maxLength = 4000) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }
  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }
  return normalized;
}

function sanitizeOptionalText(value: unknown, maxLength = 4000) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }
  if (normalized.length > maxLength) {
    throw new Error("Additional notes are too long.");
  }
  return normalized;
}

export function sanitizeContractInput(payload: Record<string, unknown>): ContractFormInput {
  return {
    companyName: sanitizeText(payload.companyName, "Company name", 200),
    clientName: sanitizeText(payload.clientName, "Client name", 200),
    contractType: sanitizeText(payload.contractType, "Contract type", 160),
    servicesDescription: sanitizeText(payload.servicesDescription, "Services description", 6000),
    paymentTerms: sanitizeText(payload.paymentTerms, "Payment terms", 2000),
    contractDuration: sanitizeText(payload.contractDuration, "Contract duration", 500),
    jurisdiction: sanitizeText(payload.jurisdiction, "Jurisdiction", 200),
    additionalNotes: sanitizeOptionalText(payload.additionalNotes, 3000),
    uploadedDocumentId:
      typeof payload.uploadedDocumentId === "string" && payload.uploadedDocumentId.trim()
        ? payload.uploadedDocumentId.trim()
        : null,
  };
}

export async function resolveProfileId(user: AuthenticatedUser) {
  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", user.sub)
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to resolve profile for authenticated user.");
  }

  return String(data.id);
}

async function loadUploadedDocumentForUser(profileId: string, uploadedDocumentId?: string | null) {
  if (!uploadedDocumentId) {
    return null;
  }

  const { data, error } = await adminSupabase
    .from("uploaded_documents")
    .select("*")
    .eq("id", uploadedDocumentId)
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load uploaded document: ${error.message}`);
  }

  return (data as UploadedDocumentRecord | null) || null;
}

export async function generateAndSaveContract(user: AuthenticatedUser, input: ContractFormInput) {
  const profileId = await resolveProfileId(user);
  const uploadedDocument = await loadUploadedDocumentForUser(profileId, input.uploadedDocumentId);
  const prompt = buildContractPrompt(input, uploadedDocument?.parsed_text);

  let generatedContent = "";
  try {
    generatedContent = await generateContractHtmlWithOpenAi(prompt);
  } catch (error) {
    console.error("[Contracts] OpenAI generation failed", error);
    generatedContent = buildContractHtmlFallback(input);
  }

  if (!generatedContent) {
    generatedContent = buildContractHtmlFallback(input);
  }

  generatedContent = sanitizeContractHtml(generatedContent);

  const { data, error } = await adminSupabase
    .from("contracts")
    .insert({
      user_id: profileId,
      uploaded_document_id: uploadedDocument?.id || null,
      company_name: input.companyName,
      client_name: input.clientName,
      contract_type: input.contractType,
      services_description: input.servicesDescription,
      payment_terms: input.paymentTerms,
      contract_duration: input.contractDuration,
      jurisdiction: input.jurisdiction,
      additional_notes: input.additionalNotes || null,
      generated_content: generatedContent,
    })
    .select("*")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to save generated contract.");
  }

  return {
    contract: data as ContractRecord,
    uploadedDocument,
  };
}

export async function listContractsForUser(user: AuthenticatedUser) {
  const profileId = await resolveProfileId(user);
  const { data, error, count } = await adminSupabase
    .from("contracts")
    .select("*", { count: "exact" })
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data || []) as ContractRecord[],
    total: count || 0,
  };
}

export async function getContractForUser(user: AuthenticatedUser, contractId: string) {
  const profileId = await resolveProfileId(user);
  const { data, error } = await adminSupabase
    .from("contracts")
    .select("*, uploaded_document:uploaded_documents(*)")
    .eq("id", contractId)
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return data;
}

export async function generateContractPdfForUser(user: AuthenticatedUser, contractId: string) {
  const contract = await getContractForUser(user, contractId);
  if (!contract) {
    return null;
  }

  return {
    fileName: `contract-${Date.now()}.pdf`,
    buffer: await renderContractPdfBuffer(String(contract.generated_content || "")),
    contract,
  };
}
