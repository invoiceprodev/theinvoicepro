import type { Request } from "express";
import type { AuthenticatedUser } from "../auth.js";

export type AuthedRequest = Request & { user?: AuthenticatedUser };

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ContractFormInput {
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

export interface UploadedDocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  storage_path: string;
  parsed_text: string | null;
  created_at: string;
}

export interface ContractRecord {
  id: string;
  user_id: string;
  uploaded_document_id: string | null;
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
}
