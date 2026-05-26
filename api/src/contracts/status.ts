import { apiConfig } from "../config.js";

export function getContractsAiStatus() {
  const openAiConfigured = Boolean(apiConfig.openAiApiKey);
  const llamaParseConfigured = Boolean(apiConfig.llamaParseApiKey);

  return {
    openAiConfigured,
    llamaParseConfigured,
    contractGenerationMode: openAiConfigured ? "ai" : "fallback",
    documentParsingEnabled: llamaParseConfigured,
  };
}
