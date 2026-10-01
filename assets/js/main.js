/**
 * main.js — all interactions for the Midco retailer site (vanilla JS, no framework).
 *
 *  1. Lenis smooth scrolling (+ anchor links offset by the sticky header)
 *  2. Scroll reveals: headline words, clip-path wipes, staggered grid
 *  3. Parallax: background blob layers and section photos
 *  4. Spring physics: magnetic buttons, 3D tilt cards, sliding nav pill
 *  5. Header: scrolled state, active section, mobile menu
 *  6. FAQ accordion, ZIP checker, footer year
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var headerHeight = function () {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 104;
  };

  /* ---------------------------------------------------------------- */
  /* 1. Lenis smooth scrolling                                         */
  /* ---------------------------------------------------------------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: -headerHeight() },
    });
  }

  var onScroll = function (fn) {
    if (lenis) lenis.on('scroll', fn);
    else window.addEventListener('scroll', fn, { passive: true });
  };

  /* ---------------------------------------------------------------- */
  /* 2. Scroll reveals (run once)                                      */
  /* ---------------------------------------------------------------- */
  function revealOnce(selector, threshold) {
    var els = document.querySelectorAll(selector);
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: threshold });
    els.forEach(function (el) { io.observe(el); });
  }

  revealOnce('[data-reveal]', 0.4);   // headline word reveal
  revealOnce('[data-wipe]', 0.05);    // clip-path section wipe
  revealOnce('[data-stagger]', 0.15); // Why Midco grid

  /* ---------------------------------------------------------------- */
  /* 3. Parallax                                                       */
  /*    data-parallax="0.15" moves the element from -15% to +15% of    */
  /*    its own height while its container crosses the viewport.       */
  /* ---------------------------------------------------------------- */
  var parallaxEls = reduceMotion ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));

  function updateParallax() {
    var vh = window.innerHeight;
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) continue;
      var progress = Math.min(1, Math.max(0, (vh - box.top) / (vh + box.height)));
      var speed = parseFloat(el.getAttribute('data-parallax')) * 100;
      el.style.transform = 'translate3d(0,' + (-speed + 2 * speed * progress).toFixed(3) + '%,0)';
    }
  }
  if (parallaxEls.length) {
    onScroll(updateParallax);
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }

  /* ---------------------------------------------------------------- */
  /* 4. Spring engine (matches the React spring settings)              */
  /* ---------------------------------------------------------------- */
  var springs = [];
  var running = false;
  var last = 0;

  function Spring(value, opts) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = opts.stiffness;
    this.damping = opts.damping;
    this.mass = opts.mass || 1;
    this.onUpdate = opts.onUpdate;
    springs.push(this);
  }
  Spring.prototype.set = function (target) {
    this.target = target;
    start();
  };
  Spring.prototype.jump = function (value) {
    this.value = this.target = value;
    this.velocity = 0;
    this.onUpdate(value);
  };
  Spring.prototype.step = function (dt) {
    var force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
    this.velocity += (force / this.mass) * dt;
    this.value += this.velocity * dt;
    var settled = Math.abs(this.velocity) < 0.01 && Math.abs(this.value - this.target) < 0.01;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
    }
    this.onUpdate(this.value);
    return !settled;
  };

  function tick(now) {
    var dt = Math.min(0.064, (now - last) / 1000);
    last = now;
    var active = false;
    var steps = Math.ceil(dt / 0.008); // sub-step for stability
    for (var i = 0; i < springs.length; i++) {
      for (var s = 0, moving = false; s < steps; s++) moving = springs[i].step(dt / steps);
      if (moving) active = true;
    }
    if (active) requestAnimationFrame(tick);
    else running = false;
  }
  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }

  /* Magnetic buttons ------------------------------------------------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      var strength = parseFloat(btn.getAttribute('data-strength')) || 0.35;
      var tx = 0;
      var ty = 0;
      var apply = function () { btn.style.translate = tx.toFixed(2) + 'px ' + ty.toFixed(2) + 'px'; };
      var opts = { stiffness: 220, damping: 16, mass: 0.4 };
      var sx = new Spring(0, Object.assign({ onUpdate: function (v) { tx = v; apply(); } }, opts));
      var sy = new Spring(0, Object.assign({ onUpdate: function (v) { ty = v; apply(); } }, opts));
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        sx.set((e.clientX - (r.left + r.width / 2)) * strength);
        sy.set((e.clientY - (r.top + r.height / 2)) * strength);
      });
      btn.addEventListener('mouseleave', function () {
        sx.set(0);
        sy.set(0);
      });
    });
  }

  /* 3D tilt plan cards ----------------------------------------------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var glare = card.querySelector('.tilt-glare');
      var rx = 0;
      var ry = 0;
      var apply = function () { card.style.transform = 'rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)'; };
      var opts = { stiffness: 180, damping: 18 };
      var sRx = new Spring(0, Object.assign({ onUpdate: function (v) { rx = v; apply(); } }, opts));
      var sRy = new Spring(0, Object.assign({ onUpdate: function (v) { ry = v; apply(); } }, opts));
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var mx = (e.clientX - r.left) / r.width;
        var my = (e.clientY - r.top) / r.height;
        sRx.set(7 - 14 * my);  // [0,1] -> [7,-7]
        sRy.set(-9 + 18 * mx); // [0,1] -> [-9,9]
        if (glare) {
          glare.style.setProperty('--gx', mx * 100 + '%');
          glare.style.setProperty('--gy', my * 100 + '%');
        }
      });
      card.addEventListener('mouseleave', function () {
        sRx.set(0);
        sRy.set(0);
        if (glare) {
          glare.style.setProperty('--gx', '50%');
          glare.style.setProperty('--gy', '50%');
        }
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 5. Header                                                         */
  /* ---------------------------------------------------------------- */
  var navBar = document.querySelector('[data-nav]');
  if (navBar) {
    var setScrolled = function () { navBar.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll(setScrolled);
    setScrolled();
  }

  // Active section + sliding pill
  var navList = document.querySelector('[data-nav-list]');
  if (navList) {
    var pill = navList.querySelector('.nav-pill');
    var links = Array.prototype.slice.call(navList.querySelectorAll('.nav-link'));
    var pillX = 0;
    var pillW = 0;
    var placePill = function () {
      pill.style.transform = 'translateX(' + pillX.toFixed(2) + 'px)';
      pill.style.width = pillW.toFixed(2) + 'px';
    };
    var pillOpts = { stiffness: 380, damping: 32 };
    var spX = new Spring(0, Object.assign({ onUpdate: function (v) { pillX = v; placePill(); } }, pillOpts));
    var spW = new Spring(0, Object.assign({ onUpdate: function (v) { pillW = v; placePill(); } }, pillOpts));
    var current = null;

    var activate = function (id) {
      var link = links.filter(function (l) { return l.hash === '#' + id; })[0];
      if (!link || link === current) return;
      var listBox = navList.getBoundingClientRect();
      var box = link.getBoundingClientRect();
      links.forEach(function (l) { l.classList.toggle('is-active', l === link); });
      if (!current || reduceMotion) {
        spX.jump(box.left - listBox.left);
        spW.jump(box.width);
      } else {
        spX.set(box.left - listBox.left);
        spW.set(box.width);
      }
      pill.classList.add('is-visible');
      current = link;
    };

    var sections = links
      .map(function (l) { return document.getElementById(l.hash.slice(1)); })
      .filter(Boolean);
    if (sections.length && 'IntersectionObserver' in window) {
      var navIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) activate(e.target.id); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { navIo.observe(s); });
      window.addEventListener('resize', function () {
        if (!current) return;
        var listBox = navList.getBoundingClientRect();
        var box = current.getBoundingClientRect();
        spX.jump(box.left - listBox.left);
        spW.jump(box.width);
      });
    }
  }

  // Mobile menu
  var toggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.getElementById('mobile-nav');
  if (toggle && mobileNav) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileNav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 6a. FAQ accordion (one open at a time)                            */
  /* ---------------------------------------------------------------- */
  var faq = document.querySelector('[data-faq]');
  if (faq) {
    var items = Array.prototype.slice.call(faq.querySelectorAll('.faq-item'));
    items.forEach(function (item) {
      var btn = item.querySelector('button');
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('button').setAttribute('aria-expanded', 'false');
        });
        if (willOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /* 6b. ZIP checker (front-end only)                                  */
  /*     Screens the ZIP against the 3-digit prefixes of Midco's       */
  /*     service states. Edit PHONE / STATES here if they change.      */
  /* ---------------------------------------------------------------- */
  var zipBox = document.querySelector('[data-zip]');
  if (zipBox) {
    var PHONE_TEL = (document.querySelector('a[href^="tel:"]') || { getAttribute: function () { return 'tel:'; } }).getAttribute('href');
    var FOOTPRINT = 'Kansas, Minnesota, North Dakota, South Dakota';
    var STATES = [
      { state: 'Minnesota', from: 550, to: 567 },
      { state: 'South Dakota', from: 570, to: 577 },
      { state: 'North Dakota', from: 580, to: 588 },
      { state: 'Kansas', from: 660, to: 679 },
    ];
    var form = zipBox.querySelector('form');
    var input = zipBox.querySelector('input');
    var status = zipBox.querySelector('#zip-status');
    var phoneIcon =
      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';

    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 5);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zip = input.value;
      if (!/^\d{5}$/.test(zip)) {
        input.setAttribute('aria-invalid', 'true');
        status.innerHTML = '<p class="mt-3 pl-5 text-sm font-medium text-[#a94442]">Enter a valid 5-digit ZIP code.</p>';
        return;
      }
      input.removeAttribute('aria-invalid');
      var prefix = Number(zip.slice(0, 3));
      var match = STATES.filter(function (s) { return prefix >= s.from && prefix <= s.to; })[0];
      var message = match
        ? '<strong class="text-teal">Good news.</strong> ' + zip + ' is in Midco’s ' + match.state +
          ' service area. Call to confirm plans and pricing at your exact address.'
        : zip + ' looks outside Midco’s service states (' + FOOTPRINT + '). Call and a specialist will double-check your address.';
      status.innerHTML =
        '<div class="zip-result mt-3 flex flex-col gap-3 rounded-2xl p-4 text-sm sm:flex-row sm:items-center sm:justify-between ' +
        (match ? 'bg-midco-50 text-ink ring-1 ring-teal' : 'bg-white text-ink ring-1 ring-midco-100') + '">' +
        '<p>' + message + '</p>' +
        '<a href="' + PHONE_TEL + '" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-violet px-4 py-2 font-semibold text-white hover:bg-plum">' +
        phoneIcon + ' Call to order</a></div>';
    });
  }

  /* ---------------------------------------------------------------- */
  /* 7. Hero load-in sequence + price count-up                         */
  /* ---------------------------------------------------------------- */
  var heroSection = document.querySelector('[data-hero]');
  if (heroSection) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { heroSection.classList.add('is-loaded'); });
    });
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-countup'), 10);
    if (reduceMotion || !target) return;
    var duration = 1400;
    var startAt = null;
    el.textContent = '0';
    var frame = function (now) {
      if (startAt === null) startAt = now;
      var t = Math.min(1, (now - startAt) / duration);
      var eased = 1 - Math.pow(1 - t, 4); // ease-out quart
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    };
    // Start once the offer card has faded in
    setTimeout(function () { requestAnimationFrame(frame); }, 900);
  }
  document.querySelectorAll('[data-countup]').forEach(countUp);

  /* ---------------------------------------------------------------- */
  /* 8. Pause animated backgrounds while off-screen (saves battery)    */
  /* ---------------------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    var bgIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('bg-paused', !e.isIntersecting); });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('[data-anim-bg], .marquee-flow, .cta-flow').forEach(function (el) { bgIo.observe(el); });
  }

  /* 6c. Footer year ------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
