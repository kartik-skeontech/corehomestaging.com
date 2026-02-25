#!/usr/bin/env node

/**
 * Hygraph Schema Setup Script (v2 Management API)
 *
 * Usage:
 *   HYGRAPH_TOKEN=<mcp-pat-token> node hygraph/setup.js
 */

const ENDPOINT = 'https://management-us-west-2.hygraph.com/graphql';
const TOKEN = process.env.HYGRAPH_TOKEN;
const ENV_ID = '4646dddacacd4e21a1b92ff22067d3fb';
const ASSET_MODEL_ID = '0a542d0c2bfc434a9d3e37148d8509dc';

if (!TOKEN) {
  console.error('\nMissing HYGRAPH_TOKEN environment variable.\n');
  console.error('Usage: HYGRAPH_TOKEN=<your-mcp-pat> node hygraph/setup.js\n');
  process.exit(1);
}

// ============================================================================
// GraphQL helper
// ============================================================================

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
    throw new Error(json.errors.map(e => e.message).join(' | '));
  }
  return json.data;
}

async function gqlWithRetry(query, retries = 15, delay = 4000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await gql(query);
    } catch (err) {
      if (err.message.includes('pending migration')) {
        process.stdout.write('  (waiting for migration...) ');
        await sleep(delay);
      } else if (err.message.includes('already exists') || err.message.includes('duplicate')) {
        console.log('  (already exists, skipping)');
        return null;
      } else {
        throw err;
      }
    }
  }
  throw new Error('Max retries exceeded waiting for migration to complete');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================================
// Model ID lookup
// ============================================================================

async function getModelId(apiId) {
  const data = await gql(`{
    viewer {
      ... on TokenViewer {
        project {
          environment(name: "master") {
            contentModel {
              models { id apiId }
            }
          }
        }
      }
    }
  }`);
  const models = data.viewer.project.environment.contentModel.models;
  const model = models.find(m => m.apiId === apiId);
  return model ? model.id : null;
}

// ============================================================================
// Schema operations
// ============================================================================

async function createModel(apiId, apiIdPlural, displayName, description) {
  console.log(`\nCreating model: ${displayName}...`);

  // Wait if a prior deletion/creation is still pending
  const result = await gqlWithRetry(`
    mutation {
      createModel(data: {
        environmentId: "${ENV_ID}"
        apiId: "${apiId}"
        apiIdPlural: "${apiIdPlural}"
        displayName: "${displayName}"
        description: "${(description || '').replace(/"/g, '\\"')}"
      }) {
        migration { id }
      }
    }
  `);

  if (result === null) {
    console.log(`  Model already exists: ${apiId}`);
  } else {
    console.log(`  Model created: ${apiId}`);
  }

  // Wait a moment then get the model ID
  await sleep(3000);
  const modelId = await getModelId(apiId);
  if (!modelId) {
    console.error(`  Could not find model ID for ${apiId}. Skipping fields.`);
    return null;
  }
  return modelId;
}

async function addStringField(modelId, apiId, displayName, description, isRequired, isList) {
  const desc = (description || '').replace(/"/g, '\\"');
  console.log(`  Adding field: ${apiId} (String${isList ? '[]' : ''})`);
  await gqlWithRetry(`
    mutation {
      createSimpleField(data: {
        modelId: "${modelId}"
        apiId: "${apiId}"
        displayName: "${displayName}"
        description: "${desc}"
        type: STRING
        isRequired: ${isRequired ? 'true' : 'false'}
        isUnique: false
        isList: ${isList ? 'true' : 'false'}
        isLocalized: false
      }) {
        migration { id }
      }
    }
  `);
  await sleep(3000);
}

async function addIntField(modelId, apiId, displayName, description, isRequired) {
  const desc = (description || '').replace(/"/g, '\\"');
  console.log(`  Adding field: ${apiId} (Int)`);
  await gqlWithRetry(`
    mutation {
      createSimpleField(data: {
        modelId: "${modelId}"
        apiId: "${apiId}"
        displayName: "${displayName}"
        description: "${desc}"
        type: INT
        isRequired: ${isRequired ? 'true' : 'false'}
        isUnique: false
        isList: false
        isLocalized: false
      }) {
        migration { id }
      }
    }
  `);
  await sleep(3000);
}

async function addAssetField(modelId, apiId, displayName, description) {
  const desc = (description || '').replace(/"/g, '\\"');
  console.log(`  Adding field: ${apiId} (Asset)`);
  await gqlWithRetry(`
    mutation {
      createRelationalField(data: {
        modelId: "${modelId}"
        apiId: "${apiId}"
        displayName: "${displayName}"
        description: "${desc}"
        type: ASSET
        isList: false
        isRequired: false
        reverseSide: { modelId: "${ASSET_MODEL_ID}" }
      }) {
        migration { id }
      }
    }
  `);
  await sleep(3000);
}

// ============================================================================
// Schema Definition
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Core Home Staging — Hygraph Schema Setup');
  console.log('='.repeat(60));

  // Test connection
  console.log('\nTesting API connection...');
  try {
    await gql('{ viewer { __typename } }');
    console.log('Connected!');
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // HeroSection
  // -------------------------------------------------------------------
  let id = await createModel('HeroSection', 'HeroSections', 'Hero Section', 'Main hero banner');
  if (id) {
    await addStringField(id, 'heading', 'Heading', 'Main hero headline', true, false);
    await addStringField(id, 'subtitle', 'Subtitle', 'Subheading text', false, false);
    await addStringField(id, 'primaryCtaText', 'Primary Button Text', '', false, false);
    await addStringField(id, 'primaryCtaLink', 'Primary Button Link', '', false, false);
    await addStringField(id, 'secondaryCtaText', 'Secondary Button Text', '', false, false);
    await addStringField(id, 'secondaryCtaLink', 'Secondary Button Link', '', false, false);
    await addAssetField(id, 'backgroundImage', 'Background Image', 'Hero background photo');
  }

  // -------------------------------------------------------------------
  // SocialProofStat
  // -------------------------------------------------------------------
  id = await createModel('SocialProofStat', 'SocialProofStats', 'Social Proof Stat', 'Stats shown in the social proof bar');
  if (id) {
    await addIntField(id, 'value', 'Number Value', 'The numeric value', true);
    await addStringField(id, 'prefix', 'Prefix', 'Text before the number', false, false);
    await addStringField(id, 'suffix', 'Suffix', 'Text after the number', false, false);
    await addStringField(id, 'label', 'Label', 'Description below the number', true, false);
    await addIntField(id, 'order', 'Display Order', 'Order of appearance', false);
  }

  // -------------------------------------------------------------------
  // WhyStagingSection
  // -------------------------------------------------------------------
  id = await createModel('WhyStagingSection', 'WhyStagingSections', 'Why Staging Section', 'The "Why Staging Matters" section');
  if (id) {
    await addStringField(id, 'eyebrow', 'Eyebrow Text', 'Small text above heading', false, false);
    await addStringField(id, 'heading', 'Heading', '', true, false);
    await addStringField(id, 'paragraphs', 'Paragraphs', 'Body text paragraphs', false, true);
    await addStringField(id, 'bulletPoints', 'Bullet Points', 'Checkmark bullet points', false, true);
    await addStringField(id, 'ctaText', 'CTA Text', 'Link text at the bottom', false, false);
    await addStringField(id, 'ctaLink', 'CTA Link', 'Link URL', false, false);
    await addAssetField(id, 'image', 'Section Image', 'Image beside the text');
  }

  // -------------------------------------------------------------------
  // Service
  // -------------------------------------------------------------------
  id = await createModel('Service', 'Services', 'Service', 'Individual service offerings');
  if (id) {
    await addStringField(id, 'title', 'Service Title', '', true, false);
    await addStringField(id, 'description', 'Description', 'Short description', true, false);
    await addAssetField(id, 'image', 'Service Image', '');
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // PortfolioItem
  // -------------------------------------------------------------------
  id = await createModel('PortfolioItem', 'PortfolioItems', 'Portfolio Item', 'Before/after portfolio comparisons');
  if (id) {
    await addStringField(id, 'label', 'Project Label', 'e.g. "Yorkville Condo — Living Room"', true, false);
    await addAssetField(id, 'beforeImage', 'Before Image', '');
    await addAssetField(id, 'afterImage', 'After Image', '');
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // ResultsSection
  // -------------------------------------------------------------------
  id = await createModel('ResultsSection', 'ResultsSections', 'Results Section', 'The "Numbers Don\'t Lie" section');
  if (id) {
    await addStringField(id, 'eyebrow', 'Eyebrow Text', '', false, false);
    await addStringField(id, 'heading', 'Heading', '', true, false);
  }

  // -------------------------------------------------------------------
  // ResultStat
  // -------------------------------------------------------------------
  id = await createModel('ResultStat', 'ResultStats', 'Result Stat', 'Individual stat in the Results section');
  if (id) {
    await addIntField(id, 'value', 'Number Value', '', true);
    await addStringField(id, 'prefix', 'Prefix', '', false, false);
    await addStringField(id, 'suffix', 'Suffix', '', false, false);
    await addStringField(id, 'label', 'Label', '', true, false);
    await addStringField(id, 'description', 'Description', 'Additional context', false, false);
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // HowItWorksStep
  // -------------------------------------------------------------------
  id = await createModel('HowItWorksStep', 'HowItWorksSteps', 'How It Works Step', 'Steps in the "How It Works" section');
  if (id) {
    await addStringField(id, 'title', 'Step Title', '', true, false);
    await addStringField(id, 'description', 'Step Description', '', true, false);
    await addIntField(id, 'order', 'Step Number', '1, 2, 3, or 4', true);
  }

  // -------------------------------------------------------------------
  // Testimonial
  // -------------------------------------------------------------------
  id = await createModel('Testimonial', 'Testimonials', 'Testimonial', 'Client testimonials');
  if (id) {
    await addStringField(id, 'quote', 'Quote', 'The testimonial text', true, false);
    await addStringField(id, 'authorName', 'Author Name', '', true, false);
    await addStringField(id, 'authorRole', 'Author Role', '', true, false);
    await addIntField(id, 'stars', 'Star Rating', 'Rating out of 5', false);
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // AboutSection
  // -------------------------------------------------------------------
  id = await createModel('AboutSection', 'AboutSections', 'About Section', 'The About / Team section');
  if (id) {
    await addStringField(id, 'eyebrow', 'Eyebrow Text', '', false, false);
    await addStringField(id, 'heading', 'Heading', '', true, false);
    await addStringField(id, 'paragraphs', 'Paragraphs', 'Body paragraphs', false, true);
    await addStringField(id, 'credentials', 'Credentials', 'List of credentials', false, true);
    await addAssetField(id, 'image', 'Team Photo', '');
  }

  // -------------------------------------------------------------------
  // ServiceArea
  // -------------------------------------------------------------------
  id = await createModel('ServiceArea', 'ServiceAreas', 'Service Area', 'Geographic regions served');
  if (id) {
    await addStringField(id, 'region', 'Region Name', 'e.g. "Toronto"', true, false);
    await addStringField(id, 'areas', 'Areas', 'Neighborhoods in this region', false, true);
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // Faq
  // -------------------------------------------------------------------
  id = await createModel('Faq', 'Faqs', 'FAQ', 'Frequently Asked Questions');
  if (id) {
    await addStringField(id, 'question', 'Question', '', true, false);
    await addStringField(id, 'answer', 'Answer', '', true, false);
    await addIntField(id, 'order', 'Display Order', '', false);
  }

  // -------------------------------------------------------------------
  // ContactInfo
  // -------------------------------------------------------------------
  id = await createModel('ContactInfo', 'ContactInfos', 'Contact Info', 'Contact section content');
  if (id) {
    await addStringField(id, 'eyebrow', 'Eyebrow Text', '', false, false);
    await addStringField(id, 'heading', 'Heading', '', false, false);
    await addStringField(id, 'description', 'Description', '', false, false);
    await addStringField(id, 'phone', 'Phone Number', '', false, false);
    await addStringField(id, 'email', 'Email Address', '', false, false);
    await addStringField(id, 'address', 'Address', '', false, false);
    await addStringField(id, 'instagramUrl', 'Instagram URL', '', false, false);
    await addStringField(id, 'facebookUrl', 'Facebook URL', '', false, false);
    await addStringField(id, 'pinterestUrl', 'Pinterest URL', '', false, false);
  }

  // -------------------------------------------------------------------
  // SiteSettings
  // -------------------------------------------------------------------
  id = await createModel('SiteSettings', 'SiteSettingsEntries', 'Site Settings', 'Global site settings');
  if (id) {
    await addStringField(id, 'siteName', 'Site Name', '', false, false);
    await addStringField(id, 'tagline', 'Tagline', '', false, false);
    await addStringField(id, 'footerDescription', 'Footer Description', '', false, false);
    await addStringField(id, 'formResponseNote', 'Form Response Note', '', false, false);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Schema setup complete!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Run: HYGRAPH_TOKEN=<token> node hygraph/seed.js');
  console.log('2. Update js/cms-config.js with your Content API endpoint');
  console.log('   https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master');
  console.log('');
}

main().catch(err => {
  console.error('\nSetup failed:', err.message);
  process.exit(1);
});
