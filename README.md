# TRILLIONS_CODESPACES_BOOT_READY_Fcat >> app.js <<'EOF'

app.get("/",async(req,res)=>{

res.send(`<!DOCTYPE html>
<html>
<head>

<meta charset="utf-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>Ω TRILLIONS REAL CORE</title>

<style>

body{
 background:#000;
  color:#00ff66;
   font-family:monospace;
    margin:0;
     padding:15px;
     }

     h1{
      color:#00ffaa;
       font-size:24px;
       }

       button{
        background:#001b0c;
         color:#00ff66;
          border:1px solid #00ff66;
           padding:10px;
            margin:4px;
            }

            .card{
             border:1px solid #00ff66;
              padding:12px;
               margin-top:10px;
                white-space:pre-wrap;
                 overflow:auto;
                 }

                 small{
                  color:#66ffaa;
                  }

                  </style>
                  </head>

                  <body>

                  <h1>Ω TRILLIONS REAL CORE ACTIVE</h1>

                  <small>
                  BOOT → RUNTIME → SOCKETS → API →
                  MONITORING → BLOCKCHAIN → IA →
                  ORCHESTRATOR → NETWORK
                  </small>

                  <br><br>

                  <button onclick="load('/api/full')">
                  FULL SCAN
                  </button>

                  <button onclick="load('/api/system')">
                  SYSTEM
                  </button>

                  <button onclick="load('/api/network')">
                  NETWORK
                  </button>

                  <button onclick="load('/api/repo')">
                  REPOSITORY
                  </button>

                  <button onclick="load('/api/blockchain')">
                  BLOCKCHAIN
                  </button>

                  <button onclick="load('/api/ai?m=Bonjour TRILLIONS')">
                  AI
                  </button>

                  <div class="card" id="out">
                  LOADING...
                  </div>

                  <script src="/socket.io/socket.io.js"></script>

                  <script>

                  const out=document.getElementById("out");

                  async function load(url){

                   out.textContent="LOADING "+url;

                    try{

                      const r=await fetch(url);
                        const j=await r.json();

                          out.textContent=
                            JSON.stringify(j,null,2);

                             }catch(e){

                               out.textContent=e.message;

                                }

                                }

                                const socket=io();

                                socket.on("runtime",data=>{

                                 out.textContent=
                                  JSON.stringify(data,null,2);

                                  });

                                  load("/api/full");

                                  </script>

                                  </body>
                                  </html>`);

                                  });

                                  app.get("/api/system",
                                  async(req,res)=>
                                  res.json(await getSystem())
                                  );

                                  app.get("/api/network",
                                  async(req,res)=>
                                  res.json(await getNetwork())
                                  );

                                  app.get("/api/repo",
                                  async(req,res)=>
                                  res.json(await getRepo())
                                  );

                                  app.get("/api/blockchain",
                                  async(req,res)=>
                                  res.json(await getBlockchain())
                                  );

                                  app.get("/api/full",
                                  async(req,res)=>
                                  res.json(await FULL_SCAN())
                                  );

                                  app.get("/api/ai",
                                  async(req,res)=>
                                  res.json(
                                   await getAI(req.query.m)
                                   )
                                   );

                                   io.on("connection",socket=>{

                                    console.log(
                                      "SOCKET CONNECTED =>",
                                        socket.id
                                         );

                                          const LOOP=setInterval(
                                           async()=>{

                                             socket.emit(
                                                "runtime",
                                                   await FULL_SCAN()
                                                     );

                                                      },5000);

                                                       socket.on("disconnect",()=>{

                                                         clearInterval(LOOP);

                                                          });

                                                          });

                                                          server.listen(PORT,"0.0.0.0",()=>{

                                                           console.log("");
                                                            console.log("==================================");
                                                             console.log("Ω TRILLIONS REAL CORE ACTIVE");
                                                              console.log("PORT =>",PORT);
                                                               console.log("REALITY => REAL VALUES ONLY");
                                                                console.log("SOCKET.IO => ACTIVE");
                                                                 console.log("BLOCKCHAIN => ACTIVE");
                                                                  console.log("AI HUB => ACTIVE");
                                                                   console.log("MONITORING => ACTIVE");
                                                                    console.log("==================================");
                                                                     console.log("");

                                                                     });

                                                                     EOF

                                                                     cp app.js app.js.txt

                                                                     cat > package.json <<'EOF'
                                                                     {
                                                                      "name":"trillions-real-core",
                                                                       "version":"1.0.0",
                                                                        "main":"app.js",
                                                                         "scripts":{
                                                                           "start":"node app.js",
                                                                             "dev":"nodemon app.js"
                                                                              },
                                                                               "dependencies":{
                                                                                 "axios":"latest",
                                                                                   "dotenv":"latest",
                                                                                     "express":"latest",
                                                                                       "socket.io":"latest",
                                                                                         "systeminformation":"latest"
                                                                                          },
                                                                                           "devDependencies":{
                                                                                             "nodemon":"latest"
                                                                                              }
                                                                                              }
                                                                                              EOF

                                                                                              cp package.json package.json.txt

                                                                                              mkdir -p \
                                                                                              .vscode \
                                                                                              logs \
                                                                                              runtime \
                                                                                              reports \
                                                                                              public

                                                                                              cat > .vscode/launch.json <<'EOF'
                                                                                              {
                                                                                               "version":"0.2.0",
                                                                                                "configurations":[
                                                                                                  {
                                                                                                     "type":"node",
                                                                                                        "request":"launch",
                                                                                                           "name":"TRILLIONS REAL CORE",
                                                                                                              "program":"${workspaceFolder}/app.js",
                                                                                                                 "console":"integratedTerminal"
                                                                                                                   }
                                                                                                                    ]
                                                                                                                    }
                                                                                                                    EOF

                                                                                                                    npm install --legacy-peer-deps

                                                                                                                    npm install -g pm2 || true

                                                                                                                    pm2 delete TRILLIONS 2>/dev/null || true

                                                                                                                    pm2 start app.js \
                                                                                                                    --name TRILLIONS

                                                                                                                    pm2 save 2>/dev/null || true

                                                                                                                    echo ""
                                                                                                                    echo "=================================="
                                                                                                                    echo "TRILLIONS INSTALLED"
                                                                                                                    echo "app.js OK"
                                                                                                                    echo "package.json OK"
                                                                                                                    echo "launch.json OK"
                                                                                                                    echo "PM2 ACTIVE"
                                                                                                                    echo "PORT => 3000"
                                                                                                                    echo "=================================="
                                                                                                                    echo ""

                                                                                                                    pm2 list