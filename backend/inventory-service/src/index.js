require('dotenv').config()
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { subscribe } = require('../../shared/eventBus')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3006

app.use(express.json())
attachHealth(app)

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

async function seedDefaultStock() {
  const count = await prisma.inventory.count()
  if (count > 0) return
  const data = []
  for (let id = 1; id <= 30; id++) {
    data.push({ productId: id, quantity: 100 })
  }
  await prisma.inventory.createMany({ data })
  console.log(`[inventory-service] seeded default stock for ${data.length} products`)
}

app.get('/inventory/:productId', async (req, res) => {
  try {
    const productId = parseInt(req.params.productId)
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' })
    let record = await prisma.inventory.findUnique({ where: { productId } })
    if (!record) {
      record = await prisma.inventory.create({ data: { productId, quantity: 100 } })
    }
    res.json(record)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read inventory' })
  }
})

app.post('/inventory', async (req, res) => {
  try {
    const { productId, quantity } = req.body
    if (productId == null || quantity == null) {
      return res.status(400).json({ error: 'productId and quantity required' })
    }
    const record = await prisma.inventory.upsert({
      where: { productId: parseInt(productId) },
      update: { quantity: parseInt(quantity) },
      create: { productId: parseInt(productId), quantity: parseInt(quantity) }
    })
    res.json(record)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update inventory' })
  }
})

subscribe('OrderPlaced', async (event) => {
  console.log('[inventory-service] OrderPlaced received:', event.orderId)
  for (const item of event.items || []) {
    try {
      const record = await prisma.inventory.findUnique({ where: { productId: item.productId } })
      if (!record) {
        console.warn(`[inventory-service] No stock record for product ${item.productId}`)
        continue
      }
      if (record.quantity < item.quantity) {
        console.warn(`[inventory-service] Insufficient stock for product ${item.productId}`)
        continue
      }
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { decrement: item.quantity } }
      })
      console.log(`[inventory-service] Decremented product ${item.productId} by ${item.quantity}`)
    } catch (err) {
      console.error(`[inventory-service] Error updating inventory for product ${item.productId}:`, err.message)
    }
  }
})

seedDefaultStock().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[inventory-service] listening on http://localhost:${PORT}`)
  })
  gracefulShutdown(server, 'inventory-service', () => prisma.$disconnect())
})
