// Build statis: salin aplikasi ke folder dist/ (artefak yang siap di-deploy).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const item of ["index.html", "css", "js", "assets"]) {
  fs.cpSync(path.join(root, item), path.join(dist, item), { recursive: true });
}
const count = fs.readdirSync(dist, { recursive: true }).length;
console.log(`Build OK: ${count} entri ditulis ke dist/`);
