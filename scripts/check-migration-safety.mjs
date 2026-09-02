import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const migrationsDirectory = path.resolve("migrations");
const allowedOperationClasses = new Set(["additive"]);

async function operationFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await operationFiles(entryPath)));
    } else if (entry.isFile() && entry.name === "ops.json") {
      files.push(entryPath);
    }
  }

  return files;
}

async function main() {
  const unsafeOperations = [];

  for (const operationsPath of await operationFiles(migrationsDirectory)) {
    const migration = path.dirname(operationsPath);
    const operations = JSON.parse(await readFile(operationsPath, "utf8"));

    for (const operation of operations) {
      if (!allowedOperationClasses.has(operation.operationClass)) {
        unsafeOperations.push({
          migration: path.relative(process.cwd(), migration),
          id: operation.id,
          operationClass: operation.operationClass,
        });
      }
    }
  }

  if (unsafeOperations.length > 0) {
    console.error("Refusing an unsafe deployment. Production migrations must be additive.");
    for (const operation of unsafeOperations) {
      console.error(`- ${operation.migration}: ${operation.id} (${operation.operationClass})`);
    }
    console.error("Split destructive changes into a separately reviewed, backwards-compatible release.");
    process.exit(1);
  }

  console.log("Migration safety check passed: all operations are additive.");
}

await main();
