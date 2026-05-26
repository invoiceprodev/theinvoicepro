import { apiRequest, apiRequestBlob } from "@/lib/api-client";

export interface UploadedDocument {
  id: string;
  file_name: string;
  mime_type: string;
  parsed_text: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  company_name: string;
  client_name: string;
  contract_type: string;
  services_description: string;
  payment_terms: string;
  contract_duration: string;
  jurisdiction: string;
  additional_notes: string | null;
  generated_content: string;
  created_at: string;
  updated_at: string;
  uploaded_document_id?: string | null;
  uploaded_document?: UploadedDocument | null;
}

export interface ContractAiStatus {
  openAiConfigured: boolean;
  llamaParseConfigured: boolean;
  contractGenerationMode: "ai" | "fallback";
  documentParsingEnabled: boolean;
}

export interface ContractFormValues {
  companyName: string;
  clientName: string;
  contractType: string;
  servicesDescription: string;
  paymentTerms: string;
  contractDuration: string;
  jurisdiction: string;
  additionalNotes: string;
  uploadedDocumentId?: string | null;
}

export async function uploadContractDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<{ data: UploadedDocument }>("/contracts/upload", {
    method: "POST",
    body: formData,
  });
}

export async function generateContract(values: ContractFormValues) {
  return apiRequest<{ data: Contract; uploadedDocument: UploadedDocument | null }>("/contracts/generate", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export async function getContractStatus() {
  return apiRequest<{ data: ContractAiStatus }>("/contracts/status");
}

export async function getContract(id: string) {
  return apiRequest<{ data: Contract }>(`/contracts/${id}`);
}

export async function downloadContractPdf(id: string) {
  return apiRequestBlob(`/contracts/${id}/pdf`);
}
