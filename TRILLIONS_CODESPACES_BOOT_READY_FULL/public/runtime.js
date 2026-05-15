const terminal = document.getElementById("terminal");
const socket = io();

function write(line){ terminal.textContent += line + "\n"; terminal.scrollTop = terminal.scrollHeight; }
function setText(id,value){ const el=document.getElementById(id); if(el) el.textContent=value; }

async function loadState(){
  const state = await fetch("/api/state").then(r=>r.json());
  setText("status", state.ok ? "ONLINE" : "ERROR");
  setText("kernel", state.kernel?.runtime || "-");
  setText("profile", state.kernel?.profile || "-");
  setText("mode", state.mode || "-");
  setText("uptime", (state.uptimeSec || 0) + "s");
}

async function startRuntime(){ await fetch("/api/start",{method:"POST"}); await loadState(); }
async function rescan(){ await fetch("/api/rescan",{method:"POST"}); await loadState(); }
function clearTerminal(){ terminal.textContent=""; }

socket.on("log", item => write(`[${item.ts.slice(11,19)}] [${item.channel}] ${item.message}`));
socket.on("state", state => {
  setText("status", state.ok ? "ONLINE" : "ERROR");
  setText("kernel", state.kernel?.runtime || "-");
  setText("profile", state.kernel?.profile || "-");
  setText("mode", state.mode || "-");
  setText("uptime", (state.uptimeSec || 0) + "s");
});

function matrix(){
  const canvas=document.getElementById("matrix"), ctx=canvas.getContext("2d");
  function resize(){canvas.width=innerWidth;canvas.height=innerHeight}
  resize(); addEventListener("resize",resize);
  const drops=Array(Math.ceil(innerWidth/14)).fill(0);
  setInterval(()=>{ctx.fillStyle="rgba(0,0,0,.10)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#10ff91";ctx.font="12px monospace";drops.forEach((y,i)=>{ctx.fillText(Math.random()>.5?"1":"0",i*14,y*14);if(y*14>canvas.height&&Math.random()>.98)drops[i]=0;drops[i]++;});},55);
}
matrix(); loadState(); setInterval(loadState,5000);
