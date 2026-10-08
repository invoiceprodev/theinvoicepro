-- ============================================================
-- AI Contracts MVP
-- ============================================================
-- Purpose:
-- Add tenant-owned contract generation and uploaded document tables
-- for the AI Contracts dashboard module.
--
-- Safe to re-run.
-- Run in Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS uploaded_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  parsed_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE uploaded_documents IS 'Tenant-owned source documents uploaded for AI contract generation';
COMMENT ON COLUMN uploaded_documents.storage_path IS 'Supabase Storage path for the original uploaded file';
COMMENT ON COLUMN uploaded_documents.parsed_text IS 'Plain text extracted from the source document for prompt context';

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_id ON uploaded_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_created_at ON uploaded_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user_created_at ON uploaded_documents(user_id, created_at DESC);

ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Users can insert own uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Users can update own uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Users can delete own uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can view all uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can insert any uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can update any uploaded documents" ON uploaded_documents;
DROP POLICY IF EXISTS "Admins can delete uploaded documents" ON uploaded_documents;

CREATE POLICY "Users can view own uploaded documents"
  ON uploaded_documents FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own uploaded documents"
  ON uploaded_documents FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own uploaded documents"
  ON uploaded_documents FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own uploaded documents"
  ON uploaded_documents FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all uploaded documents"
  ON uploaded_documents FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert any uploaded documents"
  ON uploaded_documents FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any uploaded documents"
  ON uploaded_documents FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete uploaded documents"
  ON uploaded_documents FOR DELETE
  USING (is_admin());

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_document_id UUID REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  services_description TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  contract_duration TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  additional_notes TEXT,
  generated_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contracts IS 'Tenant-owned AI-generated contracts';
COMMENT ON COLUMN contracts.generated_content IS 'Generated contract body stored as HTML';

CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_uploaded_document_id ON contracts(uploaded_document_id);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_user_created_at ON contracts(user_id, created_at DESC);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can insert own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update own contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete own contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can view all contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can insert any contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can update any contracts" ON contracts;
DROP POLICY IF EXISTS "Admins can delete contracts" ON contracts;

CREATE POLICY "Users can view own contracts"
  ON contracts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own contracts"
  ON contracts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contracts"
  ON contracts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own contracts"
  ON contracts FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all contracts"
  ON contracts FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert any contracts"
  ON contracts FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any contracts"
  ON contracts FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete contracts"
  ON contracts FOR DELETE
  USING (is_admin());

DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;

NOTIFY pgrst, 'reload schema';
