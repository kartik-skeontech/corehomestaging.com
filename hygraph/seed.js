#!/usr/bin/env node

/**
 * Hygraph Content Seed Script
 *
 * Populates the Hygraph project with the initial website content.
 * Run this AFTER setup.js has created the schema.
 *
 * Usage:
 *   HYGRAPH_ENDPOINT=<endpoint> HYGRAPH_TOKEN=<token> node hygraph/seed.js
 *
 * Note: Use the same Management API endpoint and token as setup.js.
 * All content is created in DRAFT stage. You'll need to publish it
 * from the Hygraph dashboard (select all > publish).
 */

const ENDPOINT = 'https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master';
const TOKEN = process.env.HYGRAPH_TOKEN;

if (!TOKEN) {
  console.error('\nMissing HYGRAPH_TOKEN environment variable.\n');
  console.error('Usage: HYGRAPH_TOKEN=<your-mcp-pat> node hygraph/seed.js\n');
  process.exit(1);
}

async function gql(query) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }
  return json.data;
}

async function createAndPublish(modelName, data) {
  const fields = Object.entries(data)
    .map(([key, val]) => {
      if (typeof val === 'number') return `${key}: ${val}`;
      if (Array.isArray(val)) return `${key}: [${val.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ')}]`;
      return `${key}: "${val.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    })
    .join('\n          ');

  const createMutation = `
    mutation {
      create${modelName}(data: {
        ${fields}
      }) {
        id
      }
    }
  `;

  const result = await gql(createMutation);
  const id = result[`create${modelName}`].id;

  // Publish it
  await gql(`
    mutation {
      publish${modelName}(where: { id: "${id}" }, to: PUBLISHED) {
        id
      }
    }
  `);

  return id;
}

// ============================================================================
// Content Data
// ============================================================================

async function seedHero() {
  console.log('Seeding Hero Section...');
  await createAndPublish('HeroSection', {
    heading: 'Sell Faster. Sell Higher. Staging That Transforms GTA Homes.',
    subtitle: 'Professional home staging services across the Greater Toronto Area. Staged homes sell 73% faster and up to 25% above asking price.',
    primaryCtaText: 'Get Your Free Staging Consultation',
    primaryCtaLink: '#contact',
    secondaryCtaText: 'View Our Portfolio',
    secondaryCtaLink: '#portfolio',
  });
}

async function seedSocialProof() {
  console.log('Seeding Social Proof Stats...');
  const stats = [
    { value: 500, suffix: '+', label: 'Homes Staged', order: 1 },
    { value: 73, suffix: '%', label: 'Faster Sales', order: 2 },
    { value: 23, prefix: '$', label: 'Return Per $1 Invested', order: 3 },
    { value: 85, suffix: '%', label: 'Sell Above Asking', order: 4 },
  ];
  for (const stat of stats) {
    await createAndPublish('SocialProofStat', stat);
  }
}

async function seedWhyStaging() {
  console.log('Seeding Why Staging Section...');
  await createAndPublish('WhyStagingSection', {
    eyebrow: 'The GTA Market Today',
    heading: "In a Buyer's Market, First Impressions Are Everything",
    paragraphs: [
      'With GTA homes averaging 67 days on market and 5.8 months of supply, buyers have more choices than ever. Your listing has seconds to make an impression online before a buyer scrolls past.',
      'The average GTA home is priced at $973,000. Can you afford to leave money on the table?',
    ],
    bulletPoints: [
      '83% of buyers say staging helps them visualize living in a home',
      'Unstaged homes sit longer and sell for less in competitive markets',
      'Professional staging returns $23.34 for every $1 invested',
    ],
    ctaText: 'See what staging can do for your listing',
    ctaLink: '#portfolio',
  });
}

async function seedServices() {
  console.log('Seeding Services...');
  const services = [
    { title: 'Vacant Home Staging', description: 'Transform empty rooms into aspirational spaces that help buyers see the full potential of your property.', order: 1 },
    { title: 'Occupied Home Staging', description: "We work with your existing furniture and supplement with our inventory to maximize your home's appeal.", order: 2 },
    { title: 'Staging Consultation', description: 'Expert walkthrough and personalized room-by-room recommendations to prepare your home for market.', order: 3 },
    { title: 'Virtual Staging', description: 'Photorealistic digital staging for online listings at a fraction of the cost of physical staging.', order: 4 },
    { title: 'Home Redesign', description: 'Love your home again. We restyle and rearrange what you already own for a completely fresh look.', order: 5 },
    { title: 'Model Home Staging', description: 'Turnkey staging for builders and developers. Create the lifestyle vision that sells units.', order: 6 },
  ];
  for (const service of services) {
    await createAndPublish('Service', service);
  }
}

async function seedPortfolio() {
  console.log('Seeding Portfolio Items...');
  const items = [
    { label: 'Yorkville Condo — Living Room', order: 1 },
    { label: 'Oakville Family Home — Kitchen', order: 2 },
    { label: 'Mississauga Townhouse — Primary Bedroom', order: 3 },
    { label: 'Downtown Toronto Loft — Open Concept', order: 4 },
  ];
  for (const item of items) {
    await createAndPublish('PortfolioItem', item);
  }
  console.log('  Note: Upload before/after images via the Hygraph dashboard');
}

async function seedResults() {
  console.log('Seeding Results Section...');
  await createAndPublish('ResultsSection', {
    eyebrow: 'Proven Results',
    heading: "The Numbers Don't Lie",
  });

  const stats = [
    { value: 550, suffix: '+', label: 'Average ROI', description: 'For every dollar spent on staging', order: 1 },
    { value: 73, suffix: '%', label: 'Faster Sale', description: 'Compared to unstaged homes in the GTA', order: 2 },
    { value: 25, prefix: 'up to', suffix: '%', label: 'Above Asking', description: 'What staged homes can achieve', order: 3 },
  ];
  for (const stat of stats) {
    await createAndPublish('ResultStat', stat);
  }
}

async function seedHowItWorks() {
  console.log('Seeding How It Works Steps...');
  const steps = [
    { title: 'Book a Consultation', description: "Contact us for a free walkthrough of your property. We'll assess the space and discuss your goals and timeline.", order: 1 },
    { title: 'Receive Your Proposal', description: "Within 24 hours, you'll receive a detailed staging plan with options tailored to your budget and market position.", order: 2 },
    { title: 'We Stage Your Home', description: 'Our team handles everything—furniture delivery, styling, accessorizing. Typical setup takes just 1–2 days.', order: 3 },
    { title: 'Sell With Confidence', description: 'Your home goes to market looking its absolute best. Attract more showings, stronger offers, faster results.', order: 4 },
  ];
  for (const step of steps) {
    await createAndPublish('HowItWorksStep', step);
  }
}

async function seedTestimonials() {
  console.log('Seeding Testimonials...');
  const testimonials = [
    {
      quote: 'Core Home Staging transformed our Yorkville listing. It sold in 5 days for $87,000 over asking. Their team is professional, creative, and incredibly easy to work with.',
      authorName: 'Sarah M.',
      authorRole: 'Realtor, Royal LePage',
      stars: 5,
      order: 1,
    },
    {
      quote: 'We were skeptical about staging our home, but the results spoke for themselves. The investment paid for itself ten times over. Every seller in the GTA should call Core.',
      authorName: 'David & Priya T.',
      authorRole: 'Homeowners, Oakville',
      stars: 5,
      order: 2,
    },
    {
      quote: 'As a builder, I need staging that sells a lifestyle. Core consistently delivers magazine-quality setups that help us close units faster across all our developments.',
      authorName: 'Michael R.',
      authorRole: 'VP Sales, Urban Development Corp.',
      stars: 5,
      order: 3,
    },
  ];
  for (const t of testimonials) {
    await createAndPublish('Testimonial', t);
  }
}

async function seedAbout() {
  console.log('Seeding About Section...');
  await createAndPublish('AboutSection', {
    eyebrow: 'About Core Home Staging',
    heading: "GTA's Trusted Home Staging Partner",
    paragraphs: [
      'Founded in Toronto, Core Home Staging brings together interior design expertise and real estate market knowledge to help sellers achieve exceptional results.',
      'With an extensive furniture and decor inventory, a dedicated team, and a passion for transforming spaces, we serve the entire Greater Toronto Area—from downtown condos to suburban family homes and luxury estates.',
      "We don't just stage homes. We create emotional connections between buyers and properties, helping you sell faster and for more.",
    ],
    credentials: [
      'Certified Staging Professional',
      '500+ Properties Staged',
      'Full In-House Inventory',
      'Serving the Entire GTA',
    ],
  });
}

async function seedServiceAreas() {
  console.log('Seeding Service Areas...');
  const areas = [
    { region: 'Toronto', areas: ['Downtown', 'Midtown', 'North York', 'Scarborough', 'Etobicoke', 'East York'], order: 1 },
    { region: 'York Region', areas: ['Markham', 'Richmond Hill', 'Vaughan', 'Aurora', 'Newmarket'], order: 2 },
    { region: 'Peel Region', areas: ['Mississauga', 'Brampton', 'Caledon'], order: 3 },
    { region: 'Halton Region', areas: ['Oakville', 'Burlington', 'Milton'], order: 4 },
    { region: 'Durham Region', areas: ['Pickering', 'Ajax', 'Whitby', 'Oshawa'], order: 5 },
  ];
  for (const area of areas) {
    await createAndPublish('ServiceArea', area);
  }
}

async function seedFAQs() {
  console.log('Seeding FAQs...');
  const faqs = [
    { question: 'How much does home staging cost?', answer: 'Staging costs vary based on the size of the home, the number of rooms, and the duration. As a rough guide, staging a condo typically starts at $2,500–$3,500 and a detached home at $3,500–$6,000+ for the initial month. Contact us for a free, no-obligation quote tailored to your property.', order: 1 },
    { question: 'How long does staging take?', answer: 'Most staging setups are completed in 1–2 business days. We work around your schedule and can accommodate tight timelines for fast-moving listings.', order: 2 },
    { question: 'Do you stage occupied homes?', answer: "Yes! Occupied staging involves working with your existing furniture and adding our pieces to enhance the space. We provide a detailed plan of what stays, what gets stored, and what we bring in.", order: 3 },
    { question: 'How long can the furniture stay?', answer: 'Our standard staging period is 45 days with flexible extensions available. We understand that selling timelines can shift, and we work with you to keep your home looking its best throughout.', order: 4 },
    { question: "What's the ROI on home staging?", answer: 'Industry data shows an average return of $23.34 for every $1 invested in staging. In the current GTA market, where the average home price is nearly $1 million, even a 1–2% price increase from staging represents significant returns.', order: 5 },
    { question: 'What areas do you serve?', answer: 'We serve the entire Greater Toronto Area, including Toronto, Mississauga, Oakville, Vaughan, Markham, Richmond Hill, and surrounding communities.', order: 6 },
    { question: 'Do you offer virtual staging?', answer: "Yes. Virtual staging is a cost-effective option, particularly for vacant properties where physical staging isn't feasible. We create photorealistic digitally furnished images for your online listings.", order: 7 },
    { question: 'Can I choose the furniture style?', answer: 'Absolutely. During the consultation, we discuss the target buyer demographic and select furniture and decor that will resonate most. We have contemporary, transitional, modern farmhouse, and luxury inventory available.', order: 8 },
  ];
  for (const faq of faqs) {
    await createAndPublish('Faq', faq);
  }
}

async function seedContactInfo() {
  console.log('Seeding Contact Info...');
  await createAndPublish('ContactInfo', {
    eyebrow: 'Get In Touch',
    heading: 'Ready to Transform Your Listing?',
    description: "Request a free, no-obligation staging consultation. We'll visit your property, discuss your goals, and provide a tailored proposal within 24 hours.",
    phone: '4165551234',
    email: 'hello@corehomestaging.com',
    address: 'Serving the Greater Toronto Area',
    instagramUrl: '#',
    facebookUrl: '#',
    pinterestUrl: '#',
  });
}

async function seedSiteSettings() {
  console.log('Seeding Site Settings...');
  await createAndPublish('SiteSettings', {
    siteName: 'Core Home Staging',
    tagline: 'Professional Home Staging for the GTA',
    footerDescription: 'Professional home staging for the Greater Toronto Area. We transform properties into buyer-ready homes that sell faster and for more.',
    formResponseNote: "We'll respond within 2 business hours during business days.",
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Core Home Staging - Hygraph Content Seed');
  console.log('='.repeat(60));
  console.log('');

  await seedHero();
  await seedSocialProof();
  await seedWhyStaging();
  await seedServices();
  await seedPortfolio();
  await seedResults();
  await seedHowItWorks();
  await seedTestimonials();
  await seedAbout();
  await seedServiceAreas();
  await seedFAQs();
  await seedContactInfo();
  await seedSiteSettings();

  console.log('\n' + '='.repeat(60));
  console.log('Content seeded and published!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Open Hygraph Dashboard and upload images to Portfolio Items, Services, etc.');
  console.log('2. Copy your Content API endpoint from Project Settings > API Access');
  console.log('3. Update js/cms-config.js:');
  console.log('   - Set endpoint to your Content API URL');
  console.log('   - Set enabled to true');
  console.log('4. Open the website in your browser to verify CMS content loads');
  console.log('');
}

main().catch(function (err) {
  console.error('Seed failed:', err);
  process.exit(1);
});
