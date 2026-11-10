/* The Social Company — shared behaviour: language (EN/EL), light/dark theme, footer funding banners.
   Load in <head> after content.js. Call TSC.apply() at the end of <body>, before the concept script. */
(function () {
  var root = document.documentElement;
  var concept = root.getAttribute('data-concept') || 'home';
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var lang = store.get('tsc-lang') === 'el' ? 'el' : 'en';
  var theme = store.get('tsc-theme-' + concept) || root.getAttribute('data-default-theme') || 'light';
  root.setAttribute('lang', lang);
  root.setAttribute('data-theme', theme);

  var base = root.getAttribute('data-base') || '../';
  var T = window.TSC_CONTENT[lang];
  var listeners = [];

  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, T);
  }

  function bannersHTML() {
    var mode = theme === 'dark' ? 'dark' : 'light';
    var info = window.TSC_INFO;
    return '<a class="tsc-banners" href="' + info.fundUrl + '" target="_blank" rel="noopener" aria-label="' + T.footer.funded + '">' +
      '<img class="tsc-b-eu" src="' + base + 'assets/banners/eu-' + lang + '-' + mode + '.png" alt="' + T.footer.funded + '">' +
      '<img class="tsc-b-cy" src="' + base + 'assets/banners/cy-' + mode + '.png" alt="' + T.footer.cy + '">' +
      '</a>';
  }

  function controlsHTML() {
    return '<div class="tsc-controls">' +
      '<button type="button" class="tsc-lang" data-lang-toggle aria-label="' + T.ui.lang + '">' +
        '<span class="' + (lang === 'en' ? 'on' : '') + '">EN</span><i>/</i><span class="' + (lang === 'el' ? 'on' : '') + '">ΕΛ</span>' +
      '</button>' +
      '<button type="button" class="tsc-theme" data-theme-toggle aria-label="' + T.ui.theme + '"><span class="tsc-theme-dot"></span></button>' +
      '</div>';
  }

  function setTheme(next) {
    theme = next;
    root.setAttribute('data-theme', theme);
    store.set('tsc-theme-' + concept, theme);
    document.querySelectorAll('[data-banners]').forEach(function (el) { el.innerHTML = bannersHTML(); });
    listeners.forEach(function (cb) { cb(theme); });
  }

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = get(el.getAttribute('data-i18n'));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-controls]').forEach(function (el) { el.innerHTML = controlsHTML(); });
    document.querySelectorAll('[data-banners]').forEach(function (el) { el.innerHTML = bannersHTML(); });
    document.querySelectorAll('[data-ig]').forEach(function (el) { el.textContent = window.TSC_INFO.ig; el.href = window.TSC_INFO.igUrl; el.target = '_blank'; el.rel = 'noopener'; });
    document.querySelectorAll('[data-email]').forEach(function (el) { el.textContent = window.TSC_INFO.email; el.href = 'mailto:' + window.TSC_INFO.email; });

    document.addEventListener('click', function (e) {
      var tg = e.target.closest('[data-theme-toggle]');
      if (tg) {
        var next = theme === 'dark' ? 'light' : 'dark';
        if (document.startViewTransition && !reduced) {
          /* the new theme opens as a circle from the switch */
          var r = tg.getBoundingClientRect();
          root.style.setProperty('--vx', (r.left + r.width / 2) + 'px');
          root.style.setProperty('--vy', (r.top + r.height / 2) + 'px');
          root.classList.add('theme-switching');
          document.startViewTransition(function () { setTheme(next); }).finished.finally(function () { root.classList.remove('theme-switching'); });
        } else setTheme(next);
      }
      if (e.target.closest('[data-lang-toggle]')) {
        store.set('tsc-lang', lang === 'en' ? 'el' : 'en');
        location.reload();
      }
    });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* [data-reveal] fades up when it enters the viewport; siblings stagger via --i */
  function reveal(scope) {
    root.classList.add('js');
    var els = (scope || document).querySelectorAll('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* [data-count="607"] counts up from 0 once visible */
  function counters(scope) {
    var els = (scope || document).querySelectorAll('[data-count]');
    function run(el) {
      var end = +el.getAttribute('data-count'), t0 = null, dur = 1600;
      if (reduced) { el.textContent = end; return; }
      (function tick(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(end * e);
        if (p < 1) requestAnimationFrame(tick);
      })(performance.now());
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* Split an element's text into word (and optionally character) spans; returns the innermost spans */
  function split(el, chars) {
    var text = el.textContent, out = [];
    el.setAttribute('aria-label', text);
    el.textContent = '';
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span');
      w.className = 'split-w'; w.setAttribute('aria-hidden', 'true');
      if (chars) {
        Array.from(part).forEach(function (ch) {
          var c = document.createElement('span');
          c.className = 'split-c'; c.textContent = ch;
          w.appendChild(c); out.push(c);
        });
      } else { w.textContent = part; out.push(w); }
      el.appendChild(w);
    });
    return out;
  }

  window.T = T;
  window.TSC = {
    lang: lang,
    get theme() { return theme; },
    t: get,
    apply: apply,
    setTheme: setTheme,
    onTheme: function (cb) { listeners.push(cb); },
    reveal: reveal,
    counters: counters,
    split: split,
    reduced: reduced
  };
})();
