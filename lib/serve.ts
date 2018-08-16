import { utimes } from "fs";
import { spawn } from "child_process";
import * as serve from "webpack-serve";
import { getWebpackConfig } from "./getWebpackConfig";
import {
  CLIENT_ENTRY_POINT,
  SERVER_ENTRY_POINT,
  SERVER_STARTED_SIGNAL
} from "./constants";

export function main() {
  const clientPort = parseInt(process.env.CLIENT_PORT || "4444", 10);
  const serverPort = parseInt(process.env.SERVER_PORT || "4445", 10);
  const webSocketPort = parseInt(process.env.WEB_SOCKET_PORT || "4446", 10);
  const serverDebugPort = process.env.SERVER_DEBUG_PORT
    ? parseInt(process.env.SERVER_DEBUG_PORT, 10)
    : undefined;

  startServer(serverPort, serverDebugPort);
  startClient(
    clientPort,
    webSocketPort,
    serverPort,
    typeof serverDebugPort === "number" /* debug */
  );
}

function startServer(serverPort: number, serverDebugPort?: number) {
  const startArgs = ["--no-notify", "--transpileOnly"];
  const endArgs = [SERVER_ENTRY_POINT];

  const child = spawn(
    "./node_modules/.bin/ts-node-dev",
    typeof serverDebugPort === "number"
      ? [...startArgs, `--inspect-brk=${serverDebugPort}`, ...endArgs]
      : [...startArgs, ...endArgs],
    {
      env: { ...process.env, PORT: serverPort.toString() }
    }
  );

  process.on("exit", () => {
    child.kill();
  });

  let firstServerStart = true;

  child.stdout.on("data", data => {
    if (data.toString().trim() === SERVER_STARTED_SIGNAL) {
      if (!firstServerStart) {
        // Modify this file to force the client to reload.
        utimes(CLIENT_ENTRY_POINT, new Date(), new Date(), error => {
          if (error) {
            throw error;
          }
        });
      }

      firstServerStart = false;
    }

    console.log(`[SERVER] ${data}`);
  });

  child.stderr.on("data", data => {
    console.log(`[SERVER] ${data}`);
  });
}

function startClient(
  clientPort: number,
  webSocketPort: number,
  serverPort: number,
  debug: boolean
) {
  const config = getWebpackConfig({
    mode: "development",
    publicPath: "/dist/client/",
    apiServerLocation: `http://localhost:${serverPort}`,
    serve: {
      webSocketPort,
      clientPort,
      debug
    }
  });

  serve({}, { config });
}
