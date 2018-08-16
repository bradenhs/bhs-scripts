import { getWebpackConfig } from "./getWebpackConfig";

interface TEnv {
  apiServerLocation?: string;
  publicPath?: string;
}

export default function(env: TEnv) {
  const apiServerLocation = env.apiServerLocation;
  const publicPath = env.publicPath;

  if (apiServerLocation === undefined) {
    printUsage();
    process.exit(1);
    return;
  }

  if (publicPath === undefined) {
    printUsage();
    process.exit(1);
    return;
  }

  return getWebpackConfig({
    apiServerLocation,
    publicPath,
    mode: "production"
  });
}

function printUsage() {
  console.log(
    "\nUsage:\n\n" +
      "npx build-client --env.apiServerLocation=value --env.publicPath=value\n\n" +
      "* apiServerLocation: The base url the client should use for its api requests i.e. where is the node controller hosted?\n\n" +
      "* publicPath: Path relative to root of where the client is being hosted i.e. where was the dist/client folder copied to?\n\n"
  );
}
