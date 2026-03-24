import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import Setting from '../models/setting.js';

const router = Router();

// GET /api/v2/settings/public -- no auth, safe fields only
router.get('/public', async (req, res) => {
  const settings = await Setting.find({ key: { $in: ['allowRegistration', 'logoUrl', 'siteName'] } });
  const result = {};
  for (const s of settings) result[s.key] = s.value;
  // Provide defaults if not yet seeded
  result.allowRegistration ??= false;
  result.logoUrl ??= '';
  result.siteName ??= 'JSON Manager';
  res.json({ success: true, data: result });
});

// Admin routes — require auth + admin
router.use(requireAuth, requireAdmin);

// GET /api/v2/settings -- all settings
router.get('/', async (req, res) => {
  const settings = await Setting.find().sort({ key: 1 });
  res.json({ success: true, data: settings });
});

// PATCH /api/v2/settings/:key -- upsert a setting value
router.patch('/:key', async (req, res) => {
  const { value } = req.body;
  if (value === undefined) {
    return res.status(400).json({ success: false, msg: 'value is required' });
  }
  const setting = await Setting.findOneAndUpdate(
    { key: req.params.key },
    { value },
    { new: true, upsert: true }
  );
  res.json({ success: true, data: setting });
});

export default router;
