#!/usr/bin/env node

/**
 * Hygraph Build-Time Data Fetcher
 *
 * Fetches all published content from Hygraph and writes cms-data.json.
 * Run this as your hosting platform's build command:
 *   node hygraph/build.js
 *
 * No token required — uses the public Content API.
 */

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master';
const OUTPUT = path.join(__dirname, '..', 'cms-data.json');

const QUERY = `{
  heroSections(first: 1, stage: PUBLISHED) {
    heading
    subtitle
    primaryCtaText
    primaryCtaLink
    secondaryCtaText
    secondaryCtaLink
    backgroundImage {
      url(transformation: {image: {resize: {width: 1920, height: 1080, fit: crop}}})
    }
  }
  socialProofStats(stage: PUBLISHED, orderBy: order_ASC) {
    value
    suffix
    prefix
    label
  }
  whyStagingSections(first: 1, stage: PUBLISHED) {
    eyebrow
    heading
    paragraphs
    bulletPoints
    ctaText
    ctaLink
    image {
      url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}})
    }
  }
  services(stage: PUBLISHED, orderBy: order_ASC) {
    title
    description
    image {
      url(transformation: {image: {resize: {width: 600, height: 400, fit: crop}}})
    }
  }
  portfolioItems(stage: PUBLISHED, orderBy: order_ASC) {
    label
    beforeImage {
      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})
    }
    afterImage {
      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})
    }
  }
  resultsSections(first: 1, stage: PUBLISHED) {
    eyebrow
    heading
  }
  resultStats(stage: PUBLISHED, orderBy: order_ASC) {
    value
    suffix
    prefix
    label
    description
  }
  howItWorksSteps(stage: PUBLISHED, orderBy: order_ASC) {
    title
    description
  }
  testimonials(stage: PUBLISHED, orderBy: order_ASC) {
    quote
    authorName
    authorRole
    stars
  }
  aboutSections(first: 1, stage: PUBLISHED) {
    eyebrow
    heading
    paragraphs
    credentials
    image {
      url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}})
    }
  }
  serviceAreas(stage: PUBLISHED, orderBy: order_ASC) {
    region
    areas
  }
  faqs(stage: PUBLISHED, orderBy: order_ASC) {
    question
    answer
  }
  contactInfos(first: 1, stage: PUBLISHED) {
    eyebrow
    heading
    description
    phone
    email
    address
    instagramUrl
    facebookUrl
    pinterestUrl
  }
  siteSettingsEntries(first: 1, stage: PUBLISHED) {
    siteName
    tagline
    footerDescription
    formResponseNote
  }
}`;

async function build() {
  console.log('Fetching content from Hygraph...');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY }),
  });

  if (!res.ok) {
    throw new Error('Hygraph request failed: ' + res.status + ' ' + res.statusText);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error('GraphQL errors: ' + json.errors.map(e => e.message).join(', '));
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(json.data, null, 2));
  console.log('cms-data.json written (' + Object.keys(json.data).length + ' collections)');
}

build().catch(function (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
});
