import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import Setting from '../models/setting.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/v2/auth/register
router.post('/register', async (req, res) => {
  const allowSetting = await Setting.findOne({ key: 'allowRegistration' });
  if (!allowSetting?.value) {
    return res.status(403).json({ success: false, msg: 'Registration is currently disabled' });
  }

  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, msg: 'email, name, password required' });
  }
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, msg: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, name, provider: 'local', passwordHash });
  res.status(201).json({ success: true, token: signToken(user), user });
});

// POST /api/v2/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, msg: 'email and password required' });
  }
  const user = await User.findOne({ email });
  if (!user || user.provider !== 'local') {
    return res.status(401).json({ success: false, msg: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ success: false, msg: 'Invalid credentials' });

  res.json({ success: true, token: signToken(user), user });
});

// GET /api/v2/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, msg: 'User not found' });
  res.json({ success: true, user });
});

export default router;
