/* ==========================================================================
   GOTCHA POTRERO — "OPERACIÓN POTRERO"
   JavaScript puro + anime.js 3.2.2 (opcional: todo funciona aunque la CDN falle).
   Principios:
   · El contenido es visible por defecto. `html.ok` se agrega al arrancar; solo entonces
     existen los estados ocultos de revelado (ver styles.css).
   · Cada módulo corre dentro de `safe()`: si uno falla, los demás siguen.
   · Un solo manejador de scroll/resize con requestAnimationFrame para todo.
   ========================================================================== */
(function () {
  'use strict';

  /* ===================================================================
     CONFIGURACIÓN — el número de WhatsApp vive SOLO aquí.
     [0] = principal (formulario, botón flotante, CTA) · [1] = alterno (Contacto y Ubicación).
     Formato: 52 + 10 dígitos. Si [0] queda vacío, el botón flotante y el envío se ocultan.
     =================================================================== */
  const WHATSAPP = ["527224126728", "527228024629"];

  const root = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const hasAnime = () => typeof window.anime === 'function' && !reduce;
  const safe = (fn, name) => { try { fn(); } catch (e) { if (window.console) console.warn('[gotcha] ' + (name || fn.name), e); } };
  const debounce = (fn, ms) => { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; };
  const pad2 = (n) => (n < 10 ? '0' : '') + n;

  /* Estado "con JS": desde aquí existen los estados ocultos de animación */
  root.classList.add('ok');
  if (hasAnime()) root.classList.add('anime');
  /* Seguro: si algo impidiera terminar el cargador, el hero se revela igual */
  setTimeout(function () { root.classList.add('ready'); }, 2600);

  /* ---------- Bus de scroll/resize (un solo rAF) ---------- */
  const tasks = [];
  let ticking = false;
  const onFrame = (fn) => tasks.push(fn);
  function runTasks() { ticking = false; for (let i = 0; i < tasks.length; i++) safe(tasks[i], 'task'); }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(runTasks); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  /* ===================================================================
     1 · WHATSAPP: enlaces, números visibles y mensajes
     =================================================================== */
  const MSG = {
    generic: 'Hola Gotcha Potrero, quiero información de paquetes y fechas.',
    header: 'Hola Gotcha Potrero, quiero información para jugar. ¿Me ayudan con paquetes y fechas?',
    hero: 'Hola Gotcha Potrero, quiero armar mi escuadrón. ¿Qué fecha tienen disponible?',
    campo: 'Hola Gotcha Potrero, quiero pisar el campo. ¿Qué fechas tienen disponibles?',
    p150: 'Hola Gotcha Potrero, quiero el paquete de $150 con 50 cápsulas. ¿Qué fecha tienen disponible?',
    p200: 'Hola Gotcha Potrero, quiero el paquete de $200 con 100 cápsulas. ¿Qué fecha tienen disponible?',
    p300: 'Hola Gotcha Potrero, quiero el paquete de $300 con 200 cápsulas. ¿Qué fecha tienen disponible?',
    escuadron: 'Hola Gotcha Potrero, quiero empezar mi misión y armar mi escuadrón. ¿Cómo reservo?',
    ocasiones: 'Hola Gotcha Potrero, quiero reservar una fecha para un festejo. ¿Qué día tienen disponible?',
    ubicacion: 'Hola, ¿me compartes la ubicación exacta del campo?',
    ubicacion2: 'Hola, ¿me compartes la ubicación exacta del campo?',
    contacto1: 'Hola Gotcha Potrero, quiero información de paquetes y fechas.',
    contacto2: 'Hola Gotcha Potrero, quiero información de paquetes y fechas.',
    float: 'Hola Gotcha Potrero, quiero jugar. ¿Me ayudan con paquetes y fechas?'
  };
  const waUrl = (i, txt) => {
    const n = (WHATSAPP[i] || '').replace(/\D/g, '');
    return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(txt) : '';
  };
  const fmtNum = (n) => {
    const d = String(n).replace(/\D/g, '').replace(/^52/, '');
    return d.length === 10 ? d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6) : '+' + n;
  };

  function initWhatsApp() {
    if (!WHATSAPP[0]) root.classList.add('nowa');
    $$('[data-wa]').forEach(function (a) {
      const i = parseInt(a.getAttribute('data-wa-n') || '0', 10);
      const url = waUrl(i, MSG[a.getAttribute('data-wa')] || MSG.generic);
      if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      else if (i > 0) { a.hidden = true; }   // sin número alterno: se oculta con elegancia
    });
    $$('[data-wa-num]').forEach(function (b) {
      const n = WHATSAPP[parseInt(b.getAttribute('data-wa-num'), 10)];
      if (n) b.textContent = fmtNum(n);
      else { const w = b.closest('.wabtn'); if (w) w.hidden = true; }
    });
  }

  /* ===================================================================
     2 · CARGADOR (≤ 2.2 s) — contador 000→100, barra de cápsulas y mancha verde
     =================================================================== */
  function initLoader() {
    const ld = $('#loader');
    if (!ld) { root.classList.add('ready'); return; }
    const num = $('#ldNum');
    const segs = $$('#ldBar i');
    const credit = Math.min(performance.now(), 600);          // descuenta lo que ya tardó en cargar
    const t0 = performance.now() - credit;
    const DUR = reduce ? 450 : 1150;
    let finished = false;

    function out() {
      if (finished) return;
      finished = true;
      ld.classList.add('out');
      setTimeout(function () { ld.classList.add('fade'); root.classList.add('ready'); }, reduce ? 0 : 470);
      setTimeout(function () { ld.classList.add('gone'); }, reduce ? 80 : 880);
    }
    function step(now) {
      const p = clamp((now - t0) / DUR, 0, 1);
      const v = Math.round(100 * (1 - Math.pow(1 - p, 2)));
      if (num) num.textContent = ('00' + v).slice(-3);
      const on = Math.floor(v / 10);
      for (let i = 0; i < segs.length; i++) segs[i].classList.toggle('on', i < on || v === 100);
      if (p < 1) requestAnimationFrame(step); else out();
    }
    requestAnimationFrame(step);
    setTimeout(out, 2000);                                     // tope duro
  }

  /* ===================================================================
     3 · HEADER, MENÚ MÓVIL, PROGRESO Y NAVEGACIÓN ACTIVA
     =================================================================== */
  function initHeader() {
    const hdr = $('.hdr');
    const bar = $('.prog i');
    const burger = $('#burger');
    const menu = $('#menu');
    const navLinks = $$('.nav a');
    const secs = navLinks.map(function (a) { return $(a.getAttribute('href')); });

    onFrame(function () {
      const y = window.pageYOffset;
      if (hdr) hdr.classList.toggle('scrolled', y > 40);
      if (bar) {
        const max = root.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';
      }
      const mid = window.innerHeight * 0.4;
      navLinks.forEach(function (a, i) {
        const s = secs[i]; if (!s) return;
        const r = s.getBoundingClientRect();
        a.classList.toggle('on', r.top <= mid && r.bottom > mid);
      });
    });

    if (!burger || !menu) return;
    function setMenu(open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', String(!open));
      if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
      root.classList.toggle('lock', open);
    }
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
    window.matchMedia('(min-width:1100px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ===================================================================
     4 · REVELADOS: IntersectionObserver + respaldo por geometría
     (nunca clip-path ni scale(0) sobre un elemento observado)
     =================================================================== */
  function tween(from, to, dur, cb, done) {
    const s = performance.now();
    (function f(now) {
      const p = clamp((now - s) / dur, 0, 1);
      cb(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(f); else if (done) done();
    })(s);
  }
  function countUp(b) {
    const to = parseInt(b.getAttribute('data-count'), 10);
    if (!to) return;
    if (reduce) { b.textContent = String(to); return; }
    b.textContent = '0';
    const end = function () { b.textContent = String(to); };
    if (hasAnime()) {
      const o = { v: 0 };
      window.anime({ targets: o, v: to, round: 1, duration: 1700, easing: 'easeOutExpo', update: function () { b.textContent = String(o.v); }, complete: end });
    } else {
      tween(0, to, 1500, function (v) { b.textContent = String(v); }, end);
    }
    setTimeout(end, 2600);                                     // por si la pestaña estuvo oculta
  }

  function initReveal() {
    /* Escalonado automático */
    $$('[data-stagger]').forEach(function (g) {
      $$('.rv', g).forEach(function (c, i) { c.style.setProperty('--sd', (i * 80) + 'ms'); });
    });
    $$('.sec__head').forEach(function (h) {
      $$('.rv', h).forEach(function (c, i) { c.style.setProperty('--sd', (i * 110) + 'ms'); });
    });

    function reveal(el) {
      if (el.classList.contains('in')) return;
      el.classList.add('in');
      $$('[data-count]', el).forEach(countUp);
    }
    const pending = () => $$('.rv:not(.in)');
    function byGeometry() {
      const vh = window.innerHeight;
      pending().forEach(function (el) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.96 && r.bottom > -40) reveal(el);
      });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
      pending().forEach(function (el) { io.observe(el); });
    } else {
      pending().forEach(reveal);
    }
    onFrame(byGeometry);                                       // respaldo en scroll y resize
    byGeometry();
    setTimeout(byGeometry, 2000);                              // respaldo ~2 s tras cargar
    window.addEventListener('load', function () { byGeometry(); setTimeout(byGeometry, 600); });
    setTimeout(function () {                                   // red de seguridad a los 3.5 s
      const vh = window.innerHeight;
      pending().forEach(function (el) { if (el.getBoundingClientRect().top < vh * 1.5) reveal(el); });
    }, 3500);
  }

  /* ===================================================================
     5 · HERO: canvas de bolas de pintura + inclinación de la torre
     =================================================================== */
  const COLORS = ['#7CFF3A', '#F28C28', '#C1121F'];
  function newSplat(x, y, col, sc) {
    const drops = [], n = 8 + Math.floor(Math.random() * 7);
    for (let i = 0; i < n; i++) drops.push({ a: Math.random() * 6.2832, d: (1.4 + Math.random() * 2.6) * sc * 10, s: (1.4 + Math.random() * 3.4) * sc });
    const drips = [], k = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < k; j++) drips.push({ ox: (Math.random() - 0.5) * sc * 14, len: (14 + Math.random() * 34) * sc, w: (2 + Math.random() * 2.4) * sc });
    return { x: x, y: y, col: col, r: (9 + Math.random() * 7) * sc, drops: drops, drips: drips, born: performance.now() };
  }
  /* Dibuja una mancha; devuelve false cuando ya se desvaneció (vida en segundos) */
  function drawSplat(ctx, s, now, life, still) {
    const age = still ? 99 : (now - s.born) / 1000;
    if (age < 0) return true;
    const grow = still ? 1 : 1 - Math.pow(1 - clamp(age / 0.28, 0, 1), 3);
    const fade = still ? 0.9 : clamp(1 - (age - life * 0.3) / (life * 0.7), 0, 1);
    if (fade <= 0) return false;
    ctx.globalAlpha = fade * 0.92;
    ctx.fillStyle = s.col;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * grow, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x + s.r * 0.35 * grow, s.y - s.r * 0.2 * grow, s.r * 0.62 * grow, 0, 6.2832); ctx.fill();
    for (let i = 0; i < s.drops.length; i++) {
      const d = s.drops[i];
      ctx.beginPath(); ctx.arc(s.x + Math.cos(d.a) * d.d * grow, s.y + Math.sin(d.a) * d.d * grow, d.s * grow, 0, 6.2832); ctx.fill();
    }
    const dg = still ? 1 : clamp((age - 0.15) / 1.4, 0, 1);
    for (let j = 0; j < s.drips.length; j++) {
      const p = s.drips[j], len = p.len * dg;
      ctx.fillRect(s.x + p.ox - p.w / 2, s.y, p.w, len);
      ctx.beginPath(); ctx.arc(s.x + p.ox, s.y + len, p.w / 2, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    return still ? true : age < life;
  }

  function initHero() {
    const hero = $('#inicio'), cv = $('#fx');
    if (!hero || !cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 1, H = 1, sc = 1;
    function size() {
      const r = hero.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      sc = clamp(W / 900, 0.7, 1.35);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    /* Movimiento reducido: 3 manchas estáticas y nada más */
    if (reduce) {
      const pts = [[0.2, 0.8, 0], [0.6, 0.72, 1], [0.82, 0.9, 2]];
      const paint = function () { ctx.clearRect(0, 0, W, H); pts.forEach(function (p) { drawSplat(ctx, newSplat(W * p[0], H * p[1], COLORS[p[2]], sc), 0, 5, true); }); };
      paint(); window.addEventListener('resize', debounce(function () { size(); paint(); }, 200));
      return;
    }
    window.addEventListener('resize', debounce(size, 160));

    const balls = [], splats = [];
    let next = 500, visible = true, raf = 0, last = 0;
    const tilt = $('.torre-tilt');
    let tgx = -2, tgy = 0, cx = -2, cy = 0;

    function spawn() {
      const left = Math.random() < 0.5;
      const x0 = left ? -12 : W + 12, y0 = H * (0.18 + Math.random() * 0.42);
      const tx = W * (0.1 + Math.random() * 0.8), ty = H * (0.55 + Math.random() * 0.4);
      const T = 0.9 + Math.random() * 0.7, g = H * 1.25;
      balls.push({
        x0: x0, y0: y0, vx: (tx - x0) / T, vy: (ty - y0 - 0.5 * g * T * T) / T, g: g, t: 0, T: T, tx: tx, ty: ty,
        col: COLORS[Math.floor(Math.random() * 3)], r: (4 + Math.random() * 3) * clamp(sc, 0.85, 1.15), trail: []
      });
    }
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);

      next -= dt * 1000;
      if (next <= 0) { spawn(); next = 600 + Math.random() * 800; }

      for (let i = splats.length - 1; i >= 0; i--) if (!drawSplat(ctx, splats[i], now, 4.2)) splats.splice(i, 1);

      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.t += dt;
        if (b.t >= b.T) {
          splats.push(newSplat(b.tx, b.ty, b.col, sc)); if (splats.length > 14) splats.shift();
          balls.splice(i, 1); continue;
        }
        const x = b.x0 + b.vx * b.t, y = b.y0 + b.vy * b.t + 0.5 * b.g * b.t * b.t;
        b.trail.push(x, y); if (b.trail.length > 20) b.trail.splice(0, 2);
        ctx.fillStyle = b.col;
        for (let k = 0; k < b.trail.length; k += 2) {
          const f = k / b.trail.length;
          ctx.globalAlpha = f * 0.45;
          ctx.beginPath(); ctx.arc(b.trail[k], b.trail[k + 1], b.r * (0.25 + f * 0.7), 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.beginPath(); ctx.arc(x - b.r * 0.3, y - b.r * 0.3, b.r * 0.3, 0, 6.2832); ctx.fill();
      }

      if (tilt) {
        cx = lerp(cx, tgx, 0.07); cy = lerp(cy, tgy, 0.07);
        tilt.style.setProperty('--rx', cx.toFixed(2) + 'deg');
        tilt.style.setProperty('--ry', cy.toFixed(2) + 'deg');
      }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', start);
    if (tilt && fine) {
      hero.addEventListener('pointermove', function (e) {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        tgx = -2 - ny * 16; tgy = nx * 22;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { tgx = -2; tgy = 0; });
    }
    start();
  }

  /* ===================================================================
     6 · CINTA TÁCTICA: velocidad extra con el scroll
     =================================================================== */
  function initMarquee() {
    if (reduce) return;
    const sec = $('.cinta');
    const strips = $$('.strip__in');
    if (!sec || !strips.length) return;
    let seqW = 0, vis = false, raf = 0, last = 0, lastY = window.pageYOffset, boost = 0;
    const pos = [0, 0];
    function measure() {
      const q = strips[0].querySelector('.seq');
      seqW = q ? q.getBoundingClientRect().width : 0;
      strips.forEach(function (s) { s.classList.toggle('drv', seqW > 0); });
      if (seqW > 0) {   // posición inicial correcta aunque la cinta aún no sea visible
        strips[0].style.transform = 'translate3d(' + (-pos[0]).toFixed(1) + 'px,0,0)';
        if (strips[1]) strips[1].style.transform = 'translate3d(' + (-seqW + pos[1]).toFixed(1) + 'px,0,0)';
      }
    }
    measure();
    window.addEventListener('resize', debounce(measure, 160));
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    function frame(now) {
      raf = 0;
      if (!vis || !seqW) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      const y = window.pageYOffset;
      boost = lerp(boost, clamp(Math.abs(y - lastY), 0, 90), 0.12); lastY = y;
      const shift = (seqW / 40) * dt + boost * 0.9;
      pos[0] = (pos[0] + shift) % seqW;
      pos[1] = (pos[1] + shift) % seqW;
      strips[0].style.transform = 'translate3d(' + (-pos[0]).toFixed(1) + 'px,0,0)';
      if (strips[1]) strips[1].style.transform = 'translate3d(' + (-seqW + pos[1]).toFixed(1) + 'px,0,0)';
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && vis) { last = 0; raf = requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) start(); }, { rootMargin: '120px 0px' }).observe(sec);
    }
  }

  /* ===================================================================
     7 · LA MISIÓN: las palabras se encienden con el scroll
     =================================================================== */
  function initMision() {
    const h = $('#misionTxt');
    if (!h) return;
    const words = [];
    function wrap(node) {
      const parts = node.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span'); s.className = 'wd'; s.textContent = p; frag.appendChild(s); words.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    }
    Array.from(h.childNodes).forEach(function (n) {
      if (n.nodeType === 3) wrap(n);
      else if (n.nodeType === 1) Array.from(n.childNodes).forEach(function (c) { if (c.nodeType === 3) wrap(c); });
    });
    const pct = $('#misionPct');
    let lastTxt = '';
    function update() {
      const r = h.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.25), 0, 1);
      const f = p * (words.length + 6);
      for (let i = 0; i < words.length; i++) {
        const o = clamp((f - i) / 6, 0, 1), w = words[i], v = (0.14 + 0.86 * o).toFixed(2);
        if (w._v !== v) { w._v = v; w.style.opacity = v; w.classList.toggle('on', o > 0.85); }
      }
      if (pct) { const t = 'CARGA ' + pad2(Math.round(p * 100)) + '%'; if (t !== lastTxt) { lastTxt = t; pct.textContent = t; } }
    }
    onFrame(update); update();
  }

  /* ===================================================================
     8 · EL CAMPO: galería horizontal fijada (desktop) / carrusel nativo (móvil)
     =================================================================== */
  function initCampo() {
    const sec = $('#campo');
    if (!sec) return;
    const vp = $('.campo__viewport', sec), track = $('.campo__track', sec), panels = $$('.panel', track);
    if (!vp || !track || !panels.length) return;
    const mq = window.matchMedia('(min-width:900px) and (hover:hover)');
    let maxX = 0;

    function measure() {
      if (!mq.matches) { maxX = 0; track.style.transform = ''; return; }
      const last = panels[panels.length - 1];
      const padR = parseFloat(getComputedStyle(track).paddingRight) || 0;
      maxX = Math.max(0, last.offsetLeft + last.offsetWidth + padR - vp.clientWidth);
    }
    function burst(pn) {
      pn.classList.add('hit');
      const s = $('.splat', pn);
      if (s && hasAnime()) {
        window.anime({ targets: s, scale: [0, 1], rotate: [-24, 8], opacity: [0, 0.95], duration: 950, easing: 'easeOutElastic(1, .6)' });
      }
    }
    function update() {
      const vh = window.innerHeight, vw = window.innerWidth, r = sec.getBoundingClientRect();
      let p;
      if (mq.matches) {
        p = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
        track.style.transform = 'translate3d(' + (-p * maxX).toFixed(1) + 'px,0,0)';
      } else {
        const sw = track.scrollWidth - track.clientWidth;
        p = sw > 0 ? track.scrollLeft / sw : 0;
      }
      sec.style.setProperty('--cp', p.toFixed(4));
      if (r.bottom < -200 || r.top > vh + 200) return;
      panels.forEach(function (pn) {
        const b = pn.getBoundingClientRect(), c = b.left + b.width / 2;
        pn.style.setProperty('--par', clamp((c - vw / 2) / (vw / 2 + b.width / 2), -1, 1).toFixed(3));
        if (pn.hasAttribute('data-hit') && !pn.classList.contains('hit') && Math.abs(c - vw / 2) < vw * 0.2) burst(pn);
      });
    }
    measure();
    onFrame(update);
    track.addEventListener('scroll', schedule, { passive: true });
    const remeasure = function () { measure(); schedule(); };
    window.addEventListener('resize', debounce(remeasure, 120));
    window.addEventListener('load', remeasure);
    if (mq.addEventListener) mq.addEventListener('change', remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    update();
  }

  /* ===================================================================
     9 · ARSENAL: resplandor que sigue al puntero
     =================================================================== */
  function initCards() {
    $$('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }

  /* ===================================================================
     10 · PAQUETES: cuadrícula de cápsulas + inclinación 3D
     =================================================================== */
  function initPaq() {
    $$('.ammo').forEach(function (a) {
      const n = parseInt(a.getAttribute('data-n'), 10) || 0;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < n; i++) { const d = document.createElement('i'); d.style.setProperty('--k', i); frag.appendChild(d); }
      a.appendChild(frag);
    });
    if (!fine || reduce) return;
    $$('.ticket').forEach(function (t) {
      const inner = $('.ticket__in', t);
      if (!inner) return;
      t.addEventListener('pointermove', function (e) {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        inner.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(2) + 'deg');
        inner.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(2) + 'deg');
      }, { passive: true });
      t.addEventListener('pointerleave', function () { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ===================================================================
     11 · ESCUADRÓN: la línea se dibuja con el scroll y los nodos se encienden
     =================================================================== */
  function initTimeline() {
    const tl = $('#tl');
    if (!tl) return;
    const steps = $$('.step', tl);
    function update() {
      const r = tl.getBoundingClientRect(), vh = window.innerHeight, line = vh * 0.62;
      tl.style.setProperty('--tl', clamp((line - r.top) / r.height, 0, 1).toFixed(4));
      steps.forEach(function (s) {
        const n = $('.step__node', s); if (!n) return;
        const b = n.getBoundingClientRect();
        s.classList.toggle('lit', b.top + b.height / 2 < line);
      });
    }
    onFrame(update); update();
  }

  /* ===================================================================
     12 · OCASIONES: imagen que sigue al cursor (desktop) / acordeón (móvil)
     =================================================================== */
  function initOcc() {
    const list = $('.occ');
    const rows = $$('.occ__row');
    if (!list || !rows.length) return;
    const desk = window.matchMedia('(min-width:900px) and (hover:hover) and (pointer:fine)');

    const fl = document.createElement('div');
    fl.className = 'occ-float'; fl.setAttribute('aria-hidden', 'true');
    fl.innerHTML = '<div class="occ-float__clip"><img alt="" width="1599" height="899"></div>';
    document.body.appendChild(fl);
    const img = $('img', fl);
    let tx = 0, ty = 0, cx = 0, cy = 0, rot = 0, raf = 0, preloaded = false;

    function loop() {
      raf = 0;
      cx = lerp(cx, tx, 0.14); cy = lerp(cy, ty, 0.14);
      rot = lerp(rot, clamp((tx - cx) * 0.06, -8, 8), 0.2);
      fl.style.transform = 'translate3d(' + (cx - fl.offsetWidth / 2).toFixed(1) + 'px,' + (cy - fl.offsetHeight / 2).toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
      if (fl.classList.contains('show') || Math.abs(tx - cx) > 0.5) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(loop); }
    function preload() {
      if (preloaded) return; preloaded = true;
      rows.forEach(function (r) { const i = new Image(); i.src = r.getAttribute('data-img'); });
    }
    function showFor(row) {
      if (!desk.matches) return;
      const src = row.getAttribute('data-img');
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      fl.classList.add('show'); kick();
    }
    list.addEventListener('pointerenter', preload);
    list.addEventListener('pointermove', function (e) {
      if (!desk.matches) return;
      if (!fl.classList.contains('show')) { cx = e.clientX; cy = e.clientY; }
      tx = e.clientX + 40; ty = e.clientY; kick();
    }, { passive: true });
    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function () { showFor(row); });
      row.addEventListener('pointerleave', function () { fl.classList.remove('show'); });
      row.addEventListener('focusin', function () {
        if (!desk.matches) return;
        const r = row.getBoundingClientRect();
        tx = r.left + r.width * 0.6; ty = r.top + r.height / 2; showFor(row);
      });
      row.addEventListener('focusout', function () { fl.classList.remove('show'); });

      const btn = $('.occ__btn', row);
      if (btn) btn.addEventListener('click', function () {
        if (desk.matches) return;                              // en desktop manda el hover
        const open = !row.classList.contains('open');
        rows.forEach(function (o) { o.classList.remove('open'); const b = $('.occ__btn', o); if (b) b.setAttribute('aria-expanded', 'false'); });
        row.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    function sync() {
      rows.forEach(function (o) {
        o.classList.remove('open');
        const b = $('.occ__btn', o); if (b) b.setAttribute('aria-expanded', desk.matches ? 'true' : 'false');
      });
      fl.classList.remove('show');
    }
    sync();
    if (desk.addEventListener) desk.addEventListener('change', sync);
  }

  /* ===================================================================
     13 · RECORRIDO: portal expansivo + video bajo demanda
     =================================================================== */
  function initPortal() {
    const sec = $('#recorrido');
    if (!sec) return;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function update() {
      const r = sec.getBoundingClientRect(), vh = window.innerHeight;
      const p = clamp(-r.top / Math.max(1, sec.offsetHeight - vh), 0, 1);
      sec.style.setProperty('--p', ease(clamp(p / 0.7, 0, 1)).toFixed(4));
      sec.classList.toggle('txt-off', p < 0.72);
    }
    onFrame(update); update();

    /* Video */
    const btn = $('#vidBtn'), modal = $('#vid'), box = $('#vidBox'), x = $('#vidX');
    if (!btn || !modal || !box || !x) return;
    const SRC = 'assets/video/campo.mp4';
    const POSTER = 'assets/img/whatsapp-image-2026-11-20-at-10-54-11-am-1.jpg';
    /* El video existe en assets/video; sin petición previa (evita descargas/errores falsos) */
    function open() {
      const v = document.createElement('video');
      v.controls = true; v.preload = 'none'; v.poster = POSTER; v.setAttribute('playsinline', '');
      v.addEventListener('loadedmetadata', function () { if (v.videoWidth && v.videoHeight) box.style.aspectRatio = v.videoWidth + ' / ' + v.videoHeight; });
      v.src = SRC;
      box.appendChild(v);
      modal.hidden = false; root.classList.add('lock'); x.focus();
      const pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
    }
    function close() {
      const v = $('video', box);
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); v.remove(); }
      box.style.aspectRatio = ''; modal.hidden = true; root.classList.remove('lock'); btn.focus();
    }
    btn.addEventListener('click', open);
    x.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  /* ===================================================================
     14 · PREGUNTAS: <details> con altura animada
     =================================================================== */
  function initFaq() {
    $$('.faq__i').forEach(function (d) {
      const sum = $('summary', d);
      if (!sum) return;
      if (d.open) d.classList.add('is-open');
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.classList.contains('is-open')) {
          d.classList.remove('is-open');
          setTimeout(function () { if (!d.classList.contains('is-open')) d.removeAttribute('open'); }, reduce ? 0 : 500);
        } else {
          d.setAttribute('open', '');
          void d.offsetHeight;                                 // reflow: arranca desde 0fr
          requestAnimationFrame(function () { d.classList.add('is-open'); });
        }
      });
    });
  }

  /* ===================================================================
     15 · FORMULARIO → WhatsApp
     =================================================================== */
  function initForm() {
    const f = $('#form');
    if (!f) return;
    const fecha = $('#f-fecha');
    const d = new Date();
    const hoy = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
    if (fecha) fecha.min = hoy;
    const ok = $('#formOk');

    function setErr(id, msg) {
      const input = $('#' + id), box = $('#e-' + id.replace('f-', ''));
      const fld = input ? input.closest('.fld') : null;
      if (box) box.textContent = msg || '';
      if (fld) fld.classList.toggle('bad', !!msg);
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }
    function validate() {
      const nombre = $('#f-nombre').value.trim();
      const n = parseInt($('#f-jug').value, 10);
      const fch = fecha ? fecha.value : '';
      const r = [
        setErr('f-nombre', nombre.length < 2 ? 'Escribe tu nombre (mínimo 2 letras).' : ''),
        setErr('f-jug', !(n >= 1) ? 'Dinos cuántos van (mínimo 1).' : ''),
        setErr('f-fecha', fch && fch < hoy ? 'Elige una fecha de hoy en adelante.' : '')
      ];
      return r.every(Boolean);
    }
    ['f-nombre', 'f-jug', 'f-fecha'].forEach(function (id) {
      const el = $('#' + id); if (el) el.addEventListener('input', function () { setErr(id, ''); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!WHATSAPP[0]) return;
      if (!validate()) { const bad = $('.fld.bad input', f); if (bad) bad.focus(); if (ok) ok.textContent = ''; return; }
      const nombre = $('#f-nombre').value.trim();
      const n = parseInt($('#f-jug').value, 10);
      const paq = $('#f-paq').value;
      const extra = $('#f-msg').value.trim();
      let fechaTxt = 'por confirmar';
      if (fecha && fecha.value) {
        const p = fecha.value.split('-');
        fechaTxt = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      const txt = '¡Hola Gotcha Potrero! Soy ' + nombre + '. ' + (n === 1 ? 'Seré 1 jugador.' : 'Somos ' + n + ' jugadores.') +
        ' Paquete: ' + paq + '. Fecha: ' + fechaTxt + '.' + (extra ? ' ' + extra : '');
      const url = waUrl(0, txt);
      const w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (err) { /* nada */ } } else { window.location.href = url; }
      if (ok) ok.textContent = 'Listo: abrimos WhatsApp con tu mensaje. Solo falta enviarlo.';
    });
  }

  /* ===================================================================
     16 · BOTÓN FLOTANTE: burbuja a los 4 s
     =================================================================== */
  function initFloat() {
    const fl = $('.wa-float');
    if (!fl || !WHATSAPP[0]) return;
    setTimeout(function () {
      fl.classList.add('bubble');
      setTimeout(function () { fl.classList.remove('bubble'); }, 6000);
    }, 4000);
  }

  /* ===================================================================
     17 · MANCHAS DE PINTURA POR CLIC / TOQUE
     =================================================================== */
  function initPaint() {
    if (reduce) return;
    const cv = $('#paint');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 1, H = 1, raf = 0;
    const splats = [];
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', debounce(size, 160));
    function frame(now) {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      for (let i = splats.length - 1; i >= 0; i--) if (!drawSplat(ctx, splats[i], now, 5)) splats.splice(i, 1);
      if (splats.length) raf = requestAnimationFrame(frame);   // solo corre mientras haya manchas
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a,button,input,select,textarea,summary,label,video,.vid,.menu')) return;
      splats.push(newSplat(e.clientX, e.clientY, COLORS[Math.floor(Math.random() * 3)], 1.5 + Math.random() * 0.8));
      if (splats.length > 12) splats.shift();
      if (!raf) raf = requestAnimationFrame(frame);
    });
  }

  /* ===================================================================
     18 · CURSOR RETÍCULA (solo puntero fino)
     =================================================================== */
  function initCursor() {
    if (!fine || reduce) return;
    const c = $('.cur');
    if (!c) return;
    root.classList.add('cur-on');
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    function loop() {
      raf = 0;
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(x - cx) > 0.2 || Math.abs(y - cy) > 0.2) raf = requestAnimationFrame(loop);
    }
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      c.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,summary,input,select,textarea,label,.panel,.ticket')));
    });
    document.addEventListener('mouseleave', function () { c.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { c.style.opacity = ''; });
  }

  /* ===================================================================
     ARRANQUE
     =================================================================== */
  safe(initLoader, 'loader');
  safe(initWhatsApp, 'whatsapp');
  safe(initHeader, 'header');
  safe(initReveal, 'reveal');
  safe(initHero, 'hero');
  safe(initMarquee, 'marquee');
  safe(initMision, 'mision');
  safe(initCampo, 'campo');
  safe(initCards, 'cards');
  safe(initPaq, 'paquetes');
  safe(initTimeline, 'timeline');
  safe(initOcc, 'ocasiones');
  safe(initPortal, 'portal');
  safe(initFaq, 'faq');
  safe(initForm, 'form');
  safe(initFloat, 'float');
  safe(initPaint, 'paint');
  safe(initCursor, 'cursor');
  schedule();
  window.addEventListener('load', schedule);
})();
