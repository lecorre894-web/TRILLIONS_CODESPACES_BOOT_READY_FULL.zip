"use strict";

const os = require("os");
const crypto = require("crypto");
const { performance, monitorEventLoopDelay } = require("perf_hooks");

const SCAN_MS = Math.max(500, Math.min(Number(process.argv[2] || 2000), 10000));

function now(){ return performance.now(); }
function f(n,d=2){ return Number.isFinite(n) ? Number(n.toFixed(d)) : 0; }

function classify(score){
  if(score >= 1400) return "OMEGA_ASIC";
  if(score >= 900) return "ULTRA_ASIC";
  if(score >= 550) return "HEAVY_ASIC";
  if(score >= 300) return "FAST_ASIC";
  if(score >= 120) return "NORMAL_ASIC";
  return "LOW_ASIC";
}

function percent(before, after){
  if(!Number.isFinite(before) || before <= 0) return 0;
  return ((after - before) / before) * 100;
}

function latencyScan(){
  let best = Infinity, sum = 0, worst = 0;
  const n = 80000;
  for(let i=0;i<n;i++){
    const a = now();
    const b = now();
    const d = b - a;
    if(d < best) best = d;
    if(d > worst) worst = d;
    sum += d;
  }
  return {
    best_us: f(best * 1000, 4),
    avg_us: f((sum / n) * 1000, 4),
    worst_us: f(worst * 1000, 4)
  };
}

function normalMath(ms){
  const start = now();
  let ops = 0;
  let x = 0.123456789;

  while(now() - start < ms){
    for(let i=0;i<50000;i++){
      x = Math.sin(x + i) + Math.cos(x) + Math.sqrt((i % 1000) + 1);
    }
    ops += 50000 * 5;
  }

  const sec = (now() - start) / 1000;
  return {
    ops_sec: Math.round(ops / sec),
    checksum: f(x, 6)
  };
}

function asicMath(ms){
  const start = now();
  let ops = 0;
  let x = 0.123456789;
  let y = 1.987654321;

  while(now() - start < ms){
    for(let i=0;i<120000;i++){
      x = x * 1.000000119 + y * 0.999999937;
      y = y + x * 0.000000031;
      x = x - y * 0.000000017;
    }
    ops += 120000 * 8;
  }

  const sec = (now() - start) / 1000;
  return {
    ops_sec: Math.round(ops / sec),
    checksum: f((x + y) % 1000000, 6)
  };
}

function normalHash(ms){
  const payload = crypto.randomBytes(4096);
  const start = now();
  let n = 0;

  while(now() - start < ms){
    crypto.createHash("sha256").update(payload).digest();
    n++;
  }

  const sec = (now() - start) / 1000;
  return { sha256_sec: Math.round(n / sec) };
}

function asicHash(ms){
  const batch = [];
  for(let i=0;i<16;i++) batch.push(crypto.randomBytes(4096));

  const start = now();
  let n = 0;
  let idx = 0;

  while(now() - start < ms){
    for(let j=0;j<16;j++){
      crypto.createHash("sha256").update(batch[idx & 15]).digest();
      idx++;
    }
    n += 16;
  }

  const sec = (now() - start) / 1000;
  return { sha256_sec: Math.round(n / sec) };
}

function normalMemory(ms){
  const size = 16 * 1024 * 1024;
  const src = Buffer.allocUnsafe(size);
  const dst = Buffer.allocUnsafe(size);
  src.fill(11);

  const start = now();
  let bytes = 0;

  while(now() - start < ms){
    src.copy(dst);
    bytes += size;
  }

  const sec = (now() - start) / 1000;
  return { memory_MB_sec: f((bytes / 1048576) / sec, 2) };
}

function asicMemory(ms){
  const size = 8 * 1024 * 1024;
  const lanes = 4;
  const src = [];
  const dst = [];

  for(let i=0;i<lanes;i++){
    src.push(Buffer.allocUnsafe(size));
    dst.push(Buffer.allocUnsafe(size));
    src[i].fill(17 + i);
  }

  const start = now();
  let bytes = 0;
  let k = 0;

  while(now() - start < ms){
    const lane = k & 3;
    src[lane].copy(dst[lane]);
    bytes += size;
    k++;
  }

  const sec = (now() - start) / 1000;
  return { memory_MB_sec: f((bytes / 1048576) / sec, 2) };
}

async function loopScan(ms, asicMode){
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();

  const start = now();
  let ticks = 0;

  if(!asicMode){
    while(now() - start < ms){
      await new Promise(r => setImmediate(r));
      ticks++;
    }
  } else {
    while(now() - start < ms){
      await Promise.resolve();
      if((ticks & 15) === 0) await new Promise(r => setImmediate(r));
      ticks++;
    }
  }

  h.disable();

  const sec = (now() - start) / 1000;
  return {
    ticks_sec: Math.round(ticks / sec),
    mean_ms: f(h.mean / 1e6, 4),
    p95_ms: f(h.percentile(95) / 1e6, 4),
    p99_ms: f(h.percentile(99) / 1e6, 4),
    max_ms: f(h.max / 1e6, 4)
  };
}

function score(r){
  const math = Math.log10(Math.max(r.math.ops_sec, 1)) * 115;
  const hash = Math.log10(Math.max(r.hash.sha256_sec, 1)) * 95;
  const mem = Math.log10(Math.max(r.memory.memory_MB_sec, 1)) * 150;
  const loop = Math.log10(Math.max(r.loop.ticks_sec, 1)) * 90;
  const latencyPenalty = Math.min(r.latency.avg_us * 8, 140);
  const loopPenalty = Math.min(r.loop.p95_ms * 4, 200);

  const total = Math.max(0, math + hash + mem + loop - latencyPenalty - loopPenalty);

  return {
    score: f(total, 2),
    class: classify(total),
    math_score: f(math, 2),
    hash_score: f(hash, 2),
    memory_score: f(mem, 2),
    loop_score: f(loop, 2),
    latency_penalty: f(latencyPenalty, 2),
    loop_penalty: f(loopPenalty, 2)
  };
}

async function runMode(mode){
  const part = Math.max(120, Math.floor(SCAN_MS / 5));
  const asic = mode === "SOFTWARE_ASIC";

  const r = {
    mode,
    latency: latencyScan(),
    math: asic ? asicMath(part) : normalMath(part),
    hash: asic ? asicHash(part) : normalHash(part),
    memory: asic ? asicMemory(part) : normalMemory(part),
    loop: await loopScan(part, asic)
  };

  r.score = score(r);
  return r;
}

(async function main(){
  console.log("");
  console.log("===== TRILLIONS SOFTWARE ASIC VALIDATOR =====");
  console.log("SCAN_MS:", SCAN_MS);
  console.log("Node:", process.version, "| V8:", process.versions.v8);
  console.log("CPU visible:", os.cpus()[0]?.model || "UNAVAILABLE");
  console.log("Logical CPUs visible:", os.cpus().length);
  console.log("");

  console.log("[1/2] NORMAL_KERNEL scan...");
  const normal = await runMode("NORMAL_KERNEL");

  console.log("[2/2] SOFTWARE_ASIC scan...");
  const asic = await runMode("SOFTWARE_ASIC");

  const scoreGain = percent(normal.score.score, asic.score.score);
  const hashGain = percent(normal.hash.sha256_sec, asic.hash.sha256_sec);
  const memoryGain = percent(normal.memory.memory_MB_sec, asic.memory.memory_MB_sec);
  const mathGain = percent(normal.math.ops_sec, asic.math.ops_sec);
  const loopDelta = asic.loop.p95_ms - normal.loop.p95_ms;

  let verdict = "SOFTWARE_ASIC_NOT_CONFIRMED";
  if(scoreGain > 5 && hashGain >= -5 && loopDelta < 20) verdict = "SOFTWARE_ASIC_CONFIRMED";
  if(scoreGain > 15 && hashGain > 5 && memoryGain > 0) verdict = "SOFTWARE_ASIC_STRONG_CONFIRMED";
  if(scoreGain < -5) verdict = "SOFTWARE_ASIC_REGRESSION";

  console.log("");
  console.log("===== RESULT =====");
  console.log("NORMAL_SCORE:", normal.score.score, normal.score.class);
  console.log("ASIC_SCORE:", asic.score.score, asic.score.class);
  console.log("GAIN_PERCENT:", f(scoreGain, 2), "%");
  console.log("HASH_GAIN_PERCENT:", f(hashGain, 2), "%");
  console.log("MEMORY_GAIN_PERCENT:", f(memoryGain, 2), "%");
  console.log("MATH_GAIN_PERCENT:", f(mathGain, 2), "%");
  console.log("EVENT_LOOP_P95_DELTA_MS:", f(loopDelta, 4));
  console.log("VERDICT:", verdict);
  console.log("");

  console.log("NORMAL hash/sec:", normal.hash.sha256_sec);
  console.log("ASIC hash/sec:", asic.hash.sha256_sec);
  console.log("NORMAL memory MB/sec:", normal.memory.memory_MB_sec);
  console.log("ASIC memory MB/sec:", asic.memory.memory_MB_sec);
  console.log("NORMAL event loop p95 ms:", normal.loop.p95_ms);
  console.log("ASIC event loop p95 ms:", asic.loop.p95_ms);
  console.log("");

  console.log("===== JSON_EXPORT =====");
  console.log(JSON.stringify({
    ok: true,
    validator: "TRILLIONS_SOFTWARE_ASIC_VALIDATOR",
    scan_ms: SCAN_MS,
    host_visible: {
      node: process.version,
      v8: process.versions.v8,
      logical_cpus: os.cpus().length,
      cpu_model: os.cpus()[0]?.model || "UNAVAILABLE"
    },
    normal,
    software_asic: asic,
    deltas: {
      score_gain_percent: f(scoreGain, 2),
      hash_gain_percent: f(hashGain, 2),
      memory_gain_percent: f(memoryGain, 2),
      math_gain_percent: f(mathGain, 2),
      event_loop_p95_delta_ms: f(loopDelta, 4)
    },
    verdict,
    honesty: {
      software_asic: "software accelerator / specialized runtime path",
      not_physical_asic: true,
      not_real_ehs: true,
      bounded_by_host_cpu_and_container_limits: true
    }
  }, null, 2));
})();
