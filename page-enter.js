/* Early bootstrap so arriving pages can swipe/dissolve in without a flash. */
(function () {
  try {
    var key = 'portfolio-nav-type';
    var type = sessionStorage.getItem(key);
    if (!type) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.removeItem(key);
      return;
    }
    document.documentElement.classList.add('is-page-enter');
    document.documentElement.setAttribute('data-nav-type', type);
  } catch (err) {}
})();
