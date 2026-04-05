// Global error handling middleware
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `Duplicate value for ${field}` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Joi validation (fallback)
  if (err.isJoi) {
    return res.status(400).json({ success: false, message: err.details?.map(d => d.message).join(', ') || err.message });
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  
  res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
