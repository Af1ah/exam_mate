import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const forbiddenPatterns = [
  { label: "production server IP", pattern: /31\.97\.202\.121/ },
  { label: "root-owned Exam Mate deploy path", pattern: /\/root\/projects\/exam-mate/ },
  { label: "root-owned question import path", pattern: /\/root\/projects\/ssc_cgl_questions\.csv/ },
  { label: "root SSH default in deploy workflow", pattern: /DEPLOY_USER:-root/ },
  { label: "root SSH example", pattern: /--user\s+root\b/ },
  { label: "root SSH target", pattern: /\broot@/ },
];

const excludedDirectories = new Set([".agents", ".git", ".next", "coverage", "dist", "node_modules"]);
const excludedFiles = new Set([
  ".env",
  "scripts/check-public-config.mjs",
  "scripts/__pycache__/deploy.cpython-314.pyc",
]);
const scannedExtensions = new Set([
  ".conf",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".py",
  ".sh",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const violations = [];

function isScannableFile(file) {
  if (excludedFiles.has(file) || file.endsWith(".pyc")) {
    return false;
  }

  const basename = path.basename(file);
  if (basename.startsWith(".env") && basename !== ".env.example") {
    return false;
  }

  const extension = path.extname(file);
  return basename.startsWith(".env") || scannedExtensions.has(extension);
}

function collectFiles(directory = ".") {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relativePath = path.relative(".", fullPath);

    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) {
        files.push(...collectFiles(fullPath));
      }
      continue;
    }

    if (entry.isFile() && isScannableFile(relativePath)) {
      files.push(relativePath);
    }
  }

  return files;
}

for (const file of collectFiles()) {
  if (statSync(file).size > 1024 * 1024) {
    continue;
  }

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const lines = text.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const { label, pattern } of forbiddenPatterns) {
      if (pattern.test(line)) {
        violations.push(`${file}:${index + 1}: ${label}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("Refusing to continue: repo-visible files contain production server details.");
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Public config check passed: no forbidden production server details found.");
