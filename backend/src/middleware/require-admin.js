export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, msg: 'Admin access required' });
  }
  next();
}
