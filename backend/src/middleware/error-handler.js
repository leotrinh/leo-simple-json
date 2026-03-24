export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ success: false, msg: err.message || 'Internal server error' });
}
