require('dotenv').config()
const express = require('express')
const { PrismaClient } = require('@prisma/client')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3002

app.use(express.json())
attachHealth(app)

const categories = ['T-Shirts', 'Hoodies', 'Jackets', 'Accessories']

function placeholder(name, category) {
  const colors = {
    'T-Shirts': '0f172a/a855f7',
    Hoodies: '1e1b4b/f43f5e',
    Jackets: '312e81/06b6d4',
    Accessories: '0f172a/facc15'
  }
  const text = encodeURIComponent(name)
  return `https://placehold.co/600x600/${colors[category] || '111111/ffffff'}?text=${text}`
}

const seedProducts = [
  { name: 'Six Eyes Tee', description: 'A sleek tee inspired by mystic sight and cursed energy.', price: 34.99, category: 'T-Shirts', sku: 'AT-TS-001' },
  { name: 'Saiyan Rage Hoodie', description: 'Power-level maxed pullover for training arcs and chill days.', price: 64.99, category: 'Hoodies', sku: 'AT-HD-001' },
  { name: 'Ronin Series Jacket', description: 'Wanderer-style bomber with embroidered kanji details.', price: 119.99, category: 'Jackets', sku: 'AT-JK-001' },
  { name: 'Shadow Monarch Tee', description: 'Dark fantasy graphic tee for those who command the shadows.', price: 32.99, category: 'T-Shirts', sku: 'AT-TS-002' },
  { name: 'Ninja Way Hoodie', description: 'Never-go-back-on-your-word statement hoodie.', price: 59.99, category: 'Hoodies', sku: 'AT-HD-002' },
  { name: 'Curse Mark Longsleeve', description: 'Longsleeve shirt with jagged seal-inspired graphics.', price: 42.99, category: 'T-Shirts', sku: 'AT-TS-003' },
  { name: 'Titan Slayer Tee', description: 'Oversized tee built for freedom-fighting vibes.', price: 29.99, category: 'T-Shirts', sku: 'AT-TS-004' },
  { name: 'Spirit Detective Hoodie', description: 'Street-ready hoodie for afterlife investigators.', price: 62.99, category: 'Hoodies', sku: 'AT-HD-003' },
  { name: 'Hollow Mask Tee', description: 'Minimalist mask silhouette on heavyweight cotton.', price: 31.99, category: 'T-Shirts', sku: 'AT-TS-005' },
  { name: 'Alchemist Crewneck', description: 'Equivalent-exchange themed crewneck sweatshirt.', price: 54.99, category: 'Hoodies', sku: 'AT-HD-004' },
  { name: 'Demon Hunter Jacket', description: 'Tactical jacket with Nichirin-color lining accents.', price: 129.99, category: 'Jackets', sku: 'AT-JK-002' },
  { name: 'Hero Agency Tee', description: 'Plus Ultra energy tee for aspiring heroes.', price: 27.99, category: 'T-Shirts', sku: 'AT-TS-006' },
  { name: 'Pirate King Tank', description: 'Sleeveless tank for treasure-hunting summers.', price: 24.99, category: 'T-Shirts', sku: 'AT-TS-007' },
  { name: 'Zombie Idol Hoodie', description: 'Pastel-horror idol hoodie from the undead stage.', price: 57.99, category: 'Hoodies', sku: 'AT-HD-005' },
  { name: 'Mecha Pilot Bomber', description: 'Flight jacket with embroidered mecha squadron patch.', price: 139.99, category: 'Jackets', sku: 'AT-JK-003' },
  { name: 'Guild Master Tee', description: 'Fantasy guild emblem tee in vintage wash.', price: 30.99, category: 'T-Shirts', sku: 'AT-TS-008' },
  { name: 'Chakra Seal Snapback', description: 'Structured cap with geometric seal embroidery.', price: 28.99, category: 'Accessories', sku: 'AT-AC-001' },
  { name: 'Soul Reaper Hoodie', description: 'Black shihakusho-inspired hoodie with white trim.', price: 69.99, category: 'Hoodies', sku: 'AT-HD-006' },
  { name: 'Jujutsu Academy Tee', description: 'Tokyo technical school uniform-style tee.', price: 33.99, category: 'T-Shirts', sku: 'AT-TS-009' },
  { name: 'Phantom Troupe Jacket', description: 'Spider-themed varsity jacket with numbered detail.', price: 124.99, category: 'Jackets', sku: 'AT-JK-004' },
  { name: 'Straw Crew Tee', description: 'Nakama spirit tee for loyal crews.', price: 26.99, category: 'T-Shirts', sku: 'AT-TS-010' },
  { name: 'Quirk User Hoodie', description: 'Hero/villain reversible hoodie for any alignment.', price: 66.99, category: 'Hoodies', sku: 'AT-HD-007' },
  { name: 'Stand User Tee', description: 'Arrow motif tee for those with fighting spirits.', price: 35.99, category: 'T-Shirts', sku: 'AT-TS-011' },
  { name: 'Magic Knight Sweatpants', description: 'Relaxed joggers with squad insignia prints.', price: 48.99, category: 'Accessories', sku: 'AT-AC-002' },
  { name: 'Guild Emblem Beanie', description: 'Ribbed beanie with woven guild crest patch.', price: 22.99, category: 'Accessories', sku: 'AT-AC-003' },
  { name: 'Ronin X Hoodie', description: 'Masterless samurai oversized hoodie with back print.', price: 71.99, category: 'Hoodies', sku: 'AT-HD-008' },
  { name: 'Dragon Slayer Scale Jacket', description: 'Scaled-texture moto jacket for fantasy warriors.', price: 149.99, category: 'Jackets', sku: 'AT-JK-005' }
]

async function seed() {
  const count = await prisma.product.count()
  if (count > 0) return
  const data = seedProducts.map((p) => ({
    ...p,
    imageUrl: placeholder(p.name, p.category)
  }))
  await prisma.product.createMany({ data })
  console.log(`[product-service] seeded ${data.length} products`)
}

app.get('/products/categories', (_req, res) => {
  res.json(categories)
})

app.get('/products', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 24))
    const { category, search } = req.query

    const where = {}
    if (category && categories.includes(category)) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to list products' })
  }
})

app.get('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return res.status(404).json({ error: 'Not found' })
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get product' })
  }
})

app.post('/products', async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, sku } = req.body
    if (!name || !description || price == null || !category || !sku) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const product = await prisma.product.create({
      data: { name, description, price: parseFloat(price), category, imageUrl: imageUrl || placeholder(name, category), sku }
    })
    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create product' })
  }
})

app.patch('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    const data = { ...req.body }
    if (data.price) data.price = parseFloat(data.price)
    const product = await prisma.product.update({ where: { id }, data })
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

app.delete('/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' })
    await prisma.product.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

seed().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`[product-service] listening on http://localhost:${PORT}`)
  })
  gracefulShutdown(server, 'product-service', () => prisma.$disconnect())
})
