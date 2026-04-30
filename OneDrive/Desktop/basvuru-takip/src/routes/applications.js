const express = require('express');
const { z } = require('zod');
const { Application } = require('../models/Application');
const { authRequired } = require('../middleware/auth');

const applicationsRouter = express.Router();

const createSchema = z.object({
  ownerEmail: z.string().email().optional(),
  company: z.string().min(1),
  role: z.string().min(1),
  applicantName: z.string().optional(),
  applicantPhone: z.string().optional(),
  applicantLinkedIn: z.string().optional(),
  applicantCvUrl: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  appliedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  notes: z.string().optional()
});

applicationsRouter.get('/', authRequired, async (req, res) => {
  const user = req.user;
  const query = user.role === 'admin' ? {} : { ownerEmail: user.email };
  const items = await Application.find(query).sort({ createdAt: -1 }).lean();
  return res.json({ items });
});

applicationsRouter.post('/', authRequired, async (req, res) => {
  const user = req.user;
  if (user.role !== 'user' && user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN' });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'BAD_REQUEST' });

  const payload = parsed.data;
  const ownerEmail = user.role === 'admin' ? String(payload.ownerEmail || user.email) : user.email;

  const doc = {
    ownerEmail,
    company: payload.company.trim(),
    role: payload.role.trim(),
    applicantName: String(payload.applicantName || '').trim(),
    applicantPhone: String(payload.applicantPhone || '').trim(),
    applicantLinkedIn: String(payload.applicantLinkedIn || '').trim(),
    applicantCvUrl: String(payload.applicantCvUrl || '').trim(),
    status: payload.status || 'Başvuruldu',
    priority: payload.priority || 'Düşük',
    location: payload.location || 'Bilinmiyor',
    jobType: payload.jobType || 'Belirtilmedi',
    appliedAt: payload.appliedAt || '',
    updatedAt: payload.updatedAt || '',
    notes: payload.notes || '-'
  };

  try {
    const created = await Application.create(doc);
    return res.status(201).json({ item: created });
  } catch (err) {
    if (String(err?.code) === '11000') {
      return res.status(409).json({ error: 'DUPLICATE_APPLICATION' });
    }
    throw err;
  }
});

applicationsRouter.delete('/:id', authRequired, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
  const { id } = req.params;
  const r = await Application.deleteOne({ _id: id });
  return res.json({ ok: r.deletedCount === 1 });
});

applicationsRouter.delete('/', authRequired, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
  await Application.deleteMany({});
  return res.json({ ok: true });
});

module.exports = { applicationsRouter };

