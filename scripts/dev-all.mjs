import { spawn } from "node:child_process";

const processes = [];
let shuttingDown = false;

function startProcess(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      console.error(`[${name}] exited with code ${code ?? "null"}${signal ? ` (signal ${signal})` : ""}`);
      shutdown(code ?? 1);
    }
  });

  processes.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of processes) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of processes) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(exitCode);
  }, 1000).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev:all] Starting API on http://127.0.0.1:3000");
startProcess("api", "npm", ["run", "api:dev"]);

console.log("[dev:all] Starting frontend on http://127.0.0.1:5173");
startProcess("web", "npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"]);
