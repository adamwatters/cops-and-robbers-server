import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import * as express from 'express'
import * as http from 'http'

class Player {
    id: string
    handle: string
    position: number
    constructor(id, handle, position) {
        this.id = id
        this.handle = handle
        this.position = position
    }
}

const PORT = process.env.PORT || 3000

const app = express()
const httpServer = http.createServer(app)

app.use(express.static('dist'))

const wss = new WebSocketServer({ server: httpServer })
const players: Player[] = []
const positions: number[] = [0, 1, 2, 3, 4, 5]
const connectionIDs: string[] = []

function sendIncludingSelf(sender: WebSocket, message: {}) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message))
        }
    })
}

function sendExcludingSelf(sender: WebSocket, message: {}) {
    wss.clients.forEach(function each(client) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message))
        }
    })
}

wss.on('connection', function connection(ws) {
    let id = uuidv4()
    connectionIDs.push(id)
    ws.send(
        JSON.stringify({
            type: 'handshake',
            id,
        })
    )

    ws.on('close', () => {
        const index = players.indexOf(id)
        if (index > -1) {
            players.splice(index, 1)
            sendExcludingSelf(ws, {
                type: 'playersUpdate',
                players,
            })
        }
    })

    ws.on('message', function message(data) {
        let json = JSON.parse(data as unknown as string)
        console.log(json)
        if (json.type === 'joinGame') {
            if (positions.length > 0) {
                let player = new Player(id, json.handle, positions.shift())
                players.push(player)
                sendIncludingSelf(ws, {
                    type: 'playersUpdate',
                    players,
                })
            } else {
                ws.send(
                    JSON.stringify({
                        type: 'gameIsFull',
                    })
                )
            }
        }
        if (json.type === 'positionUpdate') {
            json.type = 'enemyPosition'
            sendExcludingSelf(ws, json)
        }
        if (json.type === 'directionUpdate') {
            json.type = 'enemyDirection'
            sendExcludingSelf(ws, json)
        }
    })
})

httpServer.listen(PORT, () => console.log(`Listening on ${PORT}`))
