/**
 * DotField — vanilla port of @react-bits/DotField-JS-CSS
 * Props match the user's Usage example exactly (no changes).
 */
(function () {
  var TWO_PI = Math.PI * 2;

  var defaults = {
    dotRadius: 1,
    dotSpacing: 16,
    cursorRadius: 500,
    cursorForce: 0.53,
    bulgeOnly: true,
    bulgeStrength: 66,
    glowRadius: 400,
    sparkle: true,
    waveAmplitude: 5,
    gradientFrom: '#A855F7',
    gradientTo: '#B497CF',
    glowColor: '#120F17'
  };

  function mount(container) {
    if (!container) return;

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;');

    var glowId = 'dot-field-glow-' + Math.random().toString(36).slice(2, 9);
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var radialGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    radialGrad.setAttribute('id', glowId);
    var stop0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop0.setAttribute('offset', '0%');
    stop0.setAttribute('stop-color', defaults.glowColor);
    var stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '100%');
    stop1.setAttribute('stop-color', 'transparent');
    radialGrad.appendChild(stop0);
    radialGrad.appendChild(stop1);
    defs.appendChild(radialGrad);
    svg.appendChild(defs);

    var glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowEl.setAttribute('cx', '-9999');
    glowEl.setAttribute('cy', '-9999');
    glowEl.setAttribute('r', String(defaults.glowRadius));
    glowEl.setAttribute('fill', 'url(#' + glowId + ')');
    glowEl.style.opacity = '0';
    glowEl.style.willChange = 'opacity';
    svg.appendChild(glowEl);

    container.classList.add('dot-field-container');
    container.appendChild(canvas);
    container.appendChild(svg);

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var dotsRef = [];
    var mouseRef = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
    var rafRef = null;
    var sizeRef = { w: 0, h: 0, offsetX: 0, offsetY: 0 };
    var glowOpacity = { current: 0 };
    var engagement = { current: 0 };
    var resizeTimer = null;
    var speedInterval = null;
    var frameCount = 0;
    var resizeObserver = null;

    var p = defaults;

    function buildDots(w, h) {
      var step = p.dotRadius + p.dotSpacing;
      var cols = Math.floor(w / step);
      var rows = Math.floor(h / step);
      var padX = (w % step) / 2;
      var padY = (h % step) / 2;
      var dots = new Array(rows * cols);
      var idx = 0;
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          var ax = padX + col * step + step / 2;
          var ay = padY + row * step + step / 2;
          dots[idx++] = { ax: ax, ay: ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
      dotsRef = dots;
    }

    function doResize() {
      var rect = container.getBoundingClientRect();
      var w = Math.max(0, Math.round(rect.width));
      var h = Math.max(0, Math.round(rect.height));
      if (w < 1 || h < 1) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.w = w;
      sizeRef.h = h;
      sizeRef.offsetX = rect.left + window.scrollX;
      sizeRef.offsetY = rect.top + window.scrollY;
      buildDots(w, h);
    }

    function scheduleResize() {
      requestAnimationFrame(function () {
        doResize();
        requestAnimationFrame(doResize);
      });
    }

    function resize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    }

    function onMouseMove(e) {
      mouseRef.x = e.pageX - sizeRef.offsetX;
      mouseRef.y = e.pageY - sizeRef.offsetY;
    }

    function updateMouseSpeed() {
      var m = mouseRef;
      var dx = m.prevX - m.x;
      var dy = m.prevY - m.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }

    function tick() {
      frameCount++;
      var dots = dotsRef;
      var m = mouseRef;
      var w = sizeRef.w;
      var h = sizeRef.h;
      var len = dots.length;
      var t = frameCount * 0.02;

      var targetEngagement = Math.min(m.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      var eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;

      glowEl.setAttribute('cx', String(m.x));
      glowEl.setAttribute('cy', String(m.y));
      glowEl.style.opacity = String(glowOpacity.current);

      ctx.clearRect(0, 0, w, h);

      var grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, p.gradientFrom);
      grad.addColorStop(1, p.gradientTo);
      ctx.fillStyle = grad;

      var cr = p.cursorRadius;
      var crSq = cr * cr;
      var rad = p.dotRadius / 2;
      var isBulge = p.bulgeOnly;

      ctx.beginPath();

      for (var i = 0; i < len; i++) {
        var d = dots[i];
        var dx = m.x - d.ax;
        var dy = m.y - d.ay;
        var distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          var dist = Math.sqrt(distSq);
          if (isBulge) {
            var tt = 1 - dist / cr;
            var push = tt * tt * p.bulgeStrength * eng;
            var angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            var angle2 = Math.atan2(dy, dx);
            var move = (500 / dist) * (m.speed * p.cursorForce);
            d.vx += Math.cos(angle2) * -move;
            d.vy += Math.sin(angle2) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        var drawX = d.sx;
        var drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }

        if (p.sparkle) {
          var hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if ((hash % 100) < 3) {
            ctx.moveTo(drawX + rad * 1.8, drawY);
            ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }

      ctx.fill();

      rafRef = requestAnimationFrame(tick);
    }

    scheduleResize();
    window.addEventListener('resize', resize);
    window.addEventListener('load', scheduleResize, { once: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    speedInterval = setInterval(updateMouseSpeed, 20);
    rafRef = requestAnimationFrame(tick);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(function () {
        scheduleResize();
      });
      resizeObserver.observe(container);
    }

    return function destroy() {
      cancelAnimationFrame(rafRef);
      clearInterval(speedInterval);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('load', scheduleResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.classList.remove('dot-field-container');
    };
  }

  function init() {
    var el = document.getElementById('dot-field-container');
    if (el) mount(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
