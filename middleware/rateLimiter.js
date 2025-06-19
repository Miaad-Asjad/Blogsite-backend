
import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimiter;
