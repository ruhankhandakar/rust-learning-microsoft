const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CONTENT_DIR = path.join(__dirname, "..", "content");
const OUTPUT = path.join(__dirname, "..", "public", "content-hash.json");

function hashDir(dir) {
  const hash = crypto.createHash("sha256");
  const files = getAllMdFiles(dir).sort();
  for (const file of files) {
    hash.update(fs.readFileSync(file));
  }
  return hash.digest("hex").slice(0, 12);
}

function getAllMdFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllMdFiles(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

const books = fs
  .readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const hashes = {};
for (const book of books) {
  hashes[book] = hashDir(path.join(CONTENT_DIR, book));
}

const globalHash = crypto
  .createHash("sha256")
  .update(JSON.stringify(hashes))
  .digest("hex")
  .slice(0, 12);

const result = { version: globalHash, books: hashes };

fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n");
console.log(`content-hash.json generated (${globalHash})`);
