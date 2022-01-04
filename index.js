"use strict";
exports.__esModule = true;
var ws_1 = require("ws");
var uuid_1 = require("uuid");
var express = require("express");
var http = require("http");
var Player = /** @class */ (function () {
    function Player(id, playerName, position) {
        this.id = id;
        this.playerName = playerName;
        this.position = position;
    }
    return Player;
}());
var PORT = process.env.PORT || 3000;
var app = express();
var httpServer = http.createServer(app);
app.use(express.static('dist'));
var wss = new ws_1.WebSocketServer({ server: httpServer });
var players = [];
var positions = [0, 1, 2, 3, 4, 5];
var connectionIDs = [];
function sendIncludingSelf(sender, message) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}
function sendExcludingSelf(sender, message) {
    wss.clients.forEach(function each(client) {
        if (client !== sender && client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}
wss.on('connection', function connection(ws) {
    var id = (0, uuid_1.v4)();
    connectionIDs.push(id);
    ws.send(JSON.stringify({
        type: 'handshake',
        id: id
    }));
    ws.on('close', function () {
        var index = players.indexOf(id);
        if (index > -1) {
            players.splice(index, 1);
            sendExcludingSelf(ws, {
                type: 'playersUpdate',
                players: players
            });
        }
    });
    ws.on('message', function message(data) {
        var json = JSON.parse(data);
        console.log(json);
        if (json.type === 'joinGame') {
            if (positions.length > 0) {
                var player = new Player(id, json.playerName, positions.shift());
                players.push(player);
                sendIncludingSelf(ws, {
                    type: 'playersUpdate',
                    players: players
                });
            }
            else {
                ws.send(JSON.stringify({
                    type: 'gameIsFull'
                }));
            }
        }
        if (json.type === 'positionUpdate') {
            json.type = 'enemyPosition';
            sendExcludingSelf(ws, json);
        }
        if (json.type === 'directionUpdate') {
            json.type = 'enemyDirection';
            sendExcludingSelf(ws, json);
        }
    });
});
httpServer.listen(PORT, function () { return console.log("Listening on ".concat(PORT)); });
