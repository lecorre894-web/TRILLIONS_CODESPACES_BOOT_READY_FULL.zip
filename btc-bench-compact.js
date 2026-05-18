"use strict";

const os = require("os");
const crypto = require("crypto");
const { performance } = require("perf_hooks");

const ms = Math.max(500, Math.min(Number(process.argv[2] || 3000), 30000));
const payloadSize = 80;

function f(n,d=6){ return Number.isFinite(n) ? Number(n.toFixed(d)) : 0; }

function doubleSha256(buf){
  return crypto.createHash("sha256")
    .update(crypto.createHash("sha256").update(buf).digest())
    .digest();
}

function bench(){
  const header = crypto.randomBytes(payloadSize);
  let nonce = 0, hashes = 0, checksum = 0;
  const start = performance.now();

  while(performance.now() - start < ms){
    header.writeUInt32LE(nonce >>> 0, payloadSize - 4);
    const out = doubleSha256(header);
    checksum ^= out[0];
    nonce = (nonce + 1) >>> 0;
    hashes++;
  }

  const sec = (performance.now() - start) / 1000;
  const hps = hashes / Math.max(sec, 0.001);

  return {
    elapsed_sec: f(sec,4),
    hashes,
    Hs: Math.round(hps),
    KHs: f(hps / 1e3,6),
    MHs: f(hps / 1e6,6),
    GHs: f(hps / 1e9,9),
    THs: f(hps / 1e12,12),
    PHs: f(hps / 1e15,15),
    EHs: f(hps / 1e18,18),
    gap_to_1_EHs: f(1e18 / Math.max(hps,1),2),
    checksum
  };
}

const r = bench();

console.log("");
console.log("===== BTC DOUBLE SHA256 COMPACT BENCH =====");
console.log("CPU:", os.cpus()[0]?.model || "UNAVAILABLE");
console.log("vCPU:", os.cpus().length);
console.log("Node:", process.version);
console.log("Duration ms:", ms);
console.log("");
console.log("H/s :", r.Hs);
console.log("KH/s:", r.KHs);
console.log("MH/s:", r.MHs);
console.log("GH/s:", r.GHs);
console.log("TH/s:", r.THs);
console.log("PH/s:", r.PHs);
console.log("EH/s:", r.EHs);
console.log("Gap to 1 EH/s:", r.gap_to_1_EHs, "x");
console.log("");
console.log("Honesty: real software double-SHA256 only; not real ASIC/EH/s.");
console.log("");
console.log(JSON.stringify({ ok:true, bench:"BTC_COMPACT", result:r }, null, 2));
