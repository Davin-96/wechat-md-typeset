(function () {
  'use strict';

  // ===== API layer (Electron IPC or browser fallback) =====
  const api = window.api;

  // ===== DOM refs =====
  const $ = (id) => document.getElementById(id);
  const editThemeBtn = $('editThemeBtn'), insertImageBtn = $('insertImageBtn'),
    copyBtn = $('copyBtn'), exportBtn = $('exportBtn'), settingsBtn = $('settingsBtn'),
    newArticleBtn = $('newArticleBtn'), newThemeBtn = $('newThemeBtn'), uploadImageBtn = $('uploadImageBtn'),
    articleList = $('articleList'), themeList = $('themeList'), imageList = $('imageList'),
    articleTitle = $('articleTitle'), mdEditor = $('mdEditor'), wordCount = $('wordCount'), saveStatus = $('saveStatus'),
    preview = $('preview'), previewThemeName = $('previewThemeName'), dataDir = $('dataDir'),
    themeModal = $('themeModal'), themeForm = $('themeForm'), themeNameInput = $('themeNameInput'), saveThemeBtn = $('saveThemeBtn'),
    imageModal = $('imageModal'), dropZone = $('dropZone'), fileInput = $('fileInput'), uploadStatus = $('uploadStatus'),
    imageUrlInput = $('imageUrlInput'), insertUrlBtn = $('insertUrlBtn'), imagePickerList = $('imagePickerList'),
    settingsModal = $('settingsModal'), imageHostSelect = $('imageHostSelect'), smmsToken = $('smmsToken'),
    imgbbKey = $('imgbbKey'), autoSaveToggle = $('autoSaveToggle'), settingsDataDir = $('settingsDataDir'), saveSettingsBtn = $('saveSettingsBtn'),
    uiModeBtn = $('uiModeBtn'), toastEl = $('toast');

  // ===== State =====
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const defaultConfig = clone(THEMES.builtinConfigs[0]);
  const state = {
    article: null, config: clone(defaultConfig), currentThemeId: 'moyu',
    articles: [], customThemes: [], images: [], settings: null,
    editingTheme: null, editingThemeId: null,
    saveTimer: null, renderTimer: null, isDirty: false
  };
  const allThemes = () => THEMES.builtinThemes.concat(state.customThemes);

  // ===== Utilities =====
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2200);
  }
  function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function openModal(id) { $(id).classList.remove('hidden'); }
  function closeModal(id) { $(id).classList.add('hidden'); }

  // ===== Render =====
  function render() {
    const r = Engine.render(mdEditor.value, state.config);
    preview.innerHTML = r.html;
    const t = allThemes().find(x => x.id === state.currentThemeId);
    previewThemeName.textContent = t ? t.name : '自定义样式';
    wordCount.textContent = (mdEditor.value.replace(/\s/g, '').length) + ' 字';
  }
  function onEditorInput() {
    state.isDirty = true; saveStatus.textContent = '未保存';
    clearTimeout(state.renderTimer); state.renderTimer = setTimeout(render, 120);
    scheduleSave();
  }
  function markDirty() { state.isDirty = true; saveStatus.textContent = '未保存'; scheduleSave(); }
  function scheduleSave() {
    if (!state.settings || !state.settings.autoSave) return;
    clearTimeout(state.saveTimer); state.saveTimer = setTimeout(saveCurrentArticle, 800);
  }

  // ===== Articles =====
  async function saveCurrentArticle() {
    if (!state.article) state.article = {};
    state.article.title = articleTitle.value || '无标题文章';
    state.article.content = mdEditor.value;
    state.article.config = clone(state.config);
    state.article.themeId = state.currentThemeId;
    const saved = await api.saveArticle(state.article);
    state.article = saved;
    const i = state.articles.findIndex(a => a.id === saved.id);
    if (i >= 0) state.articles[i] = saved; else state.articles.unshift(saved);
    renderArticleList();
    saveStatus.textContent = '已保存'; state.isDirty = false;
  }
  async function loadArticle(id) {
    if (state.isDirty) await saveCurrentArticle();
    const a = await api.getArticle(id); if (!a) return;
    state.article = a;
    state.config = a.config ? clone(a.config) : clone(defaultConfig);
    state.currentThemeId = a.themeId || null;
    articleTitle.value = a.title === '无标题文章' ? '' : (a.title || '');
    mdEditor.value = a.content || '';
    render(); renderThemeList();
    saveStatus.textContent = '已保存'; state.isDirty = false;
    renderArticleList();
  }
  function newArticle() {
    state.article = { title: '', content: '', config: clone(defaultConfig) };
    state.config = clone(defaultConfig); state.currentThemeId = 'moyu';
    articleTitle.value = ''; mdEditor.value = '';
    render(); renderThemeList();
    saveStatus.textContent = '未保存'; state.isDirty = false;
    renderArticleList(); mdEditor.focus();
  }
  async function deleteArticle(id) {
    await api.deleteArticle(id);
    state.articles = state.articles.filter(a => a.id !== id);
    if (state.article && state.article.id === id) {
      if (state.articles.length) loadArticle(state.articles[0].id); else newArticle();
    }
    renderArticleList(); toast('已删除文章');
  }
  function renderArticleList() {
    articleList.innerHTML = '';
    if (!state.articles.length) { articleList.innerHTML = '<div class="list-empty">暂无文章<br>点击上方新建</div>'; return; }
    for (const a of state.articles) {
      const item = document.createElement('div');
      item.className = 'list-item' + (state.article && state.article.id === a.id ? ' active' : '');
      const title = document.createElement('div'); title.className = 'list-item-title'; title.textContent = a.title || '无标题文章';
      const meta = document.createElement('div'); meta.className = 'list-item-meta';
      meta.textContent = formatDate(a.updatedAt) + ' · ' + (a.content || '').replace(/\s/g, '').length + '字';
      item.appendChild(title); item.appendChild(meta);
      item.addEventListener('click', () => loadArticle(a.id));
      const del = document.createElement('button'); del.className = 'list-item-del'; del.textContent = '✕';
      del.addEventListener('click', (e) => { e.stopPropagation(); deleteArticle(a.id); });
      item.appendChild(del);
      articleList.appendChild(item);
    }
  }

  // ===== Themes =====
  function styleCss(o) {
    return Object.keys(o).map(k => k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()) + ':' + o[k]).join(';');
  }
  function buildThumb(t) {
    const c = t.config;
    const st = THEMES.buildTheme(c);
    const thumb = document.createElement('div');
    thumb.className = 'theme-thumb';
    thumb.style.background = st.container.backgroundColor;
    if (c.bgImage) { thumb.style.backgroundImage = 'url(' + c.bgImage + ')'; thumb.style.backgroundSize = 'cover'; }
    const h1 = document.createElement('div');
    h1.style.cssText = styleCss(Object.assign({}, st.h1, { fontSize: '11px', margin: '0', padding: '3px 8px', lineHeight: '1.35', boxShadow: 'none' }));
    h1.textContent = '标题样式';
    thumb.appendChild(h1);
    const lineColor = c.dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.13)';
    for (const w of ['86%', '62%']) {
      const ln = document.createElement('div');
      ln.style.cssText = 'height:4px;border-radius:2px;background:' + lineColor + ';width:' + w + ';flex:none';
      thumb.appendChild(ln);
    }
    const q = document.createElement('div');
    q.style.cssText = styleCss(Object.assign({}, st.blockquote, { fontSize: '9px', padding: '4px 7px', margin: '2px 0 0', boxShadow: 'none', lineHeight: '1.4' }));
    q.textContent = '引用示例';
    thumb.appendChild(q);
    return thumb;
  }
  function applyTheme(id) {
    const t = allThemes().find(x => x.id === id); if (!t) return;
    state.config = clone(t.config); state.currentThemeId = id;
    render(); renderThemeList(); markDirty();
  }
  function renderThemeList() {
    themeList.innerHTML = '';
    for (const t of allThemes()) {
      const card = document.createElement('div');
      card.className = 'theme-card' + (state.currentThemeId === t.id ? ' active' : '');
      card.appendChild(buildThumb(t));
      const bar = document.createElement('div'); bar.className = 'theme-card-bar';
      const name = document.createElement('div'); name.className = 'theme-card-name'; name.textContent = t.name; name.title = t.name;
      bar.appendChild(name);
      if (t.builtin) {
        const tag = document.createElement('span'); tag.className = 'theme-card-tag'; tag.textContent = '内置';
        bar.appendChild(tag);
      } else {
        const acts = document.createElement('div'); acts.className = 'theme-card-actions';
        const ed = document.createElement('button'); ed.textContent = '✎'; ed.title = '编辑';
        ed.addEventListener('click', (e) => { e.stopPropagation(); openThemeEditor(t.id); });
        const del = document.createElement('button'); del.className = 'theme-del'; del.textContent = '✕'; del.title = '删除';
        del.addEventListener('click', (e) => { e.stopPropagation(); deleteTheme(t.id); });
        acts.appendChild(ed); acts.appendChild(del); bar.appendChild(acts);
        card.addEventListener('dblclick', () => openThemeEditor(t.id));
      }
      card.appendChild(bar);
      card.addEventListener('click', () => applyTheme(t.id));
      themeList.appendChild(card);
    }
  }
  async function deleteTheme(id) {
    await api.deleteTheme(id);
    state.customThemes = state.customThemes.filter(t => t.id !== id);
    if (state.currentThemeId === id) state.currentThemeId = null;
    renderThemeList(); toast('已删除主题');
  }

  // ===== Theme editor =====
  const themeFormSchema = [
    { group: '全局', fields: [
      { key: 'accent', label: '主题色', type: 'color', def: '#4caf50' },
      { key: 'bg', label: '背景色', type: 'color', def: '#ffffff' },
      { key: 'bgImage', label: '背景图 URL', type: 'text', full: true },
      { key: 'textColor', label: '正文色', type: 'color', def: '#3f3f3f' },
      { key: 'fontSize', label: '字号', type: 'select', options: THEMES.options.fontSize, def: '16px' },
      { key: 'lineHeight', label: '行距', type: 'select', options: THEMES.options.lineHeight, def: '1.75' },
      { key: 'font', label: '字体', type: 'select', options: THEMES.options.font, def: 'sans', full: true }
    ]},
    { group: '标题与区块', fields: [
      { key: 'h1Style', label: 'H1 样式', type: 'select', options: THEMES.options.h1Style, def: 'plain' },
      { key: 'h2Style', label: 'H2 样式', type: 'select', options: THEMES.options.h2Style, def: 'underline' },
      { key: 'codeTheme', label: '代码主题', type: 'select', options: THEMES.options.codeTheme, def: 'atom-one-dark', full: true },
      { key: 'quoteBg', label: '引用背景', type: 'color' },
      { key: 'quoteStyle', label: '引用样式', type: 'select', options: THEMES.options.quoteStyle, def: 'default' },
      { key: 'imgRadius', label: '图片圆角', type: 'select', options: THEMES.options.imgRadius, def: '8px' },
      { key: 'thColor', label: '表头色', type: 'color', full: true }
    ]}
  ];
  function buildThemeForm(config) {
    themeForm.innerHTML = '';
    for (const group of themeFormSchema) {
      const g = document.createElement('div'); g.className = 'form-group';
      const t = document.createElement('div'); t.className = 'form-group-title'; t.textContent = group.group; g.appendChild(t);
      const grid = document.createElement('div'); grid.className = 'form-grid';
      for (const f of group.fields) {
        const field = document.createElement('div'); field.className = 'field' + (f.full ? ' full' : '');
        const label = document.createElement('label'); label.textContent = f.label; field.appendChild(label);
        let input;
        if (f.type === 'select') {
          input = document.createElement('select'); input.className = 'input';
          for (const opt of f.options) {
            const o = document.createElement('option');
            if (typeof opt === 'string') { o.value = opt; o.textContent = opt; }
            else { o.value = opt.value; o.textContent = opt.label; }
            input.appendChild(o);
          }
          input.value = config[f.key] || f.def || '';
        } else if (f.type === 'color') {
          input = document.createElement('input'); input.type = 'color';
          input.value = config[f.key] || (f.key === 'quoteBg' || f.key === 'thColor' ? (config.accent || '#4caf50') : (f.def || '#000000'));
        } else {
          input = document.createElement('input'); input.type = 'text'; input.className = 'input'; input.value = config[f.key] || '';
        }
        input.dataset.key = f.key;
        input.addEventListener('input', () => {
          state.editingTheme[f.key] = input.value;
          state.config = clone(state.editingTheme);
          state.currentThemeId = null;
          renderThemeList(); render(); markDirty();
        });
        field.appendChild(input); grid.appendChild(field);
      }
      g.appendChild(grid); themeForm.appendChild(g);
    }
  }
  function openThemeEditor(themeId) {
    let config = null, id = null, name = '';
    if (themeId) {
      const t = allThemes().find(x => x.id === themeId);
      if (t) { config = clone(t.config); id = t.builtin ? null : t.id; name = t.name; }
    }
    if (!config) config = clone(state.config);
    state.editingTheme = config; state.editingThemeId = id;
    buildThemeForm(config); themeNameInput.value = name;
    openModal('themeModal');
  }
  async function saveTheme() {
    const name = themeNameInput.value.trim() || '未命名主题';
    const theme = { id: state.editingThemeId || undefined, name: name, config: clone(state.editingTheme) };
    const saved = await api.saveTheme(theme);
    const i = state.customThemes.findIndex(t => t.id === saved.id);
    if (i >= 0) state.customThemes[i] = saved; else state.customThemes.push(saved);
    state.config = clone(saved.config); state.currentThemeId = saved.id;
    renderThemeList(); render();
    closeModal('themeModal'); toast('主题已保存'); markDirty();
  }

  // ===== Images =====
  function insertImageMarkdown(url) {
    const ta = mdEditor, start = ta.selectionStart, end = ta.selectionEnd;
    const md = '![图片](' + url + ')';
    ta.value = ta.value.slice(0, start) + md + ta.value.slice(end);
    ta.selectionStart = ta.selectionEnd = start + md.length;
    ta.focus(); onEditorInput(); closeModal('imageModal');
  }
  async function handleUpload(file, insert) {
    if (!file || !file.type.startsWith('image/')) { toast('请选择图片文件'); return; }
    uploadStatus.textContent = '上传中…';
    try {
      const buf = await file.arrayBuffer();
      const url = await api.uploadImage(buf, file.name);
      const img = await api.saveImage({ name: file.name, url: url });
      state.images.unshift(img); renderImageList();
      uploadStatus.textContent = '';
      if (insert) insertImageMarkdown(url); else { toast('已上传到素材库'); closeModal('imageModal'); }
    } catch (e) { uploadStatus.textContent = ''; toast('上传失败：' + e.message); }
  }
  async function deleteImage(id) {
    await api.deleteImage(id);
    state.images = state.images.filter(i => i.id !== id);
    renderImageList();
  }
  function renderImageList() {
    imageList.innerHTML = '';
    if (!state.images.length) { imageList.innerHTML = '<div class="list-empty">暂无素材</div>'; }
    else {
      for (const img of state.images) {
        const card = document.createElement('div'); card.className = 'image-card';
        const im = document.createElement('img'); im.src = img.url; im.alt = img.name || '';
        card.appendChild(im);
        card.addEventListener('click', () => insertImageMarkdown(img.url));
        const del = document.createElement('button'); del.className = 'image-del'; del.textContent = '✕';
        del.addEventListener('click', (e) => { e.stopPropagation(); deleteImage(img.id); });
        card.appendChild(del); imageList.appendChild(card);
      }
    }
    renderImagePicker();
  }
  function renderImagePicker() {
    imagePickerList.innerHTML = '';
    if (!state.images.length) { imagePickerList.innerHTML = '<div class="list-empty">暂无素材，请先上传</div>'; return; }
    for (const img of state.images) {
      const card = document.createElement('div'); card.className = 'image-card';
      const im = document.createElement('img'); im.src = img.url;
      card.appendChild(im); card.addEventListener('click', () => insertImageMarkdown(img.url));
      imagePickerList.appendChild(card);
    }
  }

  // ===== Copy & Export =====
  async function copyToWechat() {
    const r = Engine.renderForWechat(mdEditor.value, state.config);
    try {
      await api.writeClipboardHTML(r.html, r.text);
      toast('已复制，去公众号后台粘贴');
    } catch (e) {
      toast('复制失败：' + (e && e.message ? e.message : e));
    }
  }
  async function exportHTML() {
    const r = Engine.render(mdEditor.value, state.config);
    const doc = Engine.exportDoc(r.html, articleTitle.value || '公众号文章');
    const name = (articleTitle.value || '公众号文章') + '.html';
    const r2 = await api.saveHTMLFile(doc, name);
    if (r2) toast('已导出 HTML');
  }

  // ===== Settings =====
  function toggleCustomFields() {
    $('customFields').classList.toggle('hidden', imageHostSelect.value !== 'custom');
  }
  async function openSettings() {
    imageHostSelect.value = state.settings.imageHost;
    smmsToken.value = state.settings.smmsToken || '';
    imgbbKey.value = state.settings.imgbbKey || '';
    $('customApiUrl').value = state.settings.customApiUrl || '';
    $('customFileField').value = state.settings.customFileField || 'file';
    $('customTokenHeader').value = state.settings.customTokenHeader || 'Authorization';
    $('customToken').value = state.settings.customToken || '';
    $('customResponsePath').value = state.settings.customResponsePath || '';
    $('customExtraFields').value = state.settings.customExtraFields || '';
    toggleCustomFields();
    autoSaveToggle.checked = state.settings.autoSave !== false;
    settingsDataDir.textContent = await api.getDataDir();
    openModal('settingsModal');
  }
  async function saveSettings() {
    state.settings.imageHost = imageHostSelect.value;
    state.settings.smmsToken = smmsToken.value;
    state.settings.imgbbKey = imgbbKey.value;
    state.settings.customApiUrl = $('customApiUrl').value;
    state.settings.customFileField = $('customFileField').value;
    state.settings.customTokenHeader = $('customTokenHeader').value;
    state.settings.customToken = $('customToken').value;
    state.settings.customResponsePath = $('customResponsePath').value;
    state.settings.customExtraFields = $('customExtraFields').value;
    state.settings.autoSave = autoSaveToggle.checked;
    await api.saveSettings(state.settings);
    closeModal('settingsModal'); toast('设置已保存');
  }

  // ===== Events =====
  function bindEvents() {
    mdEditor.addEventListener('input', onEditorInput);
    articleTitle.addEventListener('input', markDirty);
    mdEditor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = mdEditor.selectionStart, en = mdEditor.selectionEnd;
        mdEditor.value = mdEditor.value.slice(0, s) + '  ' + mdEditor.value.slice(en);
        mdEditor.selectionStart = mdEditor.selectionEnd = s + 2; onEditorInput();
      }
    });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentArticle(); toast('已保存'); }
    });

    uiModeBtn.addEventListener('click', () => {
      const m = document.documentElement.getAttribute('data-ui') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-ui', m);
      try { localStorage.setItem('uiMode', m); } catch (e) {}
      uiModeBtn.textContent = m === 'dark' ? '☀' : '☾';
    });
    editThemeBtn.addEventListener('click', () => openThemeEditor());
    newThemeBtn.addEventListener('click', () => openThemeEditor());
    saveThemeBtn.addEventListener('click', saveTheme);
    newArticleBtn.addEventListener('click', newArticle);
    insertImageBtn.addEventListener('click', () => { openModal('imageModal'); switchImageTab('upload'); });
    copyBtn.addEventListener('click', copyToWechat);
    exportBtn.addEventListener('click', exportHTML);
    settingsBtn.addEventListener('click', openSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    imageHostSelect.addEventListener('change', toggleCustomFields);

    // sidebar tabs
    document.querySelectorAll('.sidebar-tabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-tabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        document.querySelector('[data-panel="' + tab.dataset.tab + '"]').classList.remove('hidden');
      });
    });

    // image modal tabs
    document.querySelectorAll('[data-imgtab]').forEach(seg => {
      seg.addEventListener('click', () => switchImageTab(seg.dataset.imgtab));
    });
    function switchImageTab(name) {
      document.querySelectorAll('[data-imgtab]').forEach(s => s.classList.toggle('active', s.dataset.imgtab === name));
      document.querySelectorAll('[data-imgpanel]').forEach(p => p.classList.toggle('hidden', p.dataset.imgpanel !== name));
      if (name === 'library') renderImagePicker();
    }

    // drop zone
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleUpload(fileInput.files[0], true); fileInput.value = ''; });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault(); dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0], true);
    });
    insertUrlBtn.addEventListener('click', () => {
      const url = imageUrlInput.value.trim();
      if (!url) { toast('请输入图片 URL'); return; }
      insertImageMarkdown(url); imageUrlInput.value = '';
    });

    // sidebar library upload (no insert)
    const libraryInput = document.createElement('input');
    libraryInput.type = 'file'; libraryInput.accept = 'image/*'; libraryInput.hidden = true;
    document.body.appendChild(libraryInput);
    libraryInput.addEventListener('change', () => { if (libraryInput.files[0]) handleUpload(libraryInput.files[0], false); libraryInput.value = ''; });
    uploadImageBtn.addEventListener('click', () => libraryInput.click());

    // modal close
    document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
      b.closest('.modal').classList.add('hidden');
    }));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));
  }

  // ===== Init =====
  async function init() {
    state.settings = await api.getSettings();
    state.customThemes = await api.getThemes();
    state.articles = await api.listArticles();
    state.images = await api.getImages();
    renderArticleList(); renderThemeList(); renderImageList();
    bindEvents();
    uiModeBtn.textContent = document.documentElement.getAttribute('data-ui') === 'dark' ? '☀' : '☾';
    dataDir.textContent = await api.getDataDir();
    if (state.articles.length) await loadArticle(state.articles[0].id);
    else newArticle();
    render();
  }

  init();
})();