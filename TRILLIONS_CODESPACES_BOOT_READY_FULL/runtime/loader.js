const fs = require("fs");
const path = require("path");

function scanRepository(root) {
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (["node_modules", ".git"].includes(name)) continue;
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      out.push({ path: path.relative(root, full), dir: stat.isDirectory(), bytes: stat.size });
      if (stat.isDirectory()) walk(full);
    }
  }
  walk(root);
  return out;
}

module.exports = { scanRepository };
