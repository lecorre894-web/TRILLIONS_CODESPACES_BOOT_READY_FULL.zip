const { Worker } = require("worker_threads");
const os = require("os");
const crypto = require("crypto");
const { performance } = require("perf_hooks");

const WORKERS = Math.max(2, os.cpus().length);
const DURATION = 30;

let native = null;
try { native = require("./native/build/Release/trillions_native.node"); } catch(e) {}

console.log("\n===== TRILLIONS APEX REAL BENCH =====\n");
console.log("Workers:", WORKERS);
console.log("Duration:", DURATION, "sec");
console.log("Native AVX:", native ? "AVAILABLE" : "UNAVAILABLE");
console.log("");

const workerCode = `
const { parentPort, workerData } = require("worker_threads");
const crypto = require("crypto");
const { performance } = require("perf_hooks");

let mathOps = 0;
let hashOps = 0;
let memOps = 0;
let loopSamples = [];
let blocks = [];

const end = performance.now() + workerData.duration * 1000;

while(performance.now() < end){
  const t0 = performance.now();

  let x = 0;
  for(let i=0;i<250000;i++){
    x += Math.sqrt((i & 8191) + 1) * Math.sin(i) * Math.cos(i);
  }
  mathOps += 250000;

  const b = Buffer.allocUnsafe(1024 * 256);
  for(let i=0;i<b.length;i+=64){
    b[i] = (i + x) & 255;
    memOps++;
  }

  crypto.createHash("sha256").update(b).digest("hex");
  hashOps++;

  blocks.push(b);
  if(blocks.length > 16) blocks.shift();

  loopSamples.push(performance.now() - t0);
}

parentPort.postMessage({
  mathOps,
  hashOps,
  memOps,
  avgLoop: loopSamples.reduce((a,b)=>a+b,0)/loopSamples.length,
  maxLoop: Math.max(...loopSamples),
  minLoop: Math.min(...loopSamples)
});
`;

const start = performance.now();
const rssStart = process.memoryUsage().rss / 1048576;

let done = 0;
let total = {
  mathOps:0,
  hashOps:0,
  memOps:0,
  avgLoop:0,
  maxLoop:0,
  minLoop:Infinity
};

for(let i=0;i<WORKERS;i++){
  const w = new Worker(workerCode, {
    eval:true,
    workerData:{ duration:DURATION }
  });

  w.on("message", r=>{
    total.mathOps += r.mathOps;
    total.hashOps += r.hashOps;
    total.memOps += r.memOps;
    total.avgLoop += r.avgLoop;
    total.maxLoop = Math.max(total.maxLoop, r.maxLoop);
    total.minLoop = Math.min(total.minLoop, r.minLoop);
  });

  w.on("exit", ()=>{
    done++;

    if(done === WORKERS){
      const elapsed = (performance.now() - start) / 1000;
      const mem = process.memoryUsage();

      const mathRate = Math.round(total.mathOps / elapsed);
      const hashRate = Math.round(total.hashOps / elapsed);
      const memRate = Math.round(total.memOps / elapsed);
      const avgLoop = total.avgLoop / WORKERS;

      let avx2 = 0;
      let avx512 = 0;

      if(native){
        try { avx2 = native.avx2Bench(100000000).estimated_GFLOPS || 0; } catch(e){}
        try { avx512 = native.avx512Bench(100000000).estimated_GFLOPS || 0; } catch(e){}
      }

      const realScore =
        (mathRate / 1000000) * 6 +
        (memRate / 100000) * 5 +
        hashRate * 2 +
        (1000 / Math.max(avgLoop,1)) * 3 +
        Math.min(500, avx2 + avx512);

      let cls = "NORMAL";
      if(realScore > 2500) cls = "APEX";
      else if(realScore > 1500) cls = "OMEGA";
      else if(realScore > 900) cls = "ULTRA";
      else if(realScore > 500) cls = "EXTREME";
      else if(realScore > 250) cls = "FAST";

      console.log("===== RESULT =====\n");
      console.log("Elapsed sec:", elapsed.toFixed(2));
      console.log("");
      console.log("Math ops/sec:", mathRate.toLocaleString());
      console.log("SHA256/sec:", hashRate.toLocaleString());
      console.log("Memory ops/sec:", memRate.toLocaleString());
      console.log("");
      console.log("Event loop avg ms:", avgLoop.toFixed(4));
      console.log("Event loop min ms:", total.minLoop.toFixed(4));
      console.log("Event loop max ms:", total.maxLoop.toFixed(4));
      console.log("");
      console.log("AVX2 GFLOPS:", avx2.toFixed(2));
      console.log("AVX512 GFLOPS:", avx512.toFixed(2));
      console.log("");
      console.log("RSS MB:", (mem.rss/1048576).toFixed(2));
      console.log("RSS delta MB:", ((mem.rss/1048576)-rssStart).toFixed(2));
      console.log("Heap MB:", (mem.heapUsed/1048576).toFixed(2));
      console.log("");
      console.log("APEX_REAL_SCORE:", realScore.toFixed(2));
      console.log("SYSTEM CLASS:", cls);
      console.log("");
      console.log("Honesty: strongest real mixed benchmark for current host; physical limit remains Codespaces 2 vCPU.");
      console.log("");
    }
  });
}
