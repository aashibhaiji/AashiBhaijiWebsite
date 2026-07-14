(function () {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  // Header background on scroll
  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Mobile menu
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click (for anchor links)
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // On the landing page, logo + Work always scroll to the top
  if (document.body.classList.contains('page-home')) {
    function scrollHomeToTop(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'auto' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    var logo = document.querySelector('.site-header .logo');
    if (logo) logo.addEventListener('click', scrollHomeToTop);

    document.querySelectorAll('.site-header .nav a').forEach(function (link) {
      if (link.textContent.trim().toLowerCase() === 'work') {
        link.addEventListener('click', scrollHomeToTop);
      }
    });
  }

  // Page transitions: content dissolves/swipes; top nav never moves
  (function setupPageTransitions() {
    var NAV_KEY = 'portfolio-nav-type';
    var EXIT_MS = 420;
    var ENTER_MS = 520;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function pageKindFromUrl(url) {
      try {
        var path = new URL(url, window.location.href).pathname.toLowerCase();
        if (/projects-at-a-glance\.html$/.test(path) || /projects\.html$/.test(path)) return 'projects';
        if (/about\.html$/.test(path)) return 'about';
        if (/design-system\.html$/.test(path)) return 'meta';
        if (
          /project-[^/]+\.html$/.test(path) ||
          /sun-pharma\.html$/.test(path) ||
          /relaxo\.html$/.test(path)
        ) {
          return 'case';
        }
        if (/work\.html$/.test(path) || /index\.html$/.test(path) || /\/$/.test(path)) return 'work';
        if (!/\.html$/.test(path)) return 'work';
      } catch (err) {}
      return 'other';
    }

    function isInternalHtmlNav(url) {
      try {
        var to = new URL(url, window.location.href);
        var from = new URL(window.location.href);
        if (to.protocol !== 'http:' && to.protocol !== 'https:' && to.protocol !== 'file:') {
          return false;
        }
        if (to.origin !== 'null' && from.origin !== 'null' && to.origin !== from.origin) {
          return false;
        }
        if (to.pathname.indexOf('/assets/') !== -1) return false;
        var path = to.pathname.toLowerCase();
        return /\.html$/.test(path) || /\/$/.test(path) || !/\.[a-z0-9]+$/i.test(path);
      } catch (err) {
        return false;
      }
    }

    function isSameDocument(fromUrl, toUrl) {
      try {
        var from = new URL(fromUrl, window.location.href);
        var to = new URL(toUrl, window.location.href);
        return from.pathname === to.pathname && from.search === to.search;
      } catch (err) {
        return false;
      }
    }

    function resolveNavType(fromKind, toKind) {
      if (!fromKind || !toKind || fromKind === 'other' || toKind === 'other') return 'lateral';
      var primary = { work: true, projects: true, about: true, meta: true };
      if (primary[fromKind] && toKind === 'case') return 'forward';
      if (fromKind === 'case' && primary[toKind]) return 'back';
      if (fromKind === 'case' && toKind === 'case') return 'forward';
      return 'lateral';
    }

    function persistNavType(type) {
      document.documentElement.setAttribute('data-nav-type', type);
      try {
        sessionStorage.setItem(NAV_KEY, type);
      } catch (err) {}
    }

    function readNavType() {
      try {
        return sessionStorage.getItem(NAV_KEY);
      } catch (err) {
        return null;
      }
    }

    function clearNavType() {
      try {
        sessionStorage.removeItem(NAV_KEY);
      } catch (err) {}
    }

    // Enter animation on arrival (header stays put)
    (function startEnterIfNeeded() {
      if (reduceMotion) {
        clearNavType();
        document.documentElement.classList.remove('is-page-enter');
        return;
      }
      var type = readNavType();
      if (!type) return;
      document.documentElement.setAttribute('data-nav-type', type);
      document.documentElement.classList.add('is-page-enter');
      window.setTimeout(function () {
        document.documentElement.classList.remove('is-page-enter');
        clearNavType();
      }, ENTER_MS);
    })();

    if (reduceMotion) return;

    // Controlled transitions for every in-site page click, including project tiles
    document.addEventListener(
      'click',
      function (event) {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        var link = event.target.closest && event.target.closest('a[href]');
        if (!link) return;
        if (link.target && link.target !== '' && link.target !== '_self') return;
        if (link.hasAttribute('download')) return;

        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0) {
          return;
        }

        var toUrl;
        try {
          toUrl = new URL(href, window.location.href);
        } catch (err) {
          return;
        }

        if (!isInternalHtmlNav(toUrl.href)) return;
        if (isSameDocument(window.location.href, toUrl.href)) return;

        event.preventDefault();
        if (document.documentElement.classList.contains('is-page-exit')) return;

        var type = resolveNavType(
          pageKindFromUrl(window.location.href),
          pageKindFromUrl(toUrl.href)
        );
        persistNavType(type);
        document.documentElement.classList.add('is-page-exit');

        var navigated = false;
        function go() {
          if (navigated) return;
          navigated = true;
          window.location.href = toUrl.href;
        }

        window.setTimeout(go, EXIT_MS);
      },
      true
    );
  })();

  // Optional: fade-in projects on scroll
  const projects = document.querySelectorAll('.project');
  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          const delay = Math.min(i * 80, 400);
          entry.target.style.animation = "fadeUp 0.6s ease " + delay + "ms forwards";
          entry.target.style.opacity = "0";
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '-40px 0px', threshold: 0.1 }
  );

  projects.forEach(function (project) {
    project.style.opacity = '0';
    observer.observe(project);
  });

  // About page: scroll-triggered reveal
  const aboutReveals = document.querySelectorAll('.about-reveal');
  if (aboutReveals.length > 0) {
    const aboutObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, i) {
          if (entry.isIntersecting) {
            var delay = 0;
            if (entry.target.classList.contains('about-exp__item')) {
              var items = document.querySelectorAll('.about-exp__item');
              var idx = Array.prototype.indexOf.call(items, entry.target);
              delay = Math.min(idx * 80, 320);
            }
            setTimeout(function () {
              entry.target.classList.add('is-visible');
            }, delay);
            aboutObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '-24px 0px -24px 0px', threshold: 0.1 }
    );
    aboutReveals.forEach(function (el) {
      aboutObserver.observe(el);
    });
  }

  // Project case study: floating back-to-top (ring uses --scroll-pct; top bar is .scroll-progress)
  const backTopWrap = document.getElementById('project-back-top-wrap');
  if (backTopWrap) {
    const projectRevealImages = document.querySelectorAll('.project-reveal-image');
    if (projectRevealImages.length > 0) {
      const imageObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              imageObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '-40px 0px -20px 0px', threshold: 0.2 }
      );
      projectRevealImages.forEach(function (img) {
        imageObserver.observe(img);
      });
    }

    function updateBackTop() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0;
      const clamped = Math.min(100, Math.max(0, pct));

      if (scrollY > 350) {
        backTopWrap.classList.add('is-visible');
        backTopWrap.style.setProperty('--scroll-pct', String(clamped));
      } else {
        backTopWrap.classList.remove('is-visible');
        backTopWrap.style.setProperty('--scroll-pct', '0');
      }
    }
    window.addEventListener('scroll', updateBackTop, { passive: true });
    updateBackTop();
  }

  // Project page: click-to-zoom for strip images (3/4 layouts)
  const stripImages = document.querySelectorAll('.project-img__strip .project-img__media');
  if (stripImages.length > 0) {
    const lightbox = document.createElement('div');
    lightbox.className = 'img-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML =
      '<div class="img-lightbox__inner">' +
      '<button class="img-lightbox__close" aria-label="Close image zoom">×</button>' +
      '<img class="img-lightbox__img" alt="" />' +
      '</div>';
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.img-lightbox__img');
    const closeBtn = lightbox.querySelector('.img-lightbox__close');

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lightboxImg.removeAttribute('src');
      lightboxImg.removeAttribute('alt');
    }

    stripImages.forEach(function (img) {
      img.addEventListener('click', function () {
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || 'Zoomed project image';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  // Scroll-into-view: play looping video when visible, pause when off-screen (muted for browser autoplay rules)
  const scrollPlayVideos = document.querySelectorAll('video.js-scroll-play-loop');
  if (scrollPlayVideos.length > 0) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    scrollPlayVideos.forEach(function (video) {
      function applyMotionPreference() {
        if (reduceMotion.matches) {
          video.removeAttribute('autoplay');
          video.controls = true;
        } else {
          video.controls = false;
        }
      }
      applyMotionPreference();
      reduceMotion.addEventListener('change', applyMotionPreference);

      if (reduceMotion.matches) {
        return;
      }

      const vObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              video.play().catch(function () {});
            } else {
              video.pause();
            }
          });
        },
        { rootMargin: '-8% 0px -8% 0px', threshold: 0.2 }
      );
      vObserver.observe(video);
    });
  }

  // Hero video controls: visual play/pause + mute/unmute
  document.querySelectorAll('.project-hero-video__wrap').forEach(function (wrap) {
    var video = wrap.querySelector('.js-hero-video');
    var playBtn = wrap.querySelector('.js-hero-video-toggle');
    var muteBtn = wrap.querySelector('.js-hero-video-mute-toggle');
    var playIcon = wrap.querySelector('.js-hero-video-play-icon');
    var soundIcon = wrap.querySelector('.js-hero-video-sound-icon');
    if (!video || !playBtn || !muteBtn) return;

    function syncControls() {
      var paused = video.paused;
      var muted = video.muted;

      if (playIcon) playIcon.textContent = paused ? '▶' : '❚❚';
      playBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      playBtn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');

      if (soundIcon) soundIcon.textContent = muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      muteBtn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
    }

    // Best effort: attempt autoplay with sound; fallback to muted autoplay if blocked by browser.
    video.muted = false;
    video.play().catch(function () {
      video.muted = true;
      video.play().catch(function () {});
      syncControls();
    });

    playBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (video.paused) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
      syncControls();
    });

    muteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      video.muted = !video.muted;
      if (video.paused) {
        video.play().catch(function () {});
      }
      syncControls();
    });

    video.addEventListener('play', syncControls);
    video.addEventListener('pause', syncControls);
    syncControls();
  });

  // 15-stage flip cards: click/keyboard toggles the flip state
  document.querySelectorAll('.stage-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    });
  });

  // Workbook embed: Office viewer only works when the XLSX URL is public HTTPS
  document.querySelectorAll('[data-office-doc]').forEach(function (wrap) {
    var rel = wrap.getAttribute('data-office-doc');
    if (!rel) return;
    var iframe = wrap.querySelector('.project-doc-viewport__frame');
    if (!iframe) return;
    var docUrl = new URL(rel, window.location.href).href;
    if (window.location.protocol === 'https:') {
      wrap.classList.add('project-doc-viewport--embed');
      iframe.src =
        'https://view.officeapps.live.com/op/embed.aspx?src=' +
        encodeURIComponent(docUrl);
    } else {
      wrap.classList.add('project-doc-viewport--local');
    }
  });

  // Work tabs (Selected work / Medals) + glance panel
  function activateWorkPanel(panelId) {
    if (!panelId) return;

    document.querySelectorAll('.work__tab').forEach(function (t) {
      const selected = t.getAttribute('data-panel') === panelId;
      t.classList.toggle('is-active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
    });

    document.querySelectorAll('.work__panel').forEach(function (panel) {
      const active = panel.id === panelId;
      panel.classList.toggle('is-active', active);
      if (active) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    });
  }

  document.querySelectorAll('.work__tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateWorkPanel(tab.getAttribute('data-panel'));
    });
  });

  // Glance page: filters + shuffle
  const glanceGrid = document.getElementById('glance-grid');
  if (glanceGrid) {
    const filterBtns = document.querySelectorAll('.glance-filters__btn');
    const cards = Array.prototype.slice.call(glanceGrid.querySelectorAll('.glance-card'));
    const emptyState = document.getElementById('glance-empty');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function updateEmptyState() {
      const visibleCount = cards.filter(function (card) {
        return !card.classList.contains('is-hidden');
      }).length;
      if (!emptyState) return;
      const show = visibleCount === 0;
      emptyState.hidden = !show;
      emptyState.classList.toggle('is-visible', show);
    }

    function applyGlanceFilter(filter) {
      cards.forEach(function (card) {
        const cats = (card.getAttribute('data-category') || '').split(/\s+/);
        const show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.classList.toggle('is-hidden', !show);
        if (show && !reduceMotion) {
          card.classList.add('is-entering');
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              card.classList.remove('is-entering');
            });
          });
        }
      });
      updateEmptyState();
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const filter = btn.getAttribute('data-filter') || 'all';
        filterBtns.forEach(function (b) {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        applyGlanceFilter(filter);
      });
    });

    const shuffleBtn = document.getElementById('glance-shuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', function () {
        const visible = cards.filter(function (card) {
          return !card.classList.contains('is-hidden');
        });
        for (var i = visible.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = visible[i];
          visible[i] = visible[j];
          visible[j] = tmp;
        }
        visible.forEach(function (card) {
          if (!reduceMotion) {
            card.classList.add('is-entering');
          }
          glanceGrid.appendChild(card);
          if (!reduceMotion) {
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                card.classList.remove('is-entering');
              });
            });
          }
        });
      });
    }
  }

  // About strengths tabs
  const strengthBtns = document.querySelectorAll('.about-strengths-tabs__btn');
  if (strengthBtns.length > 0) {
    strengthBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const key = btn.getAttribute('data-strengths');
        strengthBtns.forEach(function (b) {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('.about-strengths-panel').forEach(function (panel) {
          const active = panel.getAttribute('data-strengths-panel') === key;
          panel.classList.toggle('is-active', active);
          if (active) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        });
      });
    });
  }

  // --- Interactions & Fun Touches ---

  // 1. Scroll Progress Bar
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', function () {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
    progressBar.style.transform = 'scaleX(' + Math.min(Math.max(scrollPercent, 0), 1) + ')';
  }, { passive: true });

  // 2. 3D Tilt Effect on Project Cards (skip light landing list layout)
  const projectCardsForTilt = document.body.classList.contains('page-home')
    ? []
    : document.querySelectorAll('.project__link');
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    projectCardsForTilt.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02, 1.02, 1.02) translateY(-4px)';
        card.style.transition = 'transform 0.1s ease-out';
      });
      
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = '';
      });
    });
  }

  // 3. Magnetic Buttons (exclude nav CTA — no pull on "Get in Touch")
  const magneticButtons = document.querySelectorAll('.btn:not(.btn--nav)');
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    magneticButtons.forEach(function (btn) {
      // Ensure element has transition for smooth return
      btn.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        btn.style.transform = 'translate(' + (x * 0.25) + 'px, ' + (y * 0.25) + 'px)';
      });
      
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  // Case-study hero video: poster + play overlay; preserve playhead on pause/resume
  document.querySelectorAll('[data-cs-video]').forEach(function (wrap) {
    var video = wrap.querySelector('.cs-hero__video');
    var playBtn = wrap.querySelector('.cs-hero__play');
    if (!video || !playBtn) return;

    function setPlaying(playing) {
      wrap.classList.toggle('is-playing', playing);
      playBtn.setAttribute('aria-hidden', playing ? 'true' : 'false');
      playBtn.tabIndex = playing ? -1 : 0;
    }

    playBtn.addEventListener('click', function () {
      // Resume from currentTime — never force a restart
      video.play().catch(function () {});
    });

    video.addEventListener('play', function () {
      setPlaying(true);
    });

    video.addEventListener('pause', function () {
      // Keep currentTime; show overlay again over the paused frame
      if (!video.ended) setPlaying(false);
    });

    video.addEventListener('ended', function () {
      setPlaying(false);
    });

    setPlaying(false);
  });

  // Live portal preview: keep muted autoplay looping (BanglaBiz pattern)
  document.querySelectorAll('.cs-hero__preview--live .cs-hero__video').forEach(function (video) {
    video.muted = true;
    var tryPlay = function () {
      video.play().catch(function () {});
    };
    tryPlay();
    video.addEventListener('pause', function () {
      if (!video.ended) tryPlay();
    });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tryPlay();
    });
  });

})();
