import { utimes } from "fs";
import { spawn } from "child_process";
import * as ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import * as ForkTsCheckerNotifierWebpackPlugin from "fork-ts-checker-notifier-webpack-plugin";
import * as WebSocket from "ws";
import { Configuration } from "webpack";
import * as path from "path";
import * as serve from "webpack-serve";

export function main() {
  const clientPort = parseInt(process.env.CLIENT_PORT || "4444", 10);
  const serverPort = parseInt(process.env.SERVER_PORT || "4445", 10);
  const webSocketPort = parseInt(process.env.WEB_SOCKET_PORT || "4446", 10);
  const serverDebugPort = process.env.SERVER_DEBUG_PORT
    ? parseInt(process.env.SERVER_DEBUG_PORT, 10)
    : undefined;

  startServer(serverPort, serverDebugPort);
  startClient(clientPort, webSocketPort);
}

function startServer(serverPort: number, serverDebugPort?: number) {
  const startArgs = ["--no-notify", "--transpileOnly"];
  const endArgs = ["./server/index.ts"];

  const child = spawn(
    "ts-node-dev",
    typeof serverDebugPort === "number"
      ? [...startArgs, `--inspect-brk=${serverDebugPort}`, ...endArgs]
      : [...startArgs, ...endArgs],
    {
      env: {
        PORT: serverPort.toString()
      }
    }
  );

  process.on("exit", () => {
    child.kill();
  });

  let firstServerStart = true;

  child.stdout.on("data", data => {
    if (data.toString().trim() === "SERVER_STARTED") {
      if (!firstServerStart) {
        // Modify this file to force the client to reload.
        utimes("./client/index.ts", new Date(), new Date(), error => {
          throw error;
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

function startClient(clientPort: number, webSocketPort: number) {
  let reloadPage: Function | undefined;

  const config: Configuration = {
    entry: "./client/index.ts",
    mode: "development",
    serve: {
      content: "./public",
      clipboard: false,
      hotClient: {
        hmr: false,
        reload: false,
        host: "localhost",
        port: webSocketPort
      },
      port: clientPort,
      on: {
        listening({ server }) {
          const socket = new WebSocket(`ws://localhost:${webSocketPort}`);

          reloadPage = () => {
            const data = {
              type: "broadcast",
              data: {
                type: "window-reload",
                data: {}
              }
            };

            socket.send(JSON.stringify(data));
          };

          server.on("close", () => {
            socket.close();
          });
        },
        "build-finished": () => {
          if (reloadPage) {
            reloadPage();
          }
        }
      }
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin(),
      new ForkTsCheckerNotifierWebpackPlugin()
    ],
    output: {
      pathinfo: false,
      path: path.resolve("./public/dist"),
      publicPath: "dist",
      filename: "index.js"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        }
      ]
    }
  };

  serve({}, { config });
}
