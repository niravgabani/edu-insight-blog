// Copies article images (featured image + images inside the content) to Cloudinary
// and updates the articles to use the Cloudinary URLs.
//
//   node --env-file=.env scripts/migrate-images.js [--limit 50]
//
// Needs CLOUDINARY_URL in server/.env. Safe to run again: images already on Cloudinary are skipped,
// so an interrupted run continues where it stopped. Images that fail keep their old URL.
import crypto from 'node:crypto';
import * as mongo from '../mongo.js';
import * as cloudinary from '../cloudinary.js';

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) : 0;
const CONCURRENCY = 5;

// Same source URL -> same Cloudinary id, so a re-run never uploads a duplicate
const idFor = (url) => crypto.createHash('sha1').update(url).digest('hex').slice(0, 20);

const needsMove = (url) => /^https?:\/\//.test(url || '') && !cloudinary.isCloudinary(url);

async function move(url, failures) {
  try {
    return await cloudinary.uploadFromUrl(url, idFor(url));
  } catch (err) {
    failures.push(`${url}  (${err.message || err.error?.message || err})`);
    return url;
  }
}

async function main() {
  if (!cloudinary.enabled()) throw new Error('CLOUDINARY_URL is not set in server/.env');
  await mongo.connect();

  // Articles whose featured image or content still points somewhere other than Cloudinary
  const filter = {
    $or: [
      { image: { $regex: '^https?://', $not: /^https:\/\/res\.cloudinary\.com\// } },
      { content: { $regex: '<img[^>]+src="https?://(?!res\\.cloudinary\\.com)' } },
    ],
  };
  const total = await mongo.posts().countDocuments(filter);
  const cursor = mongo.posts().find(filter, { projection: { id: 1, image: 1, content: 1 } });
  if (LIMIT) cursor.limit(LIMIT);
  console.log(`${total} articles have images to move${LIMIT ? ` (doing ${LIMIT} now)` : ''}.`);

  const failures = [];
  let done = 0;
  let images = 0;
  const posts = await cursor.toArray();
  let next = 0;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < posts.length) {
        const post = posts[next++];
        const update = {};
        if (needsMove(post.image)) {
          update.image = await move(post.image, failures);
          if (update.image !== post.image) images++;
        }
        const srcs = [...new Set([...post.content.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter(needsMove))];
        if (srcs.length) {
          let content = post.content;
          for (const src of srcs) {
            const moved = await move(src, failures);
            if (moved !== src) images++;
            content = content.split(`src="${src}"`).join(`src="${moved}"`);
          }
          update.content = content;
        }
        if (Object.keys(update).length) await mongo.posts().updateOne({ id: post.id }, { $set: update });
        if (++done % 50 === 0 || done === posts.length) console.log(`  ${done}/${posts.length} articles, ${images} images moved`);
      }
    })
  );

  console.log(`Done. ${images} images moved to Cloudinary, ${failures.length} failed.`);
  if (failures.length) console.log(`Failed (they keep the old URL; run again to retry):\n${failures.slice(0, 30).join('\n')}`);
}

try {
  await main();
} catch (err) {
  console.error(err.message || err);
  process.exitCode = 1;
} finally {
  await mongo.close();
}
