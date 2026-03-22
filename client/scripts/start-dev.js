const net = require("net");
const { spawn } = require("child_process");

const basePort = Number(process.env.PORT || 3000);
const maxScanRange = 50;

function checkHostPortFree(port, host) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error && error.code === "EAFNOSUPPORT") {
        resolve(true);
        return;
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen({ port, host, exclusive: true });
  });
}

async function isPortFree(port) {
  const ipv4Free = await checkHostPortFree(port, "0.0.0.0");
  if (!ipv4Free) return false;

  const ipv6Free = await checkHostPortFree(port, "::");
  return ipv6Free;
}

async function findFreePort(startPort) {
  for (let port = startPort; port <= startPort + maxScanRange; port += 1) {
    // eslint-disable-next-line no-await-in-loop
    const free = await isPortFree(port);
    if (free) return port;
  }
  return startPort;
}

async function main() {
  const port = await findFreePort(basePort);

  const env = {
    ...process.env,
    PORT: String(port),
    BROWSER: process.env.BROWSER || "none",
    DISABLE_ESLINT_PLUGIN: process.env.DISABLE_ESLINT_PLUGIN || "true",
  };

  console.log(`Starting frontend on port ${port}`);

  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "react-scripts start"], {
          stdio: "inherit",
          env,
        })
      : spawn("npx", ["react-scripts", "start"], {
          stdio: "inherit",
          env,
        });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("Failed to start development server:", error);
  process.exit(1);
});
