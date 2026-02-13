require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const visitRoutes = require('./routes/visits');
const entryRoutes = require('./routes/entries');
const reportRoutes = require('./routes/reports');
const { ensureBucket } = require('./utils/minio');
const { seedDefaultUser } = require('./utils/seed');

const app = express();
const ALLOWED_REPORT_MODELS = new Set(['gpt-4o', 'gpt-4.1']);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/visits', visitRoutes);
app.use('/', entryRoutes);
app.use('/', reportRoutes);

// Simple error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dusfr';

async function start() {
  try {
    const reportModel = (process.env.OPENAI_REPORT_MODEL || '').trim();
    if (reportModel && !ALLOWED_REPORT_MODELS.has(reportModel)) {
      throw new Error(
        `Unsupported OPENAI_REPORT_MODEL: ${reportModel}. Supported values: gpt-4o, gpt-4.1.`
      );
    }

    await mongoose.connect(MONGO_URI);
    try {
      await mongoose.connection.collection('reports').dropIndex('visitId_1');
    } catch (error) {
      if (error && error.codeName !== 'IndexNotFound') {
        console.error('Failed to drop legacy reports index', error);
      }
    }
    await ensureBucket();
    await seedDefaultUser();
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
