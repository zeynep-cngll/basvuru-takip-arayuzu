const express = require('express');
const { User } = require('../models/User');
const { Application } = require('../models/Application');
const { authRequired, requireRole } = require('../middleware/auth');

const adminRouter = express.Router();

adminRouter.use(authRequired, requireRole('admin'));

adminRouter.get('/users', async (_req, res) => {
  const users = await User.find({ role: 'user' })
    .sort({ createdAt: -1 })
    .select({ email: 1, registeredAt: 1 })
    .lean();

  const userEmails = users.map((u) => u.email);
  const counts = await Application.aggregate([
    { $match: { ownerEmail: { $in: userEmails } } },
    { $group: { _id: '$ownerEmail', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((c) => [c._id, c.count]));

  return res.json({
    users: users.map((u) => ({
      email: u.email,
      registeredAt: u.registeredAt,
      applicationCount: countMap.get(u.email) || 0
    }))
  });
});

adminRouter.delete('/users/:email', async (req, res) => {
  const email = String(req.params.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'BAD_REQUEST' });
  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
  if (email === adminEmail) return res.status(400).json({ error: 'CANNOT_DELETE_ADMIN' });

  const r = await User.deleteOne({ email, role: 'user' });
  await Application.deleteMany({ ownerEmail: email });
  return res.json({ ok: r.deletedCount === 1 });
});

module.exports = { adminRouter };

