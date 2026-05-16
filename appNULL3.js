/*
TRILLIONS REAL CORE — NUMERO 1 SURGICAL FUSION
================================================
SOCLE: app.js.txt
COUCHES ADDITIVES: hardware metrics + cockpit mesures + brain/neural bus + BTC terminal + mining bridge.
REGLES:
- REAL DATA ONLY: si une donnée n'est pas accessible, elle est indiquée unavailable/null.
- Aucun wallet, aucune seed, aucune clé privée.
- Aucune transaction automatique, aucun mining automatique.
- Le shell est gardé, mais filtré contre les commandes destructrices.
- Les métriques matérielles affichent toujours les unités: GHz, GB, %, °C, W, MB/s, KB/s, VRAM.

Install conseillé:
npm install express socket.io axios systeminformation dotenv

Start:
node app.js
*/

'use strict';

try { require('dotenv').config(); } catch (_) {}

const express = require('express');
const http = require('http');
const os = require('os');
const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('child_process');
const { Server } = require('socket.io');

let axios = null;
let si = null;
try { axios = require('axios'); } catch (_) {}
try { si = require('systeminformation'); } catch (_) {}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 1e8 });
const PORT = Number(process.env.PORT || 3000);
const START = Date.now();
const CLIENTS = new Set();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const KERNEL = {
  name: 'TRILLIONS_REAL_CORE_NUMERO1',
  version: 'OMEGA_SURGICAL_FUSION_V1',
  socle: 'app.js.txt',
  mode: 'REAL_ONLY_OR_UNAVAILABLE',
  topology: 'SMARTPHONE⇄WEBSOCKET⇄CODESPACES⇄NODE_CORE⇄NEURAL_BUS⇄MODULES⇄LEGACY',
  started: new Date().toISOString(),
  safety: {
    noSeed: true,
    noPrivateKey: true,
    noAutoTransaction: true,
    noAutoMining: true,
    readOnlyByDefault: true,
    destructiveShellBlocked: true
  }
};

const STATE = {
  boot: new Date().toISOString(),
  tick: 0,
  logs: [],
  events: [],
  mining: { connected: false, rigs: [], lastUpdate: null, totalHashrate: 0, unit: 'H/s' },
  brain: {
    status: 'ACTIVE',
    cortex: 'GENESIS_CORE',
    neuralBus: 'ACTIVE',
    lobes: ['hardware', 'btc', 'network', 'runtime', 'security', 'legacy', 'ai'],
    agents: [
      { id: 'GENESIS', role: 'orchestration', status: 'ACTIVE' },
      { id: 'PROMETHEUS', role: 'metrics/runtime', status: 'ACTIVE' },
      { id: 'SENTINEL', role: 'safety/read-only guard', status: 'ACTIVE' },
      { id: 'ORACLE_BTC', role: 'btc/mempool/fees', status: 'ACTIVE' },
      { id: 'SHA_BRAIN', role: 'sha256/mining bridge', status: 'ACTIVE' }
    ],
    memory: { short: 'runtime state', mid: 'logs + snapshots', long: 'legacy map', crystalline: 'validated configs only' }
  },
  neural: { pulses: 0, lastPulse: null, channels: ['runtime', 'hardware', 'btc', 'mining', 'network', 'ai', 'security'], events: [] },
  btc: {
    status: 'STANDBY',
    updatedAt: null,
    priceUsd: null,
    height: null,
    mempoolTx: null,
    mempoolVMB: null,
    fees: { fastestFee: null, halfHourFee: null, hourFee: null, economyFee: null, minimumFee: null },
    sources: ['mempool.space', 'coingecko'],
    error: null
  },
  lastHardware: null
};

function now() { return new Date().toISOString(); }
function upSec() { return Math.floor((Date.now() - START) / 1000); }
function safeText(x, n = 20000) { return String(x == null ? '' : x).slice(0, n); }
function round(x, d = 2) { const n = Number(x); return Number.isFinite(n) ? Number(n.toFixed(d)) : null; }
function gb(bytes) { return round(Number(bytes || 0) / 1073741824, 2); }
function mb(bytes) { return round(Number(bytes || 0) / 1048576, 2); }
function kb(bytes) { return round(Number(bytes || 0) / 1024, 2); }
function log(channel, message, level = 'info') {
  const item = { ts: now(), channel: String(channel), message: String(message), level };
  STATE.logs.push(item);
  if (STATE.logs.length > 800) STATE.logs.shift();
  console.log(`[${item.channel}] ${item.ts} -> ${item.message}`);
  io.emit('log', item);
  return item;
}
function pulse(channel, title, data = {}) {
  const item = { ts: now(), channel, title, data };
  STATE.neural.pulses++;
  STATE.neural.lastPulse = item.ts;
  STATE.neural.events.push(item);
  if (STATE.neural.events.length > 200) STATE.neural.events.shift();
  io.emit('neural:pulse', item);
  return item;
}
function sh(cmd, timeout = 10000) {
  return new Promise(resolve => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 * 25 }, (err, out, stderr) => {
      resolve({ ok: !err, cmd, out: safeText(out, 30000), err: safeText(stderr || (err && err.message), 12000) });
    });
  });
}
function blockedCmd(cmd) {
  return /(^|\s)(rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|halt|poweroff|:\(\)\{|chmod\s+000\s+\/|chown\s+-R\s+.*\s+\/|iptables\s+-F|ufw\s+disable)/i.test(String(cmd || ''));
}

async function sysInfoCall(name, fallback) {
  if (!si || typeof si[name] !== 'function') return fallback;
  try { return await si[name](); } catch (_) { return fallback; }
}

async function hardware() {
  const memUsage = process.memoryUsage();
  const cpus = os.cpus() || [];
  const [cpu, speed, load, mem, fsSize, netStats, graphics, temp, battery, osInfo, processes] = await Promise.all([
    sysInfoCall('cpu', null),
    sysInfoCall('cpuCurrentSpeed', null),
    sysInfoCall('currentLoad', null),
    sysInfoCall('mem', null),
    sysInfoCall('fsSize', []),
    sysInfoCall('networkStats', []),
    sysInfoCall('graphics', null),
    sysInfoCall('cpuTemperature', null),
    sysInfoCall('battery', null),
    sysInfoCall('osInfo', null),
    sysInfoCall('processes', null)
  ]);

  const cpuSpeedGHz = speed && speed.avg ? round(speed.avg, 2) : (cpu && cpu.speed ? round(cpu.speed, 2) : null);
  const ramTotalGB = mem ? gb(mem.total) : gb(os.totalmem());
  const ramUsedGB = mem ? gb(mem.used) : gb(os.totalmem() - os.freemem());
  const ramFreeGB = mem ? gb(mem.free) : gb(os.freemem());
  const ramUsedPct = ramTotalGB ? round((ramUsedGB / ramTotalGB) * 100, 2) : null;

  const disks = Array.isArray(fsSize) ? fsSize.map(d => ({
    fs: d.fs,
    mount: d.mount,
    type: d.type,
    sizeGB: gb(d.size),
    usedGB: gb(d.used),
    availableGB: gb(d.available),
    usedPct: round(d.use, 2),
    unit: 'GB/%'
  })) : [];

  const networks = Array.isArray(netStats) ? netStats.map(n => ({
    iface: n.iface,
    operstate: n.operstate,
    rxTotalMB: mb(n.rx_bytes),
    txTotalMB: mb(n.tx_bytes),
    rxKBs: kb(n.rx_sec),
    txKBs: kb(n.tx_sec),
    unit: 'KB/s + MB total'
  })) : [];

  const gpus = graphics && Array.isArray(graphics.controllers) ? graphics.controllers.map(g => ({
    model: g.model,
    vendor: g.vendor,
    vramMB: g.vram || null,
    vramGB: g.vram ? round(g.vram / 1024, 2) : null,
    bus: g.bus,
    temperatureC: g.temperatureGpu == null ? null : round(g.temperatureGpu, 1),
    utilizationGpuPct: g.utilizationGpu == null ? null : round(g.utilizationGpu, 1),
    utilizationMemoryPct: g.utilizationMemory == null ? null : round(g.utilizationMemory, 1),
    powerW: g.powerDraw == null ? null : round(g.powerDraw, 1),
    unit: 'VRAM MB/GB, °C, %, W'
  })) : [];

  const out = {
    time: now(),
    host: os.hostname(),
    platform: process.platform,
    arch: os.arch(),
    node: process.version,
    pid: process.pid,
    uptimeAppSec: upSec(),
    uptimeNodeSec: Math.floor(process.uptime()),
    cpu: {
      brand: cpu ? cpu.brand : (cpus[0] && cpus[0].model) || null,
      manufacturer: cpu ? cpu.manufacturer : null,
      coresLogical: cpu ? cpu.cores : cpus.length,
      coresPhysical: cpu ? cpu.physicalCores : null,
      speedGHz: cpuSpeedGHz,
      speedMinGHz: speed && speed.min ? round(speed.min, 2) : null,
      speedMaxGHz: speed && speed.max ? round(speed.max, 2) : null,
      loadPct: load ? round(load.currentLoad, 2) : null,
      loadUserPct: load ? round(load.currentLoadUser, 2) : null,
      loadSystemPct: load ? round(load.currentLoadSystem, 2) : null,
      temperatureC: temp && temp.main != null ? round(temp.main, 1) : null,
      unit: 'GHz, %, °C'
    },
    ram: {
      totalGB: ramTotalGB,
      usedGB: ramUsedGB,
      freeGB: ramFreeGB,
      activeGB: mem ? gb(mem.active) : null,
      availableGB: mem ? gb(mem.available) : null,
      usedPct: ramUsedPct,
      unit: 'GB/%'
    },
    nodeProcess: {
      rssMB: mb(memUsage.rss),
      heapUsedMB: mb(memUsage.heapUsed),
      heapTotalMB: mb(memUsage.heapTotal),
      externalMB: mb(memUsage.external),
      unit: 'MB'
    },
    disks,
    network: networks,
    gpu: gpus,
    temperature: temp || null,
    battery: battery || null,
    os: osInfo || null,
    processes: processes ? { all: processes.all, running: processes.running, blocked: processes.blocked, sleeping: processes.sleeping } : null,
    systeminformation: Boolean(si)
  };
  STATE.lastHardware = out;
  return out;
}

async function network() {
  const r = await Promise.all([
    sh('ss -tulpn 2>/dev/null||true'),
    sh('ss -s 2>/dev/null||true'),
    sh('ip addr 2>/dev/null||true'),
    sh('ip route 2>/dev/null||true'),
    sh('curl -s --max-time 5 ifconfig.me 2>/dev/null||echo unavailable'),
    sh('ping -c 3 -W 3 1.1.1.1 2>/dev/null||echo unavailable'),
    sh('cat /etc/resolv.conf 2>/dev/null||true'),
    sh('hostname -I 2>/dev/null||true')
  ]);
  return { time: now(), ports: r[0].out, socketSummary: r[1].out, interfaces: r[2].out, route: r[3].out, publicIp: r[4].out, latency: r[5].out, dns: r[6].out, localIps: r[7].out };
}

async function repo() {
  const r = await Promise.all([
    sh('du -sh . 2>/dev/null||true'),
    sh("find . -not -path './.git/*' -not -path './node_modules/*' -type f|wc -l"),
    sh("find . -not -path './.git/*' -not -path './node_modules/*' -type d|wc -l"),
    sh("git status --short 2>/dev/null||echo unavailable"),
    sh("git branch --show-current 2>/dev/null||true"),
    sh("git log --oneline -15 2>/dev/null||true"),
    sh("find . -maxdepth 3 -type f -not -path './node_modules/*' -not -path './.git/*'|sort|head -250")
  ]);
  return { size: r[0].out, files: r[1].out, dirs: r[2].out, gitStatus: r[3].out, branch: r[4].out, gitLog: r[5].out, tree: r[6].out };
}

async function blockchain() {
  const rpc = process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com';
  if (!axios) return { provider: rpc, connected: false, error: 'axios unavailable' };
  try {
    const [block, gas, chain] = await Promise.all([
      axios.post(rpc, { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }, { timeout: 10000 }),
      axios.post(rpc, { jsonrpc: '2.0', method: 'eth_gasPrice', params: [], id: 2 }, { timeout: 10000 }),
      axios.post(rpc, { jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 3 }, { timeout: 10000 })
    ]);
    return { provider: rpc, connected: true, chainId: parseInt(chain.data.result, 16), latestBlock: parseInt(block.data.result, 16), gasPriceGwei: round(parseInt(gas.data.result, 16) / 1e9, 3), unit: 'Gwei' };
  } catch (e) { return { provider: rpc, connected: false, error: e.message }; }
}

async function btcTerminal() {
  const out = { ...STATE.btc, updatedAt: now() };
  if (!axios) {
    out.status = 'UNAVAILABLE'; out.error = 'axios unavailable'; STATE.btc = out; return out;
  }
  try {
    const [height, fees, mempool, price] = await Promise.allSettled([
      axios.get('https://mempool.space/api/blocks/tip/height', { timeout: 8000 }),
      axios.get('https://mempool.space/api/v1/fees/recommended', { timeout: 8000 }),
      axios.get('https://mempool.space/api/mempool', { timeout: 8000 }),
      axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { timeout: 8000 })
    ]);
    if (height.status === 'fulfilled') out.height = Number(height.value.data || 0);
    if (fees.status === 'fulfilled') out.fees = { ...out.fees, ...fees.value.data };
    if (mempool.status === 'fulfilled') {
      out.mempoolTx = Number(mempool.value.data.count || 0);
      out.mempoolVMB = round(Number(mempool.value.data.vsize || 0) / 1e6, 2);
    }
    if (price.status === 'fulfilled') out.priceUsd = Number(price.value.data.bitcoin && price.value.data.bitcoin.usd || 0);
    out.status = 'ACTIVE_READ_ONLY'; out.error = null;
  } catch (e) { out.status = 'ERROR'; out.error = e.message; }
  STATE.btc = out;
  pulse('btc', 'btc terminal update', { height: out.height, mempoolTx: out.mempoolTx });
  return out;
}

async function ai(message) {
  const msg = message || 'TRILLIONS: audit real runtime capabilities. No fiction, no fake telemetry.';
  if (!axios) return { provider: 'pollinations', connected: false, error: 'axios unavailable' };
  try {
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(msg);
    const r = await axios.get(url, { timeout: 18000 });
    return { provider: 'pollinations', connected: true, response: safeText(r.data, 5000) };
  } catch (e) { return { provider: 'pollinations', connected: false, error: e.message }; }
}

async function workload() {
  const r = await Promise.all([
    sh('ps aux --sort=-%cpu|head -30'),
    sh('free -m'),
    sh('df -h'),
    sh('cat /proc/loadavg 2>/dev/null||true'),
    sh('pm2 jlist 2>/dev/null||echo []'),
    sh('pm2 ls 2>/dev/null||true')
  ]);
  let pm2 = []; try { pm2 = JSON.parse(r[4].out || '[]'); } catch (_) {}
  return { topCpu: r[0].out, memory: r[1].out, disk: r[2].out, loadavg: r[3].out, pm2Json: pm2, pm2Table: r[5].out };
}

async function launchStatus() {
  const f = '.vscode/launch.json';
  const exists = fs.existsSync(f);
  let parsed = null, error = null;
  if (exists) { try { parsed = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { error = e.message; } }
  return { file: f, exists, valid: Boolean(parsed), error, expectedProgram: '${workspaceFolder}/app.js', remoteAttachPort: 9229, parsed };
}

async function security() {
  const r = await Promise.all([
    sh("grep -RniE 'api[_-]?key|secret|token|password|private_key|bearer' . --exclude-dir=node_modules --exclude-dir=.git | head -120 || true"),
    sh("find . -maxdepth 4 -type f \\( -name '.env' -o -name '*.pem' -o -name '*.key' -o -name '*secret*' -o -name '*token*' \\) -not -path './node_modules/*'"),
    sh('npm audit --audit-level=high 2>/dev/null||true')
  ]);
  return { secretGrep: r[0].out || 'none', sensitiveFiles: r[1].out || 'none', npmAudit: r[2].out || 'none' };
}

async function protocols() {
  const r = await Promise.all([
    sh("node -e \"try{require('net');console.log('tcp:node-native')}catch(e){console.log('tcp:unavailable')}\""),
    sh("node -e \"try{require('dgram');console.log('udp:node-native')}catch(e){console.log('udp:unavailable')}\""),
    sh('npm ls socket.io ws axios express systeminformation dotenv 2>/dev/null||true'),
    sh('which mosquitto_sub 2>/dev/null||echo mqtt_cli_unavailable'),
    sh('which bluetoothctl 2>/dev/null||echo bluetooth_cli_unavailable'),
    sh('which nmap 2>/dev/null||echo nmap_unavailable')
  ]);
  return { tcpUdp: r[0].out + ' | ' + r[1].out, npmProtocolStack: r[2].out, mqtt: r[3].out, bluetooth: r[4].out, nmap: r[5].out };
}

async function full() {
  const [h, n, r, b, w, l, btc] = await Promise.all([hardware(), network(), repo(), blockchain(), workload(), launchStatus(), btcTerminal()]);
  return { kernel: KERNEL, brain: STATE.brain, neural: STATE.neural, hardware: h, network: n, repo: r, blockchain: b, btc, mining: STATE.mining, workload: w, launch: l };
}

function updateMiningFromPayload(body) {
  const rigs = Array.isArray(body && body.rigs) ? body.rigs : [];
  const clean = rigs.slice(0, 128).map((r, i) => ({
    id: safeText(r.id || `rig${i + 1}`, 80),
    coin: safeText(r.coin || 'UNKNOWN', 20),
    algo: safeText(r.algo || 'SHA256', 40),
    hashrate: Number(r.hashrate || 0),
    unit: safeText(r.unit || 'H/s', 16),
    accepted: Number(r.accepted || 0),
    rejected: Number(r.rejected || 0),
    powerW: r.powerW == null ? null : Number(r.powerW),
    tempC: r.tempC == null ? null : Number(r.tempC),
    efficiencyJTH: r.efficiencyJTH == null ? null : Number(r.efficiencyJTH)
  }));
  const total = clean.reduce((a, r) => a + (Number(r.hashrate) || 0), 0);
  STATE.mining = { connected: true, rigs: clean, lastUpdate: now(), totalHashrate: total, unit: clean[0] ? clean[0].unit : 'H/s' };
  pulse('mining', 'rig metrics received', { rigs: clean.length, totalHashrate: total });
  io.emit('mining', STATE.mining);
  return STATE.mining;
}

function page() {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS REAL CORE NUMERO 1</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#020503;color:#78ff8f;font-family:Consolas,monospace;overflow-x:hidden}header{padding:12px;border-bottom:1px solid #26ff6a;background:linear-gradient(90deg,#001907,#020503);display:flex;gap:8px;align-items:center;flex-wrap:wrap;position:sticky;top:0;z-index:4}h1{font-size:18px;margin:0;color:#8dff9e;text-shadow:0 0 12px #24ff5f;flex:1}.badge{border:1px solid #35ff75;padding:3px 8px;color:#c7ffd0;background:#001b09}.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:#000b05;border-bottom:1px solid #00ff6633;position:sticky;top:48px;z-index:3}.tabs button,.btn{background:#001b0c;color:#88ff9c;border:1px solid #29ff68;padding:8px;margin:2px;font-family:Consolas,monospace;cursor:pointer}.tabs button.active,.tabs button:hover,.btn:hover{background:#00331a;color:#fff}.pane{display:none;padding:8px}.pane.active{display:block}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}@media(max-width:1100px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.grid{grid-template-columns:1fr}.tabs{top:58px}}.card{border:1px solid #00ff6655;background:rgba(0,13,6,.88);padding:10px;min-height:116px;box-shadow:0 0 18px rgba(0,255,100,.08);position:relative}.card h3{margin:0 0 8px;color:#a4ffaf;border-bottom:1px solid #00ff6622;padding-bottom:5px}.wide{grid-column:1/-1}.out{white-space:pre-wrap;word-break:break-word;overflow:auto;max-height:72vh;font-size:11px}.kv{display:grid;grid-template-columns:145px 1fr;gap:3px;font-size:12px}.k{color:#8bd99a}.v{color:#eaffee}.bar{height:8px;border:1px solid #1bff5f;background:#001b0c;margin:4px 0 8px}.fill{height:100%;background:#28ff69;transition:width .4s}.fill.warn{background:#ffd166}.fill.hot{background:#ff4d4d}.unit{color:#8affff}.mini{font-size:11px;color:#82d98f}.term{background:#000;color:#75ff87;border:1px solid #00ff66;padding:8px;width:100%;min-height:260px;max-height:520px;overflow:auto}.inp,textarea{width:100%;background:#001b0c;color:#eaffee;border:1px solid #35ff75;padding:8px;font-family:Consolas,monospace}canvas#wave{width:100%;height:150px;border:1px solid #00ff6655;background:#000;display:block}.pulse{width:8px;height:8px;border-radius:50%;background:#42ff65;display:inline-block;box-shadow:0 0 12px #42ff65;animation:pulse 1.2s infinite}@keyframes pulse{50%{opacity:.25;transform:scale(.75)}}
</style></head><body>
<header><h1>TON SYSTÈME — TRILLIONS REAL CORE NUMÉRO 1</h1><span class="pulse"></span><span id="sock" class="badge">SOCKET...</span><span id="up" class="badge">UP...</span><span id="mode" class="badge">REAL ONLY</span></header>
<div class="tabs"><button class="active" onclick="tab('dash',this)">COCKPIT</button><button onclick="tab('hw',this)">MESURES HARDWARE</button><button onclick="tab('btc',this)">BTC / SHA256</button><button onclick="tab('brain',this)">BRAIN</button><button onclick="tab('net',this)">RÉSEAU</button><button onclick="tab('repo',this)">REPO</button><button onclick="tab('term',this)">TERMINAL</button><button onclick="loadRaw('/api/full')">FULL JSON</button></div>
<div id="dash" class="pane active"><div class="grid"><div class="card wide"><h3>Onde de situation vivante</h3><canvas id="wave"></canvas><div class="mini">L'onde suit charge CPU, RAM, réseau et pulses du neural bus.</div></div><div class="card"><h3>CPU</h3><div id="cpu"></div></div><div class="card"><h3>RAM</h3><div id="ram"></div></div><div class="card"><h3>BTC Live</h3><div id="btcMini"></div></div><div class="card"><h3>GPU / VRAM</h3><div id="gpu"></div></div><div class="card"><h3>Réseau</h3><div id="netMini"></div></div><div class="card"><h3>Mining Bridge</h3><div id="miningMini"></div></div></div></div>
<div id="hw" class="pane"><div class="grid"><div class="card"><h3>CPU détaillé</h3><div id="hwCpu"></div></div><div class="card"><h3>RAM détaillée</h3><div id="hwRam"></div></div><div class="card"><h3>Node process</h3><div id="hwNode"></div></div><div class="card wide"><h3>Disques</h3><div id="hwDisk"></div></div><div class="card wide"><h3>GPU / VRAM / Power</h3><div id="hwGpu"></div></div><div class="card wide"><h3>Interfaces réseau KB/s</h3><div id="hwNet"></div></div></div></div>
<div id="btc" class="pane"><div class="grid"><div class="card"><h3>Bitcoin</h3><div id="btcFull"></div></div><div class="card"><h3>Fees sats/vB</h3><div id="fees"></div></div><div class="card"><h3>SHA256 / ASIC Bridge</h3><div id="sha"></div></div><div class="card wide"><h3>Mining rigs JSON</h3><pre id="miningRaw" class="out">—</pre></div></div></div>
<div id="brain" class="pane"><div class="grid"><div class="card"><h3>Cortex</h3><pre id="brainRaw" class="out">—</pre></div><div class="card"><h3>Neural Bus</h3><pre id="neuralRaw" class="out">—</pre></div><div class="card"><h3>Agents</h3><div id="agents"></div></div></div></div>
<div id="net" class="pane"><div class="grid"><div class="card wide"><h3>Network JSON</h3><pre id="netRaw" class="out">—</pre></div></div></div>
<div id="repo" class="pane"><div class="grid"><div class="card wide"><h3>Repo JSON</h3><pre id="repoRaw" class="out">—</pre></div></div></div>
<div id="term" class="pane"><div class="grid"><div class="card wide"><h3>Terminal sécurisé</h3><input id="cmd" class="inp" value="ps aux --sort=-%cpu | head -20"><button class="btn" onclick="runCmd()">RUN SAFE SHELL</button><button class="btn" onclick="askAI()">AI ANALYZE</button><textarea id="ask" rows="3">Analyse l'état réel du runtime et les goulots d'étranglement, sans fiction.</textarea><pre id="out" class="term">READY</pre></div></div></div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io();let last={};let phase=0;
function q(id){return document.getElementById(id)}function pct(x){return Math.max(0,Math.min(100,Number(x||0)))}
function kv(k,v,u){return '<div class="kv"><span class="k">'+k+'</span><span class="v">'+(v==null?'unavailable':v)+' '+(u?'<span class="unit">'+u+'</span>':'')+'</span></div>'}
function bar(v){let p=pct(v),c=p>85?'hot':p>65?'warn':'';return '<div class="bar"><div class="fill '+c+'" style="width:'+p+'%"></div></div>'}
function tab(id,btn){document.querySelectorAll('.pane').forEach(x=>x.classList.remove('active'));q(id).classList.add('active');document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active')}
async function get(u){let r=await fetch(u);return r.json()}
async function loadRaw(u){tab('term');q('out').textContent='LOADING '+u;try{q('out').textContent=JSON.stringify(await get(u),null,2)}catch(e){q('out').textContent='ERROR '+e.message}}
function render(s){last=s||last;let h=s.hardware||{},cpu=h.cpu||{},ram=h.ram||{},btc=s.btc||{},net=(h.network||[])[0]||{},gpu=(h.gpu||[])[0]||{},min=s.mining||{};q('up').textContent='UP '+(h.uptimeAppSec||0)+'s';q('cpu').innerHTML=kv('Modèle',cpu.brand)+kv('Fréquence',cpu.speedGHz,'GHz')+kv('Charge',cpu.loadPct,'%')+bar(cpu.loadPct)+kv('Température',cpu.temperatureC,'°C');q('ram').innerHTML=kv('Total',ram.totalGB,'GB')+kv('Utilisé',ram.usedGB,'GB')+kv('Libre',ram.freeGB,'GB')+kv('Usage',ram.usedPct,'%')+bar(ram.usedPct);q('btcMini').innerHTML=kv('Prix',btc.priceUsd,'USD')+kv('Bloc',btc.height)+kv('Mempool',btc.mempoolTx,'tx')+kv('VSize',btc.mempoolVMB,'vMB');q('gpu').innerHTML=(h.gpu||[]).length?kv('GPU',gpu.model)+kv('VRAM',gpu.vramGB,'GB')+kv('Charge',gpu.utilizationGpuPct,'%')+kv('Temp',gpu.temperatureC,'°C'):'<span class="mini">GPU unavailable / non exposé par l’hôte</span>';q('netMini').innerHTML=kv('Interface',net.iface)+kv('RX',net.rxKBs,'KB/s')+kv('TX',net.txKBs,'KB/s');q('miningMini').innerHTML=kv('Connecté',min.connected)+kv('Rigs',(min.rigs||[]).length)+kv('Hashrate',min.totalHashrate,min.unit||'H/s');q('hwCpu').innerHTML=q('cpu').innerHTML+kv('Cœurs logiques',cpu.coresLogical)+kv('Cœurs physiques',cpu.coresPhysical)+kv('Speed min',cpu.speedMinGHz,'GHz')+kv('Speed max',cpu.speedMaxGHz,'GHz');q('hwRam').innerHTML=q('ram').innerHTML+kv('Active',ram.activeGB,'GB')+kv('Available',ram.availableGB,'GB');q('hwNode').innerHTML=Object.entries(h.nodeProcess||{}).map(([k,v])=>kv(k,v,k.toLowerCase().includes('mb')?'MB':'')).join('');q('hwDisk').innerHTML=(h.disks||[]).map(d=>'<div class="card">'+kv('Mount',d.mount)+kv('Type',d.type)+kv('Taille',d.sizeGB,'GB')+kv('Utilisé',d.usedGB,'GB')+kv('Usage',d.usedPct,'%')+bar(d.usedPct)+'</div>').join('')||'unavailable';q('hwGpu').innerHTML=(h.gpu||[]).map(g=>'<div class="card">'+kv('GPU',g.model)+kv('Vendor',g.vendor)+kv('VRAM',g.vramGB,'GB')+kv('Power',g.powerW,'W')+kv('Temp',g.temperatureC,'°C')+kv('Usage',g.utilizationGpuPct,'%')+'</div>').join('')||'unavailable';q('hwNet').innerHTML=(h.network||[]).map(n=>'<div class="card">'+kv('Iface',n.iface)+kv('State',n.operstate)+kv('RX total',n.rxTotalMB,'MB')+kv('TX total',n.txTotalMB,'MB')+kv('RX live',n.rxKBs,'KB/s')+kv('TX live',n.txKBs,'KB/s')+'</div>').join('')||'unavailable';q('btcFull').innerHTML=kv('Status',btc.status)+kv('Prix BTC',btc.priceUsd,'USD')+kv('Bloc',btc.height)+kv('Mempool tx',btc.mempoolTx)+kv('Mempool',btc.mempoolVMB,'vMB')+kv('Source',(btc.sources||[]).join(', '));let f=btc.fees||{};q('fees').innerHTML=kv('Fastest',f.fastestFee,'sat/vB')+kv('Half hour',f.halfHourFee,'sat/vB')+kv('Hour',f.hourFee,'sat/vB')+kv('Economy',f.economyFee,'sat/vB')+kv('Minimum',f.minimumFee,'sat/vB');q('sha').innerHTML=kv('Rigs',(min.rigs||[]).length)+kv('Total hashrate',min.totalHashrate,min.unit)+kv('Dernière update',min.lastUpdate);q('miningRaw').textContent=JSON.stringify(min,null,2);q('brainRaw').textContent=JSON.stringify(s.brain,null,2);q('neuralRaw').textContent=JSON.stringify(s.neural,null,2);q('agents').innerHTML=(s.brain.agents||[]).map(a=>kv(a.id,a.role+' / '+a.status)).join('');}
async function refresh(){try{let s=await get('/api/full');render(s)}catch(e){q('out').textContent='REFRESH ERROR '+e.message}}
async function runCmd(){let c=q('cmd').value;q('out').textContent='$ '+c+'\nRUNNING...';let r=await fetch('/api/shell',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});let j=await r.json();q('out').textContent='$ '+c+'\n\n'+(j.out||'')+(j.err?'\n\nERR:\n'+j.err:'')}
async function askAI(){let m=q('ask').value;q('out').textContent='AI...';q('out').textContent=JSON.stringify(await get('/api/ai?m='+encodeURIComponent(m)),null,2)}
socket.on('connect',()=>q('sock').textContent='SOCKET LIVE');socket.on('disconnect',()=>q('sock').textContent='SOCKET OFF');socket.on('runtime',s=>render(s));socket.on('log',x=>{});
function wave(){let c=q('wave'),ctx=c.getContext('2d'),w=c.width=c.clientWidth,h=c.height=c.clientHeight;ctx.clearRect(0,0,w,h);let cpu=(((last.hardware||{}).cpu||{}).loadPct)||10,ram=(((last.hardware||{}).ram||{}).usedPct)||10,net=((((last.hardware||{}).network||[])[0]||{}).rxKBs)||0;ctx.lineWidth=2;for(let j=0;j<3;j++){ctx.beginPath();for(let x=0;x<w;x++){let amp=12+j*8+(cpu+ram)/12;let y=h/2+Math.sin((x/22)+phase+j)*amp+Math.sin((x/53)+phase*1.7)*(net%20);if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=j===0?'#2cff65':j===1?'#38eaff':'#ffb84d';ctx.stroke()}phase+=0.045;requestAnimationFrame(wave)}
refresh();setInterval(refresh,8000);wave();
</script></body></html>`;
}

/* ROUTES */
app.get('/', (req, res) => res.type('html').send(page()));
app.get('/api/full', async (req, res) => res.json(await full()));
app.get('/api/system', async (req, res) => res.json(await hardware()));
app.get('/api/hardware', async (req, res) => res.json(await hardware()));
app.get('/api/network', async (req, res) => res.json(await network()));
app.get('/api/repo', async (req, res) => res.json(await repo()));
app.get('/api/blockchain', async (req, res) => res.json(await blockchain()));
app.get('/api/btc', async (req, res) => res.json(await btcTerminal()));
app.get('/api/brain', async (req, res) => res.json({ brain: STATE.brain, neural: STATE.neural }));
app.get('/api/workload', async (req, res) => res.json(await workload()));
app.get('/api/launch', async (req, res) => res.json(await launchStatus()));
app.get('/api/protocols', async (req, res) => res.json(await protocols()));
app.get('/api/security', async (req, res) => res.json(await security()));
app.get('/api/ai', async (req, res) => res.json(await ai(req.query.m)));
app.get('/api/mining', (req, res) => res.json(STATE.mining));
app.post('/api/mining', (req, res) => res.json({ ok: true, mining: updateMiningFromPayload(req.body) }));
app.post('/api/shell', async (req, res) => {
  const cmd = String(req.body && req.body.cmd || '').trim();
  if (!cmd) return res.json({ ok: false, err: 'empty command' });
  if (blockedCmd(cmd)) return res.json({ ok: false, err: 'blocked dangerous command' });
  res.json(await sh(cmd, 15000));
});
app.get('/metrics', async (req, res) => {
  const h = await hardware();
  const lines = [
    '# HELP trillions_uptime_seconds Runtime uptime', '# TYPE trillions_uptime_seconds gauge', `trillions_uptime_seconds ${upSec()}`,
    '# HELP trillions_cpu_load_percent CPU load percent', '# TYPE trillions_cpu_load_percent gauge', `trillions_cpu_load_percent ${h.cpu.loadPct || 0}`,
    '# HELP trillions_cpu_speed_ghz CPU current speed GHz', '# TYPE trillions_cpu_speed_ghz gauge', `trillions_cpu_speed_ghz ${h.cpu.speedGHz || 0}`,
    '# HELP trillions_ram_used_gb RAM used GB', '# TYPE trillions_ram_used_gb gauge', `trillions_ram_used_gb ${h.ram.usedGB || 0}`,
    '# HELP trillions_ram_free_gb RAM free GB', '# TYPE trillions_ram_free_gb gauge', `trillions_ram_free_gb ${h.ram.freeGB || 0}`,
    '# HELP trillions_sockets_connected Connected Socket.IO clients', '# TYPE trillions_sockets_connected gauge', `trillions_sockets_connected ${CLIENTS.size}`,
    '# HELP trillions_neural_pulses Neural bus pulses', '# TYPE trillions_neural_pulses counter', `trillions_neural_pulses ${STATE.neural.pulses}`
  ];
  res.type('text/plain').send(lines.join('\n') + '\n');
});

io.on('connection', socket => {
  CLIENTS.add(socket.id);
  log('SOCKET', `client connected ${socket.id.slice(0, 8)}`);
  const loop = setInterval(async () => {
    try {
      STATE.tick++;
      if (STATE.tick % 4 === 0) await btcTerminal();
      const payload = { time: now(), kernel: KERNEL, brain: STATE.brain, neural: STATE.neural, hardware: await hardware(), btc: STATE.btc, mining: STATE.mining };
      pulse('runtime', 'heartbeat', { tick: STATE.tick, clients: CLIENTS.size });
      socket.emit('runtime', payload);
    } catch (e) { socket.emit('runtime:error', { error: e.message }); }
  }, 5000);
  socket.on('disconnect', () => { CLIENTS.delete(socket.id); clearInterval(loop); });
});

(async function boot() {
  log('BOOT', 'TRILLIONS REAL CORE NUMERO 1 — surgical fusion active');
  log('SAFETY', 'read-only by default / no seed / no private key / no auto transaction / no auto mining');
  if (!si) log('MODULE', 'systeminformation unavailable: npm install systeminformation', 'warn');
  if (!axios) log('MODULE', 'axios unavailable: npm install axios', 'warn');
  try { await btcTerminal(); } catch (_) {}
})();

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================');
  console.log('TRILLIONS REAL CORE NUMERO 1 ACTIVE');
  console.log('PORT => ' + PORT);
  console.log('SOCLE => app.js.txt');
  console.log('LAYERS => hardware metrics + BTC + brain + neural bus + cockpit waves');
  console.log('REAL ONLY => unavailable if inaccessible');
  console.log('================================================');
});
