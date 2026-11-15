(function () {
  try {
    var m = localStorage.getItem('uiMode');
    if (m !== 'dark' && m !== 'light') {
      m = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-ui', m);
  } catch (e) {
    document.documentElement.setAttribute('data-ui', 'light');
  }
})();
