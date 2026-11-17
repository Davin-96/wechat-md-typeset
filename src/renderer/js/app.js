/* ===== 主逻辑：完整功能 + 50 主题统一管理 + 基于主题的样式编辑 ===== */
(function () {
  'use strict';
  const api = window.api;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

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
    uiModeBtn = $('uiModeBtn'), uiModeSelect = $('uiModeSelect'), toastEl = $('toast'),
    themeSearch = $('themeSearch'), styleSeg = $('styleSeg'), themeChips = $('themeChips');

  const clone = (o) => JSON.parse(JSON.stringify(o));
  function cloneConfig(c) {
    if (!c) return c;
    const d = c.decor;
    const out = clone(c);
    if (d) out.decor = d;
    return out;
  }
  function serializeConfig(cfg) {
    const out = {};
    Object.keys(cfg).forEach(k => { if (k !== 'decor' && typeof cfg[k] !== 'function') out[k] = cfg[k]; });
    return out;
  }
  const defaultConfig = cloneConfig(THEMES.builtinConfigs[0]);
  const state = {
    article: null, config: cloneConfig(defaultConfig), currentThemeId: null,
    articles: [], customThemes: [], images: [], settings: null,
    editing: false, editingConfig: null, editingBaseId: null, editingThemeId: null, editingDecorRef: null, configBeforeEdit: null,
    currentGroup: '全部', currentStyle: 'all', searchKey: '',
    saveTimer: null, renderTimer: null, isDirty: false
  };
  function allThemes() {
    const custom = state.customThemes.map(c => {
      const cfg = Object.assign({}, c.config || {});
      if (c.decorRef) {
        const base = THEMES.builtinThemes.find(t => t.id === c.decorRef);
        if (base && base.config.decor) cfg.decor = Object.assign({}, base.config.decor, cfg.decor || {});
      }
      return { id: c.id, name: c.name, group: c.group || '自定义', style: c.style || 'modern', builtin: false, custom: true, config: cfg };
    });
    return THEMES.builtinThemes.concat(custom);
  }
  function getTheme(id) { return allThemes().find(t => t.id === id); }

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

  // ===== 明暗：跟随系统 + 手动 =====
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  function applyUIMode() {
    const mode = localStorage.getItem('ui-mode') || 'auto';
    document.documentElement.setAttribute('data-ui-mode', mode);
    const dark = mode === 'dark' || (mode === 'auto' && media.matches);
    document.documentElement.setAttribute('data-ui', dark ? 'dark' : 'light');
    if (uiModeSelect) uiModeSelect.value = mode;
    if (uiModeBtn) uiModeBtn.textContent = dark ? '☀' : '☾';
  }
  function setUIMode(mode) { localStorage.setItem('ui-mode', mode); applyUIMode(); }
  if (media.addEventListener) media.addEventListener('change', () => { if ((localStorage.getItem('ui-mode') || 'auto') === 'auto') applyUIMode(); });

  // ===== Render =====
  function activeConfig() { return state.editing && state.editingConfig ? state.editingConfig : state.config; }
  function render() {
    if (!mdEditor.value.trim()) {
      preview.innerHTML = '<div class="preview-empty"><div class="pe-icon">✎</div><div class="pe-title">开始写作吧</div><div class="pe-sub">在左侧输入 Markdown，这里会实时显示公众号排版效果</div></div>';
    } else {
      const r = Engine.render(mdEditor.value, activeConfig());
      preview.innerHTML = r.html;
    }
    const t = getTheme(state.currentThemeId);
    previewThemeName.textContent = (state.editing ? '编辑中 · ' : '') + (t ? t.name : (state.currentThemeId ? '自定义样式' : ''));
    wordCount.textContent = (mdEditor.value.replace(/\s/g, '').length) + ' 字';
  }
  function onEditorInput() {
    state.isDirty = true; saveStatus.textContent = '未保存';
    clearTimeout(state.renderTimer); state.renderTimer = setTimeout(() => { if (!state.editing) render(); }, 120);
    scheduleSave();
  }
  function markDirty() { state.isDirty = true; saveStatus.textContent = '未保存'; scheduleSave(); }
  function scheduleSave() {
    if (!state.settings || !state.settings.autoSave || state.editing) return;
    clearTimeout(state.saveTimer); state.saveTimer = setTimeout(saveCurrentArticle, 800);
  }

  // ===== Articles =====
  async function saveCurrentArticle() {
    if (!state.article) state.article = {};
    state.article.title = articleTitle.value || '无标题文章';
    state.article.content = mdEditor.value;
    state.article.config = serializeConfig(state.config);
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
    state.currentThemeId = a.themeId || null;
    const base = getTheme(state.currentThemeId);
    state.config = base ? Object.assign(cloneConfig(base.config), a.config || {}) : cloneConfig(a.config || defaultConfig);
    articleTitle.value = a.title === '无标题文章' ? '' : (a.title || '');
    mdEditor.value = a.content || '';
    render(); renderThemeList();
    saveStatus.textContent = '已保存'; state.isDirty = false;
    renderArticleList();
  }
  function newArticle() {
    state.article = { title: '', content: '', config: {} };
    state.currentThemeId = getTheme('linear') ? 'linear' : THEMES.builtinThemes[0].id;
    state.config = cloneConfig(getTheme(state.currentThemeId).config);
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
      item.className = 'list-item' + (state.article && state.article.id === a.id ? ' on' : '');
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

  // ===== 主题缩略图 =====
  function themeThumb(c) {
    const accent = c.accent, bg = c.bg || '#fff', text = c.textColor || '#333';
    const font = (THEMES.fontFamilies[c.font] || '').split(',')[0];
    let titleStyle = `color:${text};font-family:${font};font-size:12px`;
    const h1 = c.h1Style, h2 = c.h2Style;
    if (h1 === 'block' || h1 === 'gradient') titleStyle = `color:#fff;background:${accent};padding:3px 6px;border-radius:3px;font-family:${font};font-size:11px`;
    else if (h1 === 'underline') titleStyle = `color:${accent};border-bottom:2px solid ${accent};font-family:${font};font-size:12px`;
    else if (h1 === 'outline') titleStyle = `color:${text};border:1px solid ${accent};padding:2px 6px;border-radius:3px;font-family:${font};font-size:11px`;
    else if (h1 === 'leftborder') titleStyle = `color:${text};border-left:3px solid ${accent};padding-left:5px;font-family:${font};font-size:11px`;
    else if (h1 === 'serifBig') titleStyle = `color:${text};font-family:Georgia,serif;font-size:12px;letter-spacing:1px`;
    let h2Css = `font-size:8px;color:${accent};font-weight:700`;
    if (h2 === 'leftborder') h2Css = `font-size:8px;color:${text};border-left:2px solid ${accent};padding-left:4px;font-weight:700`;
    if (h2 === 'block') h2Css = `font-size:8px;color:#fff;background:${accent};padding:2px 4px;border-radius:2px;display:inline-block;font-weight:700`;
    if (c.decor && c.decor.h2Deco) h2Css = `font-size:8px;color:${accent};font-weight:700;letter-spacing:1px`;
    const dark = c.dark;
    const lineColor = dark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.15)';
    const quoteBorder = c.quoteStyle === 'none' ? 'none' : `border-left:2px solid ${accent}`;
    return `<div class="theme-thumb" style="background:${bg}">
      <div style="${titleStyle};line-height:1.3;white-space:nowrap;overflow:hidden">标题样式</div>
      <div style="${h2Css};margin:2px 0">小标题</div>
      <div class="tt-line" style="background:${lineColor};width:90%;height:4px;border-radius:2px;opacity:.5"></div>
      <div class="tt-line" style="background:${lineColor};width:72%;height:4px;border-radius:2px;opacity:.5"></div>
      <div style="${quoteBorder};padding:1px 0 1px 5px;background:${c.quoteBg || (dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)')};font-size:7px;color:${text};opacity:.8;margin-top:2px">引用样式</div>
    </div>`;
  }

  // ===== 主题筛选 =====
  function styleFiltered(list) { return state.currentStyle === 'all' ? list : list.filter(t => t.style === state.currentStyle); }
  function renderStyleSeg() {
    const all = allThemes();
    const counts = { all: all.length, modern: all.filter(t => t.style === 'modern').length, special: all.filter(t => t.style === 'special').length };
    $$('#styleSeg button').forEach(b => {
      const n = b.querySelector('span'); if (n) n.textContent = counts[b.dataset.style];
      b.classList.toggle('on', b.dataset.style === state.currentStyle);
    });
  }
  function renderChips() {
    renderStyleSeg();
    const groups = THEMES.groups.concat(['自定义']);
    const pool = styleFiltered(allThemes());
    themeChips.innerHTML = groups.map(g => {
      const count = g === '全部' ? pool.length : pool.filter(t => t.group === g).length;
      return `<button class="chip ${g === state.currentGroup ? 'on' : ''}" data-group="${g}">${g} <span class="chip-num">${count}</span></button>`;
    }).join('');
    $$('.chip').forEach(c => c.addEventListener('click', () => {
      state.currentGroup = c.dataset.group;
      $$('.chip').forEach(x => x.classList.toggle('on', x === c));
      renderThemeList();
    }));
  }

  function applyTheme(id) {
    if (state.editing) cancelEdit(true);
    const t = getTheme(id); if (!t) return;
    state.config = cloneConfig(t.config); state.currentThemeId = id;
    render(); renderThemeList(); markDirty();
  }
  function renderThemeList() {
    const themes = styleFiltered(allThemes()).filter(t =>
      (state.currentGroup === '全部' || t.group === state.currentGroup) &&
      (!state.searchKey || t.name.toLowerCase().indexOf(state.searchKey) >= 0));
    themeList.innerHTML = '';
    if (!themes.length) { themeList.innerHTML = '<div class="list-empty">没有匹配的主题<br>换个关键词试试</div>'; return; }
    const meta = document.createElement('div'); meta.className = 'theme-meta'; meta.textContent = '共 ' + themes.length + ' 套 · 双击卡片可编辑';
    themeList.appendChild(meta);
    const grid = document.createElement('div'); grid.className = 'theme-grid';
    for (const t of themes) {
      const card = document.createElement('div');
      card.className = 'theme-card' + (state.currentThemeId === t.id && !state.editing ? ' on' : '');
      card.dataset.id = t.id; card.title = '单击应用 · 双击编辑';
      card.innerHTML = themeThumb(t.config);
      const bar = document.createElement('div'); bar.className = 'theme-card-bar';
      const name = document.createElement('div'); name.className = 'theme-card-name'; name.textContent = t.name; name.title = t.name;
      bar.appendChild(name);
      const tools = document.createElement('span'); tools.className = 'card-tools';
      const ed = document.createElement('button'); ed.className = 'card-tool card-edit'; ed.textContent = '✎'; ed.title = '基于此主题编辑';
      ed.addEventListener('click', e => { e.stopPropagation(); openThemeEditor(t.id); });
      tools.appendChild(ed);
      if (t.custom) {
        const del = document.createElement('button'); del.className = 'card-tool card-del'; del.textContent = '✕'; del.title = '删除自定义主题';
        del.addEventListener('click', e => { e.stopPropagation(); deleteTheme(t.id); });
        tools.appendChild(del);
      }
      bar.appendChild(tools); card.appendChild(bar);
      card.addEventListener('click', () => applyTheme(t.id));
      card.addEventListener('dblclick', e => { e.stopPropagation(); openThemeEditor(t.id); });
      grid.appendChild(card);
    }
    themeList.appendChild(grid);
  }

  async function deleteTheme(id) {
    const rec = state.customThemes.find(t => t.id === id);
    if (!rec || !confirm('删除自定义主题「' + rec.name + '」？')) return;
    await api.deleteTheme(id);
    state.customThemes = state.customThemes.filter(t => t.id !== id);
    if (state.currentThemeId === id) {
      state.currentThemeId = THEMES.builtinThemes[0].id;
      state.config = cloneConfig(getTheme(state.currentThemeId).config);
    }
    renderChips(); renderThemeList(); render(); toast('主题已删除');
  }

  // ===== 编辑样式 =====
  const formSchema = [
    { group: '全局', fields: [
      { key: 'accent', label: '主题色', type: 'color' },
      { key: 'bg', label: '背景色', type: 'color' },
      { key: 'textColor', label: '正文色', type: 'color' },
      { key: 'bgImage', label: '背景图 URL', type: 'text', full: true },
      { key: 'fontSize', label: '字号', type: 'select', options: THEMES.options.fontSize },
      { key: 'lineHeight', label: '行距', type: 'select', options: THEMES.options.lineHeight },
      { key: 'font', label: '字体', type: 'select', options: THEMES.options.font }
    ]},
    { group: '标题与区块', fields: [
      { key: 'h1Style', label: 'H1 样式', type: 'select', options: THEMES.options.h1Style },
      { key: 'h2Style', label: 'H2 样式', type: 'select', options: THEMES.options.h2Style },
      { key: 'quoteStyle', label: '引用样式', type: 'select', options: THEMES.options.quoteStyle },
      { key: 'quoteBg', label: '引用背景', type: 'color' },
      { key: 'imgRadius', label: '图片圆角', type: 'select', options: THEMES.options.imgRadius },
      { key: 'thColor', label: '表头色', type: 'color' },
      { key: 'codeTheme', label: '代码主题', type: 'select', options: THEMES.options.codeTheme, full: true }
    ]}
  ];
  function colorVal(v, fallback) { return /^#[0-9a-f]{6}$/i.test(v || '') ? v : (fallback || '#ffffff'); }
  function buildThemeForm(config) {
    themeForm.innerHTML = '';
    formSchema.forEach(grp => {
      const sec = document.createElement('div'); sec.className = 'form-group';
      const t = document.createElement('div'); t.className = 'form-group-title'; t.textContent = grp.group; sec.appendChild(t);
      const grid = document.createElement('div'); grid.className = 'form-grid';
      grp.fields.forEach(f => {
        const field = document.createElement('div'); field.className = 'field' + (f.full ? ' full' : '');
        const label = document.createElement('label'); label.textContent = f.label; field.appendChild(label);
        let input;
        if (f.type === 'select') {
          input = document.createElement('select'); input.className = 'input';
          f.options.forEach(opt => {
            const o = document.createElement('option');
            if (typeof opt === 'string') { o.value = opt; o.textContent = opt; }
            else { o.value = opt.value; o.textContent = opt.label; }
            input.appendChild(o);
          });
          input.value = config[f.key] != null ? config[f.key] : (typeof f.options[0] === 'string' ? f.options[0] : f.options[0].value);
        } else if (f.type === 'color') {
          input = document.createElement('input'); input.type = 'color'; input.className = 'input color-input';
          input.value = colorVal(config[f.key], f.key === 'bg' ? '#ffffff' : (f.key === 'textColor' ? '#333333' : config.accent));
        } else {
          input = document.createElement('input'); input.type = 'text'; input.className = 'input';
          input.value = config[f.key] || ''; input.placeholder = '可选';
        }
        input.dataset.key = f.key;
        input.addEventListener('input', () => { state.editingConfig[f.key] = input.value; render(); });
        field.appendChild(input); grid.appendChild(field);
      });
      sec.appendChild(grid); themeForm.appendChild(sec);
    });
  }
  function openThemeEditor(themeId) {
    const t = getTheme(themeId || state.currentThemeId) || getTheme(state.currentThemeId) || THEMES.builtinThemes[0];
    state.configBeforeEdit = cloneConfig(state.config);
    state.editing = true;
    state.editingConfig = cloneConfig(t.config);
    state.editingBaseId = t.builtin ? t.id : null;
    state.editingThemeId = t.builtin ? null : t.id;
    state.editingDecorRef = t.custom ? (state.customThemes.find(c => c.id === t.id) || {}).decorRef : (t.config.decor ? t.id : null);
    $('keepDecor').checked = !!state.editingConfig.decor;
    themeNameInput.value = t.builtin ? t.name + ' · 我的版本' : t.name;
    themeModal.querySelector('.modal-header h3').textContent = '编辑样式 · 基于「' + t.name + '」';
    buildThemeForm(state.editingConfig);
    openModal('themeModal');
    render(); renderThemeList();
    toast('调整参数，右侧实时预览');
  }
  function cancelEdit(silent) {
    if (!state.editing) return;
    state.editing = false; state.editingConfig = null;
    state.editingBaseId = null; state.editingThemeId = null; state.editingDecorRef = null;
    if (state.configBeforeEdit) state.config = state.configBeforeEdit;
    closeModal('themeModal'); renderThemeList(); render();
    if (!silent) toast('已放弃修改');
  }
  async function saveTheme() {
    if (!state.editing || !state.editingConfig) return;
    const name = themeNameInput.value.trim() || '未命名主题';
    const keepDecor = $('keepDecor').checked;
    const cfg = serializeConfig(state.editingConfig);
    if (!keepDecor) delete cfg.decor;
    const theme = { id: state.editingThemeId || undefined, name: name, config: cfg, decorRef: keepDecor ? state.editingDecorRef : null };
    const saved = await api.saveTheme(theme);
    const i = state.customThemes.findIndex(t => t.id === saved.id);
    if (i >= 0) state.customThemes[i] = saved; else state.customThemes.push(saved);
    state.editing = false; state.editingConfig = null;
    state.editingBaseId = null; state.editingThemeId = null; state.editingDecorRef = null;
    state.currentThemeId = saved.id;
    state.config = getTheme(saved.id).config;
    closeModal('themeModal'); renderChips(); renderThemeList(); render();
    toast('已保存为自定义主题：' + name); markDirty();
  }
  function resetStyle() {
    if (!state.editing) return;
    const base = getTheme(state.editingThemeId || state.editingBaseId);
    if (!base) { toast('无法恢复默认'); return; }
    state.editingConfig = cloneConfig(base.config);
    buildThemeForm(state.editingConfig); render(); toast('已恢复为原主题参数');
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
    state.images = state.images.filter(i => i.id !== id); renderImageList();
  }
  function renderImageList() {
    imageList.innerHTML = '';
    if (!state.images.length) imageList.innerHTML = '<div class="list-empty">暂无素材</div>';
    else for (const img of state.images) {
      const card = document.createElement('div'); card.className = 'image-card';
      const im = document.createElement('img'); im.src = img.url; im.alt = img.name || '';
      card.appendChild(im); card.addEventListener('click', () => insertImageMarkdown(img.url));
      const del = document.createElement('button'); del.className = 'image-del'; del.textContent = '✕';
      del.addEventListener('click', e => { e.stopPropagation(); deleteImage(img.id); });
      card.appendChild(del); imageList.appendChild(card);
    }
    renderImagePicker();
  }
  function renderImagePicker() {
    imagePickerList.innerHTML = '';
    if (!state.images.length) { imagePickerList.innerHTML = '<div class="list-empty">暂无素材，请先上传</div>'; return; }
    for (const img of state.images) {
      const card = document.createElement('div'); card.className = 'image-card';
      const im = document.createElement('img'); im.src = img.url; card.appendChild(im);
      card.addEventListener('click', () => insertImageMarkdown(img.url));
      imagePickerList.appendChild(card);
    }
  }

  // ===== Copy & Export =====
  async function copyToWechat() {
    const r = Engine.renderForWechat(mdEditor.value, activeConfig());
    try { await api.writeClipboardHTML(r.html, r.text); toast('已复制，去公众号后台粘贴'); }
    catch (e) { toast('复制失败：' + (e && e.message ? e.message : e)); }
  }
  async function exportHTML() {
    const r = Engine.render(mdEditor.value, activeConfig());
    const doc = Engine.exportDoc(r.html, articleTitle.value || '公众号文章');
    const p = await api.saveHTMLFile(doc, (articleTitle.value || '公众号文章') + '.html');
    if (p) toast('已导出 HTML');
  }

  // ===== Settings =====
  function toggleCustomFields() { $('customFields').classList.toggle('hidden', imageHostSelect.value !== 'custom'); }
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
    mdEditor.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = mdEditor.selectionStart, en = mdEditor.selectionEnd;
        mdEditor.value = mdEditor.value.slice(0, s) + '  ' + mdEditor.value.slice(en);
        mdEditor.selectionStart = mdEditor.selectionEnd = s + 2; onEditorInput();
      }
    });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveCurrentArticle(); toast('已保存'); }
    });
    uiModeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-ui');
      setUIMode(cur === 'dark' ? 'light' : 'dark');
    });
    if (uiModeSelect) uiModeSelect.addEventListener('change', e => setUIMode(e.target.value));
    editThemeBtn.addEventListener('click', () => openThemeEditor(state.currentThemeId));
    newThemeBtn.addEventListener('click', () => openThemeEditor(state.currentThemeId));
    saveThemeBtn.addEventListener('click', saveTheme);
    $('resetStyleBtn').addEventListener('click', resetStyle);
    $('cancelEditBtn').addEventListener('click', () => cancelEdit(false));
    themeSearch.addEventListener('input', e => { state.searchKey = e.target.value.trim().toLowerCase(); renderThemeList(); });
    $$('#styleSeg button').forEach(b => b.addEventListener('click', () => {
      state.currentStyle = b.dataset.style; renderChips(); renderThemeList();
    }));
    newArticleBtn.addEventListener('click', newArticle);
    insertImageBtn.addEventListener('click', () => { openModal('imageModal'); switchImageTab('upload'); });
    copyBtn.addEventListener('click', copyToWechat);
    exportBtn.addEventListener('click', exportHTML);
    settingsBtn.addEventListener('click', openSettings);
    saveSettingsBtn.addEventListener('click', saveSettings);
    imageHostSelect.addEventListener('change', toggleCustomFields);

    $$('.top-seg button').forEach(b => b.addEventListener('click', () => {
      $$('.top-seg button').forEach(x => x.classList.toggle('on', x === b));
      const map = { edit: 'articles', themes: 'themes', assets: 'images' };
      const tab = document.querySelector('.sidebar-tabs .tab[data-tab="' + map[b.dataset.view] + '"]');
      if (tab) tab.click();
    }));
    $$('.sidebar-tabs .tab').forEach(tab => tab.addEventListener('click', () => {
      $$('.sidebar-tabs .tab').forEach(t => t.classList.toggle('on', t === tab));
      $$('.tab-panel').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== tab.dataset.tab));
    }));
    $$('[data-imgtab]').forEach(seg => seg.addEventListener('click', () => switchImageTab(seg.dataset.imgtab)));
    function switchImageTab(name) {
      $$('[data-imgtab]').forEach(s => s.classList.toggle('on', s.dataset.imgtab === name));
      $$('[data-imgpanel]').forEach(p => p.classList.toggle('hidden', p.dataset.imgpanel !== name));
      if (name === 'library') renderImagePicker();
    }
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleUpload(fileInput.files[0], true); fileInput.value = ''; });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault(); dropZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0], true);
    });
    insertUrlBtn.addEventListener('click', () => {
      const url = imageUrlInput.value.trim();
      if (!url) { toast('请输入图片 URL'); return; }
      insertImageMarkdown(url); imageUrlInput.value = '';
    });
    const libraryInput = document.createElement('input');
    libraryInput.type = 'file'; libraryInput.accept = 'image/*'; libraryInput.hidden = true;
    document.body.appendChild(libraryInput);
    libraryInput.addEventListener('change', () => { if (libraryInput.files[0]) handleUpload(libraryInput.files[0], false); libraryInput.value = ''; });
    uploadImageBtn.addEventListener('click', () => libraryInput.click());

    $$('[data-close]').forEach(b => b.addEventListener('click', () => { b.closest('.modal').classList.add('hidden'); if (state.editing) cancelEdit(true); }));
    $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) { m.classList.add('hidden'); if (state.editing) cancelEdit(true); } }));
  }

  // ===== Init =====
  async function init() {
    applyUIMode();
    state.settings = await api.getSettings();
    state.customThemes = await api.getThemes();
    state.articles = await api.listArticles();
    state.images = await api.getImages();
    renderChips(); renderArticleList(); renderThemeList(); renderImageList();
    bindEvents();
    dataDir.textContent = await api.getDataDir();
    if (state.articles.length) await loadArticle(state.articles[0].id);
    else newArticle();
    render();
  }
  init();
})();
