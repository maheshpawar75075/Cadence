#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, "manifest.json"), "utf8"));
const version = manifest.version;
const zipName = `cadence-pro-v${version}.zip`;
const distDir = path.join(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const outputPath = path.join(distDir, zipName);

// Clean previous build
if (fs.existsSync(outputPath)) {
  fs.unlinkSync(outputPath);
}

console.log(`📦 Packaging Cadence Pro Extension v${version} for Chrome Web Store...`);

// Command to zip only client files
const filesToInclude = [
  "manifest.json",
  "tokens.css",
  "popup.html",
  "popup.css",
  "popup.js",
  "newtab.html",
  "newtab.css",
  "newtab.js",
  "dashboard.html",
  "dashboard.css",
  "dashboard.js",
  "blocked.html",
  "blocked.css",
  "blocked.js",
  "mascot.js",
  "mascot.css",
  "bootstrapper.js",
  "background.js",
  "common.js",
  "cadence-agent.js",
  "cadence-agent.css",
  "lib",
  "icons",
  "assets",
  "Wallpaper"
];

const cmd = `cd "${rootDir}" && zip -r "${outputPath}" ${filesToInclude.join(" ")} -x "*.DS_Store*" "*__MACOSX*" "*.xlsx*" "*.tmp*"`;

try {
  execSync(cmd, { stdio: "inherit" });
  const stats = fs.statSync(outputPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Successfully generated Chrome Web Store bundle:`);
  console.log(`   Location: ${outputPath}`);
  console.log(`   Size: ${sizeMb} MB`);
} catch (err) {
  console.error("❌ Failed to create zip package:", err.message);
  process.exit(1);
}
