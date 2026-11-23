/* ===== 选题工作区 · 雷达风格 + 与排版工作区双向联动 ===== */
(function () {
  'use strict';
  const api = window.api;
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const STATUSES = ['待验证', '写作中', '待发布', '已归档'];
  const META = {
    '待验证': { icon: '⚡', color: 'var(--tp-rose)', sub: '等待验证价值的选题' },
    '写作中': { icon: '✍️', color: 'var(--tp-accent2)', sub: '正在动笔的选题' },
    '待发布': { icon: '🚀', color: 'var(--tp-gold)', sub: '已完成、等待发布' },
    '已归档': { icon: '✅', color: 'var(--tp-green)', sub: '已发布或暂时搁置' }
  };
  const DEMO = [
    { title: '【演示】把复杂概念讲简单的三个框架', tags: ['写作方法', '入门'], links: ['https://example.com/framework'], notes: '演示数据：展示卡片与联动交互。', status: '待验证', demo: true },
    { title: '【演示】我的效率工具清单（年中版）', tags: ['工具', '清单'], links: [], notes: '演示数据：展示标签筛选。', status: '写作中', demo: true },
    { title: '【演示】一次失败尝试的完整复盘', tags: ['复盘'], links: ['https://example.com/postmortem'], notes: '演示数据：展示素材链接。', status: '待发布', demo: true },
    { title: '【演示】去年这时候我在想什么', tags: ['随笔'], links: [], notes: '演示数据：已归档示例。', status: '已归档', demo: true }
  ];

  const state = {
    topics: [], view: { type: 'status', value: '待验证' },
    search: '', sort: 'custom', tagSearch: '',
    railCollapsed: {}, editingId: null, dragId: null, detailId: null
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const fmtDate = ts => { if (!ts) return ''; const d = new Date(ts); return (d.getMonth() + 1) + '/' + d.getDate(); };

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add('hidden'), 2200);
  }

  // ===== 数据 =====
  async function load() {
    state.topics = await api.getTopics();
    if (!state.topics.length) {
      const seeded = DEMO.map(d => Object.assign({ id: uid(), articleId: null, createdAt: Date.now(), updatedAt: Date.now() }, d));
      for (const t of seeded) await api.saveTopic(t);
      state.topics = await api.getTopics();
    }
  }
  async function persistTopics() { await api.saveTopics(state.topics); }
  function find(id) { return state.topics.find(t => t.id === id); }

  function allTags() {
    const s = new Set();
    state.topics.forEach(t => (t.tags || []).forEach(x => s.add(x)));
    return [...s].sort((a, b) => a.localeCompare(b, 'zh'));
  }
  function stats() {
    const by = {}; STATUSES.forEach(s => by[s] = state.topics.filter(t => t.status === s).length);
    return { total: state.topics.length, pending: by['待验证'], active: by['写作中'] + by['待发布'], archived: by['已归档'], by };
  }
  function visible() {
    const q = state.search.trim().toLowerCase();
    let arr = state.topics.filter(t => {
      if (state.view.type === 'status' && t.status !== state.view.value) return false;
      if (state.view.type === 'tag' && state.view.value && !(t.tags || []).includes(state.view.value)) return false;
      if (!q) return true;
      return [t.title, t.notes, (t.tags || []).join(' '), (t.links || []).join(' ')].join(' ').toLowerCase().includes(q);
    });
    if (state.sort === 'created') arr = arr.slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    else if (state.sort === 'updated') arr = arr.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    else if (state.sort === 'title') arr = arr.slice().sort((a, b) => a.title.localeCompare(b.title, 'zh'));
    else arr = arr.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    return arr;
  }
  function snapshotOrder() { visible().forEach((t, i) => { t.order = i; }); }

  // ===== 渲染 =====
  function renderKpis() {
    const s = stats();
    const defs = [
      ['选题总数', s.total, '个', 'var(--tp-accent)'],
      ['待验证', s.pending, '个', 'var(--tp-rose)'],
      ['进行中', s.active, '个', 'var(--tp-gold)'],
      ['已归档', s.archived, '个', 'var(--tp-green)']
    ];
    $('topicKpis').innerHTML = defs.map(([l, v, u, c]) =>
      '<div class="tp-kpi" style="--kc:' + c + '"><div class="k-label">' + esc(l) + '</div><div class="k-val">' + v + '<small>' + u + '</small></div></div>'
    ).join('');
  }
  function renderRail() {
    const s = stats();
    const cg = state.railCollapsed || {};
    // 分组一：选题阶段
    let html = '<div class="tp-group' + (cg.status ? ' collapsed' : '') + '" data-group="status">' +
      '<div class="tp-group-head" data-toggle-group="status" role="button" tabindex="0" aria-expanded="' + (!cg.status) + '">' +
        '<span class="tpg-ic">◈</span><span class="tpg-name">选题阶段</span><span class="tpg-arrow">⌄</span></div>' +
      '<div class="tp-group-items">';
    STATUSES.forEach(st => {
      const m = META[st], on = state.view.type === 'status' && state.view.value === st;
      html += '<div class="tp-item' + (on ? ' active' : '') + '" data-status="' + esc(st) + '" style="--rc:' + m.color + '" tabindex="0" role="button">' +
        '<span class="tp-dot"></span><span class="tp-name">' + esc(st) + '</span><span class="tp-count">' + s.by[st] + '</span></div>';
    });
    html += '</div></div>';
    // 分组二：标签筛选
    html += '<div class="tp-group' + (cg.tag ? ' collapsed' : '') + '" data-group="tag">' +
      '<div class="tp-group-head" data-toggle-group="tag" role="button" tabindex="0" aria-expanded="' + (!cg.tag) + '">' +
        '<span class="tpg-ic">◇</span><span class="tpg-name">标签筛选</span><span class="tpg-arrow">⌄</span></div>' +
      '<div class="tp-group-items">';
    html += '<div class="tp-search"><input id="tagSearchInput" type="text" placeholder="搜索标签…" autocomplete="off" aria-label="搜索标签" value="' + esc(state.tagSearch) + '"></div>';
    html += '<div class="tp-tag-list" id="tagList"></div></div></div>';
    $('topicRail').innerHTML = html;
    renderTagList();
  }
  function renderTagList() {
    const box = $('tagList'); if (!box) return;
    const q = state.tagSearch.trim().toLowerCase();
    let tags = allTags(); if (q) tags = tags.filter(t => t.toLowerCase().includes(q));
    let html = '';
    if (!q) {
      const on = state.view.type === 'tag' && !state.view.value;
      html += '<div class="tp-item' + (on ? ' active' : '') + '" data-tag="" style="--rc:var(--tp-accent3)" tabindex="0" role="button"><span class="tp-dot"></span><span class="tp-name">全部标签</span><span class="tp-count">' + state.topics.length + '</span></div>';
    }
    if (!tags.length) html += '<div class="tp-empty-tag">' + (q ? '没有匹配的标签' : '暂无标签') + '</div>';
    tags.forEach(t => {
      const on = state.view.type === 'tag' && state.view.value === t;
      const n = state.topics.filter(x => (x.tags || []).includes(t)).length;
      html += '<div class="tp-item' + (on ? ' active' : '') + '" data-tag="' + esc(t) + '" style="--rc:var(--tp-accent3)" tabindex="0" role="button"><span class="tp-dot"></span><span class="tp-name">' + esc(t) + '</span><span class="tp-count">' + n + '</span></div>';
    });
    box.innerHTML = html;
  }
  function renderStage() {
    let icon, title, sub;
    if (state.view.type === 'status') { icon = META[state.view.value].icon; title = state.view.value; sub = META[state.view.value].sub; }
    else if (!state.view.value) { icon = '🔖'; title = '全部选题'; sub = '跨阶段按标签筛选'; }
    else { icon = '🔖'; title = state.view.value; sub = '按标签筛选的选题'; }
    $('topicStageIcon').textContent = icon;
    $('topicStageTitle').textContent = title;
    $('topicStageSub').textContent = sub;
    const arr = visible();
    $('topicStageCount').textContent = arr.length + ' 个选题';
    const sortLabel = { custom: '自定义排序', created: '按创建时间', updated: '按更改时间', title: '按标题' }[state.sort] || '自定义排序';
    if ($('topicSortLabel')) $('topicSortLabel').textContent = sortLabel;
    if (!arr.length) {
      $('topicStageList').innerHTML = '<div class="tp-blank"><b>这里还没有选题</b>点「＋ 新建选题」开始积累，或换个阶段 / 标签看看</div>';
      return;
    }
    $('topicStageList').innerHTML = arr.map((t, i) => {
      const links = (t.links || []).slice(0, 2).map(l => '<a href="' + esc(l) + '" target="_blank" rel="noopener" data-topiclink>🔗 ' + esc(l.replace(/^https?:\/\//, '')) + '</a>').join('');
      const more = (t.links || []).length > 2 ? '<span class="more">…共 ' + t.links.length + ' 条</span>' : '';
      return '<article class="tp-card" data-id="' + esc(t.id) + '" tabindex="0" role="button" aria-label="查看选题：' + esc(t.title) + '" draggable="true">' +
        '<div class="tp-rank">' + String(i + 1).padStart(2, '0') + '</div><div class="tp-main">' +
        '<div class="tp-top"><span class="tp-title">' + esc(t.title) + '</span><span class="tp-top-right"><span class="tp-updated">' + fmtDate(t.updatedAt) + '</span><button class="tp-del" data-deltopic="' + esc(t.id) + '" title="删除选题" aria-label="删除选题">✕</button></span></div>' +
        '<div class="tp-line2">' + (t.tags || []).map(x => '<span class="tp-tag">' + esc(x) + '</span>').join('') +
          (t.articleId ? '<span class="tp-linked">✓ 已关联文章</span>' : '') + (t.demo ? '<span class="tp-demo">演示</span>' : '') + '</div>' +
        (t.notes ? '<div class="tp-notes">' + esc(t.notes) + '</div>' : '') +
        (links || more ? '<div class="tp-links">' + links + more + '</div>' : '') +
        '<div class="tp-foot">' +
          '<button type="button" class="tp-status tp-drop-trigger" data-id="' + esc(t.id) + '" data-kind="status" aria-haspopup="listbox" aria-expanded="false" aria-label="修改状态">' +
            '<span class="tp-dd-label">' + esc(t.status) + '</span><span class="tp-dd-arrow">⌄</span>' +
          '</button>' +
          '<span class="tp-right">' +
            (t.articleId ? '<button class="tp-btn" data-openarticle="' + esc(t.id) + '">打开文章</button>' : '') +
            '<button class="tp-btn write" data-write="' + esc(t.id) + '">开始写作 →</button>' +
          '</span>' +
        '</div></div></article>';
    }).join('');
  }
  function render() { renderKpis(); renderRail(); renderStage(); }

  // ===== 详情 =====
  function openDetail(id) {
    const t = find(id); if (!t) return;
    state.detailId = id;
    const links = (t.links || []).length ? (t.links || []).map(l => '<a href="' + esc(l) + '" target="_blank" rel="noopener">🔗 ' + esc(l) + '</a>').join('') : '<span style="color:var(--text-2)">暂无素材链接</span>';
    $('topicDetailBody').innerHTML =
      '<div class="tp-detail-row"><div class="lb">标题</div><div class="vl" style="font-size:16px;font-weight:650;color:var(--tp-accent2)">' + esc(t.title) + '</div></div>' +
      '<div class="tp-detail-row"><div class="lb">状态</div><div class="vl">' + esc(t.status) + (t.articleId ? ' &nbsp;<span class="tp-linked">✓ 已关联文章</span>' : '') + '</div></div>' +
      '<div class="tp-detail-row"><div class="lb">标签</div><div class="vl tp-detail-tags">' + ((t.tags || []).length ? (t.tags || []).map(x => '<span class="tp-tag">' + esc(x) + '</span>').join('') : '<span style="color:var(--text-2)">无</span>') + '</div></div>' +
      '<div class="tp-detail-row"><div class="lb">笔记</div><div class="vl notes">' + (t.notes ? esc(t.notes) : '<span style="color:var(--text-2)">暂无笔记</span>') + '</div></div>' +
      '<div class="tp-detail-row"><div class="lb">素材链接</div><div class="vl">' + links + '</div></div>' +
      '<div class="tp-detail-row" style="margin-bottom:0"><div class="lb">时间</div><div class="vl" style="font:400 11px/1.6 var(--mono,monospace);color:var(--text-2)">创建 ' + fmtDate(t.createdAt) + ' · 更新 ' + fmtDate(t.updatedAt) + '</div></div>' +
      '<div class="modal-footer topic-detail-footer">' +
        '<button class="btn btn-danger" id="dtDelete">删除</button>' +
        '<button class="btn" id="dtClose">关闭</button>' +
        (t.articleId ? '<button class="btn" id="dtOpen">打开文章</button>' : '<button class="btn" id="dtWrite">开始写作 →</button>') +
        '<button class="btn btn-primary" id="dtEdit">✎ 编辑选题</button></div>';
    $('topicDetailModal').classList.remove('hidden');
    $('dtClose').addEventListener('click', () => $('topicDetailModal').classList.add('hidden'));
    $('dtDelete').addEventListener('click', () => deleteTopic(t.id));
    $('dtEdit').addEventListener('click', () => { $('topicDetailModal').classList.add('hidden'); openModal(t); });
    if ($('dtWrite')) $('dtWrite').addEventListener('click', () => { $('topicDetailModal').classList.add('hidden'); startWriting(t.id); });
    if ($('dtOpen')) $('dtOpen').addEventListener('click', () => { $('topicDetailModal').classList.add('hidden'); openLinkedArticle(t.id); });
  }

  // ===== 新建/编辑 =====
  function openModal(t) {
    state.editingId = t ? t.id : null;
    $('topicModalTitle').textContent = t ? '编辑选题' : '新建选题';
    $('topicInTitle').value = t ? t.title : '';
    $('topicInTags').value = t ? (t.tags || []).join(', ') : '';
    $('topicInLinks').value = t ? (t.links || []).join('\n') : '';
    $('topicInNotes').value = t ? (t.notes || '') : '';
    $('topicInStatus').innerHTML = STATUSES.map(s => '<option value="' + s + '">' + s + '</option>').join('');
    $('topicInStatus').value = t ? t.status : (state.view.type === 'status' ? state.view.value : STATUSES[0]);
    $('topicFieldTitle').classList.remove('invalid'); $('topicFieldLinks').classList.remove('invalid');
    $('topicModal').classList.remove('hidden');
    setTimeout(() => $('topicInTitle').focus(), 40);
  }
  const URL_RE = /^https?:\/\/\S+$/i;
  function saveFromModal() {
    const title = $('topicInTitle').value.trim();
    const links = $('topicInLinks').value.split('\n').map(s => s.trim()).filter(Boolean);
    const bad = links.some(l => !URL_RE.test(l));
    $('topicFieldTitle').classList.toggle('invalid', !title);
    $('topicFieldLinks').classList.toggle('invalid', bad);
    if (!title || bad) { toast('请修正标红的项'); return; }
    const tags = $('topicInTags').value.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    const notes = $('topicInNotes').value.trim();
    const status = STATUSES.includes($('topicInStatus').value) ? $('topicInStatus').value : STATUSES[0];
    const now = Date.now();
    if (state.editingId) {
      const t = find(state.editingId);
      if (t) Object.assign(t, { title, tags, links, notes, status, updatedAt: now });
      toast('已保存修改');
    } else {
      state.topics.unshift({ id: uid(), title, tags, links, notes, status, articleId: null, createdAt: now, updatedAt: now, order: -1 });
      toast('已新建选题');
    }
    persistTopics(); $('topicModal').classList.add('hidden'); render();
  }

  // ===== 联动：选题 → 写作（幂等：一个选题只对应一篇文章） =====
  async function startWriting(id) {
    const t = find(id); if (!t) return;
    // 已有文章：校验是否真实存在，存在则直接打开，避免重复生成孤儿文章
    if (t.articleId) {
      const existing = await api.getArticle(t.articleId);
      if (existing) {
        switchWorkspace('editor');
        if (window.EditorBridge) await window.EditorBridge.openArticle(t.articleId);
        toast('已打开该选题的文章');
        return;
      }
      t.articleId = null; // 文章已被删除：清除悬空关联后重新生成
    }
    if (window.EditorBridge && window.EditorBridge.startFromTopic) {
      const article = window.EditorBridge.startFromTopic(t);
      t.articleId = article.id;
      if (t.status === '待验证') t.status = '写作中';
      t.updatedAt = Date.now();
      await persistTopics(); render();
      switchWorkspace('editor');
      toast('已生成文章草稿，开始写作吧');
    } else {
      toast('排版模块尚未就绪，请稍候');
    }
  }
  // 供 app.js 在发布后回写
  function markPublished(articleId) {
    const t = state.topics.find(x => x.articleId === articleId);
    if (!t) return false;
    if (t.status === '已归档') return false;
    t.status = '待发布'; t.updatedAt = Date.now();
    persistTopics(); render();
    toast('关联选题「' + t.title.slice(0, 12) + '…」已更新为待发布');
    return true;
  }
  // 供 app.js 查询文章对应选题
  function getByArticle(articleId) { return state.topics.find(x => x.articleId === articleId) || null; }

  // 删除选题：确认后移除，保留其关联文章（文章是独立写作成果，不随选题删除）
  async function deleteTopic(topicId) {
    const t = find(topicId); if (!t) return;
    if (!window.confirm('确定删除选题「' + t.title + '」吗？\n（关联的文章会保留，不会删除）')) return;
    await api.deleteTopic(topicId);
    state.topics = state.topics.filter(x => x.id !== topicId);
    $('topicDetailModal').classList.add('hidden');
    render();
    toast('选题已删除');
  }

  // 打开选题关联文章：校验文章是否真实存在，避免悬空链接打开错误内容
  async function openLinkedArticle(topicId) {
    const t = find(topicId); if (!t) return;
    if (!t.articleId) { toast('该选题还没有关联文章'); return; }
    const existing = await api.getArticle(t.articleId);
    if (!existing) {
      t.articleId = null; await persistTopics(); render();
      toast('关联文章已不存在，链接已清除');
      return;
    }
    switchWorkspace('editor');
    if (window.EditorBridge) await window.EditorBridge.openArticle(t.articleId);
  }

  // ===== 工作区切换 =====
  function switchWorkspace(name) {
    closeDropdown();
    $$('.work-seg button').forEach(b => b.classList.toggle('on', b.dataset.workspace === name));
    $('topicWorkspace').classList.toggle('hidden', name !== 'topics');
    $('editorWorkspace').classList.toggle('hidden', name !== 'editor');
    $$('.editor-only').forEach(b => b.classList.toggle('hidden', name !== 'editor'));
    try { localStorage.setItem('wb-workspace', name); } catch (e) {}
  }

  // ===== 导入导出 =====
  function exportJson() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), records: state.topics }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '选题备份_' + new Date().toISOString().slice(0, 10) + '.json';
    a.click(); URL.revokeObjectURL(a.href);
    toast('已导出 ' + state.topics.length + ' 条选题');
  }
  function importJson(obj) {
    let arr = obj; if (obj && Array.isArray(obj.records)) arr = obj.records;
    if (!Array.isArray(arr)) { toast('JSON 结构不对，需要记录数组'); return; }
    const ids = new Set(state.topics.map(t => t.id));
    let added = 0, skipped = 0, invalid = 0;
    arr.forEach(item => {
      if (!item || !item.id || !item.title) { invalid++; return; }
      if (ids.has(item.id)) { skipped++; return; }
      state.topics.push({
        id: String(item.id), title: String(item.title),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        links: Array.isArray(item.links) ? item.links.map(String) : [],
        notes: item.notes ? String(item.notes) : '',
        status: STATUSES.includes(item.status) ? item.status : STATUSES[0],
        articleId: item.articleId || null,
        createdAt: item.createdAt || Date.now(), updatedAt: item.updatedAt || Date.now(),
        demo: !!item.demo
      });
      ids.add(item.id); added++;
    });
    persistTopics(); render();
    toast('导入完成：新增 ' + added + '，跳过重复 ' + skipped + (invalid ? '，无效 ' + invalid : ''));
  }

  // ===== 拖拽：卡内排序 + 拖到阶段改状态 =====
  function clearHints() {
    $$('.tp-item.drop-target').forEach(e => e.classList.remove('drop-target'));
    $$('.tp-card.drop-above,.tp-card.drop-below').forEach(e => e.classList.remove('drop-above', 'drop-below'));
  }
  function commitOrder() {
    $$('#topicStageList .tp-card').forEach((c, i) => { const t = find(c.dataset.id); if (t) t.order = i; });
    persistTopics();
  }
  function moveStatus(id, status) {
    const t = find(id); if (!t || t.status === status) return false;
    t.status = status; t.updatedAt = Date.now(); persistTopics(); return true;
  }

  // ===== 玻璃风通用下拉浮层（状态 / 排序共用） =====
  let ddState = null; // { trigger, onSelect }
  function closeDropdown() {
    const dd = $('tpDropdown'), scrim = $('tpDdScrim');
    if (dd) dd.classList.add('hidden');
    if (scrim) scrim.remove();
    if (ddState && ddState.trigger) ddState.trigger.setAttribute('aria-expanded', 'false');
    ddState = null;
  }
  function openDropdown(trigger, head, opts, current, onSelect) {
    const wasOpen = ddState && ddState.trigger === trigger;
    closeDropdown();
    if (wasOpen) return; // 再次点击同一触发器则收起
    const dd = $('tpDropdown');
    $('tpDdHead').textContent = head;
    $('tpDdList').innerHTML = opts.map(o =>
      '<button type="button" class="tp-dd-item' + (o.value === current ? ' active' : '') + '" data-value="' + esc(o.value) + '" role="option"' +
      ' style="--rc:' + (o.color || 'var(--tp-accent)') + '" aria-selected="' + (o.value === current) + '">' +
        '<span class="tp-dd-ic">' + esc(o.icon || '') + '</span>' +
        '<span class="tp-dd-name">' + esc(o.label) + '</span>' +
        '<span class="tp-dd-check">✓</span>' +
      '</button>'
    ).join('');
    // 点击外部关闭的透明遮罩
    const scrim = document.createElement('div');
    scrim.id = 'tpDdScrim'; scrim.className = 'tp-dd-scrim';
    scrim.addEventListener('click', closeDropdown);
    document.body.appendChild(scrim);
    // 先显示再测量，保证拿到真实尺寸
    dd.classList.remove('hidden', 'up');
    const r = trigger.getBoundingClientRect();
    const dh = dd.offsetHeight, dw = dd.offsetWidth;
    const gap = 6, margin = 10;
    let top = r.bottom + gap, up = false;
    if (r.bottom + gap + dh > window.innerHeight - margin && r.top - gap - dh > margin) {
      top = r.top - gap - dh; up = true; dd.classList.add('up');
    }
    let left = r.left;
    if (left + dw > window.innerWidth - margin) left = window.innerWidth - dw - margin;
    if (left < margin) left = margin;
    dd.style.top = top + 'px';
    dd.style.left = left + 'px';
    trigger.setAttribute('aria-expanded', 'true');
    // 选项点击
    $('tpDdList').onclick = (ev) => {
      const item = ev.target.closest('.tp-dd-item'); if (!item) return;
      const value = item.dataset.value;
      closeDropdown();
      if (onSelect) onSelect(value);
    };
    ddState = { trigger, onSelect };
  }
  // 滚动 / 改变大小时关闭，避免浮层脱离触发器
  window.addEventListener('resize', closeDropdown);
  window.addEventListener('scroll', closeDropdown, true);

  // ===== 事件 =====
  function bind() {
    $$('.work-seg button').forEach(b => b.addEventListener('click', () => switchWorkspace(b.dataset.workspace)));
    $('topicSearch').addEventListener('input', e => { state.search = e.target.value; renderStage(); });
    $('topicSortBtn').addEventListener('click', (e) => {
      const opts = [
        { value: 'custom', label: '自定义排序', icon: '≡', color: 'var(--tp-accent)' },
        { value: 'created', label: '按创建时间', icon: '＋', color: 'var(--tp-accent2)' },
        { value: 'updated', label: '按更改时间', icon: '↻', color: 'var(--tp-gold)' },
        { value: 'title', label: '按标题', icon: 'A', color: 'var(--tp-accent3)' }
      ];
      openDropdown(e.currentTarget, '排序规则', opts, state.sort, (value) => {
        if (value === 'custom' && state.sort !== 'custom') { snapshotOrder(); persistTopics(); }
        state.sort = value; renderStage();
      });
    });
    $('topicNewBtn').addEventListener('click', () => openModal(null));
    $('topicSaveBtn').addEventListener('click', saveFromModal);
    $('topicExportBtn').addEventListener('click', exportJson);
    $('topicImportBtn').addEventListener('click', () => $('topicImportFile').click());
    $('topicImportFile').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { importJson(JSON.parse(r.result)); } catch (err) { toast('不是有效的 JSON 文件'); } };
      r.readAsText(f); e.target.value = '';
    });

    $('topicRail').addEventListener('input', e => {
      if (!e.target.closest('#tagSearchInput')) return;
      state.tagSearch = e.target.value;
      const pos = e.target.selectionStart;
      renderTagList();
      const input = $('tagSearchInput');
      if (input) { input.focus(); try { input.setSelectionRange(pos, pos); } catch (err) {} }
    });
    $('topicRail').addEventListener('click', e => {
      const head = e.target.closest('[data-toggle-group]');
      if (head) {
        const g = head.dataset.toggleGroup;
        state.railCollapsed[g] = !state.railCollapsed[g];
        const group = head.closest('.tp-group');
        if (group) group.classList.toggle('collapsed', !!state.railCollapsed[g]);
        head.setAttribute('aria-expanded', String(!state.railCollapsed[g]));
        return;
      }
      const item = e.target.closest('.tp-item'); if (!item) return;
      if (item.dataset.status) state.view = { type: 'status', value: item.dataset.status };
      else if (item.dataset.tag !== undefined) state.view = { type: 'tag', value: item.dataset.tag || null };
      render();
    });
    $('topicRail').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.target.click(); } });

    $('topicStageList').addEventListener('click', e => {
      if (e.target.closest('[data-topiclink]')) return; // 素材链接交给浏览器打开新窗
      const del = e.target.closest('[data-deltopic]'); if (del) { e.stopPropagation(); deleteTopic(del.dataset.deltopic); return; }
      const write = e.target.closest('[data-write]'); if (write) { e.stopPropagation(); startWriting(write.dataset.write); return; }
      const open = e.target.closest('[data-openarticle]'); if (open) { e.stopPropagation(); openLinkedArticle(open.dataset.openarticle); return; }
      const st = e.target.closest('[data-kind="status"]');
      if (st) {
        e.stopPropagation();
        const opts = STATUSES.map((s, i) => ({ value: s, label: s, icon: META[s].icon, color: META[s].color }));
        const cur = find(st.dataset.id);
        openDropdown(st, '切换状态', opts, cur ? cur.status : null, (value) => {
          const t = find(st.dataset.id); if (!t) return;
          if (moveStatus(t.id, value)) { render(); toast('「' + t.title.slice(0, 12) + '…」已移至 ' + value); }
        });
        return;
      }
      const card = e.target.closest('.tp-card'); if (!card) return;
      openDetail(card.dataset.id);
    });
    $('topicStageList').addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.classList.contains('tp-card')) openDetail(e.target.dataset.id);
    });

    // 拖拽
    $('topicStageList').addEventListener('dragstart', e => {
      const card = e.target.closest('.tp-card'); if (!card) return;
      if (state.sort !== 'custom') { snapshotOrder(); state.sort = 'custom'; }
      state.dragId = card.dataset.id; card.classList.add('dragging');
      if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', state.dragId); }
    });
    $('topicStageList').addEventListener('dragover', e => {
      const dragged = $('.tp-card.dragging'); if (!dragged) return;
      e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      clearHints();
      const over = e.target.closest('.tp-card'); if (!over || over === dragged) return;
      const r = over.getBoundingClientRect();
      over.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-above' : 'drop-below');
    });
    $('topicStageList').addEventListener('drop', e => {
      e.preventDefault();
      const dragged = $('.tp-card.dragging'); if (!dragged || !state.dragId) return;
      const over = e.target.closest('.tp-card');
      if (over && over !== dragged) {
        const r = over.getBoundingClientRect(); const box = $('topicStageList');
        box.insertBefore(dragged, e.clientY < r.top + r.height / 2 ? over : over.nextSibling);
      }
      commitOrder();
    });
    $('topicStageList').addEventListener('dragend', () => {
      const dragged = $('.tp-card.dragging'); if (dragged) dragged.classList.remove('dragging');
      clearHints(); state.dragId = null;
    });
    $('topicRail').addEventListener('dragover', e => {
      const item = e.target.closest('.tp-item[data-status]'); if (!item || !state.dragId) return;
      e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      clearHints(); item.classList.add('drop-target');
    });
    $('topicRail').addEventListener('drop', e => {
      const item = e.target.closest('.tp-item[data-status]'); if (!item || !state.dragId) return;
      e.preventDefault();
      const status = item.dataset.status, t = find(state.dragId);
      if (moveStatus(state.dragId, status)) { toast('「' + t.title.slice(0, 12) + '…」已移至 ' + status); state.dragId = null; render(); }
    });
    // 弹窗关闭
    $$('#topicModal [data-close], #topicDetailModal [data-close]').forEach(b => b.addEventListener('click', () => b.closest('.modal').classList.add('hidden')));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { $('topicModal').classList.add('hidden'); $('topicDetailModal').classList.add('hidden'); }
    });
  }

  // ===== 暴露桥接接口 =====
  window.TopicsBridge = { markPublished, getByArticle, switchWorkspace, startWriting, openLinkedArticle, refresh: render };

  async function init() {
    await load();
    bind();
    render();
    let saved = 'topics'; try { saved = localStorage.getItem('wb-workspace') || 'topics'; } catch (e) {}
    // 初始工作区由 app.js 的最后一步统一设置（避免弹窗/布局闪动）
    window.__topicsInitDone = true;
  }
  init();
})();
