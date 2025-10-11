import rateLimit from 'express-rate-limit';

const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Custom rate limit key generator
const customKeyGenerator = (req) => {
  const ip = getClientIp(req);
  const userAgent = req.get('user-agent') || 'unknown-agent';
  return `${ip}-${userAgent}`;
};



// Custom handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  // Get reset time from headers or calculate
  const resetTimeHeader = res.getHeader('X-RateLimit-Reset');
  let resetTime = Date.now() + 15 * 60 * 1000; // Default 15 minutes
  
  if (resetTimeHeader) {
    resetTime = parseInt(resetTimeHeader) * 1000;
  }

  res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    limit: parseInt(res.getHeader('X-RateLimit-Limit')) || 100,
    current: parseInt(res.getHeader('X-RateLimit-Current')) || 0,
    remaining: parseInt(res.getHeader('X-RateLimit-Remaining')) || 0
  });
};

// Custom skip function for certain conditions
const skipSuccessfulRequests = (req, res) => {
  // Skip rate limiting for successful health checks
  if (req.path === '/api/health' && res.statusCode < 400) {
    return true;
  }
  return false;
};

// Store to track rate limit information
class RateLimitStore {
  constructor() {
    this.store = new Map();
  }

  increment(key, windowMs) {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const resetTime = windowStart + windowMs;

    const entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      // New or expired window
      const newEntry = { count: 1, resetTime };
      this.store.set(key, newEntry);
      return {
        limit: 100, // will be overridden by limiter
        current: 1,
        remaining: 99,
        resetTime: new Date(resetTime),
      };
    }

    // Existing window
    entry.count++;
    this.store.set(key, entry);

    return {
      limit: 100,
      current: entry.count,
      remaining: Math.max(0, 100 - entry.count),
      resetTime: new Date(entry.resetTime),
    };
  }
}

export const rateLimitStore = new RateLimitStore();

// General API rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
  skip: skipSuccessfulRequests,
  skipFailedRequests: false,
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
  skipFailedRequests: false,
});

// Strict rate limiter for registration
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again after 1 hour.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
});

// Rate limiter for clinical notes creation
export const clinicalNotesRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit to 10 clinical notes per minute
  message: {
    success: false,
    error: 'Too many clinical notes created. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
});

// Rate limiter for lab reports
export const labReportsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // Limit to 15 lab reports per minute
  message: {
    success: false,
    error: 'Too many lab reports created. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
});

// Rate limiter for analytics endpoints
export const analyticsRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit to 30 analytics requests per minute
  message: {
    success: false,
    error: 'Too many analytics requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
});

// Development mode rate limiter (more lenient)
export const developmentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit for development
  message: {
    success: false,
    error: 'Development rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: customKeyGenerator,
  handler: rateLimitHandler,
});

// Dynamic rate limiter based on environment
export const dynamicRateLimiter = () => {
  if (process.env.NODE_ENV === 'development') {
    return developmentRateLimiter;
  }
  return generalRateLimiter;
};

// Rate limit by user ID for authenticated users
export const userBasedRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on user role
    const user = req.user;
    if (!user) return 100; // Default for unauthenticated
    
    switch (user.role) {
      case 'admin':
        return 500;
      case 'clinician':
        return 200;
      case 'microbiologist':
        return 300;
      case 'lab_staff':
        return 150;
      default:
        return 100;
    }
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use ipKeyGenerator
    const user = req.user;
    return user ? `user-${user.userId}` : rateLimit.ipKeyGenerator(req);
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Export the main rate limiter (default export)
export const rateLimiter = dynamicRateLimiter();