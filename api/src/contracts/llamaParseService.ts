import { createReadStream } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import LlamaCloud from "@llamaindex/llama-cloud";
import { apiConfig } from "../config.js";

let llamaClient: LlamaCloud | null = null;

function getLlamaClient() {
  if (!apiConfig.llamaParseApiKey) {
    return null;
  }

  if (!llamaClient) {
    llamaClient = new LlamaCloud({
      apiKey: apiConfig.llamaParseApiKey,
    });
  }

  return llamaClient;
}

function extractMarkdownText(payload: unknown) {
  const candidate = payload as {
    markdown?: {
      pages?: Array<{ markdown?: string | null }>;
    };
  };

  const pageMarkdown = candidate.markdown?.pages?.map((page) => page.markdown || "").filter(Boolean) || [];
  return pageMarkdown.join("\n\n").trim();
}

export async function parseDocumentWithLlama(buffer: Buffer, originalName: string) {
  const client = getLlamaClient();
  if (!client) {
    return null;
  }

  const tempPath = join(tmpdir(), `contract-upload-${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`);

  try {
    await writeFile(tempPath, buffer);

    const file = await client.files.create({
      file: createReadStream(tempPath),
      purpose: "parse",
    });

    const result = await client.parsing.parse({
      file_id: file.id,
      tier: "agentic",
      version: "latest",
      expand: ["markdown"],
    });

    return extractMarkdownText(result) || null;
  } finally {
    await unlink(tempPath).catch(() => undefined);
  }
}
