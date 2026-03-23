import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth-routes.js';
import binRoutes from './routes/bin-routes.js';
import userRoutes from './routes/user-routes.js';
import { readCache } from './services/cache-service.js';
import { errorHandler } from './middleware/error-handler.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: '5mb' }));

// Public endpoint: read from file cache, no DB hit
app.get('/api/v2', async (req, res) => {
  const { target } = req.query;
  if (!target) return res.status(400).json({ success: false, msg: 'target is required' });
  try {
    const data = await readCache(target);
    res.json(data);
  } catch {
    res.status(404).json({ success: false, msg: `${target} not found` });
  }
});

app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/bins', binRoutes);
app.use('/api/v2/admin/users', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
});
