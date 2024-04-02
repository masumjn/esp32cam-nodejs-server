const express = require("express");
const app = express();
const server = require("http").Server(app);
const url = require("url");
const cors = require("cors");
const WebSocket = require("ws");

// Enable CORS for specific routes
app.use("/jpgstream_server", cors());
app.use("/jpgstream_client", cors());

const port = process.env.PORT || 3000;

// Assuming express_config.init(app) sets up some configurations for your Express app

// Initialize WebSocket servers
const wss1 = new WebSocket.Server({ noServer: true });
const wss2 = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss1.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    wss2.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss2.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("received wss2: %s", message);
  });
});

// Handle WebSocket upgrade requests
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

// Define a route to serve index.html or any other view
app.get("/", (req, res) => {
  res.render("index", {});
});

// Start the server
server.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
