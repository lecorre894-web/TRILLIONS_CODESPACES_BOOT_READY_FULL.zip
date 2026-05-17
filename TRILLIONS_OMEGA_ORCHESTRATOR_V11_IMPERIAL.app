/* TRILLIONS REAL CORE — APP.JS.TXT
   Additive runtime orchestrator for Codespaces / Node.js / PM2.
   Rule: REAL DATA ONLY. If unavailable, report unavailable. No fake metrics.
*/

require("dotenv").config();
const express=require("express");
const http=require("http");
const os=require("os");
const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const EventEmitter=require("events");
const {exec}=require("child_process");
const {Server}=require("socket.io");
const si=require("systeminformation");
const axios=require("axios");

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"},maxHttpBufferSize:1e8,pingInterval:10000,pingTimeout:30000,transports:["websocket","polling"]});
const PORT=Number(process.env.PORT||3000);
const START=Date.now();

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({extended:true,limit:"50mb"}));

const KERNEL={
  name:"TRILLIONS_REAL_CORE",
  version:"OMEGA_ORCHESTRATOR_V8_278_PERCENT_PLANETARY_EXPERIMENTAL",
  mode:"REAL_ONLY_OR_UNAVAILABLE",
  peace_authenticity:"no offensive action, no fake telemetry",
  power_policy:"AUTHENTIC_MULTIPLY_BY_PARALLELISM_CACHE_BATCH_WORKERS_NOT_FAKE_PERCENT",
  capacity_floor:"never claim infinite power; expose real host limits and unavailable modules",
  displayed_potential_percent:278,
  potential_policy:"278% is an orchestration/intention/dashboard multiplier, not a fake hardware claim",
  started:new Date().toISOString(),
  launch_json_binding:{
    launch_program:"${workspaceFolder}/app.js",
    remote_attach_port:9229,
    file_launch:"${file}"
  }
};

function now(){return new Date().toISOString();}
function safeText(x,n=20000){return String(x||"").slice(0,n);}
function json(x){try{return JSON.stringify(x,null,2);}catch(e){return String(x);}}
function sh(cmd,timeout=10000){
  return new Promise(resolve=>{
    exec(cmd,{timeout,maxBuffer:1024*1024*25},(err,out,stderr)=>{
      resolve({ok:!err,cmd,out:safeText(out,30000),err:safeText(stderr||err&&err.message,12000)});
    });
  });
}
function blockedCmd(cmd){
  return /(^|\s)(rm\s+-rf\s+\/|mkfs|dd\s+if=|shutdown|reboot|halt|poweroff|:(){|chmod\s+000\s+\/|chown\s+-R\s+.*\s+\/|iptables\s+-F|ufw\s+disable)/i.test(cmd);
}
async function measure(name,fn){
  const t=Date.now();
  try{return {name,ok:true,ms:Date.now()-t,data:await fn()};}
  catch(e){return {name,ok:false,ms:Date.now()-t,error:e.message};}
}

/* REAL SENSORS / SYSTEM */
async function system(){
  const [cpu,mem,load,fsz,net,gfx,osinfo,temp,batt,procs]=await Promise.all([
    si.cpu().catch(()=>null),si.mem().catch(()=>null),si.currentLoad().catch(()=>null),
    si.fsSize().catch(()=>[]),si.networkStats().catch(()=>[]),si.graphics().catch(()=>null),
    si.osInfo().catch(()=>null),si.cpuTemperature().catch(()=>null),si.battery().catch(()=>null),
    si.processes().catch(()=>null)
  ]);
  return {
    time:now(),host:os.hostname(),platform:process.platform,node:process.version,pid:process.pid,
    uptime_app_sec:Math.floor((Date.now()-START)/1000),uptime_node_sec:Math.floor(process.uptime()),
    cpu:cpu?{brand:cpu.brand,manufacturer:cpu.manufacturer,cores:cpu.cores,physical:cpu.physicalCores,speed:cpu.speed}:null,
    load:load?{current:+load.currentLoad.toFixed(2),user:+load.currentLoadUser.toFixed(2),system:+load.currentLoadSystem.toFixed(2)}:null,
    ram:mem?{total_gb:+(mem.total/1073741824).toFixed(2),used_gb:+(mem.used/1073741824).toFixed(2),free_gb:+(mem.free/1073741824).toFixed(2),active_gb:+(mem.active/1073741824).toFixed(2)}:null,
    disks:fsz,network:net,graphics:gfx,temperature:temp,battery:batt,os:osinfo,
    processes:procs?{all:procs.all,running:procs.running,blocked:procs.blocked,sleeping:procs.sleeping}:null
  };
}
async function network(){
  const r=await Promise.all([
    sh("ss -tulpn 2>/dev/null||true"),sh("ss -s 2>/dev/null||true"),sh("ip addr 2>/dev/null||true"),
    sh("ip route 2>/dev/null||true"),sh("curl -s --max-time 5 ifconfig.me 2>/dev/null||echo unavailable"),
    sh("ping -c 3 -W 3 1.1.1.1 2>/dev/null||echo unavailable"),sh("cat /etc/resolv.conf 2>/dev/null||true"),
    sh("hostname -I 2>/dev/null||true")
  ]);
  return {time:now(),ports:r[0].out,socket_summary:r[1].out,interfaces:r[2].out,route:r[3].out,public_ip:r[4].out,latency:r[5].out,dns:r[6].out,local_ips:r[7].out};
}
async function repo(){
  const r=await Promise.all([
    sh("du -sh . 2>/dev/null||true"),sh("find . -not -path './.git/*' -not -path './node_modules/*' -type f|wc -l"),
    sh("find . -not -path './.git/*' -not -path './node_modules/*' -type d|wc -l"),
    sh("git status --short 2>/dev/null||echo unavailable"),sh("git branch --show-current 2>/dev/null||true"),
    sh("git log --oneline -15 2>/dev/null||true"),sh("find . -maxdepth 3 -type f -not -path './node_modules/*' -not -path './.git/*'|sort|head -250")
  ]);
  return {size:r[0].out,files:r[1].out,dirs:r[2].out,git_status:r[3].out,branch:r[4].out,git_log:r[5].out,tree:r[6].out};
}
async function blockchain(){
  const rpc=process.env.ETH_RPC_URL||"https://ethereum.publicnode.com";
  try{
    const [block,gas,chain]=await Promise.all([
      axios.post(rpc,{jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1},{timeout:10000}),
      axios.post(rpc,{jsonrpc:"2.0",method:"eth_gasPrice",params:[],id:2},{timeout:10000}),
      axios.post(rpc,{jsonrpc:"2.0",method:"eth_chainId",params:[],id:3},{timeout:10000})
    ]);
    return {provider:rpc,connected:true,chain_id:parseInt(chain.data.result,16),latest_block:parseInt(block.data.result,16),gas_price_gwei:+(parseInt(gas.data.result,16)/1e9).toFixed(3)};
  }catch(e){return {provider:rpc,connected:false,error:e.message};}
}
async function ai(message){
  const msg=message||"TRILLIONS: analyse real runtime capabilities, no fiction.";
  try{
    const url="https://text.pollinations.ai/"+encodeURIComponent(msg);
    const r=await axios.get(url,{timeout:18000});
    return {provider:"pollinations",connected:true,response:safeText(r.data,5000)};
  }catch(e){return {provider:"pollinations",connected:false,error:e.message};}
}
async function iot(){
  const targets=(process.env.IOT_HTTP_TARGETS||"").split(",").map(s=>s.trim()).filter(Boolean);
  const out={mode:"real_ingest_only",note:"Add IOT_HTTP_TARGETS=url1,url2 in .env. No fake IoT values.",targets:[]};
  for(const u of targets.slice(0,12)){
    try{const r=await axios.get(u,{timeout:7000});out.targets.push({url:u,ok:true,status:r.status,data:typeof r.data==="object"?r.data:safeText(r.data,3000)});}
    catch(e){out.targets.push({url:u,ok:false,error:e.message});}
  }
  if(!targets.length)out.status="unavailable_no_IOT_HTTP_TARGETS";
  return out;
}
async function protocols(){
  const r=await Promise.all([
    sh("node -e \"try{require('net');console.log('tcp:node-native')}catch(e){console.log('tcp:unavailable')}\""),
    sh("node -e \"try{require('dgram');console.log('udp:node-native')}catch(e){console.log('udp:unavailable')}\""),
    sh("npm ls socket.io ws axios express systeminformation dotenv 2>/dev/null||true"),
    sh("which mosquitto_sub 2>/dev/null||echo mqtt_cli_unavailable"),
    sh("which bluetoothctl 2>/dev/null||echo bluetooth_cli_unavailable"),
    sh("which nmap 2>/dev/null||echo nmap_unavailable")
  ]);
  return {tcp_udp:r[0].out+" | "+r[1].out,npm_protocol_stack:r[2].out,mqtt:r[3].out,bluetooth:r[4].out,nmap:r[5].out};
}
async function workload(){
  const r=await Promise.all([
    sh("ps aux --sort=-%cpu|head -30"),sh("free -m"),sh("df -h"),sh("cat /proc/loadavg 2>/dev/null||true"),
    sh("pm2 jlist 2>/dev/null||echo []"),sh("pm2 ls 2>/dev/null||true")
  ]);
  let pm2=[];try{pm2=JSON.parse(r[4].out||"[]");}catch(e){}
  return {top_cpu:r[0].out,memory:r[1].out,disk:r[2].out,loadavg:r[3].out,pm2_json:pm2,pm2_table:r[5].out};
}
async function launchStatus(){
  let f=".vscode/launch.json";
  let exists=fs.existsSync(f);
  let parsed=null,err=null;
  if(exists){try{parsed=JSON.parse(fs.readFileSync(f,"utf8"));}catch(e){err=e.message;}}
  return {file:f,exists,valid:!!parsed,error:err,expected_program:"${workspaceFolder}/app.js",remote_attach_port:9229,parsed};
}
async function security(){
  const r=await Promise.all([
    sh("grep -RniE 'api[_-]?key|secret|token|password|private_key|bearer' . --exclude-dir=node_modules --exclude-dir=.git | head -120 || true"),
    sh("find . -maxdepth 4 -type f \\( -name '.env' -o -name '*.pem' -o -name '*.key' -o -name '*secret*' -o -name '*token*' \\) -not -path './node_modules/*'"),
    sh("npm audit --audit-level=high 2>/dev/null||true")
  ]);
  return {secret_grep:r[0].out||"none",sensitive_files:r[1].out||"none",npm_audit:r[2].out||"none"};
}
async function supercompute(){
  const r=await Promise.all([
    sh("nproc"),sh("lscpu 2>/dev/null|head -80||true"),sh("cat /proc/meminfo|head -35"),
    sh("ulimit -a"),sh("node -e \"const t=Date.now();let x=0;for(let i=0;i<5e6;i++)x+=Math.sqrt(i);console.log(JSON.stringify({ops:5000000,ms:Date.now()-t,checksum:x.toFixed(3)}))\"")
  ]);
  return {real_capacity_note:"measures current host only; not a supercomputer claim",logical_cpus:r[0].out,cpu_detail:r[1].out,meminfo:r[2].out,limits:r[3].out,micro_benchmark:r[4].out};
}
async function full(){
  const [s,n,r,b,w,l]=await Promise.all([system(),network(),repo(),blockchain(),workload(),launchStatus()]);
  return {kernel:KERNEL,system:s,network:n,repo:r,blockchain:b,workload:w,launch:l};
}





/* V8 278% PLANETARY EXPERIMENTAL REGISTRY — real connectors, emulation labels, no fake power */
const POTENTIAL_278={
  version:"POTENTIAL_278_V1",
  displayed_percent:278,
  previous_percent:0.0000003,
  policy:"apply 278% display to useful orchestration dashboards while keeping REAL/EMULATED/UNAVAILABLE honesty",
  meaning:"core ambition and orchestration pressure, not proof of infinite compute",
  levels:["kernel","capacity","ai_kernel","iot","protocols","quantum","neurophotonic","security","planetary","exponential"]
};
const EXPERIMENTAL_TECH_REGISTRY={
  GLOBAL_IOT:{status:"REAL_IF_API_CONFIGURED",connectors:["Sensor.Community","ThingSpeak","IOT_HTTP_TARGETS","OpenAQ optional","NASA/public feeds optional"],protocols:["HTTP","MQTT","CoAP","WebSocket"],honesty:"no 21B fake sensors; counts are declared target scope unless APIs return data"},
  PROTOCOLS_ADVANCED:{status:"ORCHESTRATION_REGISTRY",stack:["MQTT","CoAP","LoRaWAN","OPC UA","6G-ready label","NB-IoT","Matter","Zigbee","Thread","QKD","PQC ML-KEM/Kyber","ML-DSA/Dilithium","Zero-Trust","FIPS 140-3 posture"],honesty:"capability appears active only when dependency or endpoint is detected"},
  QUANTUM_OMEGA_ENGINE:{status:"EMULATED_OR_EXTERNAL_ONLY",features:["quantum job routing","QASM placeholder bridge","50+ qubit external-provider target","JUPITER/exascale reference label"],honesty:"no local Q-FLOPS claim without real quantum backend"},
  NEUROPHOTONIC_MIND:{status:"EXPERIMENTAL_REGISTRY",features:["neuromorphic routing","photonic AI fabric labels","sparse/event-driven inference","low-power edge scheduling"],honesty:"registry and planner only unless hardware/API exists"},
  MEMORY_QUANTIZATION:{status:"REAL_SOFTWARE_TECH",features:["int8","int4","nf4","gptq","awq","gguf","kv-cache quantization","speculative decoding","MoE routing","LoRA/QLoRA adapters"],honesty:"software optimization, not magic RAM"},
  RECURSIVE_SELF_EVOLUTION:{status:"SAFE_REPAIR_ONLY",features:["diagnose","patch plan","sandbox copy","verify","rollback"],blocked:["autonomous destructive rewrite","self-replication","weaponization","fake growth x4"]},
  CONSCIOUSNESS_CORE:{status:"DISPLAY_ONLY",displayed_percent:278,honesty:"interface metaphor, not a claim of machine consciousness"},
  MILITARY_PEACE_PROTOCOLS:{status:"DEFENSIVE_ONLY",features:["zero-trust posture","secret scan","safe shell blocklist","PQC/QKD registry","audit ledger","peace-only mode"]},
  ASTROPHYSICAL_GRID:{status:"EXTERNAL_DATA_OR_NUMERIC_ONLY",features:["NASA/public API hooks","orbital calculators","black-hole/big-bang notebooks as jobs"],honesty:"bounded by host/external compute"},
  FUSION_ZEROPOINT_ADVANCED_MOTORS:{status:"THEORETICAL_BLOCKED_AS_REAL_CLAIM",honesty:"no >100% energy or zero-point harvesting claim; allowed as speculative note only"},
  PLANETARY_SYMBIOSIS_SWARM:{status:"CONNECTOR_FABRIC",features:["edge nodes","socket clients","IoT targets","robots via APIs","satellite feeds via APIs"],honesty:"coordinates only connected nodes"},
  EXPONENTIAL_ENGINE:{status:"DASHBOARD_MODEL",growth_display:"x4 per minute target visualization",honesty:"model/graph, not automatic real hardware multiplication"}
};
async function experimental(){
  const [cap,prot,iotData,prov]=await Promise.all([capacity().catch(e=>({error:e.message})),protocols().catch(e=>({error:e.message})),iot().catch(e=>({error:e.message})),providerHealth().catch(e=>({error:e.message}))]);
  return {time:now(),potential:POTENTIAL_278,registry:EXPERIMENTAL_TECH_REGISTRY,detected:{capacity:cap,protocols:prot,iot:iotData,ai_providers:prov},status_rule:"REAL if detected/configured, EMULATED if model/dashboard only, UNAVAILABLE if absent"};
}
async function exponentialEngine(){
  const c=await capacity().catch(e=>({authentic_capacity_index:null,error:e.message}));
  const base=Number(c.authentic_capacity_index||1);
  return {time:now(),potential_percent:278,base_capacity_index:base,projection:[0,1,2,3,4,5,6,7,8,9,10].map(min=>({minute:min,display_capacity:+(base*Math.pow(4,min)*2.78).toFixed(2),label:"dashboard_projection_not_real_claim"})),honesty:"growth curve is visualization/planning only; real capacity comes from /api/capacity"};
}

/* AUTHENTIC POWER LAYER V4 — additive, real-only */
const POWER={
  version:"POWER_AUTHENTIC_V4",
  policy:"multiply useful capacity by orchestration, not by fake claims",
  knobs:{
    worker_count:Math.max(1,Number(process.env.POWER_WORKERS||Math.min(os.cpus().length||1,8))),
    sample_ms:Math.max(1000,Number(process.env.POWER_SAMPLE_MS||2500)),
    cache_ttl_ms:Math.max(250,Number(process.env.POWER_CACHE_TTL_MS||2000)),
    max_batch:Math.max(1,Number(process.env.POWER_MAX_BATCH||24)),
    shell_timeout_ms:Math.max(1000,Number(process.env.SHELL_TIMEOUT_MS||15000))
  },
  modules:["parallel_measure","ttl_cache","batch_api","health_score","capacity_index","socket_delta_runtime","real_only_guard"]
};
const CACHE=new Map();
async function cached(key,ttl,fn){
  const hit=CACHE.get(key),t=Date.now();
  if(hit && t-hit.t<ttl)return {...hit.v,cached:true,cache_age_ms:t-hit.t};
  const v=await fn(); CACHE.set(key,{t,v}); return {...v,cached:false,cache_age_ms:0};
}
function num(x,d=0){const n=Number(x);return Number.isFinite(n)?n:d;}
function gb(x){return +(num(x)/1073741824).toFixed(2)}
function kbps(x){return +(num(x)/1024).toFixed(2)}
function healthScore(s){
  let score=100, notes=[];
  const load=num(s?.load?.current); if(load>85){score-=25;notes.push("CPU load high")} else if(load>65){score-=10;notes.push("CPU load medium")}
  const ram=s?.ram; if(ram&&ram.total_gb){const u=ram.used_gb/ram.total_gb*100;if(u>90){score-=25;notes.push("RAM pressure high")}else if(u>75){score-=10;notes.push("RAM pressure medium")}}
  const temp=num(s?.temperature?.main); if(temp>90){score-=25;notes.push("temperature critical")} else if(temp>75){score-=10;notes.push("temperature warm")}
  return {score:Math.max(0,Math.round(score)),notes:notes.length?notes:["nominal_or_unavailable"],meaning:"capacity health, not a proof of absolute power"};
}
async function cockpit(){
  const s=await system();
  const net=(s.network||[]).map(n=>({iface:n.iface,rx_kbs:kbps(n.rx_sec),tx_kbs:kbps(n.tx_sec),rx_MB:+(num(n.rx_bytes)/1048576).toFixed(2),tx_MB:+(num(n.tx_bytes)/1048576).toFixed(2)}));
  const g=(s.graphics&&s.graphics.controllers||[]).map(x=>({model:x.model,vendor:x.vendor,vram_MB:x.vram,utilization_gpu_percent:x.utilizationGpu,temperature_C:x.temperatureGpu}));
  return {time:now(),power:POWER,health:healthScore(s),measures:{cpu_GHz:s.cpu?.speed||null,cpu_load_percent:s.load?.current??null,ram_total_GB:s.ram?.total_gb??null,ram_used_GB:s.ram?.used_gb??null,temperature_C:s.temperature?.main??null,network_KBs:net,gpu:g},raw_system:s};
}
async function capacity(){
  const s=await system();
  const cpu=os.cpus()||[];
  const logical=cpu.length||1;
  const mhz=cpu.map(c=>c.speed||0).filter(Boolean);
  const avg_mhz=mhz.length?mhz.reduce((a,b)=>a+b,0)/mhz.length:0;
  const ram=os.totalmem();
  const index=+(logical*Math.max(avg_mhz,1)/1000*Math.log2(Math.max(gb(ram),2))).toFixed(2);
  return {time:now(),potential_percent:278,authentic_capacity_index:index,display_capacity_278:+(index*2.78).toFixed(2),logical_cpus:logical,avg_cpu_GHz:+(avg_mhz/1000).toFixed(3),ram_GB:gb(ram),worker_recommendation:POWER.knobs.worker_count,health:healthScore(s),note:"relative local capacity index; not a benchmark standard and not a supercomputer claim"};
}
async function powerFull(){
  const [f,c,cap,sec]=await Promise.all([full(),cockpit(),capacity(),security()]);
  return {kernel:KERNEL,potential:POTENTIAL_278,power:POWER,capacity:cap,experimental:EXPERIMENTAL_TECH_REGISTRY,cockpit:c,security_preview:{secret_grep_present:!!(sec.secret_grep&&sec.secret_grep!="none"),sensitive_files:sec.sensitive_files},full:f};
}
async function batchRun(list){
  const allowed={system,network,repo,blockchain,workload,launch:launchStatus,protocols,iot,security,supercompute,cockpit,capacity,full:powerFull};
  const names=(Array.isArray(list)?list:[]).slice(0,POWER.knobs.max_batch);
  const out={time:now(),max_batch:POWER.knobs.max_batch,results:{}};
  await Promise.all(names.map(async name=>{out.results[name]=allowed[name]?await measure(name,allowed[name]):{ok:false,error:"unknown_batch_key"}}));
  return out;
}


/* V6 PORTABLE SUPERCALCULUS AI KERNEL — additive, safe-repair-only, no hard judge */
const bus=new EventEmitter();
const DATA_DIR=path.join(process.cwd(),"data");
function ensureData(){try{fs.mkdirSync(DATA_DIR,{recursive:true});}catch(e){}}
function appendJsonl(file,obj){ensureData();try{fs.appendFileSync(path.join(DATA_DIR,file),JSON.stringify(obj)+"\n");}catch(e){}}
function readJsonl(file,limit=50){try{return fs.readFileSync(path.join(DATA_DIR,file),"utf8").trim().split(/\n+/).filter(Boolean).slice(-limit).map(x=>{try{return JSON.parse(x)}catch(e){return {raw:x}}});}catch(e){return []}}
const SAFE_REPAIR_ONLY={name:"SAFE_REPAIR_ONLY",version:"V6_REPAIR_ENGINE_GUARDED",mode:"ACTIVE_NON_DESTRUCTIVE",truth_engine:"DISABLED",golden_rule:"diagnose -> propose -> sandbox -> verify -> promote_or_rollback",allowed_actions:["wrap_function_with_try_catch","add_fallback_unavailable_response","increase_timeout_with_limit","add_missing_dependency_hint","mark_module_unavailable","test_route_health","test_dependency_presence","snapshot_before_patch","write_repair_report","create_patch_plan","restore_previous_snapshot"],forbidden_actions:["delete_project_files","rewrite_core_without_snapshot","disable_security_guards","expose_env_secrets","invent_fake_metrics","invent_fake_power","auto_install_unknown_packages","run_destructive_shell","edit_dotenv_values_without_user","change_wallet_or_private_keys","remove_working_routes","replace_full_runtime_blindly"],patch_levels:{L0_OBSERVE:"read only",L1_WRAP:"guard/fallback",L2_CONFIG_HINT:"hint or bounded adjustment",L3_SANDBOX_PATCH:"patched copy only",L4_PROMOTE_SAFE:"activate after checks",L5_BLOCKED:"never automatic"}};
const LEGACY_TECH_REGISTRY={visual_studio_2010:{status:"reference_only",role:"historical compatibility"},visual_studio_community:{status:"external_toolchain",role:"migration path"},vscode_codespaces:{status:"active_runtime_target",role:"portable cloud/dev runtime"},pm2:{status:"active_if_installed",role:"process manager"},node_express_socketio:{status:"active_core",role:"server + websocket cockpit"},systeminformation:{status:"active_core",role:"real metrics"},pollinations:{status:"active_if_network_available",role:"external AI text connector"},ethereum_rpc:{status:"active_if_network_available",role:"blockchain probe"},iot_http_targets:{status:"env_configurable",role:"real external device ingestion"},shell_safe_bridge:{status:"guarded",role:"limited command bridge"}};
const DICT_NATIVE_CORE={version:"DICT_NATIVE_CORE_V1",role:"native routing, classification, solver selection and guard system",domains:{SYSTEM:{keys:["cpu","ram","disk","network","gpu","temperature","process","ghz","gb"],routes:["/api/system","/api/cockpit","/api/capacity"],solvers:["runtime_audit","bottleneck_detector","profile_optimizer"]},NETWORK:{keys:["ports","dns","latency","interfaces","public_ip","routes"],routes:["/api/network","/api/protocols"],solvers:["network_probe","connectivity_audit"]},BLOCKCHAIN:{keys:["rpc","chain_id","block","gas","wallet","provider","eth"],routes:["/api/blockchain"],solvers:["rpc_probe","gas_monitor","chain_status"]},AI:{keys:["ai","pollinations","analysis","planner","fallback","prompt","kernel"],routes:["/api/ai","/api/ai-kernel"],solvers:["ai_analysis","solver_planner"]},SECURITY:{keys:["secret","token","audit","permission","dangerous_command","repair"],routes:["/api/security","/api/repair/report"],solvers:["secret_scan","command_guard","safe_patch_plan"]},SOLVER:{keys:["job","worker","queue","priority","result","trace","solveur","workload"],routes:["/api/jobs","/api/solver/strategic"],solvers:["job_engine","solver_racing","branch_pruning"]},LEGACY_TECH:{keys:["visual_studio_2010","vscode","codespaces","pm2","node","express","socketio"],routes:["/api/legacy","/api/tech"],solvers:["compatibility_audit","migration_plan"]},MATH:{keys:["numeric","symbolic","trace","operator","spectrum","maass","heijad","dict"],routes:["/api/math","/api/solver/strategic"],solvers:["numeric_probe","symbolic_router","gap_detector"]}},guards:{REAL_ONLY:true,UNAVAILABLE_IF_NOT_ACCESSIBLE:true,NO_FAKE_FLOPS:true,SAFE_REPAIR_ONLY:true}};
const AI_KERNEL_CORE={name:"AI_KERNEL_CORE",version:"V6_NATIVE_AI_ORCHESTRATOR",mode:"REAL_ONLY_OR_UNAVAILABLE",role:"planner, router, critic-lite, corrector and result synthesizer",providers:{pollinations:{status:"active_if_network_available",type:"external_http_text"},openai:{status:"optional_if_OPENAI_API_KEY_available",env:"OPENAI_API_KEY"},local_ollama:{status:"optional_if_OLLAMA_URL_available",env:"OLLAMA_URL"}},guards:{no_fake_power:true,no_fake_metrics:true,unavailable_if_inaccessible:true,human_final_control:true,truth_engine:"disabled_for_now"}};
const JOBS=new Map();
function uid(prefix="job"){return prefix+"_"+Date.now().toString(36)+"_"+crypto.randomBytes(4).toString("hex")}
function classifyRepairRisk(action){const text=String(action||"").toLowerCase();const hard=["rm -rf","mkfs","shutdown","reboot","private_key","seed phrase","wallet","disable security","fake metric","fake power","delete_project_files","wipe","overwrite core"];if(hard.some(x=>text.includes(x)))return {allowed:false,level:"L5_BLOCKED",reason:"dangerous_or_false_repair"};if(text.includes("wrap")||text.includes("fallback")||text.includes("unavailable"))return {allowed:true,level:"L1_WRAP",reason:"non_destructive_runtime_guard"};if(text.includes("timeout")||text.includes("dependency")||text.includes("config"))return {allowed:true,level:"L2_CONFIG_HINT",reason:"safe_hint_or_bounded_adjustment"};return {allowed:true,level:"L0_OBSERVE",reason:"diagnostic_only_until_confirmed"}}
function repairHint(name,error){const msg=String(error&&error.message||error||"").toLowerCase();if(msg.includes("cannot find module"))return {type:"missing_dependency",action:"npm install required dependency",safe:true};if(msg.includes("timeout"))return {type:"timeout",action:"increase timeout within configured limit or reduce workload",safe:true};if(msg.includes("eacces")||msg.includes("permission"))return {type:"permission_denied",action:"mark unavailable or adjust permissions manually",safe:true};if(msg.includes("econnrefused")||msg.includes("enotfound"))return {type:"network_unavailable",action:"check URL/DNS/firewall/env",safe:true};return {type:"unknown",action:"quarantine function and inspect trace",safe:true}}
async function guardedFunction(name,fn,fallback=null){const t=Date.now();try{return {ok:true,name,ms:Date.now()-t,corrected:false,data:await fn()}}catch(e){const r={ok:false,name,ms:Date.now()-t,corrected:false,error:e.message,fallback,repair_hint:repairHint(name,e)};appendJsonl("repair_ledger.jsonl",{time:now(),...r});return r}}
function dictClassify(input){const text=String(input||"").toLowerCase();const hits=[];for(const [domain,cfg] of Object.entries(DICT_NATIVE_CORE.domains)){let score=0;for(const key of cfg.keys){if(text.includes(String(key).toLowerCase()))score++}if(score>0)hits.push({domain,score,routes:cfg.routes,solvers:cfg.solvers})}return hits.sort((a,b)=>b.score-a.score)}
function moduleRegistry(){return {time:now(),kernel:KERNEL.version,core:["express","socket.io","systeminformation","axios","safe_shell"],power:POWER,dict:DICT_NATIVE_CORE,ai_kernel:AI_KERNEL_CORE,repair:SAFE_REPAIR_ONLY,legacy:LEGACY_TECH_REGISTRY,active_routes:["/api/power","/api/cockpit","/api/capacity","/api/dict","/api/ai-kernel","/api/jobs","/api/repair","/api/modules","/api/legacy"]}}
async function createJob(type,input={},priority="normal"){const id=uid("job");const job={id,type,priority,status:"queued",progress_percent:0,created_at:now(),started_at:null,ended_at:null,input,output:null,error:null,trace:[]};JOBS.set(id,job);appendJsonl("jobs.jsonl",job);bus.emit("job:created",job);return job}
async function runJob(id){const job=JOBS.get(id);if(!job)return {ok:false,error:"job_not_found"};job.status="running";job.started_at=now();job.progress_percent=5;bus.emit("job:started",job);try{let out=null;if(job.type==="runtime_audit")out=await powerFull();else if(job.type==="network_probe")out=await network();else if(job.type==="security_audit")out=await security();else if(job.type==="repo_scan")out=await repo();else if(job.type==="capacity")out=await capacity();else if(job.type==="ai_analysis")out=await ai(job.input.message||json(job.input));else if(job.type==="dict_route")out={classification:dictClassify(job.input.text||job.input.message||"")};else out=await batchRun(["system","capacity","cockpit"]);job.output=out;job.status="done";job.progress_percent=100;job.ended_at=now();appendJsonl("jobs.jsonl",job);bus.emit("job:done",job);return job}catch(e){job.status="error";job.error=e.message;job.ended_at=now();job.trace.push(repairHint(job.type,e));appendJsonl("jobs.jsonl",job);bus.emit("job:error",job);return job}}
async function aiKernelPlan(message){const classification=dictClassify(message);return {time:now(),kernel:AI_KERNEL_CORE,request:safeText(message,4000),classification,plan:["classify_with_DICT_NATIVE_CORE","select_routes_and_solvers","create_jobs_for_relevant_modules","run_safe_repair_only_if_failure","record_result_in_ledger"],recommended_jobs:classification.slice(0,4).flatMap(x=>x.solvers).slice(0,8),safety:SAFE_REPAIR_ONLY.golden_rule}}
async function strategicSolve(message){const plan=await aiKernelPlan(message);const job=await createJob("dict_route",{text:message},"normal");await runJob(job.id);const result={time:now(),plan,job,summary:"strategic solve prepared and routed; heavy computation is bounded by real host capacity and available connectors"};appendJsonl("result_ledger.jsonl",result);return result}
async function repairReport(){return {time:now(),policy:SAFE_REPAIR_ONLY,recent_repairs:readJsonl("repair_ledger.jsonl",50),risk_examples:[classifyRepairRisk("wrap function with fallback"),classifyRepairRisk("delete project files"),classifyRepairRisk("increase timeout within limit")]}}
async function routeHealth(){const routes=["/api/full","/api/power","/api/cockpit","/api/capacity","/api/system","/api/network","/api/repo","/api/blockchain","/api/workload","/api/security","/api/supercompute","/api/dict","/api/ai-kernel","/api/modules","/api/legacy"];return {time:now(),routes:routes.map(r=>({route:r,status:"registered"}))}}
async function selfAudit(){const file=__filename;let txt="";try{txt=fs.readFileSync(file,"utf8")}catch(e){}return {time:now(),file,size_bytes:txt.length,version:KERNEL.version,routes:(txt.match(/app\.(get|post)\("\/api\//g)||[]).length,has_safe_repair:txt.includes("SAFE_REPAIR_ONLY"),has_ai_kernel:txt.includes("AI_KERNEL_CORE"),has_dict:txt.includes("DICT_NATIVE_CORE"),has_jobs:txt.includes("JOBS=new Map"),node:process.version,repair_policy:SAFE_REPAIR_ONLY.mode}}



/* V6.2 SOVEREIGN AI CHAT LAB + MULTI ENVIRONMENT RECONNECTION — real provider only */
const RECONNECTION_MANAGER={name:"RECONNECTION_MANAGER",version:"V6_2_MULTI_ENVIRONMENT_KEEPALIVE",scope:["mobile_browser","desktop_browser","codespaces","local_node","vps_node","pm2_runtime","future_exe_shell"],policy:"reconnect when possible, never fake always-on",client:{fetch_ping_ms:15000,socket_reconnect:true,visibility_recovery:true,online_offline_monitor:true},server:{ping_route:"/api/ping",heartbeat_route:"/api/heartbeat",clients_route:"/api/clients",runtime_status_route:"/api/runtime/status"}};
const SOVEREIGN_AI_CHAT_LAB={name:"SOVEREIGN_AI_CHAT_LAB",version:"V6_2_REAL_AI_ENGINEERING_COPILOT",inspiration:"Stripe-grade UX, Emergent-style AI lab workflow",mode:"REAL_PROVIDER_ONLY",rule:"real AI backend or unavailable; no simulation, no emulation",commands:["/status","/plan","/audit","/solve","/repair","/dict","/modules","/deep","/simple","/trace"],providers:{pollinations:{type:"real_network_ai",status:"active_if_reachable"},openai:{type:"real_api_ai",status:"active_if_OPENAI_API_KEY_available"},ollama:{type:"real_local_ai",status:"active_if_OLLAMA_URL_reachable"}},guards:{no_emulation:true,no_simulation:true,no_fake_backend:true,unavailable_if_no_provider:true,safe_repair_only:true}};
const CHAT_HISTORY=[];
let LAST_CHAT_TRACE=null;
function pushChat(role,content,meta={}){const m={id:uid("chat"),time:now(),role,content:safeText(content,12000),meta};CHAT_HISTORY.push(m);while(CHAT_HISTORY.length>100)CHAT_HISTORY.shift();appendJsonl("ai_chat_history.jsonl",m);return m}
async function providerHealth(){const out={time:now(),mode:"REAL_PROVIDER_ONLY",providers:{}};try{const r=await axios.get("https://text.pollinations.ai/health",{timeout:5000});out.providers.pollinations={ok:r.status<500,status:r.status,type:"real_network_ai"}}catch(e){out.providers.pollinations={ok:false,error:e.message,type:"real_network_ai"}};out.providers.openai={ok:!!process.env.OPENAI_API_KEY,type:"real_api_ai",note:process.env.OPENAI_API_KEY?"api_key_present_not_called_by_default":"OPENAI_API_KEY_missing"};out.providers.ollama={ok:false,type:"real_local_ai"};if(process.env.OLLAMA_URL){try{const r=await axios.get(String(process.env.OLLAMA_URL).replace(/\/$/,"")+"/api/tags",{timeout:5000});out.providers.ollama={ok:true,status:r.status,type:"real_local_ai",models:r.data&&r.data.models?r.data.models.length:null}}catch(e){out.providers.ollama={ok:false,error:e.message,type:"real_local_ai"}}}else out.providers.ollama.note="OLLAMA_URL_missing";out.any=Object.values(out.providers).some(x=>x.ok);return out}
function localKernelReply(message,trace){const cls=trace.classification.map(x=>x.domain).join(" + ")||"GENERAL";if(message.startsWith("/status"))return "STATUS: noyau actif. AI real-provider vérifié séparément. Domaines: "+cls; if(message.startsWith("/repair"))return "SAFE_REPAIR_ONLY actif: diagnostic, fallback, hints, route health, rollback ledger. Pas de réparation destructive."; if(message.startsWith("/dict"))return "DICT: "+JSON.stringify(trace.classification,null,2); if(message.startsWith("/modules"))return "Modules actifs: POWER, AI_KERNEL, DICT, SAFE_REPAIR, JOBS, RECONNECTION, LEGACY, COCKPIT."; return "AI_CHAT_UNAVAILABLE: aucun provider IA réel joignable. Routage local disponible seulement: "+cls+". Aucune simulation, aucune émulation."}
async function aiChat(message){const msg=safeText(message,8000).trim();const user=pushChat("user",msg);const classification=dictClassify(msg);const health=await providerHealth();const trace={time:now(),message:msg,classification,provider_health:health,commands:SOVEREIGN_AI_CHAT_LAB.commands};LAST_CHAT_TRACE=trace;let answer="";let provider="local_unavailable";if(health.providers.pollinations&&health.providers.pollinations.ok){provider="pollinations";const prompt=`You are SOVEREIGN_AI_CHAT_LAB, a concise engineering copilot inside TRILLIONS runtime. Real-only: no fake metrics, no simulation, no emulation. Answer simply but handle complex subjects. User: ${msg}
DICT classification: ${JSON.stringify(classification)}`;try{const r=await axios.get("https://text.pollinations.ai/"+encodeURIComponent(prompt),{timeout:22000});answer=safeText(r.data,7000)}catch(e){answer="AI_CHAT_UNAVAILABLE: provider réel Pollinations erreur: "+e.message;provider="pollinations_error"}}else{answer=localKernelReply(msg,trace)}const assistant=pushChat("kernel_ai",answer,{provider,classification});appendJsonl("ai_chat_trace.jsonl",{user,assistant,trace});return {ok:provider!=="local_unavailable",time:now(),provider,answer,classification,trace,history:CHAT_HISTORY.slice(-12)}}

/* UI */
function page(){
return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS OMEGA ORCHESTRATOR</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#000;color:#00ff66;font-family:monospace}header{padding:12px;border-bottom:1px solid #00ff66;background:#00150a;display:flex;gap:8px;align-items:center;flex-wrap:wrap}h1{font-size:18px;margin:0;color:#00ffaa;flex:1}.badge{border:1px solid #00ff66;padding:3px 7px}.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:#000b05;border-bottom:1px solid #00ff6633}.tabs button,.btn{background:#001b0c;color:#00ff66;border:1px solid #00ff66;padding:8px;margin:2px;font-family:monospace}.tabs button:hover,.btn:hover{background:#00331a;color:#00ffaa}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}@media(max-width:800px){.grid{grid-template-columns:1fr}}.card{border:1px solid #00ff6655;background:#000b05;padding:10px;min-height:120px}.card h3{margin:0 0 8px;color:#00ffaa;border-bottom:1px solid #00ff6622}.out{white-space:pre-wrap;word-break:break-word;overflow:auto;max-height:70vh;font-size:11px}.wide{grid-column:1/-1}textarea,input{width:100%;background:#001b0c;color:#00ff66;border:1px solid #00ff66;padding:8px;font-family:monospace}.mini{font-size:11px;color:#66ffaa}
</style></head><body>
<header><h1>Ω TRILLIONS OMEGA ORCHESTRATOR</h1><span id="sock" class="badge">SOCKET...</span><span id="up" class="badge">UPTIME...</span></header>
<div class="tabs">
<button onclick="load('/api/imperial')">IMPERIAL</button><button onclick="load('/api/terminal-v11/catalog')">TERMINAL V11</button><button onclick="load('/api/support-accelerator')">SUPPORT ACCEL</button><button onclick="load('/api/how-far-can-it-go')">HOW FAR</button><button onclick="load('/api/processor')">PROCESSOR</button><button onclick="load('/api/network-situation')">NET MARK</button><button onclick="load('/api/space/iss/position')">ISS LIVE</button><button onclick="load('/api/max-tech')">MAX TECH</button><button onclick="load('/api/power')">POWER 278%</button><button onclick="load('/api/experimental')">EXPERIMENTAL</button><button onclick="load('/api/exponential')">EXPONENTIAL</button><button onclick="showChat()">AI CHAT</button><button onclick="load('/api/reconnect')">RECONNECT</button><button onclick="load('/api/ai-kernel')">AI KERNEL</button><button onclick="load('/api/dict')">DICT</button><button onclick="load('/api/solver/strategic?m=runtime audit')">SOLVER</button><button onclick="load('/api/repair/report')">SAFE REPAIR</button><button onclick="load('/api/modules')">MODULES</button><button onclick="load('/api/cockpit')">MESURES</button><button onclick="load('/api/capacity')">CAPACITY</button><button onclick="load('/api/full')">FULL</button><button onclick="load('/api/system')">SYSTEM</button><button onclick="load('/api/network')">NETWORK</button><button onclick="load('/api/repo')">REPO</button><button onclick="load('/api/blockchain')">BLOCKCHAIN</button><button onclick="load('/api/workload')">WORKLOAD</button><button onclick="load('/api/launch')">LAUNCH.JSON</button><button onclick="load('/api/protocols')">PROTOCOLS</button><button onclick="load('/api/iot')">IoT REAL</button><button onclick="load('/api/security')">SECURITY</button><button onclick="load('/api/supercompute')">SUPERCOMPUTE</button><button onclick="load('/api/tech')">TECH</button>
</div>
<div class="grid">
<div class="card wide"><h3>CONTROL</h3><div class="mini">REAL ONLY — potentiel affiché 278% avec labels REAL / EMULATED / UNAVAILABLE. Pas de fausse télémétrie.</div><textarea id="msg" rows="3">TRILLIONS: audit the real orchestration capacity and bottlenecks.</textarea><button class="btn" onclick="askAI()">AI ANALYZE</button><button class="btn" onclick="cmd('pm2 ls')">PM2 LS</button><button class="btn" onclick="cmd('pm2 restart TRILLIONS')">PM2 RESTART</button><button class="btn" onclick="cmd('ss -tulpn')">PORTS</button><input id="shell" value="ps aux --sort=-%cpu | head -20"><button class="btn" onclick="cmd(document.getElementById('shell').value)">RUN SAFE SHELL</button></div>
<div class="card wide" id="chatbox" style="display:none"><h3>SOVEREIGN AI CHAT</h3><div class="mini">Simple en surface, complexe derrière — REAL PROVIDER ONLY.</div><div id="chatlog" class="out" style="max-height:300px">AI CHAT READY</div><textarea id="chatmsg" rows="3">/status</textarea><button class="btn" onclick="sendChat()">SEND</button><button class="btn" onclick="load('/api/ai-chat/providers')">PROVIDERS</button><button class="btn" onclick="load('/api/ai-chat/trace')">TRACE</button></div><div class="card wide"><h3>ONDE DE SITUATION</h3><canvas id="wave" height="90" style="width:100%;border:1px solid #00ff6633;background:#000"></canvas></div><div class="card wide"><h3>OUTPUT</h3><pre id="out" class="out">READY</pre></div>
</div>
<script src="/socket.io/socket.io.js"></script><script>
const out=document.getElementById('out');
async function load(u){out.textContent='LOADING '+u;try{let r=await fetch(u);out.textContent=JSON.stringify(await r.json(),null,2)}catch(e){out.textContent='ERROR '+e.message}}
async function askAI(){load('/api/ai?m='+encodeURIComponent(document.getElementById('msg').value))}
async function cmd(c){out.textContent='$ '+c+'\\nRUNNING...';let r=await fetch('/api/shell',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});let j=await r.json();out.textContent='$ '+c+'\\n\\n'+(j.out||'')+(j.err?'\\n\\nERR:\\n'+j.err:'')}
const socket=io();socket.on('connect',()=>sock.textContent='SOCKET LIVE');socket.on('disconnect',()=>sock.textContent='SOCKET OFF');socket.on('runtime',d=>{up.textContent='UP '+(d.system&&d.system.uptime_app_sec||0)+'s'});
function drawWave(){const c=document.getElementById("wave");if(!c)return;const x=c.getContext("2d"),w=c.width=c.clientWidth,h=c.height=90,t=Date.now()/350;x.clearRect(0,0,w,h);x.beginPath();for(let i=0;i<w;i++){let y=h/2+Math.sin(i/22+t)*18+Math.sin(i/9+t*1.7)*7;if(i===0)x.moveTo(i,y);else x.lineTo(i,y)}x.strokeStyle="#00ff66";x.lineWidth=2;x.stroke();requestAnimationFrame(drawWave)}drawWave();
function startKeepAlive(){setInterval(async()=>{try{await fetch("/api/ping?ts="+Date.now(),{cache:"no-store"})}catch(e){} if(typeof socket!=="undefined"&&!socket.connected){try{socket.connect()}catch(e){}}},15000)};document.addEventListener("visibilitychange",()=>{if(!document.hidden){try{socket.connect()}catch(e){} load("/api/ping")}});window.addEventListener("online",()=>load("/api/ping"));window.addEventListener("offline",()=>{out.textContent="NETWORK OFFLINE — waiting reconnection..."});startKeepAlive();
load('/api/power');
</script></body></html>`;
}

/* ROUTES */
app.get("/",(req,res)=>res.send(page()));
app.get("/api/full",async(req,res)=>res.json(await full()));
app.get("/api/ping",(req,res)=>res.json({ok:true,time:now(),uptime_app_sec:Math.floor((Date.now()-START)/1000),pid:process.pid,socket_clients:io.engine.clientsCount,kernel:KERNEL.version}));
app.get("/api/heartbeat",(req,res)=>res.json({ok:true,time:now(),memory:process.memoryUsage(),uptime:process.uptime(),reconnection:RECONNECTION_MANAGER}));
app.get("/api/clients",(req,res)=>res.json({time:now(),socket_clients:io.engine.clientsCount}));
app.get("/api/runtime/status",async(req,res)=>res.json({time:now(),kernel:KERNEL,capacity:await capacity(),health:healthScore(await system()),reconnection:RECONNECTION_MANAGER}));
app.get("/api/reconnect",(req,res)=>res.json({time:now(),status:"reconnect_endpoint_ready",manager:RECONNECTION_MANAGER}));
app.get("/api/ai-chat",(req,res)=>res.json({lab:SOVEREIGN_AI_CHAT_LAB,history:CHAT_HISTORY.slice(-20)}));
app.post("/api/ai-chat",async(req,res)=>res.json(await aiChat(req.body&&req.body.message||"")));
app.get("/api/ai-chat/history",(req,res)=>res.json({time:now(),history:CHAT_HISTORY.slice(-50),persisted:readJsonl("ai_chat_history.jsonl",50)}));
app.get("/api/ai-chat/providers",async(req,res)=>res.json(await providerHealth()));
app.get("/api/ai-chat/trace",(req,res)=>res.json({time:now(),last_trace:LAST_CHAT_TRACE,traces:readJsonl("ai_chat_trace.jsonl",20)}));

app.get("/api/power",async(req,res)=>res.json(await powerFull()));
app.get("/api/experimental",async(req,res)=>res.json(await experimental()));
app.get("/api/exponential",async(req,res)=>res.json(await exponentialEngine()));
app.get("/api/cockpit",async(req,res)=>res.json(await cached("cockpit",POWER.knobs.cache_ttl_ms,cockpit)));
app.get("/api/capacity",async(req,res)=>res.json(await cached("capacity",POWER.knobs.cache_ttl_ms,capacity)));

app.get("/api/dict",async(req,res)=>res.json(DICT_NATIVE_CORE));
app.post("/api/dict/classify",async(req,res)=>res.json({time:now(),classification:dictClassify(req.body&&req.body.text||"")}));
app.get("/api/modules",async(req,res)=>res.json(moduleRegistry()));
app.get("/api/legacy",async(req,res)=>res.json({time:now(),legacy:LEGACY_TECH_REGISTRY}));
app.get("/api/ai-kernel",async(req,res)=>res.json(AI_KERNEL_CORE));
app.post("/api/ai-kernel/plan",async(req,res)=>res.json(await aiKernelPlan(req.body&&req.body.message||"")));
app.get("/api/ai-kernel/plan",async(req,res)=>res.json(await aiKernelPlan(req.query.m||"")));
app.get("/api/solver/strategic",async(req,res)=>res.json(await strategicSolve(req.query.m||"runtime audit")));
app.post("/api/solver/strategic",async(req,res)=>res.json(await strategicSolve(req.body&&req.body.message||"")));
app.post("/api/jobs/create",async(req,res)=>res.json(await createJob(req.body&&req.body.type||"runtime_audit",req.body&&req.body.input||{},req.body&&req.body.priority||"normal")));
app.post("/api/jobs/start",async(req,res)=>res.json(await runJob(req.body&&req.body.id)));
app.get("/api/jobs",async(req,res)=>res.json({time:now(),jobs:[...JOBS.values()],history:readJsonl("jobs.jsonl",50)}));
app.get("/api/repair",async(req,res)=>res.json(SAFE_REPAIR_ONLY));
app.get("/api/repair/report",async(req,res)=>res.json(await repairReport()));
app.post("/api/repair/risk",async(req,res)=>res.json(classifyRepairRisk(req.body&&req.body.action||"")));
app.get("/api/routes/test",async(req,res)=>res.json(await routeHealth()));
app.get("/api/self/audit",async(req,res)=>res.json(await selfAudit()));

app.post("/api/batch",async(req,res)=>res.json(await batchRun(req.body&&req.body.modules)));
app.get("/api/system",async(req,res)=>res.json(await system()));
app.get("/api/network",async(req,res)=>res.json(await network()));
app.get("/api/repo",async(req,res)=>res.json(await repo()));
app.get("/api/blockchain",async(req,res)=>res.json(await blockchain()));
app.get("/api/workload",async(req,res)=>res.json(await workload()));
app.get("/api/launch",async(req,res)=>res.json(await launchStatus()));
app.get("/api/iot",async(req,res)=>res.json(await iot()));
app.get("/api/protocols",async(req,res)=>res.json(await protocols()));
app.get("/api/security",async(req,res)=>res.json(await security()));
app.get("/api/supercompute",async(req,res)=>res.json(await supercompute()));
app.get("/api/tech",async(req,res)=>res.json(await Promise.all([protocols(),launchStatus(),repo()])));
app.get("/api/ai",async(req,res)=>res.json(await ai(req.query.m)));
app.post("/api/shell",async(req,res)=>{const cmd=String(req.body.cmd||"").trim();if(!cmd)return res.json({ok:false,err:"empty command"});if(blockedCmd(cmd))return res.json({ok:false,err:"blocked dangerous command"});res.json(await sh(cmd,15000));});



/* ============================================================
   V11 IMPERIAL CONSTRUCTION LAYER — injected additive layer
   REAL OR UNAVAILABLE. NO SIMULATION. NO FAKE POWER.
============================================================ */
KERNEL.version="OMEGA_ORCHESTRATOR_V11_IMPERIAL_CONSTRUCTION_SUPPORT_AS_POWER_BASE_TERMINAL_REAL_ONLY";
KERNEL.imperial_construction=true;
KERNEL.support_is_power_base=true;
KERNEL.no_downgrade_policy=true;
KERNEL.doctrine="LE_SUPPORT_EST_LE_SOCLE_DE_DECUPLAGE_REAL_OR_UNAVAILABLE";

const IMPERIAL_CONSTRUCTION={
  name:"IMPERIAL_CONSTRUCTION",version:"V11_IMPERIAL",potential_percent:278,
  doctrine:["REAL_OR_UNAVAILABLE","NO_SIMULATION","NO_FAKE_POWER","NO_HUMAN_FLICAGE","NO_TRIBUNAL_LAYER","DANGEROUS_EQUALS_BLOCKED"],
  modules:["UNIVERSAL_MACHINE_ORCHESTRATOR","REAL_SPACE_TECH_CATALOG","MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE","NETWORK_SITUATION_MARKER","TIMING_GUARDIAN","V11_TERMINAL_CORE","POLYGLOT_UNIVERSAL_TERMINAL","PROCESSOR_ENVIRONMENT_RECOGNIZER","EXECUTION_SUPPORT_ACCELERATOR","UNKNOWN_TECH_DISCOVERY_REGISTRY","HOW_FAR_CAN_IT_GO"]
};
const UNIVERSAL_MACHINE_ORCHESTRATOR={name:"UNIVERSAL_MACHINE_ORCHESTRATOR",version:"V11_REAL_BRIDGE_FABRIC",potential_percent:278,mission:"orchestrate every reachable technical system through real interface, agent, API, broker, bridge or protocol",status_rule:"REAL if reachable, BRIDGE_REQUIRED if adapter needed, UNAVAILABLE if absent",categories:["local_machine","remote_agents","robots","iot","industrial","cloud_edge","ai_gpu_nodes","space_observables"]};
const REAL_SPACE_TECH_CATALOG={name:"REAL_SPACE_TECH_CATALOG",version:"V11_SPACE_OBSERVABLES",nodes:{ISS:{type:"REAL_OBSERVABLE_SPACE_NODE",observable:true,controllable:false,apis:["http://api.open-notify.org/iss-now.json","https://api.wheretheiss.at/v1/satellites/25544"],rule:"track public telemetry only; no control claim"}},feeds:["CelesTrak","NOAA SWPC","NASA APIs","public satellite catalogs"]};
const MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE={name:"MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE",version:"V11_MAX_TECH",collection_level:"MAXIMAL_TECHNICAL",human_flicage:false,tribunal_layer:false,social_scoring:false,allowed:["machine_metrics","network_status","protocol_status","space_observables","agent_capabilities","hardware_status","software_versions","route_health","latency","technical_errors"],forbidden:["human_identity_tracking","private_behavior_tracking","social_scoring","punitive_judgement","tribunal_decision"]};
const NETWORK_SITUATION_MARKER={name:"NETWORK_SITUATION_MARKER",version:"V11_WAVE_MARKING",metrics:["rx_kbs","tx_kbs","interfaces","socket_clients","latency_if_available"],doctrine:"REAL_NETWORK_METRICS_OR_UNAVAILABLE"};
const TIMING_GUARDIAN={name:"TIMING_GUARDIAN",version:"V11_TIMING",default_timeout_ms:15000,heavy_timeout_ms:60000,max_timeout_ms:120000,classes:{INSTANT:"<250ms",FAST:"250ms-2s",NORMAL:"2s-15s",SLOW:"15s-60s",HEAVY:"60s-120s",TIMEOUT:"exceeded timeout",BLOCKED:"blocked before execution"}};
const V11_TERMINAL_CORE={name:"V11_TERMINAL_CORE",version:"V11_SAFE_POLYGLOT_TERMINAL",shells:["bash","sh","zsh","powershell","cmd"],editors:["VS Code","Visual Studio","Codespaces","code-server","GitHub CLI"],node:["node","npm","npx","pnpm","yarn","pm2","nodemon","tsx","typescript"],system:["git","docker","docker compose","kubectl","systemd","ports","env","logs"],languages:["JS","TS","Python","Rust","Go","C++","C#","Java","Shell","HTML/CSS"],diagnostics:["package.json","launch.json","tasks.json","npm audit","npm list","route health"],guards:["no destructive command","no secret exposure","safe repair only"]};
const POLYGLOT_UNIVERSAL_TERMINAL={name:"POLYGLOT_UNIVERSAL_TERMINAL",version:"V11_ALL_LANGUAGES",rule:"runtime detected = REAL; missing runtime = UNAVAILABLE; unknown language = ADAPTER_REQUIRED"};
const PROCESSOR_ENVIRONMENT_RECOGNIZER={name:"PROCESSOR_ENVIRONMENT_RECOGNIZER",version:"V11_AUTO_CPU_ENV",mission:"detect CPU, architecture, cores, RAM, OS, container, Codespaces, GPU and runtime support"};
const EXECUTION_SUPPORT_ACCELERATOR={name:"EXECUTION_SUPPORT_ACCELERATOR",version:"V11_SUPPORT_AS_POWER_BASE",doctrine:"support is not a limit; support is the acceleration base",rules:{no_downgrade_policy:true,maximize_available_power:true,activate_all_possible_modules:true,measure_how_far_it_can_go:true,real_or_unavailable:true}};
const UNKNOWN_TECH_DISCOVERY_REGISTRY={name:"UNKNOWN_TECH_DISCOVERY_REGISTRY",version:"V11_OPEN_DISCOVERY",categories:["shells","languages","package_managers","compilers","build_tools","editors","cloud_cli","containers","ai_tools","gpu_tools","robotics_tools","iot_tools","industrial_tools","space_tools","observability","databases","network_diagnostics"]};
async function timedShell(cmd,timeout=15000){const started=Date.now(); if(blockedCmd(cmd))return {ok:false,blocked:true,cmd,started_at:now(),ended_at:now(),duration_ms:Date.now()-started,timing_class:"BLOCKED"}; const r=await sh(cmd,timeout); const ms=Date.now()-started; return {...r,started_at:new Date(started).toISOString(),ended_at:now(),duration_ms:ms,duration_sec:+(ms/1000).toFixed(3),timeout_ms:timeout,timing_class:ms<250?"INSTANT":ms<2000?"FAST":ms<15000?"NORMAL":ms<60000?"SLOW":ms<120000?"HEAVY":"TIMEOUT_OR_TOO_LONG",stdout_bytes:Buffer.byteLength(r.out||"","utf8"),stderr_bytes:Buffer.byteLength(r.err||"","utf8")};}
async function terminalV11Catalog(){const checks=["bash --version 2>/dev/null | head -1 || echo unavailable","sh --version 2>/dev/null | head -1 || echo unavailable","zsh --version 2>/dev/null | head -1 || echo unavailable","node -v 2>/dev/null || echo unavailable","npm -v 2>/dev/null || echo unavailable","npx -v 2>/dev/null || echo unavailable","pnpm -v 2>/dev/null || echo unavailable","yarn -v 2>/dev/null || echo unavailable","pm2 -v 2>/dev/null || echo unavailable","git --version 2>/dev/null || echo unavailable","docker --version 2>/dev/null || echo unavailable","kubectl version --client 2>/dev/null || echo unavailable","python --version 2>/dev/null || python3 --version 2>/dev/null || echo unavailable","rustc --version 2>/dev/null || echo unavailable","go version 2>/dev/null || echo unavailable","java -version 2>&1 | head -1 || echo unavailable"]; const out={}; await Promise.all(checks.map(async c=>{out[c]=await timedShell(c,8000)})); return {time:now(),terminal:V11_TERMINAL_CORE,tools:out};}
async function processorEnvironment(){const [cpu,mem,osinfo,gfx,temp]=await Promise.all([si.cpu().catch(()=>null),si.mem().catch(()=>null),si.osInfo().catch(()=>null),si.graphics().catch(()=>null),si.cpuTemperature().catch(()=>null)]); const raw=await Promise.all([sh("uname -a 2>/dev/null || ver 2>/dev/null || echo unavailable"),sh("test -f /.dockerenv && echo docker_container || echo no_docker_marker"),sh("echo ${CODESPACES:-false}"),sh("nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader 2>/dev/null || echo nvidia_smi_unavailable")]); return {time:now(),recognizer:PROCESSOR_ENVIRONMENT_RECOGNIZER,cpu,mem,os:osinfo,graphics:gfx,temperature:temp,runtime:{node:process.version,platform:process.platform,arch:process.arch,hostname:os.hostname(),codespaces:String(process.env.CODESPACES||raw[2].out).includes("true"),container:raw[1].out.includes("docker_container")},raw_detection:{uname:raw[0].out,docker_marker:raw[1].out,codespaces_env:raw[2].out,nvidia_smi:raw[3].out}};}
async function networkSituation(){const c=await cockpit(); return {time:now(),marker:NETWORK_SITUATION_MARKER,network:c.measures.network_KBs,socket_clients:io.engine.clientsCount};}
async function supportAccelerationProfile(){const env=await processorEnvironment(); const cap=await capacity(); return {time:now(),accelerator:EXECUTION_SUPPORT_ACCELERATOR,environment:env,capacity:cap,interpretation:"the detected support is used as launch base to activate and measure every real available module"};}
async function howFarCanItGo(){const [cap,term,env,net]=await Promise.all([capacity(),terminalV11Catalog(),processorEnvironment(),networkSituation()]); return {time:now(),imperial:IMPERIAL_CONSTRUCTION,capacity:cap,terminal_catalog:term,processor:env,network:net,rule:"REAL modules count only; unavailable tools are not faked"};}
async function issPosition(){try{const r=await axios.get("http://api.open-notify.org/iss-now.json",{timeout:8000});return {time:now(),catalog:REAL_SPACE_TECH_CATALOG.nodes.ISS,source:"Open Notify",data:r.data};}catch(e){try{const w=await axios.get("https://api.wheretheiss.at/v1/satellites/25544",{timeout:8000});return {time:now(),catalog:REAL_SPACE_TECH_CATALOG.nodes.ISS,source:"WhereTheISS",data:w.data};}catch(e2){return {time:now(),catalog:REAL_SPACE_TECH_CATALOG.nodes.ISS,ok:false,error:e2.message};}}}

app.get("/api/imperial",async(req,res)=>res.json({time:now(),kernel:KERNEL,imperial:IMPERIAL_CONSTRUCTION}));
app.get("/api/orchestrator",async(req,res)=>res.json({time:now(),orchestrator:UNIVERSAL_MACHINE_ORCHESTRATOR}));
app.get("/api/space",async(req,res)=>res.json({time:now(),space:REAL_SPACE_TECH_CATALOG}));
app.get("/api/space/catalog",async(req,res)=>res.json(REAL_SPACE_TECH_CATALOG));
app.get("/api/space/iss",async(req,res)=>res.json(REAL_SPACE_TECH_CATALOG.nodes.ISS));
app.get("/api/space/iss/position",async(req,res)=>res.json(await issPosition()));
app.get("/api/max-tech",async(req,res)=>res.json(MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE));
app.get("/api/max-tech/scan",async(req,res)=>res.json(await powerFull()));
app.get("/api/max-tech/no-flicage",async(req,res)=>res.json({time:now(),human_flicage:false,tribunal_layer:false,social_scoring:false,allowed:MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE.allowed,forbidden:MAXIMAL_TECHNICAL_COLLECTION_NO_HUMAN_FLICAGE.forbidden}));
app.get("/api/network-situation",async(req,res)=>res.json(await networkSituation()));
app.get("/api/timing",async(req,res)=>res.json(TIMING_GUARDIAN));
app.post("/api/timing/terminal",async(req,res)=>res.json(await timedShell(String(req.body&&req.body.cmd||"node --version"),Number(req.body&&req.body.timeout||15000))));
app.get("/api/terminal-v11",async(req,res)=>res.json(V11_TERMINAL_CORE));
app.get("/api/terminal-v11/catalog",async(req,res)=>res.json(await terminalV11Catalog()));
app.post("/api/terminal-v11/run",async(req,res)=>res.json(await timedShell(String(req.body&&req.body.cmd||""),Number(req.body&&req.body.timeout||15000))));
app.get("/api/polyglot/catalog",async(req,res)=>res.json(await terminalV11Catalog()));
app.get("/api/processor",async(req,res)=>res.json(await processorEnvironment()));
app.get("/api/performance-profile",async(req,res)=>res.json(await processorEnvironment()));
app.get("/api/support-accelerator",async(req,res)=>res.json(await supportAccelerationProfile()));
app.get("/api/max-expansion",async(req,res)=>res.json(await howFarCanItGo()));
app.get("/api/how-far-can-it-go",async(req,res)=>res.json(await howFarCanItGo()));

io.on("connection",socket=>{
  const forward=(ev)=>(d)=>socket.emit(ev,d);
  bus.on("job:created",forward("job:created"));bus.on("job:started",forward("job:started"));bus.on("job:done",forward("job:done"));bus.on("job:error",forward("job:error"));
  const loop=setInterval(async()=>{try{const sys=await system();socket.emit("runtime",{time:now(),system:sys,health:healthScore(sys),capacity:await capacity(),blockchain:await blockchain()});}catch(e){}},5000);
  socket.on("disconnect",()=>{clearInterval(loop);bus.removeAllListeners("job:created");bus.removeAllListeners("job:started");bus.removeAllListeners("job:done");bus.removeAllListeners("job:error");});
});

server.listen(PORT,"0.0.0.0",()=>{
  console.log("================================================");
  console.log("TRILLIONS OMEGA ORCHESTRATOR V8 278% PLANETARY EXPERIMENTAL SAFE REPAIR ACTIVE");
  console.log("PORT => "+PORT);
  console.log("LAUNCH.JSON => app.js + remote attach 9229 aware");
  console.log("REAL ONLY => unavailable if blocked");
  console.log("================================================");
});
