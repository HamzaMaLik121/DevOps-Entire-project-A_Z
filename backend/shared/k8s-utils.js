/**
 * Kubernetes-readiness helpers shared by all services.
 *
 * attachHealth(app):
 *   Adds GET /health → 200 {"status":"ok"}. Kubernetes liveness/readiness
 *   probes hit this endpoint; no auth, no DB call (probes must stay cheap).
 *
 * gracefulShutdown(server, name, cleanup):
 *   On SIGTERM (what k8s sends before killing a pod) stops accepting new
 *   connections, lets in-flight requests finish, runs cleanup (close DB/Redis),
 *   then exits. Makes rolling deploys drop zero requests.
 */

function attachHealth(app) {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })
}

function gracefulShutdown(server, name, cleanup) {
  let shuttingDown = false
  const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[${name}] ${signal} received — draining connections...`)
    server.close(async () => {
      try {
        if (cleanup) await cleanup()
      } catch (err) {
        console.error(`[${name}] cleanup error:`, err.message)
      }
      console.log(`[${name}] shutdown complete`)
      process.exit(0)
    })
    // Failsafe: don't hang the pod past k8s's grace period patience
    setTimeout(() => process.exit(1), 10_000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

module.exports = { attachHealth, gracefulShutdown }
