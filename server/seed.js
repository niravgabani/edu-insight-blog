// Prepares an empty MongoDB database on first start: site settings, the category list and the admin login.
// No articles are stored in the project — all articles live in MongoDB and are managed from the admin panel.
import crypto from 'node:crypto';
import * as mongo from './mongo.js';
import { hashPassword } from './auth.js';

export const DEFAULT_USER = 'admin';
export const DEFAULT_PASSWORD = 'admin123';

const CATEGORIES = [
  ['education', 'Education'],
  ['technology', 'Technology'],
  ['auto', 'Auto'],
  ['travel', 'Travel'],
  ['business', 'Business'],
  ['finance', 'Finance'],
  ['health', 'Health'],
  ['fashion', 'Fashion'],
  ['machinery', 'Machinery'],
  ['real-estate', 'Real Estate'],
  ['entertainment', 'Entertainment'],
  ['lifestyle', 'Lifestyle'],
];

// Called on server start: only runs when the database is empty
export async function ensureDb() {
  if (await mongo.settings().findOne({ _id: 'site' })) return;
  await mongo.settings().insertOne({
    _id: 'site',
    siteName: 'Daily InfoScope',
    siteDomain: 'dailyinfoscope.com',
    home: {
      hero: [],
      popular: [],
      latest: [],
      trending: [],
      trendingImage: null,
      featured: [],
      topCategories: CATEGORIES.slice(0, 6).map(([slug]) => slug),
    },
  });
  if (!(await mongo.categories().countDocuments()))
    await mongo.categories().insertMany(CATEGORIES.map(([slug, name], position) => ({ slug, name, position })));
  if (!(await mongo.auth().findOne({ _id: 'admin' })))
    await mongo.auth().insertOne({
      _id: 'admin',
      username: DEFAULT_USER,
      ...hashPassword(DEFAULT_PASSWORD),
      secret: crypto.randomBytes(32).toString('hex'),
    });
  console.log(`New database prepared. Add articles from the admin panel. Login: ${DEFAULT_USER} / ${DEFAULT_PASSWORD}`);
}
