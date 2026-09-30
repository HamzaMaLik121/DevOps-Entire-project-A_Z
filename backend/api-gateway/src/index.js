require('dotenv').config()
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { gracefulShutdown } = require('../../shared/k8s-utils')

const app = express()
const PORT = process.env.PORT || 8000

const services = {
  '/auth': process.env.AUTH_SERVICE_URL,
  '/products': process.env.PRODUCT_SERVICE_URL,
  '/cart': process.env.CART_SERVICE_URL,
  '/orders': process.env.ORDER_SERVICE_URL,
  '/payments': process.env.PAYMENT_SERVICE_URL,
  '/inventory': process.env.INVENTORY_SERVICE_URL
}

// NOTE: no express.json() here — it would consume the request body stream
// before the proxy forwards it, breaking all POST/PUT/PATCH requests.
// Downstream services parse their own JSON bodies.

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' })
})

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  next()
})

app.options('*', (_req, res) => res.sendStatus(204))

// Proxy each route prefix to the matching service.
for (const [prefix, target] of Object.entries(services)) {
  if (!target) {
    console.warn(`[api-gateway] No target URL configured for ${prefix}`)
    continue
  }
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      // Express strips the mount prefix (prefix) from req.url before this
      // middleware sees it, so restore it when forwarding downstream.
      pathRewrite: (path) => `${prefix}${path}`,
      onProxyReq: (proxyReq, req) => {
        const auth = req.headers.authorization
        if (auth) {
          proxyReq.setHeader('authorization', auth)
        }
      },
      logLevel: process.env.LOG_LEVEL || 'warn'
    })
  )
  console.log(`[api-gateway] ${prefix} -> ${target}`)
}

const server = app.listen(PORT, () => {
  console.log(`[api-gateway] listening on http://localhost:${PORT}`)
})

gracefulShutdown(server, 'api-gateway')
