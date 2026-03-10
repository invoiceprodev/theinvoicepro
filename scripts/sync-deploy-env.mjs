import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const PROD = {
  customerAppUrl: "https://theinvoicepro.co.za",
  adminAppUrl: "https://admin.theinvoicepro.co.za",
  apiUrl: "https://api.theinvoicepro.co.za",
  payfastNotifyUrl: "https://api.theinvoicepro.co.za/payfast/webhook",
  auth0Audience: "https://api.theinvoicepro.co.za",
  auth0RoleClaim: "https://theinvoicepro.co.za/roles",
};

function parseEnvFile(content) {
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1);
    env[key] = value;
  }

  return env;
}

function requireKeys(source, keys) {
  const missing = keys.filter((key) => !source[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env values in .env: ${missing.join(", ")}`);
  }
}

function getTargetConfig(target, source) {
  if (target === "railway") {
    requireKeys(source, [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "AUTH0_DOMAIN",
      "AUTH0_AUDIENCE",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "PAYFAST_MERCHANT_ID",
      "PAYFAST_MERCHANT_KEY",
      "PAYFAST_PASSPHRASE",
      "PAYFAST_MODE",
    ]);

    return {
      platform: "railway",
      values: {
        PORT: source.PORT || "3000",
        API_BASE_URL: PROD.apiUrl,
        CUSTOMER_APP_URL: PROD.customerAppUrl,
        ADMIN_APP_URL: PROD.adminAppUrl,
        SUPABASE_URL: source.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_BRANDING_BUCKET: source.SUPABASE_BRANDING_BUCKET || "company-branding",
        AUTH0_DOMAIN: source.AUTH0_DOMAIN,
        AUTH0_AUDIENCE: source.AUTH0_AUDIENCE || PROD.auth0Audience,
        RESEND_API_KEY: source.RESEND_API_KEY,
        RESEND_FROM_EMAIL: source.RESEND_FROM_EMAIL,
        PAYFAST_MERCHANT_ID: source.PAYFAST_MERCHANT_ID,
        PAYFAST_MERCHANT_KEY: source.PAYFAST_MERCHANT_KEY,
        PAYFAST_PASSPHRASE: source.PAYFAST_PASSPHRASE,
        PAYFAST_MODE: source.PAYFAST_MODE || "live",
        PAYFAST_NOTIFY_URL: source.PAYFAST_NOTIFY_URL || PROD.payfastNotifyUrl,
      },
    };
  }

  if (target === "vercel-customer") {
    requireKeys(source, [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_CUSTOMER_AUTH0_DOMAIN",
      "VITE_CUSTOMER_AUTH0_CLIENT_ID",
      "VITE_CUSTOMER_AUTH0_AUDIENCE",
      "VITE_CUSTOMER_AUTH0_CONNECTION",
    ]);

    return {
      platform: "vercel",
      projectIdEnv: "VERCEL_CUSTOMER_PROJECT_ID",
      values: {
        VITE_APP_URL: PROD.customerAppUrl,
        VITE_API_URL: PROD.apiUrl,
        VITE_SUPABASE_URL: source.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: source.VITE_SUPABASE_ANON_KEY,
        VITE_AUTH0_ROLE_CLAIM: source.VITE_AUTH0_ROLE_CLAIM || PROD.auth0RoleClaim,
        VITE_AUTH_MODE: source.VITE_AUTH_MODE || "auth0",
        VITE_CUSTOMER_AUTH0_DOMAIN: source.VITE_CUSTOMER_AUTH0_DOMAIN,
        VITE_CUSTOMER_AUTH0_CLIENT_ID: source.VITE_CUSTOMER_AUTH0_CLIENT_ID,
        VITE_CUSTOMER_AUTH0_AUDIENCE: source.VITE_CUSTOMER_AUTH0_AUDIENCE || PROD.auth0Audience,
        VITE_CUSTOMER_AUTH0_REDIRECT_URI: `${PROD.customerAppUrl}/auth/callback`,
        VITE_CUSTOMER_AUTH0_CONNECTION: source.VITE_CUSTOMER_AUTH0_CONNECTION,
      },
    };
  }

  if (target === "vercel-admin") {
    requireKeys(source, [
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_ADMIN_AUTH0_DOMAIN",
      "VITE_ADMIN_AUTH0_CLIENT_ID",
      "VITE_ADMIN_AUTH0_AUDIENCE",
      "VITE_ADMIN_AUTH0_CONNECTION",
    ]);

    return {
      platform: "vercel",
      projectIdEnv: "VERCEL_ADMIN_PROJECT_ID",
      values: {
        VITE_APP_URL: PROD.adminAppUrl,
        VITE_API_URL: PROD.apiUrl,
        VITE_SUPABASE_URL: source.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: source.VITE_SUPABASE_ANON_KEY,
        VITE_AUTH0_ROLE_CLAIM: source.VITE_AUTH0_ROLE_CLAIM || PROD.auth0RoleClaim,
        VITE_AUTH_MODE: source.VITE_AUTH_MODE || "auth0",
        VITE_ADMIN_AUTH0_DOMAIN: source.VITE_ADMIN_AUTH0_DOMAIN,
        VITE_ADMIN_AUTH0_CLIENT_ID: source.VITE_ADMIN_AUTH0_CLIENT_ID,
        VITE_ADMIN_AUTH0_AUDIENCE: source.VITE_ADMIN_AUTH0_AUDIENCE || PROD.auth0Audience,
        VITE_ADMIN_AUTH0_REDIRECT_URI: `${PROD.adminAppUrl}/callback`,
        VITE_ADMIN_AUTH0_CONNECTION: source.VITE_ADMIN_AUTH0_CONNECTION,
      },
    };
  }

  throw new Error(`Unknown target "${target}". Expected one of: railway, vercel-customer, vercel-admin.`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: options.input ? ["pipe", "inherit", "inherit"] : "inherit",
      env: { ...process.env, ...(options.env || {}) },
      cwd: process.cwd(),
    });

    if (options.input) {
      child.stdin.write(options.input);
      child.stdin.end();
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function syncRailway(values) {
  const service = process.env.RAILWAY_SERVICE;
  const environment = process.env.RAILWAY_ENVIRONMENT;

  if (!service) {
    throw new Error("Set RAILWAY_SERVICE before syncing Railway variables.");
  }

  for (const [key, value] of Object.entries(values)) {
    const args = ["variable", "set", `${key}=${value}`, "--service", service];
    if (environment) {
      args.push("--environment", environment);
    }
    await runCommand("./node_modules/.bin/railway", args);
  }
}

async function syncVercel(values, projectIdEnv) {
  const projectId = process.env[projectIdEnv];
  const orgId = process.env.VERCEL_ORG_ID;

  if (!projectId) {
    throw new Error(`Set ${projectIdEnv} before syncing Vercel variables.`);
  }

  if (!orgId) {
    throw new Error("Set VERCEL_ORG_ID before syncing Vercel variables.");
  }

  const env = {
    VERCEL_PROJECT_ID: projectId,
    VERCEL_ORG_ID: orgId,
  };

  for (const [key, value] of Object.entries(values)) {
    await runCommand(
      "./node_modules/.bin/vercel",
      ["env", "add", key, "production", "--value", value, "--yes", "--force"],
      { env },
    );
  }
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Usage: node scripts/sync-deploy-env.mjs <railway|vercel-customer|vercel-admin>");
  }

  const envContent = await readFile(".env", "utf8");
  const source = parseEnvFile(envContent);
  const config = getTargetConfig(target, source);

  if (config.platform === "railway") {
    await syncRailway(config.values);
    return;
  }

  await syncVercel(config.values, config.projectIdEnv);
}

main().catch((error) => {
  console.error("[env-sync]", error instanceof Error ? error.message : error);
  process.exit(1);
});
