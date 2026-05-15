const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

const state = {
  ok: true,
  name: "TRILLIONS BBB GENESIS",
  mode: "CODESPACES_BOOT_READY_FULL",
  startedAt: new Date().toISOString(),
  tick: 0,
  kernel: {
    runtime: "STANDBY",
    profile: "EXPERT",
    honestyLock: true,
    emulatedHardware: true,
    realDataOnlyWhenConnected: true,
    hiddenMining: false,
    fakeMetrics: false
  },
  logs: []
};

function log(channel, message) {
  const item = { ts: new Date().toISOString(), channel, message };
  state.logs.push(item);
  if (state.logs.length > 300) state.logs.shift();
  console.log(`[${channel}] ${message}`);
  io.emit("log", item);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/state", (req, res) => {
  res.json({ ...state, uptimeSec: Math.round(process.uptime()) });
});

app.post("/api/start", (req, res) => {
  state.kernel.runtime = "ONLINE";
  log("RUNTIME", "Runtime started");
  io.emit("state", { ...state, uptimeSec: Math.round(process.uptime()) });
  res.json({ ok: true });
});

app.post("/api/rescan", (req, res) => {
  log("RESCAN", "Repository scan requested");
  res.json({ ok: true });
});

io.on("connection", socket => {
  socket.emit("state", { ...state, uptimeSec: Math.round(process.uptime()) });
  socket.emit("log", { ts: new Date().toISOString(), channel: "SOCKET", message: "client connected" });
});

setInterval(() => {
  state.tick++;
  log("TICK", "runtime heartbeat " + state.tick);
  io.emit("state", { ...state, uptimeSec: Math.round(process.uptime()) });
}, 5000);

server.listen(PORT, "0.0.0.0", () => {
  console.log("TRILLIONS BBB SERVER ONLINE PORT " + PORT);
  log("BOOT", "TRILLIONS BBB SERVER ONLINE PORT " + PORT);
});

const dirTree = require("directory-tree");

app.get("/api/rescan", (req, res) => {

  const tree = dirTree("./", {
      extensions: /\.(js|html|css|json|mht|txt)$/
        });

          res.json(tree);

          });