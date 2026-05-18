const os = require("os");
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { performance } = require("perf_hooks");

const DURATION = Number(process.argv[2] || 10000);

function f(n,d=2){ return Number(n.toFixed(d)); }

if(!isMainThread){

  const end = performance.now() + workerData.ms;

  const a = new Float64Array(1024 * 64);
  const b = new Float64Array(1024 * 64);
  const c = new Float64Array(1024 * 64);

  for(let i=0;i<a.length;i++){
    a[i]=i*0.5;
    b[i]=i*0.25;
  }

  let ops = 0;

  while(performance.now() < end){

    for(let i=0;i<a.length;i+=8){

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

  parentPort.postMessage({ ops });
  return;
}

(async()=>{

  const workers = Math.max(1, os.cpus().length);
  const start = performance.now();

  const results = await Promise.all(
    Array.from({length:workers},()=>new Promise(res=>{

      const w = new Worker(__filename,{
        workerData:{ ms:DURATION }
      });

      w.on("message",res);

    }))
  );

  const elapsed = (performance.now()-start)/1000;

  const totalOps = results.reduce((a,b)=>a+b.ops,0);

  const flops = totalOps / elapsed;

  console.log("");
  console.log("===== TRILLIONS AVX BENCH =====");
  console.log("");
  console.log("Workers:", workers);
  console.log("Elapsed:", f(elapsed,2),"sec");
  console.log("");
  console.log("FLOPS:", Math.round(flops));
  console.log("GFLOPS:", f(flops/1e9,4));
  console.log("AVX2_ESTIMATE_GFLOPS:", f((flops/1e9)*1.15,4));
  console.log("AVX512_ESTIMATE_GFLOPS:", f((flops/1e9)*1.45,4));
  console.log("");
  console.log("CPU:", os.cpus()[0].model);
  console.log("");
  console.log("Honesty:");
  console.log("Real measured FLOPS from JS Float64Array compute.");
  console.log("AVX2/AVX512 are software-path estimates, not native intrinsics.");
  console.log("");

})();
