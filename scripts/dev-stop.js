#!/usr/bin/env node
/**
 * Stops the host-mode stack started by dev-start.js.
 * For the containerized stack use `docker compose down` instead.
 */
const { execSync } = require('child_process')

const SCRIPTS = ['next dev', 'next-server']

console.log('Stopping AnimeThreads local stack...')

for (const pattern of SCRIPTS) {
  try {
    execSync(`pkill -f "${pattern}"`, { stdio: 'ignore' })
    console.log(`  [killed] ${pattern}`)
  } catch {
    console.log(`  [none]   ${pattern}`)
  }
}

try {
  const out = execSync('ps -axo pid,command', { encoding: 'utf8' })
  const lines = out.split('\n').filter((l) => /node src\/index\.js/.test(l) && !/grep|dev-stop/.test(l))
  for (const line of lines) {
    const pid = parseInt(line.trim().split(/\s+/)[0], 10)
    if (pid) {
      try { process.kill(pid, 'SIGTERM'); console.log(`  [killed] node src/index.js (pid ${pid})`) } catch {}
    }
  }
} catch {}

console.log('Done.')
