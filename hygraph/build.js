#!/usr/bin/env node

/**
 * Hygraph Build-Time Data Fetcher
 *
 * Fetches all published content from Hygraph and writes cms-data.json.
 * Run this as your hosting platform's build command:
 *   node hygraph/build.js
 *
 * No token required — uses the public Content API.
 * Queries are split into small chunks so each can be CDN-cached independently.
 */

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master';
const OUTPUT = path.join(__dirname, '..', 'cms-data.json');

// Split into small queries — each gets cached independently by Hygraph's CDN
const QUERIES = [
  `{
    heroSections(first: 1, stage: PUBLISHED) {
      heading subtitle primaryCtaText primaryCtaLink secondaryCtaText secondaryCtaLink
      backgroundImage { url(transformation: {image: {resize: {width: 1920, height: 1080, fit: crop}}}) }
    }
    socialProofStats(stage: PUBLISHED, orderBy: order_ASC) {
      value suffix prefix label
    }
  }`,
  `{
    whyStagingSections(first: 1, stage: PUBLISHED) {
      eyebrow heading paragraphs bulletPoints ctaText ctaLink
      image { url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}}) }
    }
    services(stage: PUBLISHED, orderBy: order_ASC) {
      title description
      image { url(transformation: {image: {resize: {width: 600, height: 400, fit: crop}}}) }
    }
  }`,
  `{
    portfolioItems(stage: PUBLISHED, orderBy: order_ASC) {
      label
      beforeImage { url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}}) }
      afterImage { url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}}) }
    }
    resultsSections(first: 1, stage: PUBLISHED) { eyebrow heading }
    resultStats(stage: PUBLISHED, orderBy: order_ASC) { value suffix prefix label description }
  }`,
  `{
    howItWorksSteps(stage: PUBLISHED, orderBy: order_ASC) { title description }
    testimonials(stage: PUBLISHED, orderBy: order_ASC) { quote authorName authorRole stars }
  }`,
  `{
    aboutSections(first: 1, stage: PUBLISHED) {
      eyebrow heading paragraphs credentials
      image { url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}}) }
    }
    serviceAreas(stage: PUBLISHED, orderBy: order_ASC) { region areas }
  }`,
  `{
    faqs(stage: PUBLISHED, orderBy: order_ASC) { question answer }
    contactInfos(first: 1, stage: PUBLISHED) {
      eyebrow heading description phone email address instagramUrl facebookUrl pinterestUrl
    }
    siteSettingsEntries(first: 1, stage: PUBLISHED) {
      siteName tagline footerDescription formResponseNote
    }
  }`,
];

async function fetchQuery(query, attempt = 1, maxAttempts = 5) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (res.status === 429) {
    if (attempt >= maxAttempts) throw new Error('Rate limit persisted after ' + maxAttempts + ' attempts');
    const wait = 30000 * attempt;
    console.log(`  Rate limited. Retrying in ${wait / 1000}s... (attempt ${attempt}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, wait));
    return fetchQuery(query, attempt + 1, maxAttempts);
  }

  if (!res.ok) throw new Error('Hygraph request failed: ' + res.status);

  const json = await res.json();
  if (json.errors) throw new Error('GraphQL errors: ' + json.errors.map(e => e.message).join(', '));
  return json.data;
}

async function build() {
  console.log('Fetching content from Hygraph...');

  const data = {};

  for (let i = 0; i < QUERIES.length; i++) {
    console.log(`  Query ${i + 1}/${QUERIES.length}...`);
    const result = await fetchQuery(QUERIES[i]);
    Object.assign(data, result);
    // Small pause between queries to avoid concurrent limit
    if (i < QUERIES.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
  console.log('cms-data.json written (' + Object.keys(data).length + ' collections)');

  // Copy web files into dist/ for Cloudflare Workers deployment
  const root = path.join(__dirname, '..');
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(dist)) fs.mkdirSync(dist);

  const webAssets = ['index.html', 'css', 'js', 'images', 'fonts', 'robots.txt', 'sitemap.xml', '_headers', 'cms-data.json'];
  for (const item of webAssets) {
    const src = path.join(root, item);
    if (!fs.existsSync(src)) continue;
    cpSync(src, path.join(dist, item));
  }
  console.log('dist/ populated with web assets');
}

function cpSync(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      cpSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

build().catch(function (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
});
