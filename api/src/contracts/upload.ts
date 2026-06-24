import multer from "multer";
import { apiConfig } from "../config.js";
import { adminSupabase } from "../supabase.js";
import { parseDocumentWithLlama } from "./llamaParseService.js";
import type { UploadedDocumentRecord, UploadedFileLike } from "./types.js";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const contractUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

function normalizeStorageSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9/_-]/g, "");
}

async function ensureContractsBucket() {
  const { data: buckets, error: listError } = await adminSupabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to inspect storage buckets: ${listError.message}`);
  }

  if (buckets.some((bucket) => bucket.name === apiConfig.supabaseContractsBucket)) {
    return;
  }

  const { error: createError } = await adminSupabase.storage.createBucket(apiConfig.supabaseContractsBucket, {
    public: false,
    fileSizeLimit: MAX_UPLOAD_BYTES,
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Failed to create contracts storage bucket: ${createError.message}`);
  }
}

export async function uploadContractDocument(params: {
  profileId: string;
  file: UploadedFileLike;
}): Promise<UploadedDocumentRecord> {
  const { file, profileId } = params;

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new Error("Only PDF and DOCX files are allowed.");
  }

  await ensureContractsBucket();

  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `contracts/${normalizeStorageSegment(profileId)}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await adminSupabase.storage
    .from(apiConfig.supabaseContractsBucket)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload contract document: ${uploadError.message}`);
  }

  let parsedText: string | null = null;
  try {
    parsedText = await parseDocumentWithLlama(file.buffer, sanitizedName);
  } catch (error) {
    console.error("[Contracts] document parsing failed", error);
  }

  const { data, error } = await adminSupabase
    .from("uploaded_documents")
    .insert({
      user_id: profileId,
      file_name: file.originalname,
      mime_type: file.mimetype,
      storage_path: storagePath,
      parsed_text: parsedText,
    })
    .select("*")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "Failed to save uploaded document metadata.");
  }

  return data as UploadedDocumentRecord;
}
