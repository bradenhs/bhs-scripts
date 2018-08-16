import { mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import * as download from "download";
import * as tar from "tar";
import * as path from "path";
import { ncp } from "ncp";
import * as rimraf from "rimraf";

export async function main() {
  const appName = process.argv[2];

  if (appName === undefined) {
    printUsage();
    process.exit(1);
    return;
  }

  if (existsSync(`./${appName}`)) {
    console.log(`The directory ./${appName} already exists.`);
    process.exit(1);
    return;
  }

  mkdirSync(appName);
  mkdirSync(`${appName}/.temp`);

  console.log("Getting package location...");

  const fileLocation = execSync("npm view bhs-scripts dist.tarball")
    .toString()
    .trim();

  const fileName = last(fileLocation.split("/"));

  console.log("Downloading package...");

  try {
    await download(fileLocation, `${appName}/.temp`);
  } catch (error) {
    console.log("Error downloading");
    console.log(error);
    process.exit(1);
    return;
  }

  console.log("Extracting template...");

  try {
    const file = path.resolve(appName, ".temp", fileName);

    await tar.extract({
      file,
      cwd: path.resolve(appName, ".temp")
    });
  } catch (error) {
    console.log("Error extracting");
    console.log(error);
    process.exit(1);
    return;
  }

  console.log("Moving extracted files...");

  const error = await new Promise(r =>
    ncp(
      path.resolve(appName, ".temp/package/template"),
      path.resolve(appName),
      r
    )
  );

  if (error) {
    console.log("Error moving files");
    console.log(error);
    process.exit(1);
    return;
  }

  console.log("Cleaning up...");

  rimraf.sync(path.resolve(appName, ".temp"));

  console.log("Installing dependencies...");

  execSync(`npm i --prefix ./${appName} bhs-scripts`, {
    stdio: [0, 1, 2]
  });

  console.log("Done!");

  console.log(`\nRun this to get started:`);
  console.log(`\ncd ${appName} && npx serve\n`);
}

function printUsage() {
  console.log("\nUsage:\n\nnpx create-bhs-app app_name\n\n");
}

function last<TArrayElementType>(
  array: TArrayElementType[]
): TArrayElementType {
  return array[array.length - 1];
}
