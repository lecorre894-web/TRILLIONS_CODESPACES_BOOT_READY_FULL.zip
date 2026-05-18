"use strict";

const os = require("os");
const crypto = require("crypto");
const { performance } = require("perf_hooks");

const DURATION_MS = Math.max(500, Math.min(Number(process.argv[2] || 3000), 30000));
const PAYLOAD_SIZE = Math.max(80, Math.min(Number(process.argv[3] || 80), 4096));

function now(){ return performance.now(); }
function f(n,d=6){ return Number.isFinite(n) ? Number(n.toFixed(d)) : 0; }
function fmt(n,d=2){ return Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString("en-US") : "UNAVAILABLE"; }

function units(hps){
  return {
    Hs: f(hps, 2),
    KHs: f(hps / 1e3, 6),
    MHs: f(hps / 1e6, 6),
    GHs: f(hps / 1e9, 9),
    THs: f(hps / 1e12, 12),
    PHs: f(hps / 1e15, 15),
    EHs: f(hps / 1e18, 18)
  };
}

function doubleSha256(buf){
  return crypto.createHash("sha256")
    .update(crypto.createHash("sha256").update(buf).digest())
    .digest();
}

function benchBTC(ms, payloadSize){
  const header = crypto.randomBytes(payloadSize);
  let nonce = 0;
  let hashes = 0;
  let checksum = 0;

  const start = now();

  while(now() - start < ms){
    header.writeUInt32LE(nonce >>> 0, Math.max(0, payloadSize - 4));
    const out = doubleSha256(header);
    checksum ^= out[0];
    nonce = (nonce + 1) >>> 0;
    hashes++;
  }

  const elapsed = (now() - start) / 1000;
  const hps = hashes / Math.max(elapsed, 0.001);

  return {
    elapsed_sec: f(elapsed, 4),
    payload_bytes: payloadSize,
    hashes,
    btc_double_sha256_hps: Math.round(hps),
    units: units(hps),
    checksum
  };
}

function estimateAsics(targetEHs, asicTHs){
  const targetHps = targetEHs * 1e18;
  const asicHps = asicTHs * 1e12;
  return Math.ceil(targetHps / asicHps);
}

function classify(hps){
  if(hps >= 1e18) return "REAL_EH_S";
  if(hps >= 1e15) return "PH_S";
  if(hps >= 1e12) return "TH_S";
  if(hps >= 1e9) return "GH_S";
  if(hps >= 1e6) return "MH_S";
  return "SOFTWARE_HS";
}

const result = benchBTC(DURATION_MS, PAYLOAD_SIZE);
const hps = result.btc_double_sha256_hps;

const gap1EH = hps > 0 ? 1e18 / hps : Infinity;
const asic234For1EH = estimateAsics(1, 234);
const asic234For10EH = estimateAsics(10, 234);
const asic234For100EH = estimateAsics(100, 234);

console.log("");
console.log("===== TRILLIONS BTC EH/S BENCHMARK =====");
console.log("");
console.log("Node:", process.version, "| V8:", process.versions.v8);
console.log("CPU visible:", os.cpus()[0]?.model || "UNAVAILABLE");
console.log("Logical CPUs visible:", os.cpus().length);
console.log("Duration ms:", DURATION_MS);
console.log("Payload bytes:", PAYLOAD_SIZE);
console.log("");
console.log("----- REAL SOFTWARE BTC HASHRATE -----");
console.log("BTC double-SHA256 H/s:", fmt(result.btc_double_sha256_hps, 0));
console.log("KH/s:", result.units.KHs);
console.log("MH/s:", result.units.MHs);
console.log("GH/s:", result.units.GHs);
console.log("TH/s:", result.units.THs);
console.log("PH/s:", result.units.PHs);
console.log("EH/s:", result.units.EHs);
console.log("CLASS:", classify(hps));
console.log("");
console.log("----- GAP TO EH/S -----");
console.log("Multiplier needed for 1 EH/s:", fmt(gap1EH, 2), "x");
console.log("");
console.log("----- ASIC PROJECTION @ 234 TH/s EACH -----");
console.log("ASIC count for 1 EH/s:", asic234For1EH);
console.log("ASIC count for 10 EH/s:", asic234For10EH);
console.log("ASIC count for 100 EH/s:", asic234For100EH);
console.log("");
console.log("----- HONESTY -----");
console.log("This benchmark measures real software BTC double-SHA256 inside this runtime.");
console.log("EH/s real requires external ASIC/pool telemetry, not Codespaces software hashing.");
console.log("");
console.log("===== JSON_EXPORT =====");
console.log(JSON.stringify({
  ok: true,
  benchmark: "TRILLIONS_BTC_EHS_BENCHMARK",
  mode: "BTC_DOUBLE_SHA256_SOFTWARE_MEASURED",
  host_visible: {
    node: process.version,
    v8: process.versions.v8,
    platform: os.platform(),
    arch: os.arch(),
    logical_cpus: os.cpus().length,
    cpu_model: os.cpus()[0]?.model || "UNAVAILABLE"
  },
  result,
  gap_to_1_EHs_multiplier: f(gap1EH, 2),
  asic_projection: {
    asic_THs_each: 234,
    count_for_1_EHs: asic234For1EH,
    count_for_10_EHs: asic234For10EH,
    count_for_100_EHs: asic234For100EH
  },
  honesty: {
    real_software_hashrate: true,
    real_EHs_claim: false,
    not_mining_pool_telemetry: true,
    not_physical_asic: true,
    no_fake_hashrate: true
  }
}, null, 2));
