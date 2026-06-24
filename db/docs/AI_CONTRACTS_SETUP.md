# AI Contracts Setup

This guide covers the database, storage, and server env needed for the AI Contracts feature.

## What It Adds

- uploaded source documents stored in `uploaded_documents`
- generated contract drafts stored in `contracts`
- customer dashboard routes for list, create, detail, and PDF download
- optional `LlamaParse` document parsing before prompt generation
- optional OpenAI-backed HTML contract generation with a built-in fallback template

## Required Migration

Run:

- [`db/migrations/AI_CONTRACTS_MVP.sql`](/Users/jerry/Desktop/theinvoicepro-saas-invoicing-platform%202/db/migrations/AI_CONTRACTS_MVP.sql)

This creates:

- `uploaded_documents`
- `contracts`
- indexes for both tables
- RLS policies for users and admins
- the `contracts.updated_at` trigger

## Storage Bucket

Create a private Supabase Storage bucket named:

- `contract-documents`

Or set:

```env
SUPABASE_CONTRACTS_BUCKET=your-bucket-name
```

Notes:

- uploaded contract source files are not meant to be public
- the API can attempt bucket creation when the service role key has permission
- creating the bucket explicitly during environment setup is still recommended

## Server Env Vars

Required for the full AI flow:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_CONTRACT_MODEL=gpt-4.1-mini
LLAMA_PARSE_API_KEY=your-llamaparse-api-key
SUPABASE_CONTRACTS_BUCKET=contract-documents
```

Compatibility alias:

```env
LLAMA_CLOUD_API_KEY=
```

## Runtime Behavior

- if `OPENAI_API_KEY` is set, the API generates contract HTML with the configured model
- if `OPENAI_API_KEY` is missing, generation falls back to the built-in HTML template
- if `LLAMA_PARSE_API_KEY` or `LLAMA_CLOUD_API_KEY` is set, uploaded `PDF` and `DOCX` files are parsed and their extracted markdown is added to the prompt
- if parsing is not configured, the file is still uploaded and linked to the contract, but prompt enrichment is skipped
- generated HTML is sanitized on the server before save, dashboard rendering, and PDF generation

## API Endpoints

- `GET /contracts/status`
- `GET /contracts`
- `GET /contracts/:id`
- `GET /contracts/:id/pdf`
- `POST /contracts/upload`
- `POST /contracts/generate`

## Quick Verification

After setup, verify:

1. the migration has been run successfully
2. the storage bucket exists and is private
3. the API has `SUPABASE_SERVICE_ROLE_KEY`
4. `GET /contracts/status` reports the expected readiness values
5. a customer user can upload a `PDF` or `DOCX`, generate a draft, open the saved contract page, and download the PDF
