import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as binService from '../services/bin-service.js';

const router = Router();

// All bin routes require auth
router.use(requireAuth);

// GET /api/v2/bins?group=default
router.get('/', async (req, res) => {
  const bins = await binService.listBins(req.user.id, req.query.group);
  res.json({ success: true, data: bins });
});

// POST /api/v2/bins
router.post('/', async (req, res) => {
  const { name, group = 'default', content = {}, isPublic = true } = req.body;
  if (!name) return res.status(400).json({ success: false, msg: 'name is required' });
  const bin = await binService.createBin(req.user.id, { name, group, content, isPublic });
  res.status(201).json({ success: true, data: bin });
});

// GET /api/v2/bins/:slug
router.get('/:slug', async (req, res) => {
  const bin = await binService.getBin(req.params.slug, req.user.id);
  res.json({ success: true, data: bin });
});

// PUT /api/v2/bins/:slug
router.put('/:slug', async (req, res) => {
  const { name, group, content, isPublic } = req.body;
  const bin = await binService.updateBin(req.params.slug, req.user.id, {
    ...(name !== undefined && { name }),
    ...(group !== undefined && { group }),
    ...(content !== undefined && { content }),
    ...(isPublic !== undefined && { isPublic }),
  });
  res.json({ success: true, data: bin });
});

// DELETE /api/v2/bins/:slug
router.delete('/:slug', async (req, res) => {
  await binService.deleteBin(req.params.slug, req.user.id);
  res.status(204).send();
});

export default router;
