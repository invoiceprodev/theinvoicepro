import { resolve } from "node:path";

process.loadEnvFile?.(resolve(process.cwd(), ".env"));

const [{ app }, { apiConfig }] = await Promise.all([import("./server.js"), import("./config.js")]);

app.listen(apiConfig.port, () => {
  console.log(`[API] listening on http://127.0.0.1:${apiConfig.port}`);
});
