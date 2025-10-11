
export const rateLimitMonitor = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to capture rate limit info from headers
  res.json = function(body) {
    // Extract rate limit info from headers if they exist
    const limitHeader = res.getHeader('RateLimit-Limit');
    const remainingHeader = res.getHeader('RateLimit-Remaining');
    const resetHeader = res.getHeader('RateLimit-Reset');

    if (limitHeader && remainingHeader && resetHeader) {
      // Create rateLimit object on request
      req.rateLimit = {
        limit: parseInt(limitHeader),
        current: parseInt(limitHeader) - parseInt(remainingHeader),
        remaining: parseInt(remainingHeader),
        resetTime: new Date(parseInt(resetHeader) * 1000)
      };

      // Add rate limit info to response body if it's an object
      if (body && typeof body === 'object' && !body.rateLimit) {
        body.rateLimit = req.rateLimit;
      }
    }

    return originalJson.call(this, body);
  };

  // Log rate limit information for monitoring
  if (process.env.NODE_ENV === 'development') {
    const logRateLimitInfo = () => {
      if (req.rateLimit) {
        console.log('Rate Limit Info:', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          limit: req.rateLimit.limit,
          current: req.rateLimit.current,
          remaining: req.rateLimit.remaining,
          resetTime: req.rateLimit.resetTime
        });
      }
    };

    // Log after response is sent
    res.on('finish', logRateLimitInfo);
  }

  next();
};