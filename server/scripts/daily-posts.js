// Writes and publishes new articles every day with Claude: trending topics, yesterday's news,
// upcoming festivals and useful evergreen guides — each researched on the web and fully SEO-optimised.
//
//   node --env-file=.env scripts/daily-posts.js [--count 15] [--dry-run]
//
// Settings (server/.env, or GitHub Actions secrets/variables — see .github/workflows/daily-posts.yml):
//   ANTHROPIC_API_KEY        required
//   MONGODB_URI              required
//   DAILY_POSTS_COUNT        articles per run (default 15)
//   DAILY_POSTS_COUNTRIES    countries to cover (default: a broad international mix)
//   DAILY_POSTS_LANGUAGE     language to write in (default en)
//   DAILY_POSTS_STATUS       "published" (default) or "draft" to review them in the admin first
//   DAILY_POSTS_MODEL        Claude model (default claude-opus-5-5; claude-sonnet-5-5 costs about half)
//   PEXELS_API_KEY           optional — finds a matching free photo for each article
//   CLOUDINARY_URL           optional — stores those photos on Cloudinary
import crypto from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';
import * as mongo from '../mongo.js';
import * as cloudinary from '../cloudinary.js';

const args = process.argv.slice(2);
const argValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const COUNT = Number(argValue('count') || process.env.DAILY_POSTS_COUNT || 15);
const DRY_RUN = args.includes('--dry-run');
const MODEL = process.env.DAILY_POSTS_MODEL || 'claude-opus-5-5';
const LANGUAGE = process.env.DAILY_POSTS_LANGUAGE || 'en';
const STATUS = process.env.DAILY_POSTS_STATUS === 'draft' ? 'draft' : 'published';
const COUNTRIES =
  process.env.DAILY_POSTS_COUNTRIES ||
  'United States, India, United Kingdom, Canada, Australia, Germany, France, Brazil, Japan, South Africa, Nigeria, UAE';

const client = new Anthropic();
// If the model declines a request, the API retries it on a suitable fallback model automatically
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };
const WEB_SEARCH = (maxUses) => ({ type: 'web_search_20260209', name: 'web_search', max_uses: maxUses });

const usage = { input: 0, output: 0, searches: 0 };
const track = (message) => {
  usage.input += (message.usage.input_tokens || 0) + (message.usage.cache_read_input_tokens || 0);
  usage.output += message.usage.output_tokens || 0;
  usage.searches += message.usage.server_tool_use?.web_search_requests || 0;
};

const textOf = (message) =>
  message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

// A request with web search; long searches can pause, so keep going until Claude finishes
async function research(system, prompt, { maxSearches, effort }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0; turn < 5; turn++) {
    const message = await client.beta.messages.create({
      ...FALLBACK,
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort },
      system,
      tools: [WEB_SEARCH(maxSearches)],
      messages,
    });
    track(message);
    if (message.stop_reason === 'refusal') throw new Error('the model declined this topic');
    if (message.stop_reason !== 'pause_turn') return textOf(message);
    messages.push({ role: 'assistant', content: message.content });
  }
  throw new Error('research did not finish');
}

// A request whose answer must match a schema (no tools, so it can't conflict with search citations)
async function structured(system, prompt, schema, effort) {
  const message = await client.beta.messages.parse({
    ...FALLBACK,
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  track(message);
  if (message.stop_reason === 'refusal') throw new Error('the model declined this request');
  if (message.stop_reason === 'max_tokens') throw new Error('the answer was cut off (max_tokens)');
  if (!message.parsed_output) throw new Error('the answer did not match the expected format');
  return message.parsed_output;
}

// ---------- Prompts ----------

const EDITOR_SYSTEM = `You are the editor-in-chief of an independent, international information website.
You plan each day's articles so readers get timely, genuinely useful content: what happened yesterday,
what people are searching for right now, and what is coming up soon (festivals, holidays, observances,
major events) so that guides are published before people search for them.

You choose topics a careful human editor would be proud to publish. Avoid clickbait, rumours, gossip
about private individuals, graphic violence, medical or financial advice presented as personal advice,
and anything you cannot verify from reputable sources. Prefer angles that explain, compare, or help
the reader do something, and avoid repeating topics the site already covered.`;

const RESEARCHER_SYSTEM = `You are a meticulous research assistant for a news and information website.
Use web search to gather facts for one article. Prefer primary and reputable sources (official sites,
government and institutional pages, established news organisations). For each fact, note the source URL
and, for news, the date it happened. If sources disagree or something is unconfirmed, say so.
Do not invent figures, quotes, or dates. Return concise research notes, not an article.`;

const WRITER_SYSTEM = `You are a senior writer and SEO specialist. You write original, people-first articles
that answer the reader's question fully and are easy to scan. Every factual claim must come from the
research notes you are given; never invent statistics, quotes, dates, or sources. When information is
uncertain or still developing, say so plainly.

Write for humans first: a clear introduction that answers the main question early, logical H2/H3
sections, short paragraphs, lists or a table where they genuinely help, and a practical conclusion.
Use the focus keyword naturally in the title, the first paragraph, at least one H2, and the meta
description — never keyword-stuff. Keep a neutral, trustworthy tone.`;

const today = () => new Date().toISOString().slice(0, 10);

function planPrompt(categories, recentTitles) {
  return `Today is ${today()}. Plan ${COUNT} new articles for our website, written in language code "${LANGUAGE}".

Countries our readers come from: ${COUNTRIES}.

Use web search to find, for those countries:
1. The most significant news from yesterday that readers will want explained (politics, economy, technology, science, sport, culture — not celebrity gossip).
2. What people are searching for right now (trending searches and topics).
3. Festivals, public holidays, observances and big events in the next 7–21 days, so we can publish guides early.
4. Seasonal or evergreen questions with strong search demand right now.

Aim for a mix of roughly: 35% yesterday's news explained, 25% trending topics, 25% upcoming festivals/events, 15% evergreen guides.

Our categories (use only these slugs): ${categories.map((c) => `${c.slug} (${c.name})`).join(', ')}.

Recently published titles — do NOT repeat these topics:
${recentTitles.map((t) => `- ${t}`).join('\n') || '- (none yet)'}

For every planned article give: a working title, the angle that makes it useful, the best category slug,
the country (or "Global"), the type (news / trending / festival / evergreen), a focus keyword,
3–6 secondary keywords, and one sentence on why it matters now.`;
}

const PlanSchema = z.object({
  topics: z.array(
    z.object({
      workingTitle: z.string(),
      angle: z.string(),
      category: z.string(),
      country: z.string(),
      type: z.enum(['news', 'trending', 'festival', 'evergreen']),
      focusKeyword: z.string(),
      secondaryKeywords: z.array(z.string()),
      whyNow: z.string(),
    })
  ),
});

const ArticleSchema = z.object({
  title: z.string().describe('Compelling, accurate headline (50–70 characters) containing the focus keyword'),
  slug: z.string().describe('Short lowercase URL slug with hyphens, ideally 3–7 words, containing the focus keyword'),
  metaTitle: z.string().describe('SEO title for Google, at most 60 characters'),
  metaDescription: z.string().describe('Meta description, 140–160 characters, with the focus keyword and a reason to click'),
  excerpt: z.string().describe('One or two sentence summary shown on article cards'),
  keywords: z.array(z.string()).describe('Focus keyword first, then 4–8 related keywords'),
  contentHtml: z
    .string()
    .describe(
      'The article body as HTML (1,200–2,000 words). Allowed tags: h2, h3, p, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td, blockquote. No h1, no inline styles, no scripts. End with an FAQ section (h2 + h3 questions) and a "Sources" h2 with a list of linked source URLs.'
    ),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).describe('The same 3–5 FAQ entries used in the article'),
  imageSearch: z.string().describe('2–4 English words to find a relevant, non-sensitive stock photo'),
});

function writePrompt(topic, notes, related) {
  return `Write a complete article from the research notes below. Language: "${LANGUAGE}" (write the whole article in this language).

Topic: ${topic.workingTitle}
Angle: ${topic.angle}
Type: ${topic.type}   Country: ${topic.country}   Date today: ${today()}
Focus keyword: ${topic.focusKeyword}
Secondary keywords: ${topic.secondaryKeywords.join(', ')}

Where it helps the reader, link naturally to 1–3 of these existing articles on our site (use the relative URL exactly as given):
${related.map((p) => `- ${p.title}: /${p.slug}`).join('\n') || '- (none)'}

Research notes:
${notes}`;
}

// ---------- Helpers ----------

const slugify = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC') // recompose letters such as Korean syllables after removing accents
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);

const RESERVED = new Set(['blog', 'search', 'about', 'privacypolicy', 'contactus', 'terms', 'disclaimer', 'category', 'admin', 'api', 'uploads']);

async function uniqueSlug(base) {
  let slug = slugify(base) || `article-${Date.now()}`;
  if (RESERVED.has(slug)) slug = `${slug}-guide`;
  for (let n = 2; await mongo.posts().findOne({ slug }); n++) slug = `${slugify(base)}-${n}`;
  return slug;
}

// Only well-formed article HTML gets through: drop scripts, styles, event handlers and inline styles
const cleanHtml = (html) =>
  html
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, '')
    .replace(/\s(on\w+|style)="[^"]*"/gi, '')
    .replace(/<\/?h1[^>]*>/gi, (tag) => tag.replace(/h1/i, 'h2'));

async function findImage(query, slug) {
  const fallback = `https://picsum.photos/seed/${encodeURIComponent(slug)}/1000/700`;
  if (!process.env.PEXELS_API_KEY) return fallback;
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    const photo = (await res.json()).photos?.[0];
    if (!photo) return fallback;
    const url = photo.src.large2x || photo.src.large;
    return cloudinary.enabled() ? await cloudinary.uploadFromUrl(url, `pexels-${photo.id}`) : url;
  } catch {
    return fallback;
  }
}

// ---------- Run ----------

async function main() {
  await mongo.connect();
  const categories = (await mongo.categories().find({}, { projection: { _id: 0, slug: 1, name: 1, lang: 1 } }).toArray()).filter(
    (c) => (c.lang || 'en') === LANGUAGE
  );
  if (!categories.length) throw new Error(`No categories in language "${LANGUAGE}"`);
  const recentTitles = (await mongo.posts().find({}, { projection: { title: 1 } }).sort({ createdAt: -1 }).limit(150).toArray()).map(
    (p) => p.title
  );

  console.log(`Planning ${COUNT} articles with ${MODEL}...`);
  const planNotes = await research(EDITOR_SYSTEM, planPrompt(categories, recentTitles), { maxSearches: 15, effort: 'medium' });
  const { topics } = await structured(
    EDITOR_SYSTEM,
    `Turn this plan into exactly ${COUNT} topics. Use only these category slugs: ${categories.map((c) => c.slug).join(', ')}.\n\n${planNotes}`,
    PlanSchema,
    'low'
  );
  const validSlugs = new Set(categories.map((c) => c.slug));

  let published = 0;
  for (const [i, topic] of topics.slice(0, COUNT).entries()) {
    const label = `[${i + 1}/${COUNT}] ${topic.workingTitle}`;
    try {
      const category = validSlugs.has(topic.category) ? topic.category : categories[0].slug;
      const notes = await research(
        RESEARCHER_SYSTEM,
        `Research this for an article published on ${today()}:\n${topic.workingTitle}\nAngle: ${topic.angle}\nCountry: ${topic.country}`,
        { maxSearches: 5, effort: 'low' }
      );
      const related = await mongo
        .posts()
        .find({ status: 'published', category }, { projection: { title: 1, slug: 1 } })
        .sort({ date: -1 })
        .limit(8)
        .toArray();
      const article = await structured(WRITER_SYSTEM, writePrompt(topic, notes, related), ArticleSchema, 'medium');

      const slug = await uniqueSlug(article.slug || article.title);
      const post = {
        id: crypto.randomUUID(),
        title: article.title.trim(),
        slug,
        category,
        date: today(),
        image: await findImage(article.imageSearch, slug),
        excerpt: article.excerpt.trim(),
        content: cleanHtml(article.contentHtml),
        status: STATUS,
        lang: LANGUAGE,
        metaTitle: article.metaTitle.trim().slice(0, 200),
        metaDescription: article.metaDescription.trim().slice(0, 400),
        keywords: article.keywords.join(', ').slice(0, 300),
        faq: article.faq.slice(0, 8),
        source: { type: 'ai', topicType: topic.type, country: topic.country },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (DRY_RUN) console.log(`${label}\n  -> /${post.slug} (${post.content.length} chars, not saved: dry run)`);
      else {
        await mongo.posts().insertOne(post);
        console.log(`${label}\n  -> saved /${post.slug}`);
      }
      published++;
    } catch (err) {
      console.log(`${label}\n  -> skipped: ${err.message}`);
    }
  }

  // Approximate cost at Claude Opus 5.5 list prices ($4 / $20 per million tokens, $10 per 1,000 searches)
  const cost = (usage.input * 4 + usage.output * 20) / 1e6 + usage.searches * 0.01;
  console.log(
    `Done: ${published} of ${COUNT} articles ${DRY_RUN ? 'written (dry run)' : STATUS}. ` +
      `Tokens: ${usage.input} in / ${usage.output} out, ${usage.searches} web searches (≈ $${cost.toFixed(2)} at Opus 5.5 prices).`
  );
  if (published === 0) process.exitCode = 1;
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Anthropic.APIError ? `Claude API error ${err.status}: ${err.message}` : err.message || err);
  process.exitCode = 1;
} finally {
  await mongo.close();
}
