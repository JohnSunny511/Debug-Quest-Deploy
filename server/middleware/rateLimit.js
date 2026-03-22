const buckets = new Map();

function rateLimit({ windowMs, max, keyPrefix, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const identifier =
      req.user?.id ||
      req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket?.remoteAddress ||
      "anonymous";
    const key = `${keyPrefix}:${identifier}`;
    const current = buckets.get(key);

    if (!current || current.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.expiresAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        message: message || "Too many requests. Please try again later.",
      });
    }

    current.count += 1;
    buckets.set(key, current);
    return next();
  };
}

module.exports = { rateLimit };
