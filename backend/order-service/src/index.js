require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { publish } = require('../../shared/eventBus')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3004
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('[order-service] JWT_SECRET is required')
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

app.post('/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' })
    }

    const computedTotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)
    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total: total != null ? parseFloat(total) : computedTotal,
        items: {
          create: items.map((i) => ({
            productId: parseInt(i.productId),
            name: i.name,
            price: parseFloat(i.price),
            quantity: parseInt(i.quantity) || 1
          }))
        }
      },
      include: { items: true }
    })

    publish('OrderPlaced', {
      orderId: order.id,
      userId: order.userId,
      items: order.items
    })

    res.status(201).json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

app.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list orders' })
  }
})

app.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: true }
    })
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get order' })
  }
})

const server = app.listen(PORT, () => {
  console.log(`[order-service] listening on http://localhost:${PORT}`)
})

gracefulShutdown(server, 'order-service', () => prisma.$disconnect())
