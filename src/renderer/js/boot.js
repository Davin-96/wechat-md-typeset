(function () {
  try {
    var mode = localStorage.getItem('ui-mode') || 'auto';
    var dark = mode === 'dark' || (mode === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-ui-mode', mode);
    document.documentElement.setAttribute('data-ui', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-ui', 'light');
  }
})();
