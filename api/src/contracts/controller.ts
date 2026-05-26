import type { Response } from "express";
import { getContractsAiStatus } from "./status.js";
import {
  generateAndSaveContract,
  generateContractPdfForUser,
  getContractForUser,
  listContractsForUser,
  resolveProfileId,
  sanitizeContractInput,
} from "./service.js";
import { uploadContractDocument } from "./upload.js";
import type { AuthedRequest, UploadedFileLike } from "./types.js";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function getContractsStatusHandler(_req: AuthedRequest, res: Response) {
  res.json({ data: getContractsAiStatus() });
}

export async function uploadContractDocumentHandler(req: AuthedRequest, res: Response) {
  const user = req.user;
  const uploadedFile = (req as AuthedRequest & { file?: UploadedFileLike }).file;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!uploadedFile) {
    res.status(400).json({ error: "A file is required." });
    return;
  }

  try {
    const profileId = await resolveProfileId(user);
    const uploadedDocument = await uploadContractDocument({
      profileId,
      file: uploadedFile,
    });

    res.status(201).json({ data: uploadedDocument });
  } catch (error) {
    console.error("[Contracts] upload failed", error);
    res.status(400).json({ error: getErrorMessage(error, "Failed to upload document.") });
  }
}

export async function generateContractHandler(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const input = sanitizeContractInput((req.body || {}) as Record<string, unknown>);
    const result = await generateAndSaveContract(user, input);
    res.status(201).json({ data: result.contract, uploadedDocument: result.uploadedDocument || null });
  } catch (error) {
    console.error("[Contracts] generation failed", error);
    res.status(400).json({ error: getErrorMessage(error, "Failed to generate contract.") });
  }
}

export async function listContractsHandler(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await listContractsForUser(user);
    res.json(result);
  } catch (error) {
    console.error("[Contracts] list failed", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load contracts.") });
  }
}

export async function getContractHandler(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const contract = await getContractForUser(user, String(req.params.id || ""));
    if (!contract) {
      res.status(404).json({ error: "Contract not found." });
      return;
    }

    res.json({ data: contract });
  } catch (error) {
    console.error("[Contracts] get failed", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to load contract.") });
  }
}

export async function downloadContractPdfHandler(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const result = await generateContractPdfForUser(user, String(req.params.id || ""));
    if (!result) {
      res.status(404).json({ error: "Contract not found." });
      return;
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error("[Contracts] pdf failed", error);
    res.status(500).json({ error: getErrorMessage(error, "Failed to generate contract PDF.") });
  }
}
