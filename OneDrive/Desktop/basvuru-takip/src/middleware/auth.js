const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is missing');
  return s;
}

function signToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice('Bearer '.length) : null;
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });
    if (req.user.role !== role) return res.status(403).json({ error: 'FORBIDDEN' });
    return next();
  };
}

module.exports = { authRequired, requireRole, signToken };

