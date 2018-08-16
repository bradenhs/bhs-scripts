import { execSync } from "child_process";

export function main() {
  execSync("rm -rf ./dist/server", {
    stdio: [0, 1, 2]
  });

  execSync(
    "tsc --project ./node_modules/bhs-scripts/configs/tsconfig.server.json",
    {
      stdio: [0, 1, 2]
    }
  );
}
