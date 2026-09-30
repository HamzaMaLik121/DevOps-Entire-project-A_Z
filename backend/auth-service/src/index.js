require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { attachHealth, gracefulShutdown } = require('../../shared/k8s-utils')

const prisma = new PrismaClient()
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('[auth-service] JWT_SECRET is required')
  process.exit(1)
}

app.use(express.json())
attachHealth(app)

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

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

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already in use' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, name }
    })

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token: signToken(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Signup failed' })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    res.json({ user: { id: user.id, email: user.email, name: user.name }, token: signToken(user) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/auth/validate', (req, res) => {
  try {
    const token = req.query.token
    if (!token) return res.status(400).json({ error: 'Token required' })
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ valid: true, user: payload })
  } catch {
    res.json({ valid: false })
  }
})

app.get('/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user })
})

const server = app.listen(PORT, () => {
  console.log(`[auth-service] listening on http://localhost:${PORT}`)
})

gracefulShutdown(server, 'auth-service', () => prisma.$disconnect())
