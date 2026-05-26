import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  downloadContractPdfHandler,
  generateContractHandler,
  getContractsStatusHandler,
  getContractHandler,
  listContractsHandler,
  uploadContractDocumentHandler,
} from "./controller.js";
import { contractUploadMiddleware } from "./upload.js";

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads. Please try again shortly." },
});

const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many generation requests. Please try again shortly." },
});

export const contractsRouter = Router();

contractsRouter.get("/status", getContractsStatusHandler);
contractsRouter.get("/", listContractsHandler);
contractsRouter.get("/:id", getContractHandler);
contractsRouter.get("/:id/pdf", downloadContractPdfHandler);
contractsRouter.post("/upload", uploadLimiter, contractUploadMiddleware.single("file"), uploadContractDocumentHandler);
contractsRouter.post("/generate", generateLimiter, generateContractHandler);
