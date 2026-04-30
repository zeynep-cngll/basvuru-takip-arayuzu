const mongoose = require('mongoose');

async function connectMemoryDb() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const ms = await MongoMemoryServer.create();
  const uri = ms.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return { stop: () => ms.stop() };
}

async function connectDb(uri) {
  if (process.env.USE_MEMORY_DB === '1') {
    return connectMemoryDb();
  }
  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });
  return { stop: async () => {} };
}

module.exports = { connectDb };

