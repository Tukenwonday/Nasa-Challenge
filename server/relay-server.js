import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

const PORT = process.env.PORT || 8080

// HTTP health-check responder
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(
    JSON.stringify({
      status: 'operational',
      service: 'NASA Relics Companion Direct Relay',
      connectedClients: wss ? wss.clients.size : 0,
      timestamp: new Date().toISOString(),
    }),
  )
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  console.log(`[Relay] New connection from ${ip}. Total connected: ${wss.clients.size}`)

  ws.isAlive = true
  ws.on('pong', () => {
    ws.isAlive = true
  })

  // Direct peer-to-peer broadcast
  ws.on('message', (data, isBinary) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary })
      }
    })
  })

  ws.on('error', (err) => {
    console.error(`[Relay] Socket error from ${ip}:`, err.message)
  })

  ws.on('close', () => {
    console.log(`[Relay] Client disconnected (${ip}). Total connected: ${wss.clients.size}`)
  })
})

// Keep-alive heartbeat sweep every 30 seconds
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('[Relay] Terminating inactive stale socket connection')
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, 30000)

wss.on('close', () => {
  clearInterval(heartbeat)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`)
  console.log(`  NASA Space Relics Direct Relay Server`)
  console.log(`  Listening on port: ${PORT}`)
  console.log(`  WebSocket Endpoint: ws://0.0.0.0:${PORT}/relay`)
  console.log(`=======================================================`)
})

