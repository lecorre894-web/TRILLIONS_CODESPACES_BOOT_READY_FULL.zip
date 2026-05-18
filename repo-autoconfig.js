"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execSync } = require("child_process");

const ROOT = process.cwd();

function read(file) {
  try { return fs.readFileSync(file, "utf8"); } catch { return null; }
}

function write(file, data) {
  fs.writeFileSync(file, data);
}

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (err) {
    return String(err.stderr || err.message || "UNAVAILABLE").trim();
  }
}

function sha256(txt) {
  return crypto.createHash("sha256").update(txt || "").digest("hex");
}

function walk(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }

  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);

    if (
      rel.includes("node_modules") ||
      rel.includes(".git") ||
      rel.includes(".next") ||
      rel.includes("dist") ||
      rel.includes("build") ||
      rel.includes(".cache")
    ) continue;

    if (e.isDirectory()) walk(full, out);
    else out.push(rel);
  }

  return out;
}

function safeJsonParse(txt) {
  try { return JSON.parse(txt); } catch { return null; }
}

function detectPackage() {
  const file = path.join(ROOT, "package.json");
  const txt = read(file);
  const json = txt ? safeJsonParse(txt) : null;

  return {
    exists: !!txt,
    valid_json: !!json,
    path: exists(file) ? "package.json" : null,
    name: json?.name || null,
    version: json?.version || null,
    scripts: json?.scripts || {},
    dependencies: json?.dependencies || {},
    devDependencies: json?.devDependencies || {},
    has_express: !!(json?.dependencies?.express || json?.devDependencies?.express),
    has_socketio: !!(json?.dependencies?.["socket.io"] || json?.devDependencies?.["socket.io"]),
    has_cors: !!(json?.dependencies?.cors || json?.devDependencies?.cors),
    has_dotenv: !!(json?.dependencies?.dotenv || json?.devDependencies?.dotenv),
    hash: txt ? sha256(txt).slice(0, 16) : null
  };
}

function detectMainFiles(files) {
  const candidates = [
    "app.js",
    "server.js",
    "index.js",
    "runtime.js",
    "src/app.js",
    "src/server.js",
    "src/index.js"
  ];

  const found = candidates.filter(f => files.includes(f));

  const appJs = found.includes("app.js")
    ? "app.js"
    : found[0] || null;

  return {
    candidates_found: found,
    primary_app_file: appJs,
    html_files: files.filter(f => f.toLowerCase().endsWith(".html")),
    css_files: files.filter(f => f.toLowerCase().endsWith(".css")),
    js_files: files.filter(f => f.toLowerCase().endsWith(".js")),
    json_files: files.filter(f => f.toLowerCase().endsWith(".json"))
  };
}

function scanRoutes(file) {
  const txt = read(path.join(ROOT, file));
  if (!txt) return { file, exists: false, routes: [] };

  const routes = [];
  const regex = /\b(app|router)\s*\.\s*(get|post|put|patch|delete|all)\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let m;

  while ((m = regex.exec(txt))) {
    routes.push({
      object: m[1],
      method: m[2].toUpperCase(),
      path: m[3]
    });
  }

  const listens = [];
  const listenRegex = /\.listen\s*\(\s*([^,\)\n]+)/g;
  while ((m = listenRegex.exec(txt))) {
    listens.push(String(m[1]).trim());
  }

  const portRefs = [];
  const portRegex = /\bPORT\b|process\.env\.PORT|localhost:([0-9]+)/g;
  while ((m = portRegex.exec(txt))) {
    portRefs.push(m[0]);
  }

  return {
    file,
    exists: true,
    bytes: Buffer.byteLength(txt),
    lines: txt.split("\n").length,
    hash: sha256(txt).slice(0, 16),
    routes,
    route_count: routes.length,
    listen_expressions: listens,
    port_refs_sample: [...new Set(portRefs)].slice(0, 20),
    has_global_app: txt.includes("global.app"),
    has_express: txt.includes("express"),
    has_socketio: txt.includes("socket.io") || txt.includes("Socket"),
    has_stratum: txt.includes("STRATUM") || txt.includes("/api/stratum"),
    has_memory_pipeline: txt.includes("memory-pipeline") || txt.includes("MEMORY_PIPELINE"),
    has_bench: txt.includes("/api/bench") || txt.includes("BENCH"),
    has_dict: txt.includes("/api/dict") || txt.includes("DICT")
  };
}

function detectLaunch() {
  const paths = [
    ".vscode/launch.json",
    "launch.json",
    ".vscode/tasks.json",
    "tasks.json"
  ];

  return paths.map(p => {
    const txt = read(path.join(ROOT, p));
    return {
      path: p,
      exists: !!txt,
      valid_json: txt ? !!safeJsonParse(txt) : false,
      hash: txt ? sha256(txt).slice(0, 16) : null
    };
  });
}

function detectEnv() {
  const envFiles = [".env", ".env.local", ".env.example"].map(p => {
    const txt = read(path.join(ROOT, p));
    return {
      path: p,
      exists: !!txt,
      keys: txt
        ? txt.split("\n")
            .map(x => x.trim())
            .filter(x => x && !x.startsWith("#") && x.includes("="))
            .map(x => x.split("=")[0])
            .slice(0, 50)
        : []
    };
  });

  return {
    env_files: envFiles,
    node_env: process.env.NODE_ENV || null,
    port_env: process.env.PORT || null,
    codespaces: {
      CODESPACE_NAME: process.env.CODESPACE_NAME || null,
      GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN: process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || null,
      GITHUB_USER: process.env.GITHUB_USER || null
    }
  };
}

function detectRuntime() {
  const cpus = os.cpus();

  return {
    node: process.version,
    v8: process.versions.v8,
    platform: os.platform(),
    arch: os.arch(),
    logical_cpus: cpus.length,
    cpu_model: cpus[0]?.model || "UNAVAILABLE",
    total_ram_gb: Number((os.totalmem() / 1073741824).toFixed(2)),
    free_ram_gb: Number((os.freemem() / 1073741824).toFixed(2)),
    cwd: ROOT,
    npm_version: sh("npm -v"),
    git_branch: sh("git branch --show-current"),
    git_remote: sh("git remote -v | head -5"),
    disk: sh("df -h .")
  };
}

function detectPortsFromFiles(files) {
  const ports = new Set();
  const interesting = files.filter(f =>
    /\.(js|json|html|env|md|txt)$/i.test(f) &&
    !f.includes("node_modules")
  );

  for (const f of interesting.slice(0, 500)) {
    const txt = read(path.join(ROOT, f));
    if (!txt) continue;

    const regex = /(?:localhost:|127\.0\.0\.1:|PORT\s*=\s*|port["']?\s*:\s*|listen\()\s*([0-9]{2,5})/gi;
    let m;
    while ((m = regex.exec(txt))) {
      const p = Number(m[1]);
      if (p >= 1 && p <= 65535) ports.add(p);
    }
  }

  return [...ports].sort((a, b) => a - b);
}

function recommendations(scan) {
  const rec = [];

  if (!scan.package.exists) {
    rec.push("Créer package.json avec express, socket.io, cors, dotenv si app backend.");
  }

  if (scan.package.exists && !scan.package.has_express) {
    rec.push("Installer express : npm install express");
  }

  if (scan.main.primary_app_file && !scan.routes.has_global_app) {
    rec.push("Ajouter global.app = app juste après const app = express(); pour permettre les extensions collées en fin de fichier.");
  }

  if (scan.main.primary_app_file && !scan.routes.has_memory_pipeline) {
    rec.push("Ajouter TRILLIONS_MEMORY_PIPELINE_EXTENSION si tu veux synchroniser le profil DDR7_9600_CAS6.");
  }

  if (scan.main.primary_app_file && !scan.routes.has_stratum) {
    rec.push("Ajouter TRILLIONS_STRATUM_BTC_BLOCK pour routes /api/stratum/*.");
  }

  if (scan.detected_ports.length === 0) {
    rec.push("Définir PORT=3000 ou const PORT = process.env.PORT || 3000.");
  }

  if (!scan.launch.some(x => x.path === ".vscode/launch.json" && x.exists)) {
    rec.push("Créer .vscode/launch.json pour démarrage Codespaces/VS Code.");
  }

  rec.push("Garder submit_enabled:false dans Stratum tant que wallet/pool/worker ne sont pas validés.");
  rec.push("Garder HONESTY_LOCK : EH/s réel uniquement via pool/ASIC telemetry.");

  return rec;
}

function buildLaunchJson(primaryApp) {
  return {
    version: "0.2.0",
    configurations: [
      {
        type: "node",
        request: "launch",
        name: "TRILLIONS Launch app.js",
        program: "${workspaceFolder}/" + (primaryApp || "app.js"),
        cwd: "${workspaceFolder}",
        env: {
          NODE_ENV: "development",
          PORT: "3000"
        },
        console: "integratedTerminal",
        restart: true,
        skipFiles: ["<node_internals>/**"]
      }
    ]
  };
}

function buildTasksJson() {
  return {
    version: "2.0.0",
    tasks: [
      {
        label: "TRILLIONS npm install",
        type: "shell",
        command: "npm install",
        problemMatcher: []
      },
      {
        label: "TRILLIONS start",
        type: "shell",
        command: "node app.js",
        problemMatcher: []
      },
      {
        label: "TRILLIONS health",
        type: "shell",
        command: "curl http://localhost:3000/api/dict/status || curl http://localhost:3000/api/stratum/status || true",
        problemMatcher: []
      }
    ]
  };
}

function markdownReport(scan) {
  return `# TRILLIONS Repo AutoConfig Report

## Runtime
- Node: ${scan.runtime.node}
- V8: ${scan.runtime.v8}
- Platform: ${scan.runtime.platform} ${scan.runtime.arch}
- CPU visible: ${scan.runtime.cpu_model}
- Logical CPUs: ${scan.runtime.logical_cpus}
- RAM total/free: ${scan.runtime.total_ram_gb} GB / ${scan.runtime.free_ram_gb} GB
- Branch: ${scan.runtime.git_branch}

## Main
- Primary app file: ${scan.main.primary_app_file || "UNAVAILABLE"}
- JS files: ${scan.main.js_files.length}
- HTML files: ${scan.main.html_files.length}
- JSON files: ${scan.main.json_files.length}

## Package
- package.json: ${scan.package.exists ? "yes" : "no"}
- Express: ${scan.package.has_express ? "yes" : "no"}
- Socket.io: ${scan.package.has_socketio ? "yes" : "no"}
- Scripts: ${Object.keys(scan.package.scripts || {}).join(", ") || "none"}

## Routes
- Route count: ${scan.routes.route_count || 0}
${(scan.routes.routes || []).map(r => `- ${r.method} ${r.path}`).join("\n") || "- none detected"}

## Detected Modules
- global.app: ${scan.routes.has_global_app ? "yes" : "no"}
- Stratum: ${scan.routes.has_stratum ? "yes" : "no"}
- Memory Pipeline: ${scan.routes.has_memory_pipeline ? "yes" : "no"}
- Bench: ${scan.routes.has_bench ? "yes" : "no"}
- DiCT: ${scan.routes.has_dict ? "yes" : "no"}

## Ports
${scan.detected_ports.map(p => `- ${p}`).join("\n") || "- none detected"}

## Recommendations
${scan.recommendations.map(x => `- ${x}`).join("\n")}

## Honesty
This scanner configures the repo metadata and recommendations only.
It does not fake EH/s, CPU power, RAM speed or mining telemetry.
`;
}

function main() {
  const files = walk(ROOT);
  const pkg = detectPackage();
  const mainFiles = detectMainFiles(files);
  const routes = mainFiles.primary_app_file
    ? scanRoutes(mainFiles.primary_app_file)
    : { exists: false, routes: [], route_count: 0 };
  const launch = detectLaunch();
  const env = detectEnv();
  const runtime = detectRuntime();
  const detectedPorts = detectPortsFromFiles(files);

  const scan = {
    ok: true,
    scanner: "TRILLIONS_REPO_AUTOCONFIG",
    scanned_at: new Date().toISOString(),
    root: ROOT,
    file_count: files.length,
    package: pkg,
    main: mainFiles,
    routes,
    launch,
    env,
    runtime,
    detected_ports: detectedPorts,
    generated_templates: {
      launch_json: buildLaunchJson(mainFiles.primary_app_file),
      tasks_json: buildTasksJson()
    },
    honesty: {
      auto_modify_files: false,
      scan_only: true,
      no_fake_power: true,
      no_fake_hashrate: true
    }
  };

  scan.recommendations = recommendations(scan);

  write(path.join(ROOT, "TRILLIONS_REPO_AUTOCONFIG.json"), JSON.stringify(scan, null, 2));
  write(path.join(ROOT, "TRILLIONS_ROUTES_SCAN.json"), JSON.stringify(routes, null, 2));
  write(path.join(ROOT, "TRILLIONS_RUNTIME_PROFILE.json"), JSON.stringify(runtime, null, 2));
  write(path.join(ROOT, "TRILLIONS_REPO_REPORT.md"), markdownReport(scan));

  console.log("");
  console.log("===== TRILLIONS REPO AUTOCONFIG DONE =====");
  console.log("Root:", ROOT);
  console.log("Files:", files.length);
  console.log("Primary app:", mainFiles.primary_app_file || "UNAVAILABLE");
  console.log("Routes:", routes.route_count || 0);
  console.log("Ports:", detectedPorts.join(", ") || "none");
  console.log("");
  console.log("Generated:");
  console.log("  TRILLIONS_REPO_AUTOCONFIG.json");
  console.log("  TRILLIONS_REPO_REPORT.md");
  console.log("  TRILLIONS_ROUTES_SCAN.json");
  console.log("  TRILLIONS_RUNTIME_PROFILE.json");
  console.log("");
  console.log("Recommendations:");
  for (const r of scan.recommendations) console.log(" -", r);
  console.log("");
}

main();
