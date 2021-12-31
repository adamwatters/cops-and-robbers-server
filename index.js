import  { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import express from "express"
import http from "http"

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const app = express()
const httpServer = http.createServer(app)

app.use((req, res) => res.sendFile(INDEX, { root: process.cwd() }))

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', function connection(ws) {
  console.log("someone connected")
  let id = uuidv4();
  ws.send(JSON.stringify({type: "handshake", id}));
  console.log("someone connected")

  ws.on('message', function message(data) {
    let json = JSON.parse(data)
    console.log(json)
    if(json.type === "positionUpdate") {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          json.type = "enemyPosition"
          console.log(JSON.stringify(json))
          client.send(JSON.stringify(json));
        }
      });
    }
    if(json.type === "directionUpdate") {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          json.type = "enemyDirection"
          console.log(JSON.stringify(json))
          client.send(JSON.stringify(json));
        }
      });
    }
  });

});

httpServer.listen(PORT, () => console.log(`Listening on ${PORT}`));