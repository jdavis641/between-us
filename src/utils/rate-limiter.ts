/**
 * In-memory sliding-window rate limiter for serverless API endpoints.
 * Protects authentication and verification endpoints against brute-force attacks.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

export function checkRateLimit({
  key,
  maxAttempts = 5,
  windowMs = 300000 // 5 minutes default
}: {
  key: string;
  maxAttempts?: number;
  windowMs?: number;
}): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { 
      allowed: true, 
      remaining: maxAttempts - 1, 
      retryAfterSec: Math.ceil(windowMs / 1000) 
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  record.count += 1;
  const remaining = Math.max(0, maxAttempts - record.count);
  const retryAfterSec = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  return { allowed: true, remaining, retryAfterSec };
}

export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}
