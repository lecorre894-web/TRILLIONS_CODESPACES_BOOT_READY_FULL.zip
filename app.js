const express=require("express");
const http=require("http");
const os=require("os");
const {exec}=require("child_process");
const {Server}=require("socket.io");
const si=require("systeminformation");
const axios=require("axios");
require("dotenv").config();

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:"*"},maxHttpBufferSize:1e8});
const PORT=process.env.PORT||3000;
const START=Date.now();

app.use(express.json({limit:"50mb"}));
app.use(express.urlencoded({extended:true}));

const KERN={
  kernel:"TRILLIONS_REAL_CORE",
  version:"OMEGA_INFINITY_V2",
  reality:"REAL_ONLY",
  started:new Date().toISOString()
};

function shell(cmd,timeout){
  timeout=timeout||10000;
  return new Promise(function(resolve){
    exec(cmd,{timeout:timeout,maxBuffer:1024*1024*50},function(err,out,stderr){
      resolve({ok:!err,out:(out||"").trim(),err:(stderr||"").trim()});
    });
  });
}

async function getSystem(){
  var r=await Promise.all([
    si.cpu().catch(function(){return null;}),
    si.mem().catch(function(){return null;}),
    si.currentLoad().catch(function(){return null;}),
    si.fsSize().catch(function(){return[];}),
    si.networkStats().catch(function(){return[];}),
    si.graphics().catch(function(){return null;}),
    si.osInfo().catch(function(){return null;})
  ]);
  var cpu=r[0],mem=r[1],load=r[2],disks=r[3],network=r[4],graphics=r[5],osinfo=r[6];
  return {
    time:new Date().toISOString(),
    uptime_sec:Math.floor((Date.now()-START)/1000),
    hostname:os.hostname(),
    platform:process.platform,
    node:process.version,
    cpu:cpu?{brand:cpu.brand,cores:cpu.cores,physical:cpu.physicalCores,speed:cpu.speed}:null,
    ram:mem?{total_gb:+(mem.total/1073741824).toFixed(2),used_gb:+(mem.used/1073741824).toFixed(2),free_gb:+(mem.free/1073741824).toFixed(2)}:null,
    load:load?{current:+load.currentLoad.toFixed(2)}:null,
    disks:disks,network:network,graphics:graphics,os:osinfo
  };
}

async function getNetwork(){
  var r=await Promise.all([
    shell("ss -tulpn 2>/dev/null||true"),
    shell("ip route 2>/dev/null||true"),
    shell("curl -s --max-time 5 ifconfig.me 2>/dev/null||echo unknown"),
    shell("cat /etc/resolv.conf 2>/dev/null||true"),
    shell("ping -c 2 -W 3 1.1.1.1 2>/dev/null||echo unreachable")
  ]);
  return {
    time:new Date().toISOString(),
    public_ip:r[2].out||"unknown",
    ports:r[0].out,route:r[1].out,latency:r[4].out,dns:r[3].out
  };
}

async function getRepo(){
  var r=await Promise.all([
    shell("du -sh . 2>/dev/null||true"),
    shell("find . -not -path './.git/*' -not -path './node_modules/*' -type f|wc -l"),
    shell("find . -not -path './.git/*' -not -path './node_modules/*' -type d|wc -l"),
    shell("git status --short 2>/dev/null||echo 'not a git repo'"),
    shell("find . -not -path './.git/*' -not -path './node_modules/*' -maxdepth 2 -type f|sort|head -100"),
    shell("git branch --show-current 2>/dev/null||true"),
    shell("git log --oneline -10 2>/dev/null||true")
  ]);
  return {size:r[0].out,files:r[1].out,dirs:r[2].out,git:r[3].out,tree:r[4].out,branch:r[5].out,log:r[6].out};
}

async function getBlockchain(){
  var RPC=process.env.ETH_RPC_URL||"https://ethereum.publicnode.com";
  try{
    var r=await Promise.all([
      axios.post(RPC,{jsonrpc:"2.0",method:"eth_blockNumber",params:[],id:1},{timeout:10000}),
      axios.post(RPC,{jsonrpc:"2.0",method:"eth_gasPrice",params:[],id:2},{timeout:10000})
    ]);
    return {provider:RPC,connected:true,latest_block:parseInt(r[0].data.result,16),gas_price_gwei:+(parseInt(r[1].data.result,16)/1e9).toFixed(2)};
  }catch(e){return {provider:RPC,connected:false,error:e.message};}
}

async function getAI(message){
  try{
    var url="https://text.pollinations.ai/"+encodeURIComponent(message||"TRILLIONS REAL CORE status");
    var r=await axios.get(url,{timeout:15000});
    return {provider:"pollinations",connected:true,response:String(r.data).slice(0,4000)};
  }catch(e){return {provider:"pollinations",connected:false,error:e.message};}
}

async function getWorkloads(){
  var r=await Promise.all([
    shell("ps aux --sort=-%cpu|head -25"),
    shell("free -m"),
    shell("ss -s"),
    shell("cat /proc/loadavg 2>/dev/null||true"),
    shell("df -h 2>/dev/null||true"),
    shell("who 2>/dev/null||true")
  ]);
  return {processes:r[0].out,memory_free:r[1].out,socket_stats:r[2].out,loadavg:r[3].out,diskfree:r[4].out,who:r[5].out};
}

async function getRuntimeInfo(){
  var mu=process.memoryUsage();
  var env={};
  ["NODE_ENV","PORT","HOME","USER","SHELL","LANG","PWD"].forEach(function(k){if(process.env[k])env[k]=process.env[k];});
  return {
    node_version:process.version,pid:process.pid,
    uptime_node_sec:Math.floor(process.uptime()),
    uptime_app_sec:Math.floor((Date.now()-START)/1000),
    memory_heap_mb:+(mu.heapUsed/1048576).toFixed(2),
    memory_heap_total_mb:+(mu.heapTotal/1048576).toFixed(2),
    memory_rss_mb:+(mu.rss/1048576).toFixed(2),
    env:env,cwd:process.cwd(),title:process.title
  };
}

async function getOrchestrator(){
  var r=await Promise.all([
    shell("pm2 jlist 2>/dev/null||echo '[]'"),
    shell("pm2 ls 2>/dev/null||true"),
    shell("systemctl list-units --type=service --state=running 2>/dev/null|head -20||true")
  ]);
  var pm2_list=[];
  try{pm2_list=JSON.parse(r[0].out);}catch(e){}
  return {pm2_list:pm2_list,pm2_table:r[1].out,services:r[2].out};
}

async function FULL_SCAN(){
  var r=await Promise.all([getSystem(),getNetwork(),getRepo(),getBlockchain()]);
  return {runtime:KERN,system:r[0],network:r[1],repo:r[2],blockchain:r[3]};
}

/* ═══════════════════════════ HTML ═══════════════════════════ */

function buildHTML(){
return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Omega TRILLIONS REAL CORE</title>
<style>
*{box-sizing:border-box}
body{background:#000;color:#00ff66;font-family:monospace;margin:0;padding:0}
header{background:#000d06;border-bottom:1px solid #00ff66;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
header h1{margin:0;color:#00ffaa;font-size:18px;flex:1}
#livebadge{background:#003320;color:#00ff66;border:1px solid #00ff66;padding:2px 8px;font-size:11px}
#uptimehdr{color:#66ffaa;font-size:11px}
.dot{width:8px;height:8px;border-radius:50%;background:#00ff66;animation:pulse 1.5s infinite;display:inline-block}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
.tabs{display:flex;flex-wrap:wrap;background:#000d06;border-bottom:1px solid #00ff4433;padding:4px 8px;gap:3px}
.tab{background:#001b0c;color:#00ff66;border:1px solid #00ff6644;padding:5px 11px;cursor:pointer;font-family:monospace;font-size:11px;transition:all .15s}
.tab:hover,.tab.active{background:#003320;border-color:#00ff66;color:#00ffaa}
.pane{display:none;padding:10px}
.pane.active{display:block}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-width:680px){.g2{grid-template-columns:1fr}}
.card{border:1px solid #00ff6644;padding:9px;background:#000d06;position:relative}
.card h3{margin:0 0 7px;color:#00ffaa;font-size:12px;border-bottom:1px solid #00ff6622;padding-bottom:4px}
.card pre{margin:0;white-space:pre-wrap;word-break:break-all;font-size:10px;max-height:340px;overflow-y:auto;color:#00ff88}
.cpbtn{position:absolute;top:7px;right:7px;background:#001b0c;color:#00ff66;border:1px solid #00ff6644;padding:2px 7px;cursor:pointer;font-size:10px;font-family:monospace}
.cpbtn:hover{border-color:#00ff66;background:#003320}
.cpbtn.ok{color:#00ffaa;border-color:#00ffaa}
.bw{background:#001b0c;height:7px;border:1px solid #00ff6633;margin-top:3px}
.bf{height:100%;background:#00ff66;transition:width .5s}
.bf.w{background:#ffaa00}.bf.c{background:#ff4400}
.st{display:flex;justify-content:space-between;font-size:11px;padding:2px 0;border-bottom:1px solid #00ff6611}
.sl{color:#66ffaa}.sv{color:#00ffff}
.badge{display:inline-block;padding:1px 6px;border:1px solid;font-size:10px;margin:2px}
.bg{color:#00ff66;border-color:#00ff66}.br{color:#ff4400;border-color:#ff4400}.bo{color:#ffaa00;border-color:#ffaa00}
.inp{width:100%;background:#001b0c;color:#00ff66;border:1px solid #00ff66;padding:7px;font-family:monospace;font-size:12px}
.btn{background:#003320;color:#00ffaa;border:1px solid #00ff66;padding:7px 14px;cursor:pointer;font-family:monospace;margin-top:5px}
.btn:hover{background:#004d30}
.sug{font-size:10px;color:#66ffaa;margin-top:6px}
.sug span{cursor:pointer;color:#00ffaa;margin-right:8px}
.sug span:hover{text-decoration:underline}
</style>
</head>
<body>
<header>
  <h1>&#937; TRILLIONS REAL CORE</h1>
  <span class="dot"></span>
  <span id="livebadge">CONNECTING...</span>
  <span id="uptimehdr">—</span>
</header>

<div class="tabs">
  <button class="tab active" onclick="sw('full',this)">FULL SCAN</button>
  <button class="tab" onclick="sw('system',this)">SYSTEM</button>
  <button class="tab" onclick="sw('network',this)">NETWORK</button>
  <button class="tab" onclick="sw('repo',this)">REPO</button>
  <button class="tab" onclick="sw('blockchain',this)">BLOCKCHAIN</button>
  <button class="tab" onclick="sw('ai',this)">AI</button>
  <button class="tab" onclick="sw('workloads',this)">WORKLOADS</button>
  <button class="tab" onclick="sw('runtime',this)">RUNTIME</button>
  <button class="tab" onclick="sw('orchestrator',this)">ORCHESTRATOR</button>
  <button class="tab" onclick="sw('solver',this)">SOLVER</button>
</div>

<div class="pane active" id="pane-full">
  <div class="card">
    <h3>FULL SCAN — JSON RAW</h3>
    <button class="cpbtn" onclick="cpEl('full-raw',this)">COPY</button>
    <pre id="full-raw">Chargement...</pre>
  </div>
</div>

<div class="pane" id="pane-system">
  <div class="g2">
    <div class="card"><h3>CPU / LOAD</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-cpu"></div></div>
    <div class="card"><h3>RAM</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-ram"></div></div>
    <div class="card"><h3>DISQUES</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-disk"></div></div>
    <div class="card"><h3>OS / HOST</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-os"></div></div>
    <div class="card"><h3>GPU / GRAPHIQUES</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-gpu"></div></div>
    <div class="card"><h3>INTERFACES RESEAU</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="s-net"></div></div>
  </div>
</div>

<div class="pane" id="pane-network">
  <div class="g2">
    <div class="card"><h3>IP PUBLIQUE / LATENCE</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="n-ip"></div></div>
    <div class="card"><h3>TABLE DE ROUTAGE</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="n-route">—</pre></div>
    <div class="card"><h3>PORTS OUVERTS (ss -tulpn)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="n-ports">—</pre></div>
    <div class="card"><h3>DNS (/etc/resolv.conf)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="n-dns">—</pre></div>
    <div class="card"><h3>LATENCE PING (1.1.1.1)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="n-ping">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-repo">
  <div class="g2">
    <div class="card"><h3>GIT STATUS</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="r-git">—</pre></div>
    <div class="card"><h3>GIT LOG (10 derniers)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="r-log">—</pre></div>
    <div class="card"><h3>STATS REPO</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="r-stats"></div></div>
    <div class="card"><h3>ARBORESCENCE (depth 2)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="r-tree">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-blockchain">
  <div class="g2">
    <div class="card"><h3>NOEUD ETHEREUM</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="bc-status"></div></div>
    <div class="card"><h3>REPONSE RAW</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="bc-raw">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-ai">
  <div class="card">
    <h3>AI — POLLINATIONS</h3>
    <textarea class="inp" id="ai-msg" rows="3">TRILLIONS REAL CORE — donne le statut du systeme</textarea>
    <br>
    <button class="btn" onclick="runAI()">&#9654; ENVOYER</button>
    <button class="cpbtn" style="position:static;margin-left:8px" onclick="cpEl('ai-resp',this)">COPY</button>
    <pre id="ai-resp" style="margin-top:10px;min-height:80px">—</pre>
  </div>
</div>

<div class="pane" id="pane-workloads">
  <div class="g2">
    <div class="card"><h3>TOP PROCESSUS (CPU)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-ps">—</pre></div>
    <div class="card"><h3>MEMOIRE (free -m)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-mem">—</pre></div>
    <div class="card"><h3>SOCKETS (ss -s)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-sock">—</pre></div>
    <div class="card"><h3>LOAD AVERAGE</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-load">—</pre></div>
    <div class="card"><h3>DISQUES (df -h)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-df">—</pre></div>
    <div class="card"><h3>SESSIONS ACTIVES (who)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="w-who">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-runtime">
  <div class="g2">
    <div class="card"><h3>PROCESSUS NODE</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="rt-node"></div></div>
    <div class="card"><h3>MEMOIRE HEAP</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><div id="rt-heap"></div></div>
    <div class="card"><h3>VARIABLES ENV</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="rt-env">—</pre></div>
    <div class="card"><h3>KERNEL TRILLIONS</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="rt-kern">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-orchestrator">
  <div class="card" style="margin-bottom:8px">
    <h3>PM2 — GESTIONNAIRE DE PROCESSUS</h3>
    <button class="btn" style="margin-right:5px" onclick="pm2act('pm2 restart TRILLIONS')">&#8635; RESTART TRILLIONS</button>
    <button class="btn" style="margin-right:5px" onclick="pm2act('pm2 ls')">LIST</button>
    <button class="btn" onclick="pm2act('pm2 logs TRILLIONS --lines 30 --nostream')">LOGS</button>
    <button class="cpbtn" style="position:static;margin-left:8px" onclick="cpEl('orc-pm2',this)">COPY</button>
    <pre id="orc-pm2" style="margin-top:8px;min-height:60px">—</pre>
  </div>
  <div class="g2">
    <div class="card"><h3>PM2 JSON LIST</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="orc-json">—</pre></div>
    <div class="card"><h3>SERVICES SYSTEME (running)</h3><button class="cpbtn" onclick="cpCard(this)">COPY</button><pre id="orc-svc">—</pre></div>
  </div>
</div>

<div class="pane" id="pane-solver">
  <div class="card">
    <h3>SHELL SOLVER — EXECUTION DIRECTE</h3>
    <input class="inp" id="sv-cmd" type="text" value="ps aux --sort=-%cpu | head -15">
    <br>
    <button class="btn" onclick="runSolver()">&#9654; EXECUTE</button>
    <button class="btn" style="margin-left:5px" onclick="document.getElementById('sv-out').textContent='—'">CLEAR</button>
    <button class="cpbtn" style="position:static;margin-left:8px" onclick="cpEl('sv-out',this)">COPY</button>
    <div class="sug">
      Raccourcis :
      <span onclick="sc('df -h')">df -h</span>
      <span onclick="sc('uname -a')">uname -a</span>
      <span onclick="sc('env | sort')">env | sort</span>
      <span onclick="sc('cat /proc/cpuinfo | grep -m4 model')">cpuinfo</span>
      <span onclick="sc('ip route')">routes</span>
      <span onclick="sc('ls -lah')">ls -lah</span>
      <span onclick="sc('node --version && npm --version')">versions</span>
      <span onclick="sc('cat /proc/meminfo | head -20')">meminfo</span>
    </div>
    <pre id="sv-out" style="margin-top:10px;min-height:180px;max-height:520px;overflow-y:auto">—</pre>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
function fmtBytes(b){
  if(!b)return "0 B";
  var u=["B","KB","MB","GB","TB"],i=0;
  while(b>=1024&&i<4){b/=1024;i++;}
  return b.toFixed(1)+" "+u[i];
}
function fmtUp(s){
  if(!s)return "0s";
  var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return (h?h+"h ":"")+(m?m+"m ":"")+sec+"s";
}
function st(l,v){return '<div class="st"><span class="sl">'+l+'</span><span class="sv">'+v+'</span></div>';}
function bar(pct){var c=pct>85?"c":pct>65?"w":"";return '<div class="bw"><div class="bf '+c+'" style="width:'+pct+'%"></div></div>';}
function badge(t,c){return '<span class="badge b'+c+'">'+t+'</span>';}

function cpEl(id,btn){
  var el=document.getElementById(id);
  if(!el)return;
  navigator.clipboard.writeText(el.textContent||el.innerText||"").then(function(){
    var orig=btn.textContent;
    btn.textContent="OK";
    btn.classList.add("ok");
    setTimeout(function(){btn.textContent=orig;btn.classList.remove("ok");},1500);
  });
}
function cpCard(btn){
  var card=btn.closest(".card");
  var el=card.querySelector("pre")||card.querySelector("div[id]");
  if(!el)return;
  navigator.clipboard.writeText(el.textContent||el.innerText||"").then(function(){
    var orig=btn.textContent;
    btn.textContent="OK";
    btn.classList.add("ok");
    setTimeout(function(){btn.textContent=orig;btn.classList.remove("ok");},1500);
  });
}
function sc(cmd){document.getElementById("sv-cmd").value=cmd;}

async function api(url){
  var r=await fetch(url);
  return r.json();
}

function renderSystem(d){
  if(!d)return;
  var cpu=d.cpu||{},load=d.load||{};
  document.getElementById("s-cpu").innerHTML=
    st("Modele",cpu.brand||"—")+
    st("Coeurs logiques",cpu.cores||"—")+
    st("Coeurs physiques",cpu.physical||"—")+
    st("Frequence",cpu.speed+" GHz")+
    st("Charge actuelle",load.current+"%")+
    bar(load.current||0);
  var ram=d.ram||{},rp=ram.total_gb?Math.round(ram.used_gb/ram.total_gb*100):0;
  document.getElementById("s-ram").innerHTML=
    st("Total",ram.total_gb+" GB")+
    st("Utilise",ram.used_gb+" GB")+
    st("Libre",ram.free_gb+" GB")+
    st("Usage",rp+"%")+bar(rp);
  var disks=d.disks||[];
  document.getElementById("s-disk").innerHTML=disks.map(function(dk){
    return '<div style="margin-bottom:6px">'+
      st("Montage",dk.mount)+
      st("FS",dk.type)+
      st("Taille",(dk.size/1073741824).toFixed(1)+" GB")+
      st("Utilise",(dk.used/1073741824).toFixed(1)+" GB ("+dk.use.toFixed(1)+"%)")+
      bar(dk.use)+"</div>";
  }).join("");
  var osi=d.os||{};
  document.getElementById("s-os").innerHTML=
    st("Hostname",d.hostname||"—")+
    st("Plateforme",d.platform||"—")+
    st("Distro",(osi.distro||"—")+" "+osi.release)+
    st("Kernel",osi.kernel||"—")+
    st("Arch",osi.arch||"—")+
    st("Node",d.node||"—")+
    st("Uptime",fmtUp(d.uptime_sec));
  var g=d.graphics||{},ctrl=g.controllers||[];
  document.getElementById("s-gpu").innerHTML=ctrl.length?
    ctrl.map(function(c){return st("GPU",c.model||"—")+st("VRAM",(c.vram||"—")+" MB");}).join(""):
    '<div style="color:#555;font-size:11px">Aucun GPU detecte (Codespaces)</div>';
  var nets=d.network||[];
  document.getElementById("s-net").innerHTML=nets.map(function(n){
    return '<div style="margin-bottom:5px">'+
      st("Interface",n.iface)+
      st("Etat",n.operstate)+
      st("RX",fmtBytes(n.rx_bytes)+" ("+fmtBytes(n.rx_sec||0)+"/s)")+
      st("TX",fmtBytes(n.tx_bytes)+" ("+fmtBytes(n.tx_sec||0)+"/s)")+"</div>";
  }).join("");
}

function renderNetwork(d){
  if(!d)return;
  document.getElementById("n-ip").innerHTML=
    st("IP Publique",d.public_ip||"—")+
    st("Heure mesure",d.time||"—");
  document.getElementById("n-route").textContent=d.route||"—";
  document.getElementById("n-ports").textContent=d.ports||"—";
  document.getElementById("n-dns").textContent=d.dns||"—";
  document.getElementById("n-ping").textContent=d.latency||"—";
}

function renderRepo(d){
  if(!d)return;
  document.getElementById("r-git").textContent=d.git||"clean";
  document.getElementById("r-log").textContent=d.log||"aucun commit";
  document.getElementById("r-stats").innerHTML=
    st("Fichiers",d.files)+
    st("Dossiers",d.dirs)+
    st("Taille",d.size)+
    st("Branche",d.branch||"—");
  document.getElementById("r-tree").textContent=d.tree||"—";
}

function renderBlockchain(d){
  if(!d)return;
  var ok=d.connected;
  document.getElementById("bc-status").innerHTML=
    st("Provider",d.provider)+
    st("Statut",badge(ok?"CONNECTE":"HORS LIGNE",ok?"g":"r"))+
    (ok?st("Dernier bloc","#"+d.latest_block):"") +
    (ok&&d.gas_price_gwei?st("Gas Price",d.gas_price_gwei+" Gwei"):"")+
    (d.error?st("Erreur",d.error):"");
  document.getElementById("bc-raw").textContent=JSON.stringify(d,null,2);
}

function renderWorkloads(d){
  if(!d)return;
  document.getElementById("w-ps").textContent=d.processes||"—";
  document.getElementById("w-mem").textContent=d.memory_free||"—";
  document.getElementById("w-sock").textContent=d.socket_stats||"—";
  document.getElementById("w-load").textContent=d.loadavg||"—";
  document.getElementById("w-df").textContent=d.diskfree||"—";
  document.getElementById("w-who").textContent=d.who||"—";
}

function renderRuntime(d){
  if(!d)return;
  document.getElementById("rt-node").innerHTML=
    st("Node Version",d.node_version)+
    st("PID",d.pid)+
    st("Uptime App",fmtUp(d.uptime_app_sec))+
    st("Uptime Node",fmtUp(d.uptime_node_sec))+
    st("CWD",d.cwd)+
    st("Title",d.title);
  var hp=Math.round(d.memory_heap_mb/d.memory_heap_total_mb*100)||0;
  document.getElementById("rt-heap").innerHTML=
    st("Heap Used",d.memory_heap_mb+" MB")+
    st("Heap Total",d.memory_heap_total_mb+" MB")+
    st("RSS",d.memory_rss_mb+" MB")+
    st("Heap %",hp+"%")+bar(hp);
  document.getElementById("rt-env").textContent=JSON.stringify(d.env,null,2);
  document.getElementById("rt-kern").textContent=JSON.stringify({
    kernel:"TRILLIONS_REAL_CORE",version:"OMEGA_INFINITY_V2",reality:"REAL_ONLY"
  },null,2);
}

function renderOrchestrator(d){
  if(!d)return;
  var list=d.pm2_list||[];
  var txt=list.length?list.map(function(p){
    var e=p.pm2_env||{};
    return "► "+p.name+
      "  |  PID:"+(e.pid||p.pid||"—")+
      "  |  Status:"+(e.status||"—")+
      "  |  CPU:"+(p.monit?p.monit.cpu+"%":"—")+
      "  |  MEM:"+(p.monit?fmtBytes(p.monit.memory):"—")+
      "  |  Restarts:"+(e.restart_time||0)+
      "  |  Uptime:"+fmtUp(Math.floor((e.pm_uptime?Date.now()-e.pm_uptime:0)/1000));
  }).join("\n"):d.pm2_table||"Aucun processus PM2";
  document.getElementById("orc-pm2").textContent=txt;
  document.getElementById("orc-json").textContent=JSON.stringify(list,null,2);
  document.getElementById("orc-svc").textContent=d.services||"—";
}

async function loadTab(name){
  try{
    if(name==="full"){
      var d=await api("/api/full");
      document.getElementById("full-raw").textContent=JSON.stringify(d,null,2);
    }else if(name==="system"){
      renderSystem(await api("/api/system"));
    }else if(name==="network"){
      renderNetwork(await api("/api/network"));
    }else if(name==="repo"){
      renderRepo(await api("/api/repo"));
    }else if(name==="blockchain"){
      renderBlockchain(await api("/api/blockchain"));
    }else if(name==="workloads"){
      renderWorkloads(await api("/api/workloads"));
    }else if(name==="runtime"){
      renderRuntime(await api("/api/runtime"));
    }else if(name==="orchestrator"){
      renderOrchestrator(await api("/api/orchestrator"));
    }
  }catch(e){console.error("loadTab",name,e);}
}

function sw(name,btn){
  document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("active");});
  document.querySelectorAll(".pane").forEach(function(p){p.classList.remove("active");});
  document.getElementById("pane-"+name).classList.add("active");
  btn.classList.add("active");
  loadTab(name);
}

async function runAI(){
  var msg=document.getElementById("ai-msg").value;
  document.getElementById("ai-resp").textContent="En cours...";
  try{
    var d=await api("/api/ai?m="+encodeURIComponent(msg));
    document.getElementById("ai-resp").textContent=d.response||d.error||JSON.stringify(d);
  }catch(e){document.getElementById("ai-resp").textContent="ERROR: "+e.message;}
}

async function runSolver(){
  var cmd=document.getElementById("sv-cmd").value.trim();
  if(!cmd)return;
  document.getElementById("sv-out").textContent="$ "+cmd+"\n\nExecution...";
  try{
    var r=await fetch("/api/shell",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cmd:cmd})});
    var d=await r.json();
    document.getElementById("sv-out").textContent="$ "+cmd+"\n\n"+(d.out||"")+(d.err?"\n\n[STDERR]\n"+d.err:"");
  }catch(e){document.getElementById("sv-out").textContent="ERROR: "+e.message;}
}

async function pm2act(cmd){
  var r=await fetch("/api/shell",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cmd:cmd})});
  var d=await r.json();
  document.getElementById("orc-pm2").textContent=d.out||d.err||"—";
}

var socket=io();
socket.on("connect",function(){
  document.getElementById("livebadge").textContent="SOCKET LIVE";
  document.getElementById("livebadge").style.borderColor="#00ff66";
});
socket.on("disconnect",function(){
  document.getElementById("livebadge").textContent="SOCKET OFF";
  document.getElementById("livebadge").style.borderColor="#ff4400";
});
socket.on("runtime",function(data){
  var s=data.system;
  if(s)document.getElementById("uptimehdr").textContent="Uptime: "+fmtUp(s.uptime_sec);
  var pane=document.querySelector(".pane.active");
  if(!pane)return;
  var name=pane.id.replace("pane-","");
  if(name==="full")document.getElementById("full-raw").textContent=JSON.stringify(data,null,2);
  else if(name==="system")renderSystem(data.system);
  else if(name==="network")renderNetwork(data.network);
  else if(name==="repo")renderRepo(data.repo);
  else if(name==="blockchain")renderBlockchain(data.blockchain);
});

loadTab("full");
</script>
</body>
</html>`;
}

/* ═══════════════════════════ ROUTES ═══════════════════════════ */

app.get("/",function(req,res){res.send(buildHTML());});
app.get("/api/system",async function(req,res){res.json(await getSystem());});
app.get("/api/network",async function(req,res){res.json(await getNetwork());});
app.get("/api/repo",async function(req,res){res.json(await getRepo());});
app.get("/api/blockchain",async function(req,res){res.json(await getBlockchain());});
app.get("/api/full",async function(req,res){res.json(await FULL_SCAN());});
app.get("/api/ai",async function(req,res){res.json(await getAI(req.query.m));});
app.get("/api/workloads",async function(req,res){res.json(await getWorkloads());});
app.get("/api/runtime",async function(req,res){res.json(await getRuntimeInfo());});
app.get("/api/orchestrator",async function(req,res){res.json(await getOrchestrator());});

app.post("/api/shell",async function(req,res){
  var cmd=(req.body.cmd||"").trim();
  if(!cmd)return res.json({ok:false,out:"",err:"No command"});
  var blocked=/^\s*(rm\s+-rf\s+\/|dd\s+if=\/dev\/zero|mkfs|chmod\s+000\s+\/|shutdown|reboot|halt|poweroff)/i;
  if(blocked.test(cmd))return res.json({ok:false,out:"",err:"Commande bloquee (securite)"});
  res.json(await shell(cmd,15000));
});

/* ═══════════════════════════ SOCKET ═══════════════════════════ */

io.on("connection",function(socket){
  console.log("SOCKET =>",socket.id);
  var loop=setInterval(async function(){
    try{socket.emit("runtime",await FULL_SCAN());}catch(e){}
  },5000);
  socket.on("disconnect",function(){clearInterval(loop);});
});

/* ═══════════════════════════ START ═══════════════════════════ */

server.listen(PORT,"0.0.0.0",function(){
  console.log("");
  console.log("==================================================");
  console.log("Omega TRILLIONS REAL CORE V2 — ACTIVE");
  console.log("PORT    =>",PORT);
  console.log("TABS    => FULL/SYSTEM/NETWORK/REPO/BC/AI/WL/RT/ORC/SOLVER");
  console.log("SOCKET  => LIVE 5s");
  console.log("SHELL   => /api/shell POST");
  console.log("==================================================");
  console.log("");
});
