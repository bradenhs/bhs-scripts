import { Configuration, EnvironmentPlugin, Plugin } from "webpack";
import * as ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import * as ForkTsCheckerNotifierWebpackPlugin from "fork-ts-checker-notifier-webpack-plugin";
import * as WebpackServe from "webpack-serve";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";
import * as path from "path";
import { CLIENT_ENTRY_POINT } from "./constants";
import * as WebSocket from "ws";

interface TWebpackConfigOptions {
  mode: "production" | "development";
  apiServerLocation: string;
  publicPath: string;
  serve?: {
    webSocketPort: number;
    clientPort: number;
    debug: boolean;
  };
}

export function getWebpackConfig(options: TWebpackConfigOptions) {
  const plugins: Plugin[] = [
    new EnvironmentPlugin({
      API_SERVER_LOCATION: options.apiServerLocation,
      NODE_ENV: options.mode
    })
  ];

  if (hasServeOptions(options)) {
    plugins.push(
      new ForkTsCheckerWebpackPlugin(),
      new ForkTsCheckerNotifierWebpackPlugin()
    );
  }

  const config: Configuration = {
    entry: CLIENT_ENTRY_POINT,
    mode: options.mode,
    serve: hasServeOptions(options) ? getServeConfig(options) : undefined,
    devtool:
      options.mode === "production" || (options.serve && options.serve.debug)
        ? "source-map"
        : false,
    plugins,
    output: {
      path: path.resolve("./dist/client"),
      publicPath: options.publicPath,
      filename: "index.js"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [new TsconfigPathsPlugin()]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          options: {
            transpileOnly: hasServeOptions(options),
            compilerOptions: {
              allowJs: options.mode === "production"
            }
          }
        },
        {
          test: /\.(png|jpg|gif|svg)$/,
          use: [
            {
              loader: "file-loader",
              options: {}
            }
          ]
        },
        {
          test: /\.css$/,
          use: [{ loader: "style-loader" }, { loader: "css-loader" }]
        }
      ]
    }
  };

  return config;
}

function hasServeOptions(
  options: TWebpackConfigOptions
): options is Required<TWebpackConfigOptions> {
  return !!options.serve;
}

function getServeConfig(options: Required<TWebpackConfigOptions>) {
  let reloadPage: Function | undefined;

  const config: WebpackServe.Options = {
    content: "./",
    clipboard: false,
    open: !options.serve.debug,
    devMiddleware: {
      publicPath: options.publicPath
    },
    hotClient: {
      hmr: false,
      reload: false,
      host: "localhost",
      port: options.serve.webSocketPort
    },
    port: options.serve.clientPort,
    on: {
      listening({ server }) {
        const socket = new WebSocket(
          `ws://localhost:${options.serve!.webSocketPort}`
        );

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
  };

  return config;
}
