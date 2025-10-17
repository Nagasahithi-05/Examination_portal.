// Minimal MongoDB connection test
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;

async function test() {
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const admin = client.db().admin();
    const info = await admin.serverStatus();
    console.log('Connected to MongoDB successfully. Server info (trimmed):');
    console.log({ version: info.version, connections: info.connections });
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

test();
