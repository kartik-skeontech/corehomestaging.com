/**
 * Core Home Staging - Main JavaScript
 * Vanilla JS for all interactive features
 */

(function () {
  'use strict';

  // ==========================================================================
  // Mobile Navigation Toggle
  // ==========================================================================

  const header = document.querySelector('.site-header');
  const hamburger = document.querySelector('.hamburger');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');

  function openMobileNav() {
    document.body.classList.add('nav-open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
    mobileOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeMobileNav() {
    document.body.classList.remove('nav-open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
    mobileOverlay.setAttribute('aria-hidden', 'true');
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      const isOpen = document.body.classList.contains('nav-open');
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  // Close mobile nav when clicking a link
  mobileNavLinks.forEach(function (link) {
    link.addEventListener('click', closeMobileNav);
  });

  // Close mobile nav on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      closeMobileNav();
      hamburger.focus();
    }
  });

  // Close mobile nav when clicking overlay background
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', function (e) {
      if (e.target === mobileOverlay) {
        closeMobileNav();
      }
    });
  }

  // ==========================================================================
  // Sticky Header Background Transition
  // ==========================================================================

  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    if (window.scrollY > 80) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    lastScrollY = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });

  // Initial check
  updateHeader();

  // ==========================================================================
  // Active Nav Link Highlighting
  // ==========================================================================

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.main-nav a');

  const sectionObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            }
          });
        }
      });
    },
    {
      rootMargin: '-20% 0px -70% 0px',
    }
  );

  sections.forEach(function (section) {
    sectionObserver.observe(section);
  });

  // ==========================================================================
  // Smooth Scroll with Header Offset
  // ==========================================================================

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.offsetTop - headerHeight - 16;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });

  // ==========================================================================
  // Before/After Image Slider
  // ==========================================================================

  const sliders = document.querySelectorAll('[data-slider]');

  sliders.forEach(function (slider) {
    const handle = slider.querySelector('.ba-handle');
    let isDragging = false;

    function getSliderPosition(clientX) {
      const rect = slider.getBoundingClientRect();
      let position = ((clientX - rect.left) / rect.width) * 100;
      return Math.max(0, Math.min(100, position));
    }

    function updateSlider(position) {
      slider.style.setProperty('--slider-position', position + '%');
      if (handle) {
        handle.setAttribute('aria-valuenow', Math.round(position));
      }
    }

    // Pointer events (unified mouse + touch)
    slider.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.ba-handle') || e.target === slider) {
        isDragging = true;
        slider.setPointerCapture(e.pointerId);
        updateSlider(getSliderPosition(e.clientX));
        e.preventDefault();
      }
    });

    slider.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      updateSlider(getSliderPosition(e.clientX));
      e.preventDefault();
    });

    slider.addEventListener('pointerup', function () {
      isDragging = false;
    });

    slider.addEventListener('pointercancel', function () {
      isDragging = false;
    });

    // Keyboard support
    if (handle) {
      handle.addEventListener('keydown', function (e) {
        const currentValue = parseFloat(
          slider.style.getPropertyValue('--slider-position')
        ) || 50;
        let newValue = currentValue;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          newValue = Math.max(0, currentValue - 2);
          e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          newValue = Math.min(100, currentValue + 2);
          e.preventDefault();
        } else if (e.key === 'Home') {
          newValue = 0;
          e.preventDefault();
        } else if (e.key === 'End') {
          newValue = 100;
          e.preventDefault();
        }

        updateSlider(newValue);
      });
    }

    // Initialize at 50%
    updateSlider(50);
  });

  // Expose slider re-init for CMS dynamic content
  window._reinitSliders = function () {
    document.querySelectorAll('[data-slider]').forEach(function (slider) {
      if (slider._sliderInit) return;
      slider._sliderInit = true;

      var handle = slider.querySelector('.ba-handle');
      var isDragging = false;

      function getPos(clientX) {
        var rect = slider.getBoundingClientRect();
        var pos = ((clientX - rect.left) / rect.width) * 100;
        return Math.max(0, Math.min(100, pos));
      }
      function setPos(pos) {
        slider.style.setProperty('--slider-position', pos + '%');
        if (handle) handle.setAttribute('aria-valuenow', Math.round(pos));
      }
      slider.addEventListener('pointerdown', function (e) {
        if (e.target.closest('.ba-handle') || e.target === slider) {
          isDragging = true;
          slider.setPointerCapture(e.pointerId);
          setPos(getPos(e.clientX));
          e.preventDefault();
        }
      });
      slider.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        setPos(getPos(e.clientX));
        e.preventDefault();
      });
      slider.addEventListener('pointerup', function () { isDragging = false; });
      slider.addEventListener('pointercancel', function () { isDragging = false; });
      if (handle) {
        handle.addEventListener('keydown', function (e) {
          var cur = parseFloat(slider.style.getPropertyValue('--slider-position')) || 50;
          var val = cur;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { val = Math.max(0, cur - 2); e.preventDefault(); }
          else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { val = Math.min(100, cur + 2); e.preventDefault(); }
          else if (e.key === 'Home') { val = 0; e.preventDefault(); }
          else if (e.key === 'End') { val = 100; e.preventDefault(); }
          setPos(val);
        });
      }
      setPos(50);
    });
  };

  // Mark existing sliders as initialized
  sliders.forEach(function (s) { s._sliderInit = true; });

  // ==========================================================================
  // Counter Animation
  // ==========================================================================

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(element) {
    const target = parseFloat(element.getAttribute('data-target'));
    const format = element.getAttribute('data-format') || '';
    const duration = 2000;
    const startTime = performance.now();

    // Parse format
    let prefix = '';
    let suffix = '';
    format.split(';').forEach(function (part) {
      if (part.startsWith('prefix:')) {
        prefix = part.replace('prefix:', '');
      }
      if (part.startsWith('suffix:')) {
        suffix = part.replace('suffix:', '');
      }
    });

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue = Math.round(easedProgress * target);

      element.textContent = prefix + currentValue + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateCounter(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.stat-number, .result-number').forEach(function (el) {
    counterObserver.observe(el);
  });

  // Expose re-observe hook for CMS dynamic content
  window._reobserveCounters = function () {
    document.querySelectorAll('.stat-number, .result-number').forEach(function (el) {
      if (!el.classList.contains('counted')) {
        counterObserver.observe(el);
      }
    });
  };

  // ==========================================================================
  // Scroll Reveal Animation
  // ==========================================================================

  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    }
  );

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  document.querySelectorAll('.reveal').forEach(function (el) {
    if (prefersReducedMotion) {
      el.classList.add('reveal--visible');
    } else {
      revealObserver.observe(el);
    }
  });

  // ==========================================================================
  // Testimonial Carousel (Mobile)
  // ==========================================================================

  const testimonialsGrid = document.querySelector('.testimonials-grid');
  const dots = document.querySelectorAll('.testimonial-dot');

  if (testimonialsGrid && dots.length > 0) {
    // Update dots on scroll
    testimonialsGrid.addEventListener('scroll', function () {
      const scrollLeft = testimonialsGrid.scrollLeft;
      const cardWidth = testimonialsGrid.querySelector('.testimonial-card').offsetWidth;
      const gap = 16;
      const index = Math.round(scrollLeft / (cardWidth + gap));

      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    });

    // Click dots to scroll
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        const card = testimonialsGrid.querySelectorAll('.testimonial-card')[i];
        if (card) {
          card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      });
    });
  }

  // Expose testimonial dots re-init for CMS dynamic content
  window._reinitTestimonialDots = function () {
    var grid = document.querySelector('.testimonials-grid');
    var newDots = document.querySelectorAll('.testimonial-dot');
    if (!grid || !newDots.length) return;

    grid.addEventListener('scroll', function () {
      var scrollLeft = grid.scrollLeft;
      var firstCard = grid.querySelector('.testimonial-card');
      if (!firstCard) return;
      var cardWidth = firstCard.offsetWidth;
      var gap = 16;
      var index = Math.round(scrollLeft / (cardWidth + gap));
      newDots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    });

    newDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        var card = grid.querySelectorAll('.testimonial-card')[i];
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    });
  };

  // ==========================================================================
  // FAQ Accordion Animation
  // ==========================================================================

  document.querySelectorAll('.faq-item').forEach(function (details) {
    details.addEventListener('toggle', function () {
      // Optional: close others (accordion behavior)
      if (this.open) {
        document.querySelectorAll('.faq-item').forEach(function (other) {
          if (other !== details && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // ==========================================================================
  // Contact Form Handling
  // ==========================================================================

  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Clear previous errors
      contactForm.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function (input) {
        input.classList.remove('error');
      });
      contactForm.querySelectorAll('.form-error').forEach(function (err) {
        err.remove();
      });

      // Validate
      let isValid = true;

      const name = contactForm.querySelector('#name');
      if (!name.value.trim()) {
        showError(name, 'Please enter your name');
        isValid = false;
      }

      const email = contactForm.querySelector('#email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim()) {
        showError(email, 'Please enter your email');
        isValid = false;
      } else if (!emailRegex.test(email.value.trim())) {
        showError(email, 'Please enter a valid email');
        isValid = false;
      }

      if (!isValid) return;

      // Simulate success (replace with actual form handler later)
      contactForm.style.display = 'none';
      formSuccess.classList.add('show');
    });
  }

  function showError(input, message) {
    input.classList.add('error');
    const errorEl = document.createElement('p');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    input.parentNode.appendChild(errorEl);
  }
})();
