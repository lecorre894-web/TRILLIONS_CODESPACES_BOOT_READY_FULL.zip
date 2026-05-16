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
const {exec}=require("child_process");
const {Server}=require("socket.io");
const si=require("systeminformation");
const axios=require("axios");

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"},maxHttpBufferSize:1e8});
const PORT=Number(process.env.PORT||3000);
const START=Date.now();

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({extended:true,limit:"50mb"}));

const KERNEL={
  name:"TRILLIONS_REAL_CORE",
  version:"OMEGA_ORCHESTRATOR_V3",
  mode:"REAL_ONLY_OR_UNAVAILABLE",
  peace_authenticity:"no offensive action, no fake telemetry",
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

/* UI */
function page(){
return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS OMEGA ORCHESTRATOR</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#000;color:#00ff66;font-family:monospace}header{padding:12px;border-bottom:1px solid #00ff66;background:#00150a;display:flex;gap:8px;align-items:center;flex-wrap:wrap}h1{font-size:18px;margin:0;color:#00ffaa;flex:1}.badge{border:1px solid #00ff66;padding:3px 7px}.tabs{display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:#000b05;border-bottom:1px solid #00ff6633}.tabs button,.btn{background:#001b0c;color:#00ff66;border:1px solid #00ff66;padding:8px;margin:2px;font-family:monospace}.tabs button:hover,.btn:hover{background:#00331a;color:#00ffaa}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}@media(max-width:800px){.grid{grid-template-columns:1fr}}.card{border:1px solid #00ff6655;background:#000b05;padding:10px;min-height:120px}.card h3{margin:0 0 8px;color:#00ffaa;border-bottom:1px solid #00ff6622}.out{white-space:pre-wrap;word-break:break-word;overflow:auto;max-height:70vh;font-size:11px}.wide{grid-column:1/-1}textarea,input{width:100%;background:#001b0c;color:#00ff66;border:1px solid #00ff66;padding:8px;font-family:monospace}.mini{font-size:11px;color:#66ffaa}
</style></head><body>
<header><h1>Ω TRILLIONS OMEGA ORCHESTRATOR</h1><span id="sock" class="badge">SOCKET...</span><span id="up" class="badge">UPTIME...</span></header>
<div class="tabs">
<button onclick="load('/api/full')">FULL</button><button onclick="load('/api/system')">SYSTEM</button><button onclick="load('/api/network')">NETWORK</button><button onclick="load('/api/repo')">REPO</button><button onclick="load('/api/blockchain')">BLOCKCHAIN</button><button onclick="load('/api/workload')">WORKLOAD</button><button onclick="load('/api/launch')">LAUNCH.JSON</button><button onclick="load('/api/protocols')">PROTOCOLS</button><button onclick="load('/api/iot')">IoT REAL</button><button onclick="load('/api/security')">SECURITY</button><button onclick="load('/api/supercompute')">SUPERCOMPUTE</button><button onclick="load('/api/tech')">TECH</button>
<button onclick="load('/api/mesures')">MESURES</button>
</div>
<div class="grid">
<div class="card wide"><h3>CONTROL</h3><div class="mini">REAL ONLY — no simulation/no emulation. Unavailable if inaccessible.</div><textarea id="msg" rows="3">TRILLIONS: audit the real orchestration capacity and bottlenecks.</textarea><button class="btn" onclick="askAI()">AI ANALYZE</button><button class="btn" onclick="cmd('pm2 ls')">PM2 LS</button><button class="btn" onclick="cmd('pm2 restart TRILLIONS')">PM2 RESTART</button><button class="btn" onclick="cmd('ss -tulpn')">PORTS</button><input id="shell" value="ps aux --sort=-%cpu | head -20"><button class="btn" onclick="cmd(document.getElementById('shell').value)">RUN SAFE SHELL</button></div>
<div class="card wide"><h3>OUTPUT</h3><pre id="out" class="out">READY</pre></div>
</div>
<script src="/socket.io/socket.io.js"></script><script>
const out=document.getElementById('out');
async function load(u){out.textContent='LOADING '+u;try{let r=await fetch(u);out.textContent=JSON.stringify(await r.json(),null,2)}catch(e){out.textContent='ERROR '+e.message}}
async function askAI(){load('/api/ai?m='+encodeURIComponent(document.getElementById('msg').value))}
async function cmd(c){out.textContent='$ '+c+'\\nRUNNING...';let r=await fetch('/api/shell',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cmd:c})});let j=await r.json();out.textContent='$ '+c+'\\n\\n'+(j.out||'')+(j.err?'\\n\\nERR:\\n'+j.err:'')}
const socket=io();socket.on('connect',()=>sock.textContent='SOCKET LIVE');socket.on('disconnect',()=>sock.textContent='SOCKET OFF');socket.on('runtime',d=>{up.textContent='UP '+(d.system&&d.system.uptime_app_sec||0)+'s'});
load('/api/full');
</script></body></html>`;
}

/* ROUTES */
app.get("/",(req,res)=>res.send(page()));
app.get("/api/full",async(req,res)=>res.json(await full()));
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

io.on("connection",socket=>{
  const loop=setInterval(async()=>{try{socket.emit("runtime",{time:now(),system:await system(),blockchain:await blockchain()});}catch(e){}},5000);
  socket.on("disconnect",()=>clearInterval(loop));
});

server.listen(PORT,"0.0.0.0",()=>{
  console.log("================================================");
  console.log("TRILLIONS OMEGA ORCHESTRATOR V3 ACTIVE");
  console.log("PORT => "+PORT);
  console.log("LAUNCH.JSON => app.js + remote attach 9229 aware");
  console.log("REAL ONLY => unavailable if blocked");
  console.log("================================================");
});
