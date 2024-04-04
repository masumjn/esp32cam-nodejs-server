const express = require("express");
const app = express();
const server = require("http").Server(app);
const url = require("url");
const cors = require("cors");
var proxy = require("html2canvas-proxy");

app.use(
  cors({
    // origin: ['*', 'https://mownylive.online/','http://localhost/OptimizeDetect'],
    origin: '*',
    optionsSuccessStatus: 200,
  })
);

// app.use(
//   cors({
//     origin: "*",
//   })
// );

// app.use(
//   "/",
//   cors({ origin: "https://mownylive.online/", optionsSuccessStatus: 200, }) // some legacy browsers (IE11, various SmartTVs) choke on 204),
//   // function (req, res, next) {}
// );

// app.use(cors());

// Enable CORS for specific routes
// app.use("/jpgstream_server", cors());
// app.use("/jpgstream_client", cors());

// app.use('/', proxy());

const WebSocket = require("ws");

const port = process.env.PORT || 3000;

const express_config = require("./config/express.js");

express_config.init(app);

const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

var cameraArray = {};

//esp32cam websocket
wss1.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    wss2.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

//webbrowser websocket
wss2.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    // nothing here should be received
    console.log("received wss2: %s", message);
  });
});

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === "/jpgstream_server") {
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      wss1.emit("connection", ws, request);
    });
  } else if (pathname === "/jpgstream_client") {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

app.get("/", (req, res) => {
  res.render("index", {});
});

server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
