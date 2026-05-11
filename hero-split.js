/**
 * Hero split-text intro — staged like Wall of Portfolios: title → lead → page chrome.
 * Index only: body.home-intro-pending hides nav, projects, footer, etc. until the timeline finishes.
 */
(function () {
  var introStarted = false;

  function splitTextNodes(root) {
    var full = root.textContent.replace(/\s+/g, ' ').trim();
    if (full) root.setAttribute('aria-label', full);

    function wrapTextNode(node) {
      var text = node.nodeValue;
      var frag = document.createDocumentFragment();
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        var span = document.createElement('span');
        span.className = 'split-char';
        span.textContent = ch === ' ' ? '\u00a0' : ch;
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    }

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      for (var j = 0; j < children.length; j++) {
        var child = children[j];
        if (child.nodeType === 3) {
          if (child.nodeValue && child.nodeValue.length) wrapTextNode(child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    }

    walk(root);
  }

  function getRevealElements() {
    if (!document.body.classList.contains('home-intro-pending')) return [];
    var selectors = [
      '.site-header',
      '#projects',
      '.site-footer',
      '.hero__scroll',
      '.project-back-top-wrap',
      '.scroll-progress',
      '.gradual-blur'
    ];
    var out = [];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) out.push(el);
    }
    return out;
  }

  function init() {
    if (introStarted) return;
    introStarted = true;

    var pendingIntro = document.body.classList.contains('home-intro-pending');

    if (!window.gsap) {
      if (pendingIntro) document.body.classList.remove('home-intro-pending');
      return;
    }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      if (pendingIntro) document.body.classList.remove('home-intro-pending');
      return;
    }

    var title = document.querySelector('.hero__title');
    var lead = document.querySelector('.hero__lead');
    if (!title || !lead) {
      if (pendingIntro) document.body.classList.remove('home-intro-pending');
      return;
    }

    splitTextNodes(title);
    splitTextNodes(lead);

    var titleChars = title.querySelectorAll('.split-char');
    var leadChars = lead.querySelectorAll('.split-char');

    gsap.set([titleChars, leadChars], { opacity: 0, y: '0.35em' });

    var revealEls = getRevealElements();
    if (revealEls.length) {
      gsap.set(revealEls, { autoAlpha: 0, y: 28 });
    }

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(titleChars, {
      opacity: 1,
      y: 0,
      stagger: 0.028,
      duration: 0.62
    });

    tl.to(
      leadChars,
      {
        opacity: 1,
        y: 0,
        stagger: 0.022,
        duration: 0.58
      },
      '>'
    );

    if (revealEls.length) {
      tl.to(
        revealEls,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.07,
          ease: 'power2.out',
          onComplete: function () {
            document.body.classList.remove('home-intro-pending');
            gsap.set(revealEls, { clearProps: 'opacity,visibility,transform' });
          }
        },
        '+=0.15'
      );
    } else if (pendingIntro) {
      tl.add(function () {
        document.body.classList.remove('home-intro-pending');
      });
    }
  }

  function run() {
    /* If fonts.ready never settles (blocked network, some embeds), intro must still run or home-intro-pending hides the whole UI forever. */
    var timeoutMs = 1800;
    var timeoutId = setTimeout(function () {
      init();
    }, timeoutMs);

    function kick() {
      clearTimeout(timeoutId);
      init();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(kick).catch(kick);
    } else {
      clearTimeout(timeoutId);
      init();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
