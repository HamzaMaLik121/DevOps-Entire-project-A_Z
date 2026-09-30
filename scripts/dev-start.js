#!/usr/bin/env node
/**
 * Starts the full AnimeThreads local stack detached from this shell:
 *   - 8 backend microservices (ports 3001-3007)
 *   - API gateway (port 8000)
 *   - Next.js web app (port 3000)
 *
 * Requires: docker compose up -d   (Postgres + Redis)
 * Logs:     /tmp/animethreads/<service>.log
 * Stop:     node scripts/dev-stop.js
 */
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')

const ROOT = path.resolve(__dirname, '..')
const LOG_DIR = '/tmp/animethreads'
require('fs').mkdirSync(LOG_DIR, { recursive: true })

const SERVICES = [
  { name: 'auth', dir: 'backend/auth-service', port: 3001 },
  { name: 'product', dir: 'backend/product-service', port: 3002 },
  { name: 'cart', dir: 'backend/cart-service', port: 3003 },
  { name: 'order', dir: 'backend/order-service', port: 3004 },
  { name: 'payment', dir: 'backend/payment-service', port: 3005 },
  { name: 'inventory', dir: 'backend/inventory-service', port: 3006 },
  { name: 'notification', dir: 'backend/notification-service', port: 3007 },
  { name: 'gateway', dir: 'backend/api-gateway', port: 8000 },
  { name: 'web', dir: 'frontend', port: 3000, cmd: ['npm', ['run', 'dev']] },
]

function wait(ms) { return new Promise((r) => setTimeout(r, ms)) }

function isUp(port) {
  return new Promise((resolve) => {
    const s = net.connect({ port, host: 'localhost' })
    s.on('connect', () => { s.destroy(); resolve(true) })
    s.on('error', () => resolve(false))
  })
}

function startDetached(cmd, args, cwd, logFile) {
  const out = require('fs').openSync(logFile, 'a')
  const child = spawn(cmd, args, {
    cwd,
    detached: true,
    stdio: ['ignore', out, out],
  })
  child.unref()
  return child.pid
}

async function main() {
  console.log('Starting AnimeThreads local stack...\n')

  for (const svc of SERVICES) {
    if (await isUp(svc.port)) {
      console.log(`  [skip] ${svc.name} already running on :${svc.port}`)
      continue
    }
    const [cmd, args = []] = svc.cmd || ['node', ['src/index.js']]
    const logFile = `${LOG_DIR}/${svc.name}.log`
    startDetached(cmd, args, path.join(ROOT, svc.dir), logFile)
    console.log(`  [start] ${svc.name} -> :${svc.port} (log: ${logFile})`)
  }

  console.log('\nWaiting for services to come up...')
  const results = []
  for (const svc of SERVICES) {
    let up = false
    for (let i = 0; i < 30; i++) {
      if (await isUp(svc.port)) { up = true; break }
      await wait(1000)
    }
    results.push({ ...svc, up })
    console.log(`  ${up ? 'OK ' : 'FAIL'} ${svc.name.padEnd(12)} :${svc.port}`)
  }

  const failed = results.filter((r) => !r.up)
  if (failed.length) {
    console.log(`\nSome services failed: ${failed.map((f) => f.name).join(', ')}`)
    console.log(`Check logs in ${LOG_DIR}/`)
    process.exitCode = 1
  } else {
    console.log('\nAll services running. Web app: http://localhost:3000')
    console.log('API gateway: http://localhost:8000')
  }
}

main()
