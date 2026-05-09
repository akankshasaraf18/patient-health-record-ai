import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("\n🔍 ShiftFlow AI - Setup Verification\n");
console.log("=".repeat(50));

// Check Node version
const nodeVersion = process.version;
const requiredNodeVersion = 18;
const currentNodeMajor = parseInt(nodeVersion.slice(1).split(".")[0]);

console.log("\n📦 Node.js Version");
if (currentNodeMajor >= requiredNodeVersion) {
  console.log(`  ✓ Node.js ${nodeVersion} (OK)`);
} else {
  console.log(`  ✗ Node.js ${nodeVersion} (Requires v${requiredNodeVersion}+)`);
}

// Check if .env exists
console.log("\n⚙️  Environment Configuration");
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  console.log("  ✓ .env file found");
} else {
  console.log("  ✗ .env file not found - copy from .env.example");
}

// Check if node_modules exists
console.log("\n📚 Dependencies");
const nodeModulesPath = path.join(__dirname, "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  console.log("  ✓ node_modules installed");
} else {
  console.log("  ✗ node_modules not found - run: npm install");
}

// Check model files
console.log("\n🤖 AI Model Files");
const modelsDir = path.join(__dirname, "models");
const robertaPath = path.join(modelsDir, "roberta-saliency.onnx");
const llamaPath = path.join(modelsDir, "llama2-7b.gguf");

if (fs.existsSync(robertaPath)) {
  const stats = fs.statSync(robertaPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  ✓ RoBERTa model found (${sizeMB} MB)`);
} else {
  console.log("  ✗ RoBERTa model not found at: models/roberta-saliency.onnx");
  console.log("    See backend/models/README.md for installation instructions");
}

if (fs.existsSync(llamaPath)) {
  const stats = fs.statSync(llamaPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`  ✓ Llama-2 model found (${sizeMB} MB)`);
} else {
  console.log("  ✗ Llama-2 model not found at: models/llama2-7b.gguf");
  console.log("    See backend/models/README.md for installation instructions");
}

// Check directory structure
console.log("\n📁 Directory Structure");
const requiredDirs = ["config", "models", "modules/handoff", "modules/llm"];

let allDirsExist = true;
requiredDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✓ ${dir}/`);
  } else {
    console.log(`  ✗ ${dir}/ (missing)`);
    allDirsExist = false;
  }
});

// Summary
console.log("\n" + "=".repeat(50));
console.log("\n📋 Summary\n");

const modelsReady = fs.existsSync(robertaPath) && fs.existsSync(llamaPath);
const envReady = fs.existsSync(envPath);
const depsReady = fs.existsSync(nodeModulesPath);

if (
  modelsReady &&
  envReady &&
  depsReady &&
  currentNodeMajor >= requiredNodeVersion
) {
  console.log("✓ All checks passed! Ready to start the server.");
  console.log("\nRun: npm run dev");
} else {
  console.log("⚠ Some setup steps are incomplete:\n");
  if (!envReady) console.log("  - Copy .env.example to .env and configure");
  if (!depsReady) console.log("  - Run: npm install");
  if (!modelsReady)
    console.log("  - Download and place AI model files (see models/README.md)");
  if (currentNodeMajor < requiredNodeVersion)
    console.log(`  - Upgrade Node.js to v${requiredNodeVersion}+`);

  console.log(
    "\n⚠ Note: Server will run without models, but AI features will be unavailable."
  );
  console.log(
    "  You can still develop and test the frontend and API endpoints."
  );
}

console.log("\n");
