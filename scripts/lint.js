// Lint sederhana tanpa dependensi: cek sintaks JS, referensi berkas di index.html, dan larangan `debugger`.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const errors = [];

const jsFiles = ["js/logic.js", "js/app.js", "scripts/lint.js", "scripts/build.js"];
for (const f of jsFiles) {
  const full = path.join(root, f);
  const r = spawnSync(process.execPath, ["--check", full], { encoding: "utf8" });
  if (r.status !== 0) errors.push(`Sintaks tidak valid di ${f}:\n${r.stderr}`);
  if (/\bdebugger\b/.test(fs.readFileSync(full, "utf8")) && f !== "scripts/lint.js")
    errors.push(`${f}: pernyataan 'debugger' tidak boleh ada.`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|data:)([^"]+)"/g)) {
  if (!fs.existsSync(path.join(root, m[1]))) errors.push(`index.html merujuk berkas yang tidak ada: ${m[1]}`);
}

if (errors.length) {
  console.error("LINT GAGAL:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("Lint OK: " + jsFiles.length + " berkas JS dan referensi index.html valid.");
