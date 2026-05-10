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

  // Project case study: floating back-to-top + read progress
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

    const backTop = backTopWrap.querySelector('.project-back-top');
    const label = backTopWrap.querySelector('.project-back-top__label');
    function updateBackTop() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? Math.round((scrollY / maxScroll) * 100) : 0;
      const clamped = Math.min(100, Math.max(0, pct));

      if (scrollY > 350) {
        backTopWrap.classList.add('is-visible');
        backTopWrap.style.setProperty('--scroll-pct', String(clamped));
        if (label) label.textContent = clamped + '% read';
      } else {
        backTopWrap.classList.remove('is-visible');
        backTopWrap.style.setProperty('--scroll-pct', '0');
        if (label) label.textContent = '0% read';
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
})();
