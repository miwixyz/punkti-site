// Punkti-Seite: Punktringe (SVG), Live-Uhr, Einblenden beim Scrollen. Keine Fremdzugriffe.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  // Ring aus n Punkten; lit(i) liefert Helligkeit 0..1 je Punkt.
  function ring(svg, n, r, size, lit, color) {
    svg.textContent = '';
    var dots = [];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 - Math.PI / 2;
      var c = el('circle', { cx: 100 + Math.cos(a) * r, cy: 100 + Math.sin(a) * r, r: size, fill: color || '#fff' });
      svg.appendChild(c);
      dots.push(c);
    }
    dots.forEach(function (c, i) { var v = lit(i); c.setAttribute('opacity', 0.14 + 0.86 * v); });
    return dots;
  }

  var pad = function (v) { return v < 10 ? '0' + v : '' + v; };

  // Live-Uhr im Hero: wandernder Kopf mit Schweif
  var clockSvg = document.getElementById('clock-ring');
  var timeEl = document.getElementById('clock-time');
  var subEl = document.getElementById('clock-sub');
  if (clockSvg) {
    var cd = ring(clockSvg, 60, 88, 2.6, function () { return 0; }, '#fff');
    var lastMin = -1;
    var tail = 9;
    var frame = function () {
      var d = new Date();
      var pos = (d.getSeconds() + d.getMilliseconds() / 1000) * (60 / 60); // 0..60 Punkte
      for (var i = 0; i < 60; i++) {
        var back = (pos - i + 60) % 60; // Abstand hinter dem Kopf
        var v = back < tail ? Math.pow(1 - back / tail, 1.6) : 0;
        cd[i].setAttribute('opacity', (0.14 + 0.86 * v).toFixed(3));
        cd[i].setAttribute('fill', back < 0.6 ? '#d9c9ff' : '#fff');
      }
      if (d.getMinutes() !== lastMin) {
        lastMin = d.getMinutes();
        timeEl.textContent = pad(d.getHours()) + ':' + pad(lastMin);
        subEl.textContent = d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    frame();
    if (reduce) setInterval(frame, 1000);
  }

  // Widget-Ringe
  var now = new Date();
  var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  var today = now.getDate();

  function mk(name) { return document.querySelector('[data-ring="' + name + '"]'); }
  function label(svg, text, sub) {
    var t = el('text', { x: 100, y: sub ? 104 : 112, 'text-anchor': 'middle', fill: '#f4f3f8', 'font-size': sub ? 40 : 46, 'font-weight': 300, 'font-family': 'Plus Jakarta Sans, system-ui, sans-serif' });
    t.textContent = text; svg.appendChild(t);
    if (sub) { var s = el('text', { x: 100, y: 128, 'text-anchor': 'middle', fill: 'rgba(244,243,248,.45)', 'font-size': 12, 'letter-spacing': 2, 'font-family': 'Plus Jakarta Sans, system-ui, sans-serif' }); s.textContent = sub; svg.appendChild(s); }
  }

  var u = mk('uhr'); if (u) { ring(u, 60, 88, 2.6, function (i) { return i < 14 && i > 4 ? (i - 4) / 10 : 0; }); label(u, pad(now.getHours()) + ':' + pad(now.getMinutes())); }
  var da = mk('datum'); if (da) { ring(da, daysInMonth, 88, 3, function (i) { return i + 1 === today ? 1 : (i + 1 < today ? 0.35 : 0); }); label(da, '' + today, now.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase()); }
  var ak = mk('akku'); if (ak) { var pct = 72; ring(ak, 60, 88, 2.6, function (i) { return i / 60 < pct / 100 ? 1 : 0; }); label(ak, pct + '%', 'AKKU'); }
  var ka = mk('kalender'); if (ka) {
    // 24 Stunden, Beispieltermine 10 bis 11 Uhr und 17 bis 18 Uhr
    var slots = [[10, 11], [17, 18]];
    ring(ka, 48, 88, 2.8, function (i) { var h = i / 2; return slots.some(function (s) { return h >= s[0] && h < s[1]; }) ? 1 : 0; });
    label(ka, '17:30', 'SPAZIERGANG');
  }

  // Einblenden beim Scrollen (IntersectionObserver, kein scroll-Listener)
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (n) { io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add('in'); });
  }
})();
