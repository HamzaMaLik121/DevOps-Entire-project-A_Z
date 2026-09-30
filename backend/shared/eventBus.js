/**
 * Simple event-bus abstraction used by the backend services.
 *
 * Uses Redis pub/sub when REDIS_URL (or EVENT_BUS_URL) is supplied,
 * otherwise falls back to an in-memory dispatcher for local single-process demos.
 */
require('dotenv').config()

const handlers = new Map() // eventType -> Array<handler>
let redisPub = null
let redisSub = null
let redisMode = false

function dispatch(eventType, payload) {
  const list = handlers.get(eventType) || []
  for (const handler of list) {
    try {
      handler(payload)
    } catch (err) {
      console.error(`[eventBus] handler error for ${eventType}:`, err.message)
    }
  }
}

function fallbackToMemory(reason) {
  if (!redisMode) return
  redisMode = false
  console.warn(`[eventBus] Redis unavailable (${reason}), falling back to in-memory mode`)
  if (redisPub) { try { redisPub.disconnect() } catch {} redisPub = null }
  if (redisSub) { try { redisSub.disconnect() } catch {} redisSub = null }
}

function connectRedis(url) {
  try {
    const Redis = require('ioredis')
    redisPub = new Redis(url, { retryStrategy: () => null, maxRetriesPerRequest: 1 })
    redisSub = new Redis(url, { retryStrategy: () => null, maxRetriesPerRequest: 1 })

    redisPub.on('error', (err) => fallbackToMemory(err.message))
    redisSub.on('error', (err) => fallbackToMemory(err.message))

    redisSub.on('message', (channel, message) => {
      const eventType = channel.replace(/^events:/, '')
      try {
        dispatch(eventType, JSON.parse(message))
      } catch {}
    })

    redisMode = true
    console.log('[eventBus] Redis pub/sub connected')
  } catch (err) {
    fallbackToMemory(err.message)
  }
}

const busUrl = process.env.EVENT_BUS_URL || process.env.REDIS_URL
if (busUrl && busUrl.startsWith('redis')) {
  connectRedis(busUrl)
}

function subscribe(eventType, handler) {
  if (!handlers.has(eventType)) {
    handlers.set(eventType, [])
    if (redisMode && redisSub) {
      redisSub.subscribe(`events:${eventType}`).catch(() => {})
    }
  }
  handlers.get(eventType).push(handler)
}

function publish(eventType, payload) {
  if (redisMode && redisPub) {
    redisPub.publish(`events:${eventType}`, JSON.stringify(payload)).catch(() => {})
  }
  dispatch(eventType, payload)
}

module.exports = { subscribe, publish }
