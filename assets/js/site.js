/* Razov DB: site behaviour.
   No libraries. Every feature degrades to plain HTML when JS is off. */

// Store link. While empty, the store area stays hidden and the paid DataPilot
// plans show "Contact us to buy" (mailto). Set an https:// URL to switch them
// to "Buy" and reveal the store button. When Paddle checkout works, set it to
// 'https://hasanradi93.github.io/razov-db/datapilot/#pricing' (it must start with https://).
const STORE_URL = '';

// Paths that are live now. Any element with data-link-pending="<path>" whose
// path is listed here becomes a real link, e.g. add '/razov-db/sqlnext/' at launch.
const LIVE_PENDING_LINKS = [];

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var lightScheme = window.matchMedia('(prefers-color-scheme: light)');
  var THEME_KEY = 'razov-theme';
  var THEME_COLORS = { dark: '#060a13', light: '#f6f8fc' };

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function announce(message) {
    var live = document.querySelector('[data-live]');
    if (!live) return;
    live.textContent = '';
    window.setTimeout(function () { live.textContent = message; }, 40);
  }

  /* ---------- Theme ---------- */
  function readStoredTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function storeTheme(value) {
    try { localStorage.setItem(THEME_KEY, value); } catch (e) { /* storage blocked: keep it for this visit only */ }
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
    $all('[data-theme-toggle]').forEach(function (button) {
      button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    });
    document.dispatchEvent(new CustomEvent('razov:themechange', { detail: { theme: theme } }));
  }

  function initTheme() {
    applyTheme(currentTheme());
    $all('[data-theme-toggle]').forEach(function (button) {
      button.addEventListener('click', function () {
        var next = currentTheme() === 'light' ? 'dark' : 'light';
        storeTheme(next);
        applyTheme(next);
      });
    });
    var onSystemChange = function (event) {
      if (!readStoredTheme()) applyTheme(event.matches ? 'light' : 'dark');
    };
    if (lightScheme.addEventListener) lightScheme.addEventListener('change', onSystemChange);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var header = document.querySelector('[data-header]');
    var toggle = document.querySelector('[data-menu-toggle]');
    var nav = document.getElementById('site-nav');
    if (!header || !toggle || !nav) return;
    var desktop = window.matchMedia('(min-width: 900px)');

    function setOpen(open, returnFocus) {
      header.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open && returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      setOpen(open, false);
      if (open) {
        var first = nav.querySelector('a');
        if (first) window.setTimeout(function () { first.focus(); }, 60);
      }
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false, false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('nav-open')) setOpen(false, true);
    });

    document.addEventListener('click', function (event) {
      if (header.classList.contains('nav-open') && !header.contains(event.target)) setOpen(false, false);
    });

    // Close when focus leaves the open menu (Tab past the last link).
    header.addEventListener('focusout', function (event) {
      if (!header.classList.contains('nav-open')) return;
      if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false, false);
    });

    var onDesktop = function (event) { if (event.matches) setOpen(false, false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onDesktop);
  }

  /* ---------- Header state and active section ---------- */
  function initHeaderState() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;
    var links = $all('.site-nav a[href^="#"]');
    var byId = {};
    links.forEach(function (link) { byId[link.getAttribute('href').slice(1)] = link; });
    // The detail sections belong to "Products" in the nav.
    ['datapilot', 'sqlnext', 'schemazone'].forEach(function (id) { byId[id] = byId.products; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) { link.classList.remove('is-active'); });
        var active = byId[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    $all('main > section[id]').forEach(function (section) { observer.observe(section); });
  }

  /* ---------- Exact in-page jumps ----------
     Sections use content-visibility: auto, so their heights are estimates
     until they render. Render everything before a same-page jump so the
     smooth scroll lands on the real position. */
  function initRenderAll() {
    function renderAll() {
      root.classList.add('render-all');
      document.removeEventListener('click', onClick, true);
    }
    function onClick(event) {
      var link = event.target.closest && event.target.closest('a[href*="#"]');
      if (!link) return;
      var url = new URL(link.href, location.href);
      if (url.pathname === location.pathname && url.hash) renderAll();
    }
    if (root.classList.contains('render-all')) return;
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', renderAll);
  }

  /* ---------- Scroll reveal and in-view state ---------- */
  function initReveal() {
    var items = $all('.reveal');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { observer.observe(el); });
  }

  function initInView() {
    var items = $all('[data-inview]');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-inview'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-inview', entry.isIntersecting);
      });
    });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Card tilt and glow ---------- */
  function initTilt() {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches || reduceMotion.matches) return;
    var MAX = 6;

    $all('[data-tilt]').forEach(function (card) {
      var frame = 0;
      var pending = null;

      function render() {
        frame = 0;
        if (!pending) return;
        var rect = card.getBoundingClientRect();
        var x = (pending.x - rect.left) / rect.width;
        var y = (pending.y - rect.top) / rect.height;
        card.style.setProperty('--ry', ((x - 0.5) * 2 * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 2 * MAX).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      }

      card.addEventListener('pointerenter', function () { card.classList.add('is-tilting'); });
      card.addEventListener('pointermove', function (event) {
        pending = { x: event.clientX, y: event.clientY };
        if (!frame) frame = window.requestAnimationFrame(render);
      });
      card.addEventListener('pointerleave', function () {
        pending = null;
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Count-up numbers ---------- */
  function initCounters() {
    var items = $all('[data-count]');
    if (!items.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      if (target === 0) return;
      var start = null;
      var duration = 900 + target * 120;
      function step(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(eased * target));
        if (t < 1) window.requestAnimationFrame(step);
      }
      el.textContent = '0';
      window.requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Typing line ---------- */
  function initTyping() {
    var el = document.querySelector('[data-typing]');
    if (!el || reduceMotion.matches) return;
    var phrases;
    try { phrases = JSON.parse(el.getAttribute('data-phrases') || '[]'); } catch (e) { phrases = []; }
    if (phrases.length < 2) return;

    var visible = true;
    var hero = el.closest('section');
    if (hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }).observe(hero);
    }

    var index = 0;
    var chars = phrases[0].length;
    var deleting = true;
    var HOLD = 2600;

    function tick() {
      if (!visible || document.hidden) {
        window.setTimeout(tick, 600);
        return;
      }
      var phrase = phrases[index];
      if (deleting) {
        chars -= 1;
        el.textContent = phrase.slice(0, chars);
        if (chars <= 0) {
          deleting = false;
          index = (index + 1) % phrases.length;
          window.setTimeout(tick, 280);
          return;
        }
        window.setTimeout(tick, 26);
        return;
      }
      phrase = phrases[index];
      chars += 1;
      el.textContent = phrase.slice(0, chars);
      if (chars >= phrase.length) {
        deleting = true;
        window.setTimeout(tick, HOLD);
        return;
      }
      window.setTimeout(tick, 42 + Math.random() * 40);
    }

    window.setTimeout(tick, HOLD);
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    $all('[data-tabs]').forEach(function (group) {
      var tabs = $all('[role="tab"]', group);
      if (!tabs.length) return;

      function select(tab, focus) {
        tabs.forEach(function (other) {
          var selected = other === tab;
          other.setAttribute('aria-selected', String(selected));
          other.tabIndex = selected ? 0 : -1;
          var panel = document.getElementById(other.getAttribute('aria-controls'));
          if (panel) panel.classList.toggle('is-active', selected);
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { select(tab, false); });
        tab.addEventListener('keydown', function (event) {
          var next = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (event.key === 'Home') next = tabs[0];
          else if (event.key === 'End') next = tabs[tabs.length - 1];
          if (next) {
            event.preventDefault();
            select(next, true);
          }
        });
      });
    });
  }

  /* ---------- Copy buttons ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.top = '0';
      area.style.left = '0';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  }

  function initCopy() {
    $all('[data-copy]').forEach(function (button) {
      var label = button.querySelector('[data-copy-label]');
      var timer = 0;
      button.addEventListener('click', function () {
        var text = button.getAttribute('data-copy-text');
        if (!text) {
          var scope = button.closest('.code');
          var code = scope && scope.querySelector('code');
          text = code ? code.textContent.trim() : '';
        }
        if (!text) return;
        copyText(text).then(function () {
          button.classList.add('is-copied');
          if (label) label.textContent = 'Copied';
          announce('Copied to the clipboard');
        }, function () {
          if (label) label.textContent = 'Press Ctrl+C';
          announce('Copy failed. Select the text and press Ctrl+C.');
        }).then(function () {
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            button.classList.remove('is-copied');
            if (label) label.textContent = 'Copy';
          }, 2000);
        });
      });
    });
  }

  /* ---------- Store link and buy buttons ---------- */
  function initStore() {
    var url = typeof STORE_URL === 'string' ? STORE_URL.trim() : '';
    if (!/^https:\/\//i.test(url)) return;

    $all('[data-store-link]').forEach(function (area) {
      area.hidden = false;
      $all('[data-store-href]', area).forEach(function (link) {
        link.setAttribute('href', url);
        link.setAttribute('rel', 'noopener');
      });
    });

    $all('[data-buy]').forEach(function (link) {
      link.setAttribute('href', url);
      link.setAttribute('rel', 'noopener');
      var label = link.querySelector('[data-buy-label]');
      if (label) label.textContent = 'Buy';
    });
  }

  /* ---------- Pending links (product pages that are not live yet) ---------- */
  function initPendingLinks() {
    if (!LIVE_PENDING_LINKS.length) return;
    $all('[data-link-pending]').forEach(function (el) {
      var path = el.getAttribute('data-link-pending');
      if (LIVE_PENDING_LINKS.indexOf(path) === -1) return;
      var link = document.createElement('a');
      link.href = path;
      link.className = el.className.replace(/\bchip\b/, 'btn btn--ghost');
      link.textContent = el.classList.contains('chip') ? 'Product page' : el.firstChild.textContent.trim();
      el.replaceWith(link);
    });
  }

  function init() {
    initTheme();
    initRenderAll();
    initMenu();
    initHeaderState();
    initReveal();
    initInView();
    initTilt();
    initCounters();
    initTyping();
    initTabs();
    initCopy();
    initStore();
    initPendingLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
