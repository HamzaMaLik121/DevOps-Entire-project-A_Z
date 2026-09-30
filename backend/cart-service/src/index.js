require('dotenv').config()
const express = require('express')
const jwt = require('jsonwebtoken')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const app = express()
const PORT = process.env.PORT || 3003
const JWT_SECRET = process.env.JWT_SECRET
const REDIS_URL = process.env.REDIS_URL

if (!JWT_SECRET) {
  console.error('[cart-service] JWT_SECRET is required')
  process.exit(1)
}

app.use(express.json())
attachHealth(app)

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.id
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

class CartStore {
  constructor() {
    this.redis = null
    this.memory = new Map()
  }

  async connect() {
    if (!REDIS_URL) return this.fallback('REDIS_URL not set')
    try {
      const Redis = require('ioredis')
      const client = new Redis(REDIS_URL, { retryStrategy: () => null, maxRetriesPerRequest: 1 })
      client.on('error', (err) => {
        console.error('[cart-service] Redis error:', err.message)
        if (!this.fallbackMode) this.fallback(err.message)
      })
      await client.ping()
      this.redis = client
      console.log('[cart-service] Redis connected')
    } catch (err) {
      this.fallback(err.message)
    }
  }

  fallback(reason) {
    this.fallbackMode = true
    console.warn(`[cart-service] Falling back to in-memory store (${reason})`)
  }

  async disconnect() {
    if (this.redis) {
      try { await this.redis.quit() } catch {}
      this.redis = null
    }
  }

  key(userId) {
    return `cart:${userId}`
  }

  async get(userId) {
    if (this.redis) {
      const raw = await this.redis.get(this.key(userId))
      return raw ? JSON.parse(raw) : []
    }
    return this.memory.get(userId) || []
  }

  async set(userId, items) {
    if (this.redis) {
      await this.redis.set(this.key(userId), JSON.stringify(items))
    } else {
      this.memory.set(userId, items)
    }
  }
}

const store = new CartStore()

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})
app.options('*', (_req, res) => res.sendStatus(204))

app.get('/cart', authMiddleware, async (req, res) => {
  try {
    const items = await store.get(req.userId)
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to read cart' })
  }
})

app.post('/cart/items', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1, name, price, imageUrl } = req.body
    if (!productId || !name || price == null) {
      return res.status(400).json({ error: 'Missing item fields' })
    }
    const items = await store.get(req.userId)
    const existing = items.find((i) => i.productId === productId)
    if (existing) {
      existing.quantity += parseInt(quantity) || 1
    } else {
      items.push({
        productId,
        name,
        price: parseFloat(price),
        imageUrl: imageUrl || '',
        quantity: parseInt(quantity) || 1
      })
    }
    await store.set(req.userId, items)
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add item' })
  }
})

app.put('/cart/items/:productId', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId)
    const quantity = parseInt(req.body.quantity)
    if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Invalid quantity' })
    }
    const items = await store.get(req.userId)
    const item = items.find((i) => i.productId === productId)
    if (!item) return res.status(404).json({ error: 'Item not in cart' })
    item.quantity = quantity
    await store.set(req.userId, items)
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

app.delete('/cart/items/:productId', authMiddleware, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId)
    if (isNaN(productId)) return res.status(400).json({ error: 'Invalid id' })
    const items = (await store.get(req.userId)).filter((i) => i.productId !== productId)
    await store.set(req.userId, items)
    res.json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to remove item' })
  }
})

app.delete('/cart', authMiddleware, async (req, res) => {
  try {
    await store.set(req.userId, [])
    res.json({ items: [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to clear cart' })
  }
})

store.connect().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[cart-service] listening on http://localhost:${PORT}`)
  })
  gracefulShutdown(server, 'cart-service', () => store.disconnect())
})
