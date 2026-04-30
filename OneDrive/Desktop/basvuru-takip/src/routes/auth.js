const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { User } = require('../models/User');
const { signToken, authRequired } = require('../middleware/auth');

const authRouter = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  password2: z.string().min(4)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function ensureAdminSeed() {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@gmail.com');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const existing = await User.findOne({ email: adminEmail }).lean();
  if (existing) return;
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await User.create({ email: adminEmail, passwordHash, role: 'admin', registeredAt: new Date() });
}

authRouter.post('/register', async (req, res) => {
  await ensureAdminSeed();
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'BAD_REQUEST' });
  const { email, password, password2 } = parsed.data;
  const e = normalizeEmail(email);
  if (password !== password2) return res.status(400).json({ error: 'PASSWORD_MISMATCH' });

  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@gmail.com');
  if (e === adminEmail) return res.status(400).json({ error: 'EMAIL_RESERVED' });

  const existing = await User.findOne({ email: e }).lean();
  if (existing) return res.status(409).json({ error: 'EMAIL_EXISTS' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: e, passwordHash, role: 'user', registeredAt: new Date() });

  const token = signToken({ sub: String(user._id), email: user.email, role: user.role });
  return res.json({
    token,
    session: {
      email: user.email,
      role: user.role,
      registeredAt: user.registeredAt
    }
  });
});

authRouter.post('/login', async (req, res) => {
  await ensureAdminSeed();
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'BAD_REQUEST' });
  const { email, password } = parsed.data;
  const e = normalizeEmail(email);

  const user = await User.findOne({ email: e });
  if (!user) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ sub: String(user._id), email: user.email, role: user.role });
  return res.json({
    token,
    session: {
      email: user.email,
      role: user.role,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt
    }
  });
});

authRouter.get('/me', authRequired, async (req, res) => {
  await ensureAdminSeed();
  const user = await User.findById(req.user.sub).lean();
  if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });
  return res.json({
    session: {
      email: user.email,
      role: user.role,
      registeredAt: user.registeredAt,
      lastLoginAt: user.lastLoginAt
    }
  });
});

module.exports = { authRouter };

