/**
 * Core Home Staging - Hygraph CMS Content Loader
 *
 * Fetches content from Hygraph's GraphQL Content API and hydrates the page.
 * Falls back gracefully to the hardcoded HTML if the CMS is not configured
 * or if the fetch fails.
 */
(function () {
  'use strict';

  // Check if CMS is configured and enabled
  if (typeof CMS_CONFIG === 'undefined' || !CMS_CONFIG.enabled || !CMS_CONFIG.endpoint) {
    return;
  }

  var endpoint = CMS_CONFIG.endpoint;
  var isPreview = window.location.search.indexOf('preview=true') !== -1 ||
                  window.self !== window.top;

  // ========================================================================
  // GraphQL Query - fetches all page content in a single request
  // SYNC: When changing fields, update BOTH js/cms.js and hygraph/build.js
  // ========================================================================

  var STAGE = isPreview ? 'DRAFT' : 'PUBLISHED';

  var QUERY = '{\n' +
    '  heroSections(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    heading\n' +
    '    subtitle\n' +
    '    primaryCtaText\n' +
    '    primaryCtaLink\n' +
    '    secondaryCtaText\n' +
    '    secondaryCtaLink\n' +
    '    backgroundImage {\n' +
    '      url(transformation: {image: {resize: {width: 1920, height: 1080, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  socialProofStats(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    value\n' +
    '    suffix\n' +
    '    prefix\n' +
    '    label\n' +
    '  }\n' +
    '  whyStagingSections(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '    paragraphs\n' +
    '    bulletPoints\n' +
    '    ctaText\n' +
    '    ctaLink\n' +
    '    image {\n' +
    '      url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  services(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    title\n' +
    '    description\n' +
    '    image {\n' +
    '      url(transformation: {image: {resize: {width: 600, height: 400, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  portfolioItems(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    label\n' +
    '    beforeImage {\n' +
    '      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})\n' +
    '    }\n' +
    '    afterImage {\n' +
    '      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  resultsSections(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '  }\n' +
    '  resultStats(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    value\n' +
    '    suffix\n' +
    '    prefix\n' +
    '    label\n' +
    '    description\n' +
    '  }\n' +
    '  howItWorksSteps(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    title\n' +
    '    description\n' +
    '  }\n' +
    '  testimonials(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    quote\n' +
    '    authorName\n' +
    '    authorRole\n' +
    '    stars\n' +
    '  }\n' +
    '  aboutSections(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '    paragraphs\n' +
    '    credentials\n' +
    '    image {\n' +
    '      url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  serviceAreas(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    region\n' +
    '    areas\n' +
    '  }\n' +
    '  faqs(stage: ' + STAGE + ', orderBy: order_ASC) {\n' +
    '    id\n' +
    '    question\n' +
    '    answer\n' +
    '  }\n' +
    '  contactInfos(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '    description\n' +
    '    phone\n' +
    '    email\n' +
    '    address\n' +
    '    instagramUrl\n' +
    '    facebookUrl\n' +
    '    pinterestUrl\n' +
    '  }\n' +
    '  siteSettingsEntries(first: 1, stage: ' + STAGE + ') {\n' +
    '    id\n' +
    '    siteName\n' +
    '    tagline\n' +
    '    footerDescription\n' +
    '    formResponseNote\n' +
    '  }\n' +
    '}';

  // ========================================================================
  // Fetch from Hygraph
  // ========================================================================

  var CACHE_KEY = 'cms_cache_v1';
  var CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  function fetchFromAPI() {
    // Skip cache in preview mode — editors need fresh data
    if (!isPreview) {
      try {
        var cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          var entry = JSON.parse(cached);
          if (Date.now() - entry.ts < CACHE_TTL) {
            return Promise.resolve(entry.data);
          }
        }
      } catch (e) {}
    }

    var headers = { 'Content-Type': 'application/json' };
    if (isPreview && CMS_CONFIG.previewToken) {
      headers['Authorization'] = 'Bearer ' + CMS_CONFIG.previewToken;
    }

    return fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ query: QUERY })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('CMS fetch failed: ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json.errors) {
          console.warn('Hygraph query errors:', json.errors);
          return null;
        }
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: json.data }));
        } catch (e) {}
        return json.data;
      })
      .catch(function (err) {
        console.warn('CMS not available, using static content:', err.message);
        return null;
      });
  }

  function fetchCMS() {
    // In preview mode (Hygraph sidebar or ?preview=true), always fetch live
    // content so editors see current data, not stale build-time snapshots.
    if (isPreview) return fetchFromAPI();

    // In deployed builds, cms-data.json is generated at build time — use it
    // to avoid any runtime API calls. Falls back to live API in local dev.
    return fetch('/cms-data.json')
      .then(function (res) {
        if (!res.ok) throw new Error('no build data');
        return res.json();
      })
      .catch(function () {
        return fetchFromAPI();
      });
  }

  // ========================================================================
  // Helper utilities
  // ========================================================================

  function setText(selector, text) {
    var el = document.querySelector(selector);
    if (el && text != null) el.textContent = text;
  }

  function setHTML(selector, html) {
    var el = document.querySelector(selector);
    if (el && html != null) el.innerHTML = html;
  }

  function setAttr(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el && value != null) el.setAttribute(attr, value);
  }

  function setAllAttr(selector, attr, value) {
    var els = document.querySelectorAll(selector);
    els.forEach(function (el) {
      if (value != null) el.setAttribute(attr, value);
    });
  }

  function createStarsSVG(count) {
    var star = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    var html = '';
    for (var i = 0; i < count; i++) html += star;
    return html;
  }

  function createCheckSVG() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  }

  function createChevronSVG() {
    return '<svg class="faq-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  }

  function formatPhone(phone) {
    if (!phone) return '';
    var digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6);
    }
    if (digits.length === 11 && digits[0] === '1') {
      return '(' + digits.slice(1, 4) + ') ' + digits.slice(4, 7) + '-' + digits.slice(7);
    }
    return phone;
  }

  function phoneHref(phone) {
    if (!phone) return '#';
    return 'tel:+' + phone.replace(/\D/g, '');
  }

  function setEditAttr(el, entryId, fieldApiId) {
    if (!el || !entryId) return;
    el.setAttribute('data-hygraph-entry-id', entryId);
    if (fieldApiId) el.setAttribute('data-hygraph-field-api-id', fieldApiId);
  }

  // ========================================================================
  // Content hydration functions
  // ========================================================================

  function hydrateHero(data) {
    if (!data) return;
    var hero = data[0] || data;

    if (hero.heading) {
      setText('.hero-content h1', hero.heading);
      setEditAttr(document.querySelector('.hero-content h1'), hero.id, 'heading');
    }
    if (hero.subtitle) {
      setText('.hero-subtitle', hero.subtitle);
      setEditAttr(document.querySelector('.hero-subtitle'), hero.id, 'subtitle');
    }
    if (hero.primaryCtaText) {
      var primaryBtn = document.querySelector('.hero-ctas .btn--primary');
      if (primaryBtn) primaryBtn.textContent = hero.primaryCtaText;
      setEditAttr(primaryBtn, hero.id, 'primaryCtaText');
    }
    if (hero.primaryCtaLink) {
      setAttr('.hero-ctas .btn--primary', 'href', hero.primaryCtaLink);
    }
    if (hero.secondaryCtaText) {
      var secondaryBtn = document.querySelector('.hero-ctas .btn--outline');
      if (secondaryBtn) secondaryBtn.textContent = hero.secondaryCtaText;
      setEditAttr(secondaryBtn, hero.id, 'secondaryCtaText');
    }
    if (hero.secondaryCtaLink) {
      setAttr('.hero-ctas .btn--outline', 'href', hero.secondaryCtaLink);
    }
    if (hero.backgroundImage && hero.backgroundImage.url) {
      var heroImg = document.querySelector('.hero-bg img');
      if (heroImg) heroImg.src = hero.backgroundImage.url;
    }
  }

  function hydrateSocialProof(stats) {
    if (!stats || !stats.length) return;
    var grid = document.querySelector('.social-proof-grid');
    if (!grid) return;

    grid.innerHTML = '';
    stats.forEach(function (stat) {
      var format = '';
      var parts = [];
      if (stat.prefix) parts.push('prefix:' + stat.prefix);
      if (stat.suffix) parts.push('suffix:' + stat.suffix);
      format = parts.join(';');

      var div = document.createElement('div');
      div.className = 'stat-item';
      setEditAttr(div, stat.id);

      // Note: innerHTML here uses CMS-managed content from Hygraph (trusted source)
      var numDiv = document.createElement('div');
      numDiv.className = 'stat-number';
      numDiv.setAttribute('data-target', stat.value);
      if (format) numDiv.setAttribute('data-format', format);
      numDiv.textContent = '0';
      setEditAttr(numDiv, stat.id, 'value');

      var labelDiv = document.createElement('div');
      labelDiv.className = 'stat-label';
      labelDiv.textContent = stat.label;
      setEditAttr(labelDiv, stat.id, 'label');

      div.appendChild(numDiv);
      div.appendChild(labelDiv);
      grid.appendChild(div);
    });

    // Re-observe counters
    if (window._reobserveCounters) window._reobserveCounters();
  }

  function hydrateWhyStaging(data) {
    if (!data) return;
    var section = data[0] || data;

    if (section.eyebrow) {
      setText('.why-staging .eyebrow', section.eyebrow);
      setEditAttr(document.querySelector('.why-staging .eyebrow'), section.id, 'eyebrow');
    }
    if (section.heading) {
      setText('.why-staging h2', section.heading);
      setEditAttr(document.querySelector('.why-staging h2'), section.id, 'heading');
    }

    if (section.paragraphs && section.paragraphs.length) {
      var textContainer = document.querySelector('.why-staging-text');
      if (textContainer) {
        setEditAttr(textContainer, section.id, 'paragraphs');
        var existingParagraphs = textContainer.querySelectorAll(':scope > p:not(.eyebrow)');
        existingParagraphs.forEach(function (p, i) {
          if (section.paragraphs[i]) p.textContent = section.paragraphs[i];
        });
      }
    }

    if (section.bulletPoints && section.bulletPoints.length) {
      var pointsContainer = document.querySelector('.why-staging-points');
      if (pointsContainer) {
        setEditAttr(pointsContainer, section.id, 'bulletPoints');
        pointsContainer.innerHTML = '';
        section.bulletPoints.forEach(function (point) {
          var div = document.createElement('div');
          div.className = 'why-staging-point';
          div.innerHTML = createCheckSVG() + '<span>' + point + '</span>';
          pointsContainer.appendChild(div);
        });
      }
    }

    if (section.image && section.image.url) {
      var img = document.querySelector('.why-staging-image img');
      if (img) img.src = section.image.url;
    }
  }

  function hydrateServices(services) {
    if (!services || !services.length) return;
    var grid = document.querySelector('.services-grid');
    if (!grid) return;

    grid.innerHTML = '';
    services.forEach(function (service, i) {
      var delay = (i % 3) + 1;
      var card = document.createElement('div');
      card.className = 'service-card reveal';
      card.setAttribute('data-delay', delay);
      setEditAttr(card, service.id);

      var imgUrl = service.image ? service.image.url : '';

      var imgWrap = document.createElement('div');
      imgWrap.className = 'service-card-image';
      var img = document.createElement('img');
      img.src = imgUrl;
      img.alt = service.title;
      img.loading = 'lazy';
      img.width = 600;
      img.height = 400;
      imgWrap.appendChild(img);

      var body = document.createElement('div');
      body.className = 'service-card-body';
      var h3 = document.createElement('h3');
      h3.textContent = service.title;
      setEditAttr(h3, service.id, 'title');
      var p = document.createElement('p');
      p.textContent = service.description;
      setEditAttr(p, service.id, 'description');
      body.appendChild(h3);
      body.appendChild(p);

      card.appendChild(imgWrap);
      card.appendChild(body);
      grid.appendChild(card);
    });

    // Make new cards visible (they missed the initial reveal observer)
    grid.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('reveal--visible');
    });
  }

  function hydratePortfolio(items) {
    if (!items || !items.length) return;
    var grid = document.querySelector('.portfolio-grid');
    if (!grid) return;

    grid.innerHTML = '';
    items.forEach(function (item, i) {
      var delay = (i % 2) + 1;
      var wrapper = document.createElement('div');
      wrapper.className = 'reveal reveal--visible';
      wrapper.setAttribute('data-delay', delay);
      setEditAttr(wrapper, item.id);

      var beforeUrl = item.beforeImage ? item.beforeImage.url : '';
      var afterUrl = item.afterImage ? item.afterImage.url : '';

      wrapper.innerHTML =
        '<div class="ba-slider" data-slider>' +
        '<img class="ba-after" src="' + afterUrl + '" alt="After staging - ' + item.label + '" loading="lazy" width="800" height="600">' +
        '<div class="ba-before-wrapper">' +
        '<img class="ba-before" src="' + beforeUrl + '" alt="Before staging - ' + item.label + '" loading="lazy" width="800" height="600">' +
        '</div>' +
        '<span class="ba-label ba-label--before">Before</span>' +
        '<span class="ba-label ba-label--after">After</span>' +
        '<div class="ba-handle" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-label="Before and after comparison slider" tabindex="0">' +
        '<span class="ba-handle-line"></span>' +
        '<span class="ba-handle-circle"></span>' +
        '<span class="ba-handle-line"></span>' +
        '</div>' +
        '</div>' +
        '<p class="portfolio-item-label">' + item.label + '</p>';
      grid.appendChild(wrapper);

      // Tag label element after innerHTML is set
      var labelEl = wrapper.querySelector('.portfolio-item-label');
      setEditAttr(labelEl, item.id, 'label');
    });

    // Re-initialize sliders
    if (window._reinitSliders) window._reinitSliders();
  }

  function hydrateResults(data) {
    if (!data) return;
    var section = data[0] || data;

    if (section.eyebrow) {
      setText('.results .eyebrow', section.eyebrow);
      setEditAttr(document.querySelector('.results .eyebrow'), section.id, 'eyebrow');
    }
    if (section.heading) {
      setText('.results h2', section.heading);
      setEditAttr(document.querySelector('.results h2'), section.id, 'heading');
    }

    if (section.stats && section.stats.length) {
      var grid = document.querySelector('.results-grid');
      if (!grid) return;

      grid.innerHTML = '';
      section.stats.forEach(function (stat, i) {
        var delay = i + 1;
        var div = document.createElement('div');
        div.className = 'result-item reveal reveal--visible';
        div.setAttribute('data-delay', delay);
        setEditAttr(div, stat.id);

        var format = '';
        var parts = [];
        if (stat.prefix) parts.push('prefix:' + stat.prefix);
        if (stat.suffix) parts.push('suffix:' + stat.suffix);
        format = parts.join(';');

        var prefixHtml = stat.prefix && stat.prefix.length > 1
          ? '<div class="result-prefix">' + stat.prefix + '</div>'
          : '';

        var dataFormat = stat.suffix ? 'suffix:' + stat.suffix : '';
        if (stat.prefix && stat.prefix.length <= 1) {
          dataFormat = (dataFormat ? dataFormat + ';' : '') + 'prefix:' + stat.prefix;
        }

        div.innerHTML =
          prefixHtml +
          '<div class="result-number" data-target="' + stat.value + '"' +
          (dataFormat ? ' data-format="' + dataFormat + '"' : '') +
          '>0</div>' +
          '<div class="result-label">' + stat.label + '</div>' +
          (stat.description ? '<div class="result-desc">' + stat.description + '</div>' : '');
        grid.appendChild(div);

        // Tag inner elements after innerHTML
        var numEl = div.querySelector('.result-number');
        setEditAttr(numEl, stat.id, 'value');
        var labelEl = div.querySelector('.result-label');
        setEditAttr(labelEl, stat.id, 'label');
      });

      if (window._reobserveCounters) window._reobserveCounters();
    }
  }

  function hydrateHowItWorks(steps) {
    if (!steps || !steps.length) return;
    var container = document.querySelector('.steps');
    if (!container) return;

    container.innerHTML = '';
    steps.forEach(function (step, i) {
      var div = document.createElement('div');
      div.className = 'step reveal reveal--visible';
      div.setAttribute('data-delay', i + 1);
      setEditAttr(div, step.id);

      var numDiv = document.createElement('div');
      numDiv.className = 'step-number';
      numDiv.textContent = i + 1;

      var h3 = document.createElement('h3');
      h3.textContent = step.title;
      setEditAttr(h3, step.id, 'title');

      var p = document.createElement('p');
      p.textContent = step.description;
      setEditAttr(p, step.id, 'description');

      div.appendChild(numDiv);
      div.appendChild(h3);
      div.appendChild(p);
      container.appendChild(div);
    });
  }

  function hydrateTestimonials(testimonials) {
    if (!testimonials || !testimonials.length) return;
    var grid = document.querySelector('.testimonials-grid');
    if (!grid) return;

    grid.innerHTML = '';
    testimonials.forEach(function (t, i) {
      var delay = i + 1;
      var card = document.createElement('div');
      card.className = 'testimonial-card reveal reveal--visible';
      card.setAttribute('data-delay', delay);
      setEditAttr(card, t.id);
      card.innerHTML =
        '<div class="testimonial-quote-mark" aria-hidden="true">&ldquo;</div>' +
        '<p class="testimonial-text">' + t.quote + '</p>' +
        '<div class="testimonial-stars" aria-label="' + t.stars + ' out of 5 stars">' +
        createStarsSVG(t.stars) +
        '</div>' +
        '<p class="testimonial-author">' + t.authorName + '</p>' +
        '<p class="testimonial-role">' + t.authorRole + '</p>';
      grid.appendChild(card);

      // Tag inner elements after innerHTML
      setEditAttr(card.querySelector('.testimonial-text'), t.id, 'quote');
      setEditAttr(card.querySelector('.testimonial-author'), t.id, 'authorName');
    });

    // Update dots
    var dotsContainer = document.querySelector('.testimonial-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      testimonials.forEach(function (_, i) {
        var btn = document.createElement('button');
        btn.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
        btn.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
        dotsContainer.appendChild(btn);
      });

      // Re-bind dot click handlers
      if (window._reinitTestimonialDots) window._reinitTestimonialDots();
    }
  }

  function hydrateAbout(data) {
    if (!data) return;
    var section = data[0] || data;

    if (section.eyebrow) {
      setText('.about .eyebrow', section.eyebrow);
      setEditAttr(document.querySelector('.about .eyebrow'), section.id, 'eyebrow');
    }
    if (section.heading) {
      setText('.about h2', section.heading);
      setEditAttr(document.querySelector('.about h2'), section.id, 'heading');
    }

    if (section.paragraphs && section.paragraphs.length) {
      var textContainer = document.querySelector('.about-text');
      if (textContainer) {
        setEditAttr(textContainer, section.id, 'paragraphs');
        var existingParagraphs = textContainer.querySelectorAll(':scope > p');
        existingParagraphs.forEach(function (p, i) {
          if (section.paragraphs[i]) p.textContent = section.paragraphs[i];
        });
      }
    }

    if (section.credentials && section.credentials.length) {
      var credsContainer = document.querySelector('.about-credentials');
      if (credsContainer) {
        setEditAttr(credsContainer, section.id, 'credentials');
        credsContainer.innerHTML = '';
        section.credentials.forEach(function (cred) {
          var div = document.createElement('div');
          div.className = 'credential';
          div.innerHTML = createCheckSVG() + ' ' + cred;
          credsContainer.appendChild(div);
        });
      }
    }

    if (section.image && section.image.url) {
      var img = document.querySelector('.about-image img');
      if (img) img.src = section.image.url;
    }
  }

  function hydrateServiceAreas(areas) {
    if (!areas || !areas.length) return;
    var container = document.querySelector('.area-regions');
    if (!container) return;

    container.innerHTML = '';
    areas.forEach(function (area) {
      var div = document.createElement('div');
      div.className = 'area-region';
      setEditAttr(div, area.id);

      var h3 = document.createElement('h3');
      h3.textContent = area.region;
      setEditAttr(h3, area.id, 'region');

      var ul = document.createElement('ul');
      setEditAttr(ul, area.id, 'areas');
      if (area.areas && area.areas.length) {
        area.areas.forEach(function (a) {
          var li = document.createElement('li');
          li.textContent = a;
          ul.appendChild(li);
        });
      }

      div.appendChild(h3);
      div.appendChild(ul);
      container.appendChild(div);
    });
  }

  function hydrateFAQs(faqs) {
    if (!faqs || !faqs.length) return;
    var list = document.querySelector('.faq-list');
    if (!list) return;

    list.innerHTML = '';
    faqs.forEach(function (faq) {
      var details = document.createElement('details');
      details.className = 'faq-item reveal reveal--visible';
      setEditAttr(details, faq.id);
      details.innerHTML =
        '<summary>' +
        faq.question +
        createChevronSVG() +
        '</summary>' +
        '<div class="faq-answer"><p>' + faq.answer + '</p></div>';
      list.appendChild(details);

      // Tag inner elements after innerHTML
      setEditAttr(details.querySelector('summary'), faq.id, 'question');
      setEditAttr(details.querySelector('.faq-answer'), faq.id, 'answer');
    });

    // Re-bind accordion behavior
    list.querySelectorAll('.faq-item').forEach(function (det) {
      det.addEventListener('toggle', function () {
        if (this.open) {
          list.querySelectorAll('.faq-item').forEach(function (other) {
            if (other !== det && other.open) other.open = false;
          });
        }
      });
    });
  }

  function hydrateContact(data) {
    if (!data) return;
    var info = data[0] || data;

    if (info.eyebrow) {
      var eyebrowEl = document.querySelector('.contact-info .eyebrow');
      if (eyebrowEl) {
        eyebrowEl.textContent = info.eyebrow;
        setEditAttr(eyebrowEl, info.id, 'eyebrow');
      }
    }
    if (info.heading) {
      setText('.contact-info h2', info.heading);
      setEditAttr(document.querySelector('.contact-info h2'), info.id, 'heading');
    }
    if (info.description) {
      var descP = document.querySelector('.contact-info > p');
      if (descP) {
        descP.textContent = info.description;
        setEditAttr(descP, info.id, 'description');
      }
    }

    if (info.phone) {
      var phoneDisplay = formatPhone(info.phone);
      var phoneLink = phoneHref(info.phone);

      // Update all phone links on the page
      document.querySelectorAll('.header-phone').forEach(function (el) {
        el.href = phoneLink;
        // Keep the SVG, update text
        var textNodes = [];
        el.childNodes.forEach(function (node) {
          if (node.nodeType === 3) textNodes.push(node);
        });
        if (textNodes.length) textNodes[textNodes.length - 1].textContent = '\n        ' + phoneDisplay + '\n      ';
      });

      var contactPhoneLink = document.querySelector('.contact-details a[href^="tel:"]');
      if (contactPhoneLink) {
        contactPhoneLink.href = phoneLink;
        var phoneTextNodes = [];
        contactPhoneLink.childNodes.forEach(function (node) {
          if (node.nodeType === 3) phoneTextNodes.push(node);
        });
        if (phoneTextNodes.length) phoneTextNodes[phoneTextNodes.length - 1].textContent = '\n                ' + phoneDisplay + '\n              ';
        setEditAttr(contactPhoneLink, info.id, 'phone');
      }

      // Mobile nav phone
      var mobilePhone = document.querySelector('.mobile-nav-contact a[href^="tel:"]');
      if (mobilePhone) {
        mobilePhone.href = phoneLink;
        mobilePhone.textContent = phoneDisplay;
      }
    }

    if (info.email) {
      var emailLink = document.querySelector('.contact-details a[href^="mailto:"]');
      if (emailLink) {
        emailLink.href = 'mailto:' + info.email;
        var emailTextNodes = [];
        emailLink.childNodes.forEach(function (node) {
          if (node.nodeType === 3) emailTextNodes.push(node);
        });
        if (emailTextNodes.length) emailTextNodes[emailTextNodes.length - 1].textContent = '\n                ' + info.email + '\n              ';
        setEditAttr(emailLink, info.id, 'email');
      }
    }

    if (info.instagramUrl) {
      setAttr('.contact-social a[aria-label*="Instagram"]', 'href', info.instagramUrl);
      setAttr('.footer-social a[aria-label*="Instagram"]', 'href', info.instagramUrl);
    }
    if (info.facebookUrl) {
      setAttr('.contact-social a[aria-label*="Facebook"]', 'href', info.facebookUrl);
      setAttr('.footer-social a[aria-label*="Facebook"]', 'href', info.facebookUrl);
    }
    if (info.pinterestUrl) {
      setAttr('.contact-social a[aria-label*="Pinterest"]', 'href', info.pinterestUrl);
      setAttr('.footer-social a[aria-label*="Pinterest"]', 'href', info.pinterestUrl);
    }
  }

  function hydrateSiteSettings(data) {
    if (!data) return;
    var settings = data[0] || data;

    if (settings.footerDescription) {
      var footerDesc = document.querySelector('.footer-brand > p');
      if (footerDesc) footerDesc.textContent = settings.footerDescription;
      setEditAttr(footerDesc, settings.id, 'footerDescription');
    }
    if (settings.formResponseNote) {
      var formNote = document.querySelector('.form-note');
      if (formNote) formNote.textContent = settings.formResponseNote;
      setEditAttr(formNote, settings.id, 'formResponseNote');
    }
  }

  // ========================================================================
  // Main: fetch and hydrate
  // ========================================================================

  function hydrateAll(data) {
    if (!data) return;
    try {
      if (data.heroSections) hydrateHero(data.heroSections);
      if (data.socialProofStats) hydrateSocialProof(data.socialProofStats);
      if (data.whyStagingSections) hydrateWhyStaging(data.whyStagingSections);
      if (data.services) hydrateServices(data.services);
      if (data.portfolioItems) hydratePortfolio(data.portfolioItems);
      if (data.resultsSections && data.resultsSections.length) hydrateResults(Object.assign({}, data.resultsSections[0], { stats: data.resultStats }));
      if (data.howItWorksSteps) hydrateHowItWorks(data.howItWorksSteps);
      if (data.testimonials) hydrateTestimonials(data.testimonials);
      if (data.aboutSections) hydrateAbout(data.aboutSections);
      if (data.serviceAreas) hydrateServiceAreas(data.serviceAreas);
      if (data.faqs) hydrateFAQs(data.faqs);
      if (data.contactInfos) hydrateContact(data.contactInfos);
      if (data.siteSettingsEntries) hydrateSiteSettings(data.siteSettingsEntries);
    } catch (err) {
      console.warn('CMS hydration error:', err);
    }
  }

  fetchCMS().then(hydrateAll);

  // Expose re-hydration for preview mode (used by preview.js on save events)
  window._cmsRehydrate = function () {
    fetchFromAPI().then(hydrateAll);
  };
})();
