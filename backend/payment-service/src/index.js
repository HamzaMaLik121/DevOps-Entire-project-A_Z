require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { publish } = require('../../shared/eventBus')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3005
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('[payment-service] JWT_SECRET is required')
  process.exit(1)
}

app.use(express.json())
attachHealth(app)

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

app.post('/payments/process', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentMethod, forceFailure } = req.body
    if (!orderId || !paymentMethod) {
      return res.status(400).json({ error: 'orderId and paymentMethod are required' })
    }

    const amount = parseFloat(req.body.amount) || 0
    const status = forceFailure ? 'failed' : 'succeeded'

    const payment = await prisma.payment.create({
      data: {
        orderId: parseInt(orderId),
        userId: req.user.id,
        amount,
        status,
        method: paymentMethod
      }
    })

    publish('PaymentProcessed', {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      status: payment.status,
      amount: payment.amount
    })

    res.json({ payment })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to process payment' })
  }
})

app.get('/payments/order/:orderId', authMiddleware, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId)
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid orderId' })
    const payment = await prisma.payment.findUnique({ where: { orderId } })
    if (!payment) return res.status(404).json({ error: 'Not found' })
    res.json(payment)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch payment' })
  }
})

const server = app.listen(PORT, () => {
  console.log(`[payment-service] listening on http://localhost:${PORT}`)
})

gracefulShutdown(server, 'payment-service', () => prisma.$disconnect())
