// MongoDB connection. Set MONGODB_URI in server/.env (see .env.example).
import { MongoClient } from 'mongodb';

let client = null;
let db = null;

// Database name: MONGODB_DB, else the one in the URL, else "edu_blog"
function dbNameFrom(uri) {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : 'edu_blog';
}

export async function connect(uri = process.env.MONGODB_URI) {
  if (db) return db;
  if (!uri) throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env and add your connection URL.');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbNameFrom(uri));

  await Promise.all([
    db.collection('posts').createIndex({ id: 1 }, { unique: true }),
    db.collection('posts').createIndex({ slug: 1 }, { unique: true }),
    db.collection('posts').createIndex({ status: 1, date: -1 }),
    db.collection('categories').createIndex({ slug: 1 }, { unique: true }),
    db.collection('messages').createIndex({ id: 1 }, { unique: true }),
  ]);
  return db;
}

export async function close() {
  await client?.close();
  client = db = null;
}

export const posts = () => db.collection('posts');
export const categories = () => db.collection('categories');
export const messages = () => db.collection('messages');
export const settings = () => db.collection('settings'); // single doc: { _id: 'site', siteName, siteDomain, home }
export const auth = () => db.collection('auth'); // single doc: { _id: 'admin', username, salt, hash, secret }

// Leave Mongo's internal _id out of API responses
export const NO_ID = { projection: { _id: 0 } };
