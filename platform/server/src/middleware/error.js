export const notFound = (req, res, _next) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[err]', err);
  res.status(status).json({
    message: err.message || 'Server error',
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
};
