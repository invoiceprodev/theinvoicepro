import OpenAI from "openai";
import { apiConfig } from "../config.js";

let openAiClient: OpenAI | null = null;

function getOpenAiClient() {
  if (!apiConfig.openAiApiKey) {
    throw new Error("OpenAI is not configured.");
  }

  if (!openAiClient) {
    openAiClient = new OpenAI({ apiKey: apiConfig.openAiApiKey });
  }

  return openAiClient;
}

export async function generateContractHtmlWithOpenAi(prompt: string) {
  const client = getOpenAiClient();
  const completion = await client.chat.completions.create({
    model: apiConfig.openAiContractModel,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: "You produce professional business contract drafts as valid HTML.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}
