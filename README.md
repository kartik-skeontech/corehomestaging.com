# Core Home Staging

Marketing website for Core Home Staging — a professional home staging company serving the Greater Toronto Area.

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS — no build step, no framework
- **CMS:** [Hygraph](https://hygraph.com) (GraphQL headless CMS)
- **Hosting:** Static (Cloudflare, Netlify, Vercel, etc.)

## Project Structure

```
├── index.html              # Single-page website
├── css/                    # Stylesheets
├── js/
│   ├── cms-config.js       # Hygraph endpoint + enabled flag
│   ├── cms.js              # Fetches content from Hygraph and hydrates page
│   └── main.js             # UI interactions (sliders, counters, animations)
├── images/                 # Static images (fallback / placeholders)
├── fonts/                  # Self-hosted fonts
└── hygraph/
    ├── setup.js            # Creates all content models in Hygraph
    └── seed.js             # Populates Hygraph with initial content
```

## Hygraph CMS

### Project details

| Setting | Value |
|---|---|
| Region | US West 2 |
| Environment | master |
| Content API | `https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master` |
| Management API | `https://management-us-west-2.hygraph.com/graphql` |

### Content Models

| Model | Description |
|---|---|
| `HeroSection` | Main hero banner (heading, CTAs, background image) |
| `SocialProofStat` | Animated stat counters in the trust bar |
| `WhyStagingSection` | "Why Staging Matters" section |
| `Service` | Individual service offerings (6 total) |
| `PortfolioItem` | Before/after comparisons (images uploaded in dashboard) |
| `ResultsSection` | "Numbers Don't Lie" section header |
| `ResultStat` | Individual stats in the results section |
| `HowItWorksStep` | 4-step process section |
| `Testimonial` | Client testimonials with star ratings |
| `AboutSection` | About / team section |
| `ServiceArea` | Geographic regions served |
| `Faq` | FAQ accordion items |
| `ContactInfo` | Contact details and social links |
| `SiteSettings` | Global site name, tagline, footer text |

### Setup from scratch

> **Prerequisite:** Generate an **MCP PAT** in Hygraph Dashboard → Project Settings → API Access → Permanent Auth Tokens → Generate MCP PAT.

```bash
# 1. Create all content models and fields
HYGRAPH_TOKEN=<your-mcp-pat> node hygraph/setup.js

# 2. Seed initial content (all entries auto-published)
HYGRAPH_TOKEN=<your-mcp-pat> node hygraph/seed.js
```

After seeding, enable the Public Content API in the Hygraph dashboard or via the Management API so the website can read content without authentication.

### CMS configuration

`js/cms-config.js` controls whether the CMS is active:

```js
var CMS_CONFIG = {
  endpoint: 'https://us-west-2.cdn.hygraph.com/content/...',
  enabled: true   // set to false to use hardcoded HTML fallback
};
```

The CMS loads gracefully — if the endpoint is unreachable or `enabled` is `false`, the page falls back to the static HTML content already in `index.html`.

### Editing content

All site content is editable in the [Hygraph Dashboard](https://app.hygraph.com):
- Text, headings, CTAs, stats → edit entries directly
- Images (hero background, portfolio before/after, service photos) → upload via the **Assets** panel, then link to the relevant entry
- After editing, click **Publish** on each entry for changes to go live

The MCP integration (configured in Claude.ai) allows editing content directly via AI — e.g. "update the hero heading to X" or "add a new FAQ".

## Development

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```
