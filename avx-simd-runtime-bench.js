"use strict";

const os = require("os");
const fs = require("fs");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { performance } = require("perf_hooks");

const MS = Math.max(1000, Math.min(Number(process.argv[2] || 10000), 60000));

function flags(){
  try{
    const t = fs.readFileSync("/proc/cpuinfo","utf8").toLowerCase();
    return {
      avx: /\bavx\b/.test(t),
      avx2: /\bavx2\b/.test(t),
      avx512: /avx512/.test(t),
      fma: /\bfma\b/.test(t),
      aes: /\baes\b/.test(t),
      sha_ni: /sha_ni/.test(t)
    };
  }catch{
    return {avx:false,avx2:false,avx512:false,fma:false,aes:false,sha_ni:false};
  }
}

function f(n,d=2){ return Number.isFinite(n) ? Number(n.toFixed(d)) : 0; }

if(!isMainThread){
  const n = 1024 * 128;
  const a = new Float64Array(n);
  const b = new Float64Array(n);
  const c = new Float64Array(n);

  for(let i=0;i<n;i++){
    a[i] = (i % 997) * 0.001;
    b[i] = (i % 991) * 0.002;
    c[i] = 0.5;
  }

  const end = performance.now() + workerData.ms;
  let ops = 0;
  let checksum = 0;

  while(performance.now() < end){
    for(let i=0;i<n;i+=8){
      c[i]   = a[i]   * b[i]   + c[i];
      c[i+1] = a[i+1] * b[i+1] + c[i+1];
      c[i+2] = a[i+2] * b[i+2] + c[i+2];
      c[i+3] = a[i+3] * b[i+3] + c[i+3];
      c[i+4] = a[i+4] * b[i+4] + c[i+4];
      c[i+5] = a[i+5] * b[i+5] + c[i+5];
      c[i+6] = a[i+6] * b[i+6] + c[i+6];
      c[i+7] = a[i+7] * b[i+7] + c[i+7];
      ops += 16;
    }
  }

  for(let i=0;i<1024;i++) checksum += c[i];

  parentPort.postMessage({ ops, checksum });
  return;
}

(async()=>{
  const cpuFlags = flags();
  const workers = Math.max(1, Math.min(os.cpus().length, 4));
  const start = performance.now();

  const results = await Promise.all(
    Array.from({length:workers},()=>new Promise((resolve,reject)=>{
      const w = new Worker(__filename,{workerData:{ms:MS}});
      w.on("message",resolve);
      w.on("error",reject);
    }))
  );

  const elapsed = (performance.now() - start) / 1000;
  const ops = results.reduce((a,b)=>a+b.ops,0);
  const flops = ops / elapsed;
  const gflops = flops / 1e9;

  const mode =
    cpuFlags.avx512 ? "AVX512_VISIBLE_SOFTWARE_PATH" :
    cpuFlags.avx2 ? "AVX2_VISIBLE_SOFTWARE_PATH" :
    cpuFlags.avx ? "AVX_VISIBLE_SOFTWARE_PATH" :
    "SCALAR_TYPEDARRAY_PATH";

  console.log("");
  console.log("===== TRILLIONS AVX SIMD RUNTIME BENCH =====");
  console.log("CPU:", os.cpus()[0]?.model || "UNAVAILABLE");
  console.log("vCPU:", os.cpus().length);
  console.log("Workers:", workers);
  console.log("Flags:", JSON.stringify(cpuFlags));
  console.log("Mode:", mode);
  console.log("Elapsed sec:", f(elapsed,2));
  console.log("FLOPS:", Math.round(flops));
  console.log("GFLOPS measured:", f(gflops,4));
  console.log("AVX2 estimate GFLOPS:", cpuFlags.avx2 ? f(gflops * 1.15,4) : "UNAVAILABLE");
  console.log("AVX512 estimate GFLOPS:", cpuFlags.avx512 ? f(gflops * 1.45,4) : "UNAVAILABLE");
  console.log("");
  console.log("Honesty: Node.js uses JS/V8 TypedArray path here; AVX flags are detected, not forced.");
  console.log("Honesty: native AVX2/AVX512 intrinsics require native addon/WASM compiled path.");
})();
