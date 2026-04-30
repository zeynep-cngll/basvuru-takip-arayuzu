const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { connectDb } = require('./src/db');
const { authRouter } = require('./src/routes/auth');
const { applicationsRouter } = require('./src/routes/applications');
const { adminRouter } = require('./src/routes/admin');
const { jobsRouter } = require('./src/routes/jobs');

const PORT = Number(process.env.PORT || 3000);

async function main() {
  // eslint-disable-next-line no-console
  console.log(
    `DB: connecting (${process.env.USE_MEMORY_DB === '1' ? 'memory' : 'MONGODB_URI'})...`
  );
  await connectDb(process.env.MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log('DB: connected');

  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/jobs', jobsRouter);

  const staticDir = path.join(__dirname);
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

