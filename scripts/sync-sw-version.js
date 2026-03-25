const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);
const swPath = path.join(__dirname, "..", "public", "sw.js");
let sw = fs.readFileSync(swPath, "utf-8");

sw = sw.replace(
  /const CACHE_NAME = "rust-training-.*?";/,
  `const CACHE_NAME = "rust-training-${pkg.version}";`
);

fs.writeFileSync(swPath, sw);
console.log(`sw.js cache name synced to ${pkg.version}`);
