import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import User from '../models/user.js';
import JsonBin from '../models/json-bin.js';
import { deleteCache } from '../services/cache-service.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/v2/admin/users
router.get('/', async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

// PATCH /api/v2/admin/users/:id/role
router.patch('/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, msg: 'role must be admin or user' });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });
  res.json({ success: true, data: user });
});

// DELETE /api/v2/admin/users/:id
router.delete('/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });

  // Delete all user's bins + their cache files
  const bins = await JsonBin.find({ userId: req.params.id });
  await Promise.all(bins.map((b) => deleteCache(b.slug)));
  await JsonBin.deleteMany({ userId: req.params.id });

  res.status(204).send();
});

export default router;
