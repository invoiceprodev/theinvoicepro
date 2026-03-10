import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFilePath = resolve(process.cwd(), ".env");
if (existsSync(envFilePath)) {
  process.loadEnvFile?.(envFilePath);
}

const [{ app }, { apiConfig }] = await Promise.all([import("./server.js"), import("./config.js")]);
const host = process.env.HOST || "0.0.0.0";

app.listen(apiConfig.port, host, () => {
  const displayHost = host === "0.0.0.0" ? "localhost" : host;
  console.log(`[API] listening on http://${displayHost}:${apiConfig.port}`);
});
