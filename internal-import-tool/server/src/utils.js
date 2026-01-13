// Why this file exists:
// Internal tools often need deterministic keys (checksum) and lightweight cleaning.

const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Very small "cleaning":
// - trim
// - normalize whitespace
function cleanText(s) {
  return String(s || "").trim().replace(/\s+/g, " ");
}

module.exports = { sha256, cleanText };
