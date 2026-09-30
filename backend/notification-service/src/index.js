require('dotenv').config()
const express = require('express')
const { subscribe } = require('../../shared/eventBus')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const app = express()
const PORT = process.env.PORT || 3007

app.use(express.json())
attachHealth(app)

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

app.get('/notifications/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service' })
})

subscribe('OrderPlaced', (event) => {
  console.log(`[notification-service] 📧 Email sent: Order #${event.orderId} confirmed for user ${event.userId}`)
})

subscribe('PaymentProcessed', (event) => {
  const statusText = event.status === 'succeeded' ? 'successful' : 'failed'
  console.log(`[notification-service] 💳 Payment ${statusText}: Order #${event.orderId} (payment ${event.paymentId})`)
})

const server = app.listen(PORT, () => {
  console.log(`[notification-service] listening on http://localhost:${PORT}`)
})

gracefulShutdown(server, 'notification-service')
