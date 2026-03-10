import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envFilePath = resolve(process.cwd(), ".env");
if (existsSync(envFilePath)) {
  process.loadEnvFile?.(envFilePath);
}

const [{ app }, { apiConfig }] = await Promise.all([import("./server.js"), import("./config.js")]);

app.listen(apiConfig.port, () => {
  console.log(`[API] listening on http://127.0.0.1:${apiConfig.port}`);
});
