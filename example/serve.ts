import { createServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import { readFileSync } from 'fs'
import { Server } from 'node-static'

const fileServer = new Server('./dist')

const file = readFileSync('.env.local.json', 'utf8')

const { ca, key, cer, hostname = 'localhost', httpsPort = 443, httpPort = 80 } = JSON.parse(file)

const secureServer = createHttpsServer({
  ca: readFileSync(ca),
  key: readFileSync(key),
  cert: readFileSync(cer),
}, (req, res) => {
  fileServer.serve(req, res)
})

secureServer.listen(httpsPort, () => {
  console.log(`Server running on https://${hostname}:${httpsPort}/`)
})

const redirectServer = createServer((req, res) => {
  res.writeHead(301, { Location: `https://${hostname}:${httpsPort}${req.url}` })
  res.end()
})

redirectServer.listen(httpPort, () => {
  console.log(`Redirect server running on http://${hostname}:${httpPort}/`)
})
