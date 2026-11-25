/* Razov DB: animated "database network" behind the hero.
   Nodes drift, nearby nodes link up, and pulses travel along the links.
   Cheap by design: one canvas, DPR capped at 2, paused when the hero is off
   screen or the tab is hidden, and a single static frame for reduced motion. */
(function () {
  'use strict';

  var canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var host = canvas.parentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  var width = 0;
  var height = 0;
  var dpr = 1;
  var linkDist = 140;
  var nodes = [];
  var pulses = [];
  var palette = null;
  var raf = 0;
  var lastTime = 0;
  var spawnClock = 0;
  var onScreen = true;
  var pointer = null;

  function readPalette() {
    var styles = getComputedStyle(document.documentElement);
    var get = function (name, fallback) {
      var value = styles.getPropertyValue(name).trim();
      return value || fallback;
    };
    palette = {
      edge: get('--net-edge', '148, 163, 184'),
      alpha: parseFloat(get('--net-alpha', '0.32')) || 0.32,
      accents: [get('--dp-rgb', '56, 189, 248'), get('--sq-rgb', '167, 139, 250'), get('--sz-rgb', '52, 211, 153')]
    };
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
  }

  function seed() {
    var area = width * height;
    var count = Math.round(Math.min(78, Math.max(26, area / 15000)));
    linkDist = Math.max(110, Math.min(170, Math.sqrt(area / count) * 1.45));
    nodes = [];
    for (var i = 0; i < count; i++) {
      var hub = Math.random() < 0.12;
      var speed = 0.006 + Math.random() * 0.012; // px per ms
      var angle = Math.random() * Math.PI * 2;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: hub ? 3.2 + Math.random() * 1.2 : 1.3 + Math.random() * 1.3,
        hub: hub,
        c: Math.floor(Math.random() * 3),
        flash: 0
      });
    }
    pulses = [];
  }

  // Sizes come from a ResizeObserver entry (measured after layout), so this
  // never forces a synchronous reflow.
  function resize(boxWidth, boxHeight) {
    var nextW = Math.max(1, Math.round(boxWidth));
    var nextH = Math.max(1, Math.round(boxHeight));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var changed = nextW !== width || nextH !== height;
    var scaleX = width ? nextW / width : 1;
    var scaleY = height ? nextH / height : 1;
    width = nextW;
    height = nextH;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!nodes.length) {
      seed();
    } else if (changed) {
      nodes.forEach(function (n) { n.x *= scaleX; n.y *= scaleY; });
      var want = Math.round(Math.min(78, Math.max(26, (width * height) / 15000)));
      if (Math.abs(want - nodes.length) > 8) seed();
    }
  }

  function neighbours(index) {
    var a = nodes[index];
    var list = [];
    for (var j = 0; j < nodes.length; j++) {
      if (j === index) continue;
      var b = nodes[j];
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      if (dx * dx + dy * dy < linkDist * linkDist * 0.8) list.push(j);
    }
    return list;
  }

  function spawnPulse(from, hops) {
    var start = typeof from === 'number' ? from : Math.floor(Math.random() * nodes.length);
    var options = neighbours(start);
    if (!options.length) return;
    var to = options[Math.floor(Math.random() * options.length)];
    pulses.push({
      a: start,
      b: to,
      t: 0,
      speed: 1 / (700 + Math.random() * 700),
      c: nodes[start].c,
      hops: hops || 0
    });
  }

  function step(dt) {
    var margin = 20;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -margin) { n.x = -margin; n.vx = Math.abs(n.vx); }
      else if (n.x > width + margin) { n.x = width + margin; n.vx = -Math.abs(n.vx); }
      if (n.y < -margin) { n.y = -margin; n.vy = Math.abs(n.vy); }
      else if (n.y > height + margin) { n.y = height + margin; n.vy = -Math.abs(n.vy); }
      if (n.flash > 0) n.flash = Math.max(0, n.flash - dt / 700);
    }

    spawnClock += dt;
    var interval = width < 600 ? 520 : 300;
    while (spawnClock > interval) {
      spawnClock -= interval;
      if (pulses.length < 24) spawnPulse();
    }

    for (var p = pulses.length - 1; p >= 0; p--) {
      var pulse = pulses[p];
      pulse.t += pulse.speed * dt;
      var a = nodes[pulse.a];
      var b = nodes[pulse.b];
      var dx = a.x - b.x;
      var dy = a.y - b.y;
      if (dx * dx + dy * dy > linkDist * linkDist * 1.2) {
        pulses.splice(p, 1);
        continue;
      }
      if (pulse.t >= 1) {
        b.flash = 1;
        pulses.splice(p, 1);
        if (pulse.hops < 3 && Math.random() < 0.65) spawnPulse(pulse.b, pulse.hops + 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    var maxSq = linkDist * linkDist;
    ctx.lineWidth = 1;

    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > maxSq) continue;
        var strength = 1 - Math.sqrt(d2) / linkDist;
        ctx.strokeStyle = rgba(palette.edge, strength * palette.alpha);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    if (pointer) {
      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        var px = n.x - pointer.x;
        var py = n.y - pointer.y;
        var pd = px * px + py * py;
        var reach = linkDist * 1.1;
        if (pd > reach * reach) continue;
        ctx.strokeStyle = rgba(palette.accents[n.c], (1 - Math.sqrt(pd) / reach) * 0.45);
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
    }

    for (var p = 0; p < pulses.length; p++) {
      var pulse = pulses[p];
      var from = nodes[pulse.a];
      var to = nodes[pulse.b];
      var t = pulse.t;
      var tail = Math.max(0, t - 0.22);
      var x = from.x + (to.x - from.x) * t;
      var y = from.y + (to.y - from.y) * t;
      var tx = from.x + (to.x - from.x) * tail;
      var ty = from.y + (to.y - from.y) * tail;
      var colour = palette.accents[pulse.c];
      var gradient = ctx.createLinearGradient(tx, ty, x, y);
      gradient.addColorStop(0, rgba(colour, 0));
      gradient.addColorStop(1, rgba(colour, 0.95));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = rgba(colour, 0.22);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(colour, 1);
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 1;

    for (var m = 0; m < nodes.length; m++) {
      var node = nodes[m];
      var c = palette.accents[node.c];
      if (node.hub || node.flash > 0) {
        ctx.strokeStyle = rgba(c, 0.35 + node.flash * 0.5);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r + 4 + node.flash * 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(c, node.hub ? 0.95 : 0.55 + node.flash * 0.45);
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    raf = 0;
    var dt = lastTime ? Math.min(50, now - lastTime) : 16;
    lastTime = now;
    step(dt);
    draw();
    schedule();
  }

  function shouldRun() {
    return onScreen && !document.hidden && !reduceMotion.matches;
  }

  function schedule() {
    if (!raf && palette && shouldRun()) raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
  }

  function drawStatic() {
    pulses = [];
    // A few frozen pulses so the still frame still reads as a network.
    for (var i = 0; i < 6; i++) spawnPulse();
    pulses.forEach(function (p) { p.t = 0.35 + Math.random() * 0.4; });
    draw();
  }

  function refresh() {
    if (!palette) return;
    if (shouldRun()) {
      schedule();
    } else {
      stop();
      if (reduceMotion.matches) drawStatic();
    }
  }

  function redraw() {
    if (raf) return;
    if (reduceMotion.matches) drawStatic(); else draw();
  }

  function applySize(boxWidth, boxHeight) {
    var first = !palette;
    if (first) readPalette();
    resize(boxWidth, boxHeight);
    redraw();
    if (first) {
      canvas.classList.add('is-ready');
      refresh();
    }
  }

  function start() {
    // The canvas fills the hero (CSS 100% x 100%), so observing the canvas gives
    // the hero size. Changing canvas.width/height only resizes the bitmap.
    if ('ResizeObserver' in window) {
      new ResizeObserver(function (entries) {
        var box = entries[entries.length - 1].contentRect;
        applySize(box.width, box.height);
      }).observe(canvas);
    } else {
      window.requestAnimationFrame(function () {
        var rect = canvas.getBoundingClientRect();
        applySize(rect.width, rect.height);
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        refresh();
      }).observe(host);
    }

    document.addEventListener('visibilitychange', refresh);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', refresh);

    document.addEventListener('razov:themechange', function () {
      if (!palette) return;
      readPalette();
      redraw();
    });

    if (finePointer.matches) {
      host.addEventListener('pointermove', function (event) {
        var rect = canvas.getBoundingClientRect();
        pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      });
      host.addEventListener('pointerleave', function () { pointer = null; });
    }
  }

  // Start after the page has loaded so the canvas never competes with first paint.
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start, { once: true });
  }
})();
