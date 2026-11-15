(function () {
  let md;
  function createMD() {
    if (md) return md;
    md = window.markdownit({
      html: false,
      linkify: true,
      typographer: false,
      breaks: false,
      highlight: function (str, lang) {
        if (lang && window.hljs && window.hljs.getLanguage(lang)) {
          try { return window.hljs.highlight(str, { language: lang, ignoreIllegals: true }).value; } catch (e) {}
        }
        try { return window.hljs.highlightAuto(str).value; } catch (e) {}
        return md.utils.escapeHtml(str);
      }
    });
    md.enable(['table', 'strikethrough']);
    return md;
  }

  function camelToKebab(s) { return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }
  function objToStyle(obj) {
    return Object.entries(obj)
      .filter(kv => kv[1] !== '' && kv[1] != null)
      .map(kv => camelToKebab(kv[0]) + ':' + kv[1])
      .join(';');
  }

  function renderTaskLists(html) {
    return html
      .replace(/<li>(\s*<p>)?\s*\[ \]\s*/g, '<li$1><span class="task-checkbox">☐</span> ')
      .replace(/<li>(\s*<p>)?\s*\[[xX]\]\s*/g, '<li$1><span class="task-checkbox checked">☑</span> ');
  }

  function walk(node, theme, codeTheme, counters) {
    const children = Array.from(node.children);
    for (const el of children) {
      const tag = el.tagName.toLowerCase();
      let styleObj = null;
      if (tag === 'code') {
        styleObj = el.parentElement && el.parentElement.tagName === 'PRE' ? theme.code_block : theme.code_inline;
      } else if (theme[tag]) {
        styleObj = theme[tag];
      } else if (tag === 'span' && el.classList.contains('task-checkbox')) {
        styleObj = { color: el.classList.contains('checked') ? theme.a.color : '#bbbbbb', marginRight: '6px' };
      }
      if (styleObj) {
        const existing = el.getAttribute('style');
        el.setAttribute('style', objToStyle(styleObj) + (existing ? ';' + existing : ''));
      }
      if (tag === 'h2' && theme.h2Number) {
        counters.h2++;
        const num = document.createElement('span');
        num.setAttribute('leaf', '');
        num.setAttribute('style', 'color:' + theme.accent + ';font-size:22px;font-weight:bold;margin-right:10px;line-height:1');
        num.textContent = String(counters.h2).padStart(2, '0');
        el.insertBefore(num, el.firstChild);
      }
      if (tag === 'blockquote' && theme.quoteMark) {
        const target = el.querySelector('p') || el;
        const q = document.createElement('span');
        q.setAttribute('leaf', '');
        q.setAttribute('style', 'color:' + theme.accent + ';font-size:30px;font-weight:bold;line-height:1;margin-right:8px;vertical-align:-6px');
        q.textContent = '"';
        target.insertBefore(q, target.firstChild);
      }
      if (tag === 'code') {
        el.querySelectorAll('span[class*="hljs-"]').forEach(span => {
          const cls = Array.from(span.classList).find(c => c.indexOf('hljs-') === 0);
          if (cls) {
            const color = codeTheme[cls.slice(5)] || codeTheme.default;
            span.setAttribute('style', 'color:' + color);
            span.removeAttribute('class');
          }
        });
      }
      walk(el, theme, codeTheme);
    }
  }

  function applyTheme(rawHTML, theme) {
    const tpl = document.createElement('template');
    tpl.innerHTML = rawHTML;
    const codeTheme = window.THEMES.codeThemes[theme.codeTheme] || window.THEMES.codeThemes['atom-one-dark'];
    const section = document.createElement('section');
    section.setAttribute('style', objToStyle(theme.container));
    while (tpl.content.firstChild) section.appendChild(tpl.content.firstChild);
    walk(section, theme, codeTheme, { h2: 0 });
    return section.outerHTML;
  }

  function plainText(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }

  function render(mdText, config) {
    const m = createMD();
    let raw = m.render(mdText || '');
    raw = renderTaskLists(raw);
    const theme = window.THEMES.buildTheme(config);
    const html = applyTheme(raw, theme);
    return { html: html, text: plainText(html) };
  }

  function exportDoc(bodyHTML, title) {
    const t = (title || '公众号文章').replace(/</g, '&lt;');
    return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + t + '</title></head><body style="margin:0;background:#eef0f2;padding:24px;">' + bodyHTML + '</body></html>';
  }

  // ===== WeChat export transformation =====

  function extractStyleValue(styleStr, prop) {
    if (!styleStr) return null;
    const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = styleStr.match(new RegExp('(?:^|;)\\s*' + escaped + '\\s*:\\s*([^;]+)', 'i'));
    return match ? match[1].trim() : null;
  }

  function addImportant(styleStr) {
    if (!styleStr) return '';
    return styleStr.split(';').map(s => s.trim()).filter(s => s)
      .map(s => /!important\s*$/i.test(s) ? s : s + ' !important').join('; ');
  }

  const BLOCK_TAGS = new Set(['p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'blockquote', 'pre', 'hr', 'img', 'thead', 'tbody', 'tr', 'td', 'th']);

  function removeWhitespaceNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (parent && parent.closest('pre, code')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach(node => {
      if (!node.parentNode) return;
      const prev = node.previousSibling, next = node.nextSibling;
      const prevBlock = prev && prev.nodeType === 1 && BLOCK_TAGS.has(prev.tagName.toLowerCase());
      const nextBlock = next && next.nodeType === 1 && BLOCK_TAGS.has(next.tagName.toLowerCase());
      const parentBlock = node.parentElement && BLOCK_TAGS.has(node.parentElement.tagName.toLowerCase());
      if (prevBlock || nextBlock || (!prev && !next && parentBlock)) node.remove();
    });
  }

  function wrapTextNodesWithLeaf(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('pre, code')) return NodeFilter.FILTER_REJECT;
        if (parent.closest('span[leaf]')) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === 'MP-STYLE-TYPE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach(node => {
      const span = document.createElement('span');
      span.setAttribute('leaf', '');
      node.parentNode.insertBefore(span, node);
      span.appendChild(node);
    });
  }

  function normalizeMargins(root) {
    const blocks = Array.from(root.children).filter(el => el.nodeType === 1);
    blocks.forEach((block, i) => {
      const prev = blocks[i - 1];
      if (prev) {
        const prevBottom = parseFloat(prev.style.marginBottom) || 0;
        const top = parseFloat(block.style.marginTop) || 0;
        if (top > 0 && prevBottom > 0) block.style.marginTop = Math.max(top - prevBottom, 0) + 'px';
      }
    });
  }

  function transformForWechat(html, config) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const section = tpl.content.firstElementChild;
    if (!section) return html;

    section.removeAttribute('class');
    section.removeAttribute('id');
    section.querySelectorAll('[class]').forEach(el => el.removeAttribute('class'));
    section.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));

    const cs = section.getAttribute('style') || '';
    const cFontSize = extractStyleValue(cs, 'font-size');
    const cLineHeight = extractStyleValue(cs, 'line-height');
    const cColor = extractStyleValue(cs, 'color');
    const cFontFamily = extractStyleValue(cs, 'font-family');
    section.querySelectorAll('p, li, td, th, blockquote, h1, h2, h3, h4, h5, h6').forEach(el => {
      let s = el.getAttribute('style') || '';
      if (cFontSize && !extractStyleValue(s, 'font-size')) s += ';font-size:' + cFontSize;
      if (cLineHeight && !extractStyleValue(s, 'line-height')) s += ';line-height:' + cLineHeight;
      if (cColor && !extractStyleValue(s, 'color')) s += ';color:' + cColor;
      if (cFontFamily && !extractStyleValue(s, 'font-family')) s += ';font-family:' + cFontFamily;
      el.setAttribute('style', s);
    });

    const accent = (config && config.accent) || '#4caf50';
    section.querySelectorAll('ol').forEach(ol => {
      const items = Array.from(ol.children).filter(li => li.tagName === 'LI');
      const frag = document.createDocumentFragment();
      items.forEach((li, i) => {
        const p = document.createElement('p');
        p.setAttribute('style', (li.getAttribute('style') || '') + ';margin:6px 0');
        const num = document.createElement('span');
        num.setAttribute('style', 'color:' + accent);
        num.textContent = (i + 1) + '. ';
        p.appendChild(num);
        while (li.firstChild) p.appendChild(li.firstChild);
        frag.appendChild(p);
      });
      ol.parentNode.replaceChild(frag, ol);
    });

    section.querySelectorAll('img').forEach(img => {
      const parent = img.parentElement;
      if (parent && parent.tagName === 'P' && parent.children.length === 1 && parent.children[0] === img && !parent.textContent.trim()) {
        const s = parent.getAttribute('style') || '';
        if (!extractStyleValue(s, 'text-align')) parent.setAttribute('style', s + ';text-align:center');
      }
    });

    normalizeMargins(section);

    section.setAttribute('style', addImportant(section.getAttribute('style') || ''));
    section.querySelectorAll('[style]').forEach(el => {
      el.setAttribute('style', addImportant(el.getAttribute('style')));
    });

    removeWhitespaceNodes(section);
    wrapTextNodesWithLeaf(section);

    const mark = document.createElement('p');
    mark.setAttribute('style', 'display:none !important;');
    const styleType = document.createElement('mp-style-type');
    styleType.setAttribute('data-value', '3');
    mark.appendChild(styleType);
    section.appendChild(mark);

    return section.outerHTML;
  }

  function renderForWechat(mdText, config) {
    const r = render(mdText, config);
    const wechatHTML = transformForWechat(r.html, config);
    return { html: wechatHTML, text: plainText(wechatHTML) };
  }

  window.Engine = { render, renderForWechat, exportDoc };
})();