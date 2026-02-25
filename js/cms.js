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

  // ========================================================================
  // GraphQL Query - fetches all page content in a single request
  // ========================================================================

  var QUERY = '{\n' +
    '  heroSections(first: 1, stage: PUBLISHED) {\n' +
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
    '  socialProofStats(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    value\n' +
    '    suffix\n' +
    '    prefix\n' +
    '    label\n' +
    '  }\n' +
    '  whyStagingSections(first: 1, stage: PUBLISHED) {\n' +
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
    '  services(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    title\n' +
    '    description\n' +
    '    image {\n' +
    '      url(transformation: {image: {resize: {width: 600, height: 400, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  portfolioItems(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    label\n' +
    '    beforeImage {\n' +
    '      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})\n' +
    '    }\n' +
    '    afterImage {\n' +
    '      url(transformation: {image: {resize: {width: 800, height: 600, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  resultsSections(first: 1, stage: PUBLISHED) {\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '  }\n' +
    '  resultStats(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    value\n' +
    '    suffix\n' +
    '    prefix\n' +
    '    label\n' +
    '    description\n' +
    '  }\n' +
    '  howItWorksSteps(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    title\n' +
    '    description\n' +
    '  }\n' +
    '  testimonials(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    quote\n' +
    '    authorName\n' +
    '    authorRole\n' +
    '    stars\n' +
    '  }\n' +
    '  aboutSections(first: 1, stage: PUBLISHED) {\n' +
    '    eyebrow\n' +
    '    heading\n' +
    '    paragraphs\n' +
    '    credentials\n' +
    '    image {\n' +
    '      url(transformation: {image: {resize: {width: 600, height: 750, fit: crop}}})\n' +
    '    }\n' +
    '  }\n' +
    '  serviceAreas(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    region\n' +
    '    areas\n' +
    '  }\n' +
    '  faqs(stage: PUBLISHED, orderBy: order_ASC) {\n' +
    '    question\n' +
    '    answer\n' +
    '  }\n' +
    '  contactInfos(first: 1, stage: PUBLISHED) {\n' +
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
    '  siteSettingsEntries(first: 1, stage: PUBLISHED) {\n' +
    '    siteName\n' +
    '    tagline\n' +
    '    footerDescription\n' +
    '    formResponseNote\n' +
    '  }\n' +
    '}';

  // ========================================================================
  // Fetch from Hygraph
  // ========================================================================

  function fetchCMS() {
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        return json.data;
      })
      .catch(function (err) {
        console.warn('CMS not available, using static content:', err.message);
        return null;
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

  // ========================================================================
  // Content hydration functions
  // ========================================================================

  function hydrateHero(data) {
    if (!data) return;
    var hero = data[0] || data;

    if (hero.heading) {
      setText('.hero-content h1', hero.heading);
    }
    if (hero.subtitle) {
      setText('.hero-subtitle', hero.subtitle);
    }
    if (hero.primaryCtaText) {
      var primaryBtn = document.querySelector('.hero-ctas .btn--primary');
      if (primaryBtn) primaryBtn.textContent = hero.primaryCtaText;
    }
    if (hero.primaryCtaLink) {
      setAttr('.hero-ctas .btn--primary', 'href', hero.primaryCtaLink);
    }
    if (hero.secondaryCtaText) {
      var secondaryBtn = document.querySelector('.hero-ctas .btn--outline');
      if (secondaryBtn) secondaryBtn.textContent = hero.secondaryCtaText;
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
      div.innerHTML =
        '<div class="stat-number" data-target="' + stat.value + '"' +
        (format ? ' data-format="' + format + '"' : '') +
        '>0</div>' +
        '<div class="stat-label">' + stat.label + '</div>';
      grid.appendChild(div);
    });

    // Re-observe counters
    if (window._reobserveCounters) window._reobserveCounters();
  }

  function hydrateWhyStaging(data) {
    if (!data) return;
    var section = data[0] || data;

    if (section.eyebrow) setText('.why-staging .eyebrow', section.eyebrow);
    if (section.heading) setText('.why-staging h2', section.heading);

    if (section.paragraphs && section.paragraphs.length) {
      var textContainer = document.querySelector('.why-staging-text');
      if (textContainer) {
        var existingParagraphs = textContainer.querySelectorAll(':scope > p:not(.eyebrow)');
        existingParagraphs.forEach(function (p, i) {
          if (section.paragraphs[i]) p.textContent = section.paragraphs[i];
        });
      }
    }

    if (section.bulletPoints && section.bulletPoints.length) {
      var pointsContainer = document.querySelector('.why-staging-points');
      if (pointsContainer) {
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

      var imgUrl = service.image ? service.image.url : '';
      card.innerHTML =
        '<div class="service-card-image">' +
        '<img src="' + imgUrl + '" alt="' + service.title + '" loading="lazy" width="600" height="400">' +
        '</div>' +
        '<div class="service-card-body">' +
        '<h3>' + service.title + '</h3>' +
        '<p>' + service.description + '</p>' +
        '</div>';
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
    });

    // Re-initialize sliders
    if (window._reinitSliders) window._reinitSliders();
  }

  function hydrateResults(data) {
    if (!data) return;
    var section = data[0] || data;

    if (section.eyebrow) setText('.results .eyebrow', section.eyebrow);
    if (section.heading) setText('.results h2', section.heading);

    if (section.stats && section.stats.length) {
      var grid = document.querySelector('.results-grid');
      if (!grid) return;

      grid.innerHTML = '';
      section.stats.forEach(function (stat, i) {
        var delay = i + 1;
        var div = document.createElement('div');
        div.className = 'result-item reveal reveal--visible';
        div.setAttribute('data-delay', delay);

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
      div.innerHTML =
        '<div class="step-number">' + (i + 1) + '</div>' +
        '<h3>' + step.title + '</h3>' +
        '<p>' + step.description + '</p>';
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
      card.innerHTML =
        '<div class="testimonial-quote-mark" aria-hidden="true">&ldquo;</div>' +
        '<p class="testimonial-text">' + t.quote + '</p>' +
        '<div class="testimonial-stars" aria-label="' + t.stars + ' out of 5 stars">' +
        createStarsSVG(t.stars) +
        '</div>' +
        '<p class="testimonial-author">' + t.authorName + '</p>' +
        '<p class="testimonial-role">' + t.authorRole + '</p>';
      grid.appendChild(card);
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

    if (section.eyebrow) setText('.about .eyebrow', section.eyebrow);
    if (section.heading) setText('.about h2', section.heading);

    if (section.paragraphs && section.paragraphs.length) {
      var textContainer = document.querySelector('.about-text');
      if (textContainer) {
        var existingParagraphs = textContainer.querySelectorAll(':scope > p');
        existingParagraphs.forEach(function (p, i) {
          if (section.paragraphs[i]) p.textContent = section.paragraphs[i];
        });
      }
    }

    if (section.credentials && section.credentials.length) {
      var credsContainer = document.querySelector('.about-credentials');
      if (credsContainer) {
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
      var listItems = '';
      if (area.areas && area.areas.length) {
        area.areas.forEach(function (a) {
          listItems += '<li>' + a + '</li>';
        });
      }
      div.innerHTML = '<h3>' + area.region + '</h3><ul>' + listItems + '</ul>';
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
      details.innerHTML =
        '<summary>' +
        faq.question +
        createChevronSVG() +
        '</summary>' +
        '<div class="faq-answer"><p>' + faq.answer + '</p></div>';
      list.appendChild(details);
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
      if (eyebrowEl) eyebrowEl.textContent = info.eyebrow;
    }
    if (info.heading) setText('.contact-info h2', info.heading);
    if (info.description) {
      var descP = document.querySelector('.contact-info > p');
      if (descP) descP.textContent = info.description;
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
    }
    if (settings.formResponseNote) {
      var formNote = document.querySelector('.form-note');
      if (formNote) formNote.textContent = settings.formResponseNote;
    }
  }

  // ========================================================================
  // Main: fetch and hydrate
  // ========================================================================

  fetchCMS().then(function (data) {
    if (!data) return;

    try {
      if (data.heroSections) hydrateHero(data.heroSections);
      if (data.socialProofStats) hydrateSocialProof(data.socialProofStats);
      if (data.whyStagingSections) hydrateWhyStaging(data.whyStagingSections);
      if (data.services) hydrateServices(data.services);
      if (data.portfolioItems) hydratePortfolio(data.portfolioItems);
      if (data.resultsSections) hydrateResults(Object.assign({}, data.resultsSections[0], { stats: data.resultStats }));
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
  });
})();
