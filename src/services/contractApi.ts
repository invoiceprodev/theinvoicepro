import type { Invoice, Expense } from "@/types";

export interface Contract {
  id: string;
  company_name: string;
  client_name: string;
  contract_type: string;
  services_description: string;
  generated_content: string;
  created_at: string;
}

export interface ContractAiStatus {
  openAiConfigured: boolean;
  llamaParseConfigured: boolean;
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
  uploadedDocumentId: string | null;
}

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
}

export async function getContractStatus() {
  return Promise.resolve({
    data: { openAiConfigured: false, llamaParseConfigured: false },
  });
}

export async function uploadContractDocument(file: File) {
  return Promise.resolve({
    data: { id: "stub", name: file.name, url: URL.createObjectURL(file) },
  });
}

export async function generateContract(values: ContractFormValues) {
  return Promise.resolve({
    data: {
      id: "stub-contract",
      company_name: values.companyName,
      client_name: values.clientName,
      contract_type: values.contractType,
      services_description: values.servicesDescription,
      generated_content: `<p>${values.servicesDescription}</p>`,
      created_at: new Date().toISOString(),
    } as Contract,
    uploadedDocument: null,
  });
}

export async function getContract(id: string) {
  return Promise.resolve({
    data: {
      id,
      company_name: "Acme Corp",
      client_name: "Client Name",
      contract_type: "Service Agreement",
      services_description: "Generated contract details.",
      generated_content: "<p>Generated contract content.</p>",
      created_at: new Date().toISOString(),
    } as Contract,
  });
}

export async function downloadContractPdf(id: string) {
  const blob = new Blob([`Contract PDF for ${id}`], {
    type: "application/pdf",
  });
  return Promise.resolve(blob);
}
