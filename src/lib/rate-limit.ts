/**
 * In-memory sliding window rate limiter.
 *
 * Works well for single-instance deployments (VPS, containers).
 * For serverless/edge (Vercel), each instance has its own Map — limits apply
 * per-instance but still provide meaningful protection against basic attacks.
 *
 * For production-grade multi-instance rate limiting, replace with:
 * @upstash/ratelimit + @upstash/redis
 *   https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now - entry.windowStart > 60 * 60 * 1000) store.delete(key)
    }
  },
  5 * 60 * 1000
)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
}

/**
 * @param key      Unique identifier (IP address, user id, etc.)
 * @param max      Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: max - 1, resetInSeconds: Math.ceil(windowMs / 1000) }
  }

  entry.count++
  const resetInSeconds = Math.ceil((entry.windowStart + windowMs - now) / 1000)

  if (entry.count > max) {
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  return { allowed: true, remaining: max - entry.count, resetInSeconds }
}

/** Extract real IP from Next.js request headers */
export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
