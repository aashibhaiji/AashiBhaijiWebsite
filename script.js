(function () {
  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

  // Header background on scroll
  function updateHeader() {
    if (window.scrollY > 60) {
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

  // 2. 3D Tilt Effect on Project Cards
  const projectCardsForTilt = document.querySelectorAll('.project__link');
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

})();
