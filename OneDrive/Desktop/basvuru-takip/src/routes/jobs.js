const express = require('express');
const { z } = require('zod');
const { Job } = require('../models/Job');
const { authRequired, requireRole } = require('../middleware/auth');

const jobsRouter = express.Router();

const PRIORITIES = ['Düşük', 'Orta', 'Yüksek'];

const createSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  summary: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  priority: z.string().optional(),
  isActive: z.boolean().optional()
});

const updateSchema = createSchema.partial();

jobsRouter.get('/', authRequired, async (req, res) => {
  const onlyActive = req.user?.role === 'user';
  const query = onlyActive ? { isActive: true } : {};
  const items = await Job.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

jobsRouter.get('/:id', authRequired, async (req, res) => {
  const { id } = req.params;
  const job = await Job.findById(id).lean();
  if (!job) return res.status(404).json({ error: 'NOT_FOUND' });
  if (req.user?.role === 'user' && job.isActive === false) {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }
  return res.json({ item: job });
});

jobsRouter.post('/', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'BAD_REQUEST' });
  const payload = parsed.data;
  const normalizedPriority = PRIORITIES.includes(String(payload.priority || '')) ? payload.priority : 'Düşük';
  const doc = {
    company: payload.company.trim(),
    role: payload.role.trim(),
    summary: String(payload.summary || '').trim(),
    location: String(payload.location || 'Bilinmiyor').trim() || 'Bilinmiyor',
    jobType: String(payload.jobType || 'Belirtilmedi').trim() || 'Belirtilmedi',
    priority: normalizedPriority || 'Düşük',
    isActive: typeof payload.isActive === 'boolean' ? payload.isActive : true
  };
  try {
    const created = await Job.create(doc);
    return res.status(201).json({ item: created });
  } catch (err) {
    if (String(err?.code) === '11000') return res.status(409).json({ error: 'DUPLICATE_JOB' });
    throw err;
  }
});

jobsRouter.patch('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'BAD_REQUEST' });
  const { id } = req.params;
  const payload = parsed.data;
  const update = {};
  if (payload.company != null) update.company = String(payload.company).trim();
  if (payload.role != null) update.role = String(payload.role).trim();
  if (payload.summary != null) update.summary = String(payload.summary).trim();
  if (payload.location != null) update.location = String(payload.location).trim() || 'Bilinmiyor';
  if (payload.jobType != null) update.jobType = String(payload.jobType).trim() || 'Belirtilmedi';
  if (payload.priority != null) {
    update.priority = PRIORITIES.includes(String(payload.priority || '')) ? payload.priority : 'Düşük';
  }
  if (payload.isActive != null) update.isActive = !!payload.isActive;

  try {
    const item = await Job.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!item) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ item });
  } catch (err) {
    if (String(err?.code) === '11000') return res.status(409).json({ error: 'DUPLICATE_JOB' });
    throw err;
  }
});

jobsRouter.delete('/:id', authRequired, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const r = await Job.deleteOne({ _id: id });
  return res.json({ ok: r.deletedCount === 1 });
});

module.exports = { jobsRouter };

