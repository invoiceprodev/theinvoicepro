import { spawn } from "node:child_process";

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "3000";
const baseUrl = `http://${host}:${port}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const templates = [
  "welcome",
  "invoice",
  "expense-receipt",
  "trial-started",
  "trial-ending",
  "subscription-activated",
  "payment-failed",
  "team-invite",
  "footer-subscription",
  "test",
];

function printPreviewHelp() {
  console.log("[email:preview] API email preview routes");
  console.log(`[email:preview] Index: ${baseUrl}/emails/previews`);

  for (const template of templates) {
    console.log(
      `[email:preview] ${template}: ${baseUrl}/emails/previews/${template}`,
    );
  }

  console.log(
    `[email:preview] Text format: ${baseUrl}/emails/previews/<template>?format=text`,
  );
  console.log("[email:preview] Press Ctrl+C to stop the API watcher.");
}

const child = spawn(npmCommand, ["run", "api:dev"], {
  stdio: "inherit",
  env: process.env,
});

printPreviewHelp();

const shutdown = (code = 0) => {
  if (!child.killed) {
    child.kill("SIGTERM");
  }
  process.exit(code);
};

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
