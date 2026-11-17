/* ===== 主题系统：保留 10 套 + 新增 20 套风格迥异主题 =====
 * 每套主题 = 基础样式(buildTheme) + 装饰层(decor)
 * decor 支持：h2Deco / h3Deco / quoteMark / ulMark / olMark / hrDeco / pageBg
 */
(function () {
  const fontFamilies = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: 'Georgia, "Songti SC", "SimSun", serif',
    kai: '"Kaiti SC", "KaiTi", "STKaiti", serif',
    mono: 'Consolas, Monaco, "Courier New", monospace'
  };

  const codeThemes = {
    'atom-one-dark': { background: '#282c34', default: '#abb2bf', keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66', function: '#61afef', title: '#e5c07b', built_in: '#e6c07b', literal: '#56b6c2', attr: '#d19a66', variable: '#e06c75', tag: '#e06c75', name: '#e06c75', type: '#e5c07b', params: '#abb2bf', symbol: '#56b6c2', meta: '#61afef', regexp: '#98c379', link: '#56b6c2' },
    'github-light': { background: '#f6f8fa', default: '#24292e', keyword: '#d73a49', string: '#032f62', comment: '#6a737d', number: '#005cc5', function: '#6f42c1', title: '#6f42c1', built_in: '#005cc5', literal: '#005cc5', attr: '#005cc5', variable: '#e36209', tag: '#22863a', name: '#22863a', type: '#d73a49', params: '#24292e', symbol: '#005cc5', meta: '#6a737d', regexp: '#032f62', link: '#005cc5' },
    'monokai': { background: '#272822', default: '#f8f8f2', keyword: '#f92672', string: '#e6db74', comment: '#75715e', number: '#ae81ff', function: '#a6e22e', title: '#a6e22e', built_in: '#a6e22e', literal: '#ae81ff', attr: '#a6e22e', variable: '#f8f8f2', tag: '#f92672', name: '#a6e22e', type: '#66d9ef', params: '#f8f8f2', symbol: '#ae81ff', meta: '#75715e', regexp: '#e6db74', link: '#ae81ff' },
    'xcode': { background: '#ffffff', default: '#000000', keyword: '#a90d91', string: '#c41a16', comment: '#007400', number: '#1c00cf', function: '#3e6a75', title: '#3e6a75', built_in: '#a90d91', literal: '#a90d91', attr: '#a90d91', variable: '#3e6a75', tag: '#a90d91', name: '#3e6a75', type: '#a90d91', params: '#000000', symbol: '#1c00cf', meta: '#643820', regexp: '#c41a16', link: '#007400' },
    'dracula': { background: '#282a36', default: '#f8f8f2', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', number: '#bd93f9', function: '#50fa7b', title: '#50fa7b', built_in: '#8be9fd', literal: '#bd93f9', attr: '#50fa7b', variable: '#f8f8f2', tag: '#ff79c6', name: '#f8f8f2', type: '#8be9fd', params: '#f8f8f2', symbol: '#8be9fd', meta: '#ffb86c', regexp: '#f1fa8c', link: '#8be9fd' }
  };

  function hexToRgba(hex, alpha) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function shadeHex(hex, pct) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const mix = v => Math.round(v + (255 - v) * pct);
    return '#' + [mix(parseInt(h.slice(0, 2), 16)), mix(parseInt(h.slice(2, 4), 16)), mix(parseInt(h.slice(4, 6), 16))].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function h1Style(style, accent, textColor, dark) {
    const base = { margin: '24px 0 16px', lineHeight: '1.4', fontWeight: 'bold' };
    switch (style) {
      case 'block': return Object.assign(base, { fontSize: '22px', color: dark ? '#fff' : '#fff', backgroundColor: accent, padding: '10px 16px', borderRadius: '6px', textAlign: 'center' });
      case 'underline': return Object.assign(base, { fontSize: '24px', color: accent, borderBottom: '3px solid ' + accent, padding: '6px 0' });
      case 'leftborder': return Object.assign(base, { fontSize: '22px', color: textColor, borderLeft: '5px solid ' + accent, paddingLeft: '12px' });
      case 'gradient': return Object.assign(base, { fontSize: '22px', color: '#fff', textAlign: 'center', padding: '10px 24px', borderRadius: '8px', backgroundColor: accent, backgroundImage: 'linear-gradient(135deg, ' + accent + ' 0%, ' + shadeHex(accent, 0.4) + ' 100%)', boxShadow: '0 4px 12px ' + hexToRgba(accent, 0.3) });
      case 'outline': return Object.assign(base, { fontSize: '22px', color: textColor, textAlign: 'center', border: '2px solid ' + accent, borderRadius: '8px', padding: '10px 16px', letterSpacing: '1px' });
      case 'serifBig': return Object.assign(base, { fontSize: '26px', color: textColor, textAlign: 'center', letterSpacing: '3px', fontFamily: fontFamilies.serif });
      case 'plain':
      default: return Object.assign(base, { fontSize: '24px', color: textColor, textAlign: 'center' });
    }
  }
  function h2Style(style, accent, textColor) {
    const base = { margin: '22px 0 14px', lineHeight: '1.4', fontWeight: 'bold' };
    switch (style) {
      case 'block': return Object.assign(base, { fontSize: '18px', color: '#fff', backgroundColor: accent, padding: '6px 12px', borderRadius: '4px', display: 'inline-block' });
      case 'leftborder': return Object.assign(base, { fontSize: '19px', color: textColor, borderLeft: '4px solid ' + accent, paddingLeft: '10px' });
      case 'number': return Object.assign(base, { fontSize: '19px', color: textColor, borderBottom: '1px solid ' + hexToRgba(textColor, 0.12), padding: '4px 0 8px' });
      case 'gradientbar': return Object.assign(base, { fontSize: '20px', color: textColor, paddingBottom: '8px', backgroundImage: 'linear-gradient(to right, ' + accent + ' 0%, ' + hexToRgba(accent, 0) + ' 100%)', backgroundRepeat: 'no-repeat', backgroundSize: '100% 3px', backgroundPosition: 'left bottom' });
      case 'plain': return Object.assign(base, { fontSize: '20px', color: textColor });
      case 'center': return Object.assign(base, { fontSize: '18px', color: textColor, textAlign: 'center' });
      case 'underline':
      default: return Object.assign(base, { fontSize: '20px', color: accent, borderBottom: '2px solid ' + accent, padding: '4px 0' });
    }
  }

  function buildTheme(c) {
    const accent = c.accent || '#4caf50';
    const textColor = c.textColor || '#3f3f3f';
    const fontSize = c.fontSize || '16px';
    const lineHeight = c.lineHeight || '1.75';
    const font = fontFamilies[c.font] || fontFamilies.sans;
    const quoteBg = c.quoteBg || hexToRgba(accent, 0.08);
    const thColor = c.thColor || accent;
    const imgRadius = c.imgRadius != null ? c.imgRadius : '8px';
    const ct = codeThemes[c.codeTheme] || codeThemes['atom-one-dark'];
    const dark = !!c.dark;
    const subText = dark ? '#b9bcc9' : '#555555';
    const emColor = dark ? '#b0b3c2' : '#666666';
    const delColor = dark ? '#8288a0' : '#999999';
    const borderColor = dark ? '#565b74' : '#dddddd';
    const hrColor = dark ? '#565b74' : '#cccccc';
    const container = {
      backgroundColor: c.bg || '#ffffff', color: textColor, fontSize: fontSize, lineHeight: lineHeight,
      fontFamily: font, letterSpacing: c.letterSpacing || '0.5px', padding: c.padding || '20px', overflowWrap: 'break-word'
    };
    if (c.page) Object.assign(container, c.page);
    let blockquote, quoteMark = false;
    if (c.quoteStyle === 'card') {
      blockquote = { backgroundColor: quoteBg, color: subText, padding: '14px 16px', margin: '14px 0', borderRadius: '10px', boxShadow: '0 2px 10px ' + hexToRgba(accent, 0.08) };
    } else if (c.quoteStyle === 'mark') {
      blockquote = { color: subText, padding: '6px 4px 6px 14px', margin: '14px 0' };
      quoteMark = true;
    } else if (c.quoteStyle === 'ticket') {
      blockquote = { border: '1px dashed ' + accent, backgroundColor: quoteBg, color: subText, padding: '12px 14px', margin: '14px 0', borderRadius: '6px' };
    } else if (c.quoteStyle === 'none') {
      blockquote = { color: subText, padding: '8px 2px', margin: '14px 0', textAlign: 'center' };
    } else {
      blockquote = { borderLeft: '4px solid ' + accent, backgroundColor: quoteBg, color: subText, padding: '10px 14px', margin: '14px 0', borderRadius: '0 6px 6px 0' };
    }
    if (c.blockquoteStyle) Object.assign(blockquote, c.blockquoteStyle);
    return {
      container: container, accent: accent, dark: dark,
      h2Number: c.h2Style === 'number', quoteMark: quoteMark && !c.decor?.quoteMark,
      h1: Object.assign(h1Style(c.h1Style, accent, textColor, dark), c.h1StyleObj || {}),
      h2: Object.assign(h2Style(c.h2Style, accent, textColor), c.h2StyleObj || {}),
      h3: Object.assign({ fontSize: '18px', color: textColor, fontWeight: 'bold', borderLeft: '3px solid ' + accent, paddingLeft: '10px', margin: '18px 0 12px', lineHeight: '1.4' }, c.h3StyleObj || {}),
      h4: Object.assign({ fontSize: '16px', color: textColor, fontWeight: 'bold', margin: '16px 0 10px', lineHeight: '1.4' }, c.h4StyleObj || {}),
      h5: { fontSize: '15px', color: textColor, fontWeight: 'bold', margin: '14px 0 10px' },
      h6: { fontSize: '14px', color: dark ? '#9aa0b2' : '#888888', fontWeight: 'bold', margin: '14px 0 10px' },
      p: { margin: '12px 0', lineHeight: lineHeight, color: textColor, fontSize: fontSize },
      blockquote: blockquote,
      code_inline: { backgroundColor: hexToRgba(accent, 0.1), color: accent, padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', fontFamily: fontFamilies.mono },
      pre: { backgroundColor: ct.background, borderRadius: '8px', padding: '14px', margin: '14px 0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: ct.default, fontSize: '14px', lineHeight: '1.6', fontFamily: fontFamilies.mono },
      code_block: { color: ct.default, fontSize: '14px', fontFamily: fontFamilies.mono, lineHeight: '1.6', backgroundColor: 'transparent', padding: '0', whiteSpace: 'pre-wrap', wordWrap: 'break-word' },
      ul: { margin: '12px 0', paddingLeft: '24px' }, ol: { margin: '12px 0', paddingLeft: '24px' },
      li: { margin: '6px 0', lineHeight: lineHeight, color: textColor },
      table: { borderCollapse: 'collapse', width: '100%', margin: '14px 0', fontSize: '15px' },
      th: { backgroundColor: thColor, color: '#fff', padding: '8px 12px', border: '1px solid ' + thColor, fontWeight: 'bold', textAlign: 'left' },
      td: { padding: '8px 12px', border: '1px solid ' + borderColor, color: textColor },
      img: { maxWidth: '100%', borderRadius: imgRadius, margin: '12px auto', display: 'block' },
      a: { color: accent, borderBottom: '1px solid ' + accent, textDecoration: 'none' },
      hr: c.decor?.hrDeco ? { border: 'none', margin: '24px 0' } : { border: 'none', borderTop: '1px dashed ' + hrColor, margin: '24px 0' },
      strong: { color: accent, fontWeight: 'bold' },
      em: { color: emColor, fontStyle: 'italic' }, del: { color: delColor },
      codeTheme: c.codeTheme || 'atom-one-dark',
      decor: c.decor || null
    };
  }

  // ============ 装饰生成工具 ============
  const dot = (color, size) => `<span style="display:inline-block;width:${size || 7}px;height:${size || 7}px;border-radius:50%;background:${color};"></span>`;
  const hrLine = (symbol, color, extra) => `<section style="margin:26px 0;text-align:center;color:${color};font-size:13px;letter-spacing:4px;line-height:1;${extra || ''}">${symbol}</section>`;

  // ============ 保留的 10 套（原版精粹）============
  const kept = [
    { id: 'moyu', name: '摸鱼绿', group: '通用', accent: '#4caf50', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'block', h2Style: 'underline', codeTheme: 'atom-one-dark', quoteBg: '#f1f8e9', quoteStyle: 'default' },
    { id: 'deepsea', name: '深海蓝', group: '通用', accent: '#2196f3', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'underline', h2Style: 'leftborder', codeTheme: 'atom-one-dark', quoteBg: '#e3f2fd', quoteStyle: 'default' },
    { id: 'graphite', name: '石墨极简', group: '通用', accent: '#48484c', bg: '#f6f6f7', textColor: '#2d2d30', font: 'sans', h1Style: 'plain', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#ececee', quoteStyle: 'default', imgRadius: '4px', thColor: '#3a3a3c' },
    { id: 'zen', name: '禅意留白', group: '文艺', accent: '#8a8a86', bg: '#fdfdfc', textColor: '#2b2b2a', font: 'kai', lineHeight: '2.0', h1Style: 'plain', h2Style: 'plain', codeTheme: 'github-light', quoteStyle: 'mark', imgRadius: '12px' },
    { id: 'ftpaper', name: '金融时报', group: '商务', accent: '#990f3d', bg: '#fff1e5', textColor: '#33302e', font: 'serif', h1Style: 'leftborder', h2Style: 'underline', codeTheme: 'github-light', quoteBg: '#ffe3d2', quoteStyle: 'card', thColor: '#990f3d' },
    { id: 'academia', name: '靛蓝学院', group: '文艺', accent: '#3f51b5', bg: '#fbfaff', textColor: '#2c2c3a', font: 'serif', h1Style: 'outline', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#eceefb', quoteStyle: 'default', thColor: '#3f51b5' },
    { id: 'amber', name: '琥珀遗产', group: '文艺', accent: '#b26400', bg: '#ece3ca', textColor: '#793205', font: 'serif', lineHeight: '1.8', h1Style: 'outline', h2Style: 'gradientbar', codeTheme: 'github-light', quoteBg: '#e4d8b4', quoteStyle: 'card' },
    { id: 'luxforest', name: '静奢森林', group: '商务', accent: '#4a6b54', bg: '#f4f1ea', textColor: '#26291f', font: 'serif', lineHeight: '1.8', h1Style: 'leftborder', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#e7e4d8', quoteStyle: 'card' },
    { id: 'noirgold', name: '黑金', group: '暗色', accent: '#d4af37', bg: '#141414', textColor: '#eae6da', font: 'serif', h1Style: 'outline', h2Style: 'gradientbar', codeTheme: 'atom-one-dark', quoteBg: '#232323', thColor: '#2a2a2a', quoteStyle: 'card', dark: true },
    { id: 'dracula', name: '暗夜公爵', group: '暗色', accent: '#bd93f9', bg: '#232530', textColor: '#f8f8f3', font: 'sans', h1Style: 'gradient', h2Style: 'number', codeTheme: 'dracula', quoteBg: '#343746', thColor: '#414558', quoteStyle: 'card', dark: true }
  ];

  // ============ 新增的 20 套（风格迥异，带装饰层）============
  const added = [
    {
      id: 'festival', name: '国潮', group: '文艺', accent: '#d9381e', bg: '#fffaf1', textColor: '#7a3a1c', font: 'sans', h1Style: 'serifBig', h2Style: 'center', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#fff3df', letterSpacing: '1px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 16px;text-align:center;"><span style="display:inline-block;padding:2px;border:1px solid #e9b949;"><span style="display:inline-block;padding:3px;background:#d9381e;"><span style="display:inline-block;padding:6px 20px;border:1px solid #f6d58e;color:#fff;letter-spacing:3px;font-weight:bold;font-size:16px;"><span style="color:#f6d58e;font-size:11px;">◆</span><span style="margin:0 12px;">${t}</span><span style="color:#f6d58e;font-size:11px;">◆</span></span></span></span></section>`,
        h3Deco: t => `<section style="margin:18px 0 12px;font-weight:bold;color:#c89318;font-size:16px;">◈ ${t}</section>`,
        quoteMark: `<span style="color:#d09121;font-size:18px;margin-right:6px;">❖</span>`,
        ulMark: `<span style="color:#d09121;">❖</span>`,
        hrDeco: hrLine('〜 ❖ 〜', '#c89318')
      }
    },
    {
      id: 'inkwash', name: '水墨', group: '文艺', accent: '#2f3e46', bg: '#f8f8f5', textColor: '#3a3f42', font: 'serif', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'github-light', letterSpacing: '1px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 14px;text-align:center;"><span style="display:block;font-size:30px;font-weight:normal;line-height:1;color:#7d8a90;font-family:${fontFamilies.serif};">${String(n).padStart(2, '0')}</span><span style="display:block;margin-top:10px;font-size:19px;font-weight:bold;color:#1f2a30;letter-spacing:3px;">${t}</span><span style="display:block;width:60px;height:3px;border-radius:50%;margin:10px auto 0;background:linear-gradient(90deg,rgba(47,62,70,0),#2f3e46,rgba(47,62,70,0));"></span></section>`,
        h3Deco: t => `<section style="margin:18px 0 12px;font-weight:bold;color:#1f2a30;"><span style="color:#9a3b3b;">｜</span>${t}</section>`,
        quoteMark: `<span style="display:block;height:22px;font-size:28px;line-height:1;color:#8e9da4;font-family:${fontFamilies.serif};">〝</span>`,
        hrDeco: hrLine('～ ◦ ～', '#909ca3')
      }
    },
    {
      id: 'terminal', name: '终端', group: '科技', accent: '#4ade80', bg: '#1e1f24', textColor: '#d4d4d8', font: 'mono', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, letterSpacing: '0',
      h1StyleObj: { color: '#fafafa', textAlign: 'left', fontFamily: fontFamilies.mono, fontSize: '20px' },
      h3StyleObj: { color: '#e4e4e7', fontFamily: fontFamilies.mono, borderLeft: 'none', paddingLeft: '0' },
      blockquoteStyle: { borderLeft: '2px solid #4ade80', background: '#26272e', color: '#a1a1aa' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 12px;font-family:${fontFamilies.mono};font-size:17px;font-weight:bold;color:#4ade80;"><span style="color:#60a5fa;">~</span><span style="color:#71717a;"> $ </span>${t}<span style="color:#4ade80;"> ▊</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-family:${fontFamilies.mono};font-size:14px;font-weight:bold;color:#e4e4e7;"><span style="color:#71717a;">&gt; </span>${t}</section>`,
        quoteMark: `<span style="display:block;margin-bottom:2px;font-family:${fontFamilies.mono};font-size:12px;color:#71717a;">// note</span>`,
        ulMark: `<span style="color:#4ade80;">❯</span>`,
        olMark: n => `<span style="font-family:${fontFamilies.mono};font-size:12px;color:#4ade80;">[${n}]</span>`,
        hrDeco: hrLine('/* ─────── */', '#52525b', `font-family:${fontFamilies.mono};`)
      }
    },
    {
      id: 'news', name: '报纸', group: '商务', accent: '#111111', bg: '#fbfaf7', textColor: '#1a1a1a', font: 'serif', h1Style: 'serifBig', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', quoteBg: '#f0eee9', letterSpacing: '0',
      h2StyleObj: { borderTop: '3px double #111', borderBottom: '1px solid #111', padding: '6px 0', textAlign: 'left' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 14px;padding:6px 0;border-top:3px double #111;border-bottom:1px solid #111;font-family:${fontFamilies.serif};font-size:18px;font-weight:bold;color:#111;">${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.serif};font-size:20px;color:#111;margin-right:6px;">“</span>`,
        hrDeco: hrLine('▬▬▬▬▬ ▪ ▬▬▬▬▬', '#333')
      }
    },


    {
      id: 'timeline', name: '时间轴', group: '科技', accent: '#0891b2', bg: '#f7fbfc', textColor: '#334155', font: 'sans', h1Style: 'underline', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#e0f2fe',
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 14px;position:relative;padding-left:32px;font-size:18px;font-weight:bold;color:#0e7490;"><span style="position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:50%;background:#0891b2;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center;">${n}</span><span style="position:absolute;left:8px;top:20px;bottom:-24px;width:2px;background:#bae6fd;"></span>${t}</section>`,
        ulMark: dot('#0891b2', 6),
        hrDeco: hrLine('● ━━━━━ ●', '#0891b2')
      }
    },
    {
      id: 'bubble', name: '对话框', group: '生活', accent: '#07c160', bg: '#f5f7f5', textColor: '#2f3b33', font: 'sans', h1Style: 'block', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#e8f8ee', imgRadius: '14px',
      h1StyleObj: { borderRadius: '18px' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:22px 0 14px;"><span style="display:inline-block;position:relative;padding:8px 16px;background:#07c160;color:#fff;border-radius:14px 14px 14px 2px;font-weight:bold;font-size:16px;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;"><span style="display:inline-block;padding:6px 12px;background:#fff;border:1px solid #d8e8dd;border-radius:12px 12px 2px 12px;color:#3d5c48;font-weight:bold;font-size:14px;">${t}</span></section>`,
        ulMark: dot('#07c160', 6),
        hrDeco: hrLine('• • •', '#07c160')
      }
    },
    {
      id: 'neon', name: '霓虹', group: '暗色', accent: '#f472b6', bg: '#15112b', textColor: '#d6d3f0', font: 'sans', h1Style: 'plain', h2Style: 'center', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: 'rgba(167,139,250,0.1)',
      h1StyleObj: { color: '#fff', textShadow: '0 0 8px #f472b6' },
      h3StyleObj: { color: '#67e8f9', textShadow: '0 0 6px rgba(34,211,238,0.6)', borderLeft: 'none', paddingLeft: '0' },
      blockquoteStyle: { borderLeft: '3px solid #a78bfa', background: 'rgba(167,139,250,0.1)', color: '#c4b5fd' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 16px;text-align:center;"><span style="display:inline-block;padding:6px 22px;border:1.5px solid #f472b6;border-radius:6px;box-shadow:0 0 10px #f472b6,inset 0 0 8px rgba(244,114,182,0.45);text-shadow:0 0 6px #f472b6;color:#fff;font-weight:bold;font-size:16px;">${t}</span></section>`,
        ulMark: `<span style="color:#67e8f9;">✦</span>`,
        hrDeco: hrLine('✦ ━━ ✦ ━━ ✦', '#a78bfa')
      }
    },
    {
      id: 'checklist', name: '清单', group: '科技', accent: '#16a34a', bg: '#fafdfb', textColor: '#243027', font: 'sans', h1Style: 'block', h2Style: 'leftborder', quoteStyle: 'ticket', codeTheme: 'github-light', quoteBg: '#f0fdf4', imgRadius: '6px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:22px 0 14px;display:flex;align-items:center;gap:10px;font-size:18px;font-weight:bold;color:#166534;"><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:#16a34a;color:#fff;font-size:13px;">✓</span>${t}</section>`,
        ulMark: `<span style="color:#16a34a;">☑</span>`,
        hrDeco: hrLine('✓ ✓ ✓', '#16a34a')
      }
    },




    {
      id: 'briefing', name: '简报', group: '商务', accent: '#1e3a8a', bg: '#f8fafc', textColor: '#1e293b', font: 'sans', h1Style: 'block', h2Style: 'leftborder', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#eef2ff', imgRadius: '4px', thColor: '#1e3a8a',
      decor: {
        h2Deco: (t, n) => `<section style="margin:22px 0 14px;padding:8px 14px;background:#1e3a8a;color:#fff;font-weight:bold;font-size:17px;letter-spacing:1px;">▌ ${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#1e3a8a;font-weight:bold;font-size:15px;border-bottom:1px solid #cbd5e1;padding-bottom:4px;">${t}</section>`,
        hrDeco: hrLine('━━━━━━━━━━', '#1e3a8a')
      }
    },

    {
      id: 'whisper', name: '留白', group: '文艺', accent: '#8a8f98', bg: '#ffffff', textColor: '#3a3a3c', font: 'serif', lineHeight: '2.0', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'xcode', quoteBg: '#f7f7f7', letterSpacing: '2px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:36px 0 16px;text-align:center;"><span style="display:block;font-size:11px;color:#b0b0b5;letter-spacing:5px;margin-bottom:8px;">— ${String(n).padStart(2, '0')} —</span><span style="font-size:18px;font-weight:normal;color:#3a3a3c;letter-spacing:4px;">${t}</span></section>`,
        quoteMark: `<span style="color:#b0b0b5;font-size:22px;margin-right:6px;font-family:${fontFamilies.serif};">“</span>`,
        hrDeco: hrLine('· · ·', '#c8c8cc')
      }
    },
    {
      id: 'docs', name: '文档', group: '科技', accent: '#0969da', bg: '#ffffff', textColor: '#1f2328', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', quoteBg: '#f6f8fa', imgRadius: '6px', letterSpacing: '0',
      h1StyleObj: { textAlign: 'left', borderBottom: '1px solid #d8dee4', paddingBottom: '8px', fontSize: '26px' },
      h2StyleObj: { textAlign: 'left', borderBottom: '1px solid #d8dee4', paddingBottom: '6px', color: '#1f2328' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;padding-bottom:6px;border-bottom:1px solid #d8dee4;font-size:19px;font-weight:bold;color:#1f2328;">${t}</section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;font-size:16px;font-weight:bold;color:#1f2328;">${t}</section>`,
        quoteMark: null,
        hrDeco: hrLine('─────────', '#d8dee4')
      }
    }


  ];

  // ============ 来自 styles.refero.design / awesome-design-md 的 20 套真实设计语言 ============
  // 每套提取自一个真实产品的 DESIGN.md 视觉基因，装饰层风格互不相同
  const designs = [
    {
      id: 'linear', name: '线性 Linear', group: '科技', accent: '#5e6ad2', bg: '#0e0f13', textColor: '#e6e7eb', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#191b24', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;"><span style="display:inline-block;font-size:11px;color:#5e6ad2;font-weight:700;letter-spacing:2px;margin-bottom:6px;">${String(n).padStart(2, '0')} /</span><span style="display:block;font-size:19px;font-weight:600;color:#f7f8fa;padding-bottom:9px;border-bottom:1px solid #2a2c38;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;color:#c9ccd8;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#5e6ad2;font-size:18px;font-weight:bold;margin-right:8px;">→</span>`,
        ulMark: `<span style="color:#5e6ad2;">▪</span>`,
        hrDeco: hrLine('━━━━━━━━━━', '#34364a')
      }
    },
    {
      id: 'vercel', name: '边界 Vercel', group: '通用', accent: '#111111', bg: '#ffffff', textColor: '#111111', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', letterSpacing: '-0.5px', imgRadius: '0',
      h1StyleObj: { fontSize: '30px', letterSpacing: '-1.2px', textAlign: 'left', fontWeight: '700' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;padding-top:12px;border-top:1px solid #eaeaea;font-size:18px;font-weight:700;color:#111;letter-spacing:-.4px;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-size:15px;font-weight:600;color:#444;">${t}</section>`,
        quoteMark: `<span style="color:#111;font-size:22px;font-weight:700;margin-right:8px;">“</span>`,
        ulMark: `<span style="color:#111;">—</span>`,
        hrDeco: hrLine('▲ ▲ ▲', '#111')
      }
    },
    {
      id: 'claude', name: '克劳德 Claude', group: '文艺', accent: '#d97757', bg: '#f8f8f6', textColor: '#121212', font: 'serif', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#f0eee9', imgRadius: '6px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 14px;font-family:${fontFamilies.serif};"><span style="font-size:23px;font-weight:700;color:#121212;">${t}</span><span style="display:block;width:34px;height:3px;background:#d97757;margin-top:9px;border-radius:2px;"></span></section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;font-family:${fontFamilies.serif};font-size:17px;font-weight:700;color:#3a3532;">${t}</section>`,
        quoteMark: `<span style="color:#d97757;font-size:18px;margin-right:8px;">✦</span>`,
        hrDeco: hrLine('❧ ───── ❧', '#b9a89b')
      }
    },
    {
      id: 'supabase', name: '翠基 Supabase', group: '科技', accent: '#3ecf8e', bg: '#0f1114', textColor: '#e6e7eb', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#161b1e', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;font-family:${fontFamilies.mono};font-size:17px;font-weight:700;color:#3ecf8e;">// ${t}<span style="display:inline-block;width:8px;height:15px;background:#3ecf8e;vertical-align:-2px;margin-left:6px;opacity:.7;"></span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-family:${fontFamilies.mono};font-size:14px;color:#7dd3a8;">> ${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.mono};font-size:15px;color:#3ecf8e;margin-right:8px;">▍</span>`,
        ulMark: `<span style="color:#3ecf8e;">●</span>`,
        hrDeco: hrLine('─ ─ ─ ─ ─', '#2c3b34', `font-family:${fontFamilies.mono};`)
      }
    },
    {
      id: 'stripe', name: '条纹 Stripe', group: '商务', accent: '#635bff', bg: '#f6f9fc', textColor: '#0a2540', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#eef2f9', imgRadius: '8px',
      h1StyleObj: { fontSize: '27px', textAlign: 'left', letterSpacing: '-.6px' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;font-size:19px;font-weight:700;color:#0a2540;padding-bottom:10px;background:linear-gradient(90deg,#635bff 0%,rgba(99,91,255,0) 100%) bottom/100% 3px no-repeat;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-size:15px;font-weight:700;color:#635bff;">${t}</section>`,
        quoteMark: `<span style="color:#635bff;font-size:26px;line-height:0;vertical-align:-8px;margin-right:6px;">“</span>`,
        ulMark: `<span style="color:#635bff;">◆</span>`,
        hrDeco: hrLine('▬▬▬▬▬▬▬', '#635bff')
      }
    },
    {
      id: 'raycast', name: '射线 Raycast', group: '暗色', accent: '#ff6363', bg: '#161619', textColor: '#eeeef0', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#202024', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;"><span style="display:inline-block;padding:6px 16px;border-radius:9px;background:linear-gradient(120deg,#ff6363,#a56bff);color:#fff;font-weight:700;font-size:16px;">${t}</span></section>`,
        quoteMark: `<span style="font-size:18px;margin-right:8px;">💡</span>`,
        ulMark: `<span style="color:#ff6363;">●</span>`,
        hrDeco: hrLine('● ━━ ● ━━ ●', '#8a5cff')
      }
    },
    {
      id: 'clickhouse', name: '点屋 ClickHouse', group: '生活', accent: '#cc9900', bg: '#fffdf3', textColor: '#1a1a1a', font: 'mono', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 14px;font-family:${fontFamilies.mono};"><span style="display:inline-block;background:#ffe066;color:#1a1a1a;padding:5px 12px;font-weight:700;font-size:16px;border-radius:3px;"># ${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-family:${fontFamilies.mono};font-size:14px;font-weight:700;color:#8a6600;">> ${t}</section>`,
        quoteMark: `<span style="font-size:16px;margin-right:8px;">⚡</span>`,
        ulMark: `<span style="color:#cc9900;">■</span>`,
        hrDeco: hrLine('═ ═ ═ ═ ═', '#d9b84a', `font-family:${fontFamilies.mono};`)
      }
    },
    {
      id: 'mongodb', name: '绿叶 MongoDB', group: '科技', accent: '#13aa52', bg: '#f6fbf7', textColor: '#1f3d2b', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#eaf6ee', imgRadius: '8px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;padding-left:12px;border-left:4px solid #13aa52;font-size:18px;font-weight:700;color:#1f3d2b;">❧ ${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-size:15px;font-weight:700;color:#13aa52;">${t}</section>`,
        quoteMark: `<span style="color:#13aa52;font-size:20px;margin-right:8px;">❧</span>`,
        ulMark: `<span style="color:#13aa52;">▸</span>`,
        hrDeco: hrLine('🍃 ────── 🍃', '#8ecfa5')
      }
    },
    {
      id: 'sanity', name: '理智 Sanity', group: '文艺', accent: '#f03e2f', bg: '#101010', textColor: '#f5f5f5', font: 'serif', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#1c1c1c', imgRadius: '0',
      h1StyleObj: { fontSize: '30px', lineHeight: '1.1', textAlign: 'left', letterSpacing: '-1px' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:32px 0 14px;font-family:${fontFamilies.serif};"><span style="display:block;font-size:11px;color:#f03e2f;letter-spacing:3px;font-family:${fontFamilies.mono};margin-bottom:6px;">SECTION ${String(n).padStart(2, '0')}</span><span style="font-size:24px;font-weight:700;color:#f5f5f5;">${t}</span></section>`,
        quoteMark: `<span style="color:#f03e2f;font-size:30px;line-height:0;vertical-align:-9px;margin-right:8px;">“</span>`,
        ulMark: `<span style="color:#f03e2f;">—</span>`,
        hrDeco: hrLine('▬▬▬ ▪ ▬▬▬', '#f03e2f')
      }
    },
    {
      id: 'sentry', name: '哨兵 Sentry', group: '暗色', accent: '#d32f79', bg: '#1a1420', textColor: '#ece7f0', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#251c2d', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;display:flex;align-items:center;gap:12px;font-size:18px;font-weight:700;color:#f2eaf4;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#d32f79,#7c3aed);color:#fff;font-size:12px;">${n}</span>${t}</section>`,
        quoteMark: `<span style="color:#d32f79;font-size:20px;margin-right:8px;">❞</span>`,
        ulMark: `<span style="color:#d32f79;">✧</span>`,
        hrDeco: hrLine('✧ ━━━ ✧', '#a8447f')
      }
    },
    {
      id: 'runway', name: '跑道 Runway', group: '文艺', accent: '#d4a24c', bg: '#0d0c0a', textColor: '#ece8df', font: 'serif', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'atom-one-dark', dark: true, letterSpacing: '1px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 16px;text-align:center;padding:12px;border-top:1px solid #d4a24c;border-bottom:1px solid #d4a24c;"><span style="font-size:20px;font-weight:700;color:#e8c98a;letter-spacing:3px;font-family:${fontFamilies.serif};">${t}</span></section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;text-align:center;font-size:13px;color:#a08a63;letter-spacing:4px;text-transform:uppercase;">${t}</section>`,
        quoteMark: `<span style="display:block;text-align:center;color:#d4a24c;font-size:28px;font-family:${fontFamilies.serif};">❝</span>`,
        hrDeco: hrLine('◆ ───── ◆', '#a08a63')
      }
    },
    {
      id: 'mistral', name: '紫调 Mistral', group: '文艺', accent: '#7b5cff', bg: '#faf9fd', textColor: '#1a1526', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#f1edff', letterSpacing: '1px',
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;text-align:center;"><span style="display:block;font-size:10px;color:#9c8ae0;letter-spacing:5px;margin-bottom:7px;">— ${String(n).padStart(2, '0')} —</span><span style="font-size:19px;font-weight:600;color:#1a1526;letter-spacing:2px;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#7b5cff;font-weight:600;font-size:15px;letter-spacing:1px;">${t}</section>`,
        quoteMark: `<span style="color:#7b5cff;font-size:20px;margin-right:8px;">“</span>`,
        hrDeco: hrLine('· · ·', '#b9a8ec')
      }
    },
    {
      id: 'ollama', name: '羊驼 Ollama', group: '科技', accent: '#c9c9c9', bg: '#141414', textColor: '#ededed', font: 'mono', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#1e1e1e', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 12px;font-family:${fontFamilies.mono};font-size:16px;font-weight:700;color:#fff;"><span style="color:#6b6b6b;">$ </span>${t}<span style="color:#6b6b6b;"> #</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-family:${fontFamilies.mono};font-size:14px;color:#b8b8b8;">${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.mono};font-size:14px;color:#8a8a8a;margin-right:8px;">&gt;</span>`,
        ulMark: `<span style="color:#c9c9c9;">-</span>`,
        hrDeco: hrLine('─────────', '#4a4a4a', `font-family:${fontFamilies.mono};`)
      }
    },

    {
      id: 'xai', name: '未来 xAI', group: '通用', accent: '#ffffff', bg: '#000000', textColor: '#e9e9e9', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'atom-one-dark', dark: true, letterSpacing: '-0.3px',
      h1StyleObj: { fontSize: '30px', fontWeight: '700', letterSpacing: '-1.2px', textAlign: 'left' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 14px;"><span style="display:block;height:4px;width:46px;background:#fff;margin-bottom:10px;"></span><span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:-.5px;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;font-size:15px;font-weight:600;color:#b8b8b8;">${t}</section>`,
        quoteMark: `<span style="display:block;text-align:center;color:#fff;font-size:24px;">“</span>`,
        ulMark: `<span style="color:#fff;">—</span>`,
        hrDeco: hrLine('▬▬▬▬▬▬▬', '#666')
      }
    },
    {
      id: 'medium', name: 'Medium 奶油', group: '文艺', accent: '#1a1a1a', bg: '#fffdf8', textColor: '#242424', font: 'serif', h1Style: 'serifBig', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', quoteBg: '#faf7ef', imgRadius: '2px', letterSpacing: '0.3px', lineHeight: '1.9',
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 14px;font-family:${fontFamilies.serif};font-size:21px;font-weight:700;color:#242424;line-height:1.3;">${t}</section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;font-family:${fontFamilies.serif};font-size:17px;font-weight:700;color:#242424;">${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.serif};font-size:40px;line-height:0;vertical-align:-14px;margin-right:8px;color:#242424;">“</span>`,
        hrDeco: hrLine('· · ·', '#bbb')
      }
    },
    {
      id: 'lamborghini', name: '狂牛 Lamborghini', group: '暗色', accent: '#d7e300', bg: '#080808', textColor: '#f2f2f2', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, letterSpacing: '0',
      h1StyleObj: { fontSize: '28px', fontWeight: '800', textAlign: 'left', fontStyle: 'italic' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;"><span style="display:inline-block;padding:7px 18px 7px 12px;background:#d7e300;color:#080808;font-weight:800;font-style:italic;font-size:16px;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%);">${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#d7e300;font-weight:700;font-size:15px;font-style:italic;">${t}</section>`,
        quoteMark: `<span style="color:#d7e300;font-size:20px;font-weight:bold;margin-right:8px;">“</span>`,
        ulMark: `<span style="color:#d7e300;">▰</span>`,
        hrDeco: hrLine('▰▰▰▰▰▰', '#d7e300')
      }
    },
    {
      id: 'superhuman', name: '超人 Superhuman', group: '暗色', accent: '#f5a623', bg: '#12100e', textColor: '#f4efe8', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#1e1a15', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;font-size:19px;font-weight:700;color:#f6ead6;padding-bottom:10px;background:linear-gradient(90deg,#f5a623 0%,rgba(245,166,35,0) 100%) bottom/100% 2px no-repeat;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#f5a623;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#f5a623;font-size:24px;margin-right:8px;">“</span>`,
        ulMark: `<span style="color:#f5a623;">✦</span>`,
        hrDeco: hrLine('✦ ━━━ ✦', '#c68a2e')
      }
    },
    {
      id: 'vivid', name: '棱镜 Vivid', group: '暗色', accent: '#a855f7', bg: '#0a0710', textColor: '#eee9f5', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#171025', imgRadius: '12px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;text-align:center;"><span style="font-size:19px;font-weight:800;background:linear-gradient(90deg,#f472b6,#a855f7,#38bdf8);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#a855f7;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#67e8f9;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="font-size:18px;margin-right:8px;">🌈</span>`,
        ulMark: `<span style="color:#c084fc;">✦</span>`,
        hrDeco: hrLine('✦ ━━ ✦ ━━ ✦', '#8b5cf6')
      }
    },
    {
      id: 'factory', name: '战情室 Factory', group: '科技', accent: '#60a5fa', bg: '#0a0e14', textColor: '#dbe4f0', font: 'mono', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#111823', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:24px 0 14px;font-family:${fontFamilies.mono};font-size:16px;font-weight:700;color:#60a5fa;">[ ${t} ]<span style="color:#334155;"> ─────────</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-family:${fontFamilies.mono};font-size:14px;color:#93c5fd;">> ${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.mono};font-size:12px;color:#60a5fa;margin-right:8px;">[!]</span>`,
        ulMark: `<span style="font-family:${fontFamilies.mono};color:#60a5fa;">+</span>`,
        hrDeco: hrLine('[ ───────── ]', '#334155', `font-family:${fontFamilies.mono};`)
      }
    }
  ];

  // ============ 补充 10 套现代简约 / 科技感主题（替换偏生活化主题）============
  // 来源：Notion / GitHub / Apple / shadcn/ui / Figma / Tailwind / Mintlify / Framer / Linear Light / Cursor
  const moderns = [
    {
      id: 'notion', name: '笔记 Notion', group: '通用', accent: '#2383e2', bg: '#ffffff', textColor: '#37352f', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', quoteBg: '#f7f6f3', imgRadius: '4px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 12px;font-size:19px;font-weight:700;color:#37352f;line-height:1.3;">${t}</section>`,
        quoteMark: `<span style="color:#2383e2;font-size:18px;margin-right:8px;">💡</span>`,
        ulMark: `<span style="color:#2383e2;">•</span>`,
        hrDeco: hrLine('─────────', '#e0e0df')
      }
    },
    {
      id: 'github', name: '代码 GitHub', group: '科技', accent: '#0969da', bg: '#ffffff', textColor: '#1f2328', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'github-light', quoteBg: '#f6f8fa', imgRadius: '6px', letterSpacing: '0',
      h1StyleObj: { fontSize: '26px', textAlign: 'left', borderBottom: '1px solid #d8dee4', paddingBottom: '8px' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;padding-bottom:6px;border-bottom:1px solid #d8dee4;font-size:19px;font-weight:600;color:#1f2328;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-size:16px;font-weight:600;color:#1f2328;">${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.mono};font-size:14px;color:#0969da;margin-right:8px;">&gt;</span>`,
        ulMark: `<span style="color:#0969da;">●</span>`,
        hrDeco: hrLine('─────────', '#d8dee4', `font-family:${fontFamilies.mono};`)
      }
    },
    {
      id: 'apple', name: '留白 Apple', group: '通用', accent: '#0071e3', bg: '#fbfbfd', textColor: '#1d1d1f', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'github-light', letterSpacing: '-0.01em', lineHeight: '1.85', imgRadius: '12px',
      h1StyleObj: { fontSize: '30px', fontWeight: '700', letterSpacing: '-.02em', textAlign: 'left' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:34px 0 14px;font-size:23px;font-weight:700;color:#1d1d1f;letter-spacing:-.01em;line-height:1.25;">${t}</section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;font-size:17px;font-weight:600;color:#1d1d1f;">${t}</section>`,
        quoteMark: `<span style="display:block;text-align:center;color:#86868b;font-size:22px;">“</span>`,
        hrDeco: hrLine('· · ·', '#c7c7cc')
      }
    },
    {
      id: 'shadcn', name: '黑白 shadcn', group: '通用', accent: '#18181b', bg: '#fafafa', textColor: '#18181b', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#f4f4f5', imgRadius: '6px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 12px;font-size:18px;font-weight:600;color:#18181b;letter-spacing:-.01em;">${t}<span style="display:block;width:28px;height:2px;background:#18181b;margin-top:8px;"></span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;font-size:15px;font-weight:600;color:#3f3f46;">${t}</section>`,
        quoteMark: `<span style="color:#18181b;font-size:18px;margin-right:8px;">“</span>`,
        ulMark: `<span style="color:#18181b;">—</span>`,
        hrDeco: hrLine('───────────', '#d4d4d8')
      }
    },
    {
      id: 'figma', name: '设计 Figma', group: '暗色', accent: '#a259ff', bg: '#1c1c1e', textColor: '#f0f0f2', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#252527', imgRadius: '8px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;font-size:18px;font-weight:700;color:#f0f0f2;padding-left:12px;border-left:3px solid #a259ff;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#b47aff;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#a259ff;font-size:20px;margin-right:8px;">✦</span>`,
        ulMark: `<span style="color:#a259ff;">●</span>`,
        hrDeco: hrLine('● ━━ ●', '#7c4dcc')
      }
    },
    {
      id: 'tailwind', name: '青蓝 Tailwind', group: '科技', accent: '#0891b2', bg: '#f8fafc', textColor: '#0f172a', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#ecfeff', imgRadius: '8px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;font-size:18px;font-weight:700;color:#0e7490;background:#ecfeff;border-radius:8px;padding:9px 14px;border-left:4px solid #0891b2;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#0891b2;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#0891b2;font-size:18px;margin-right:8px;">❯</span>`,
        ulMark: `<span style="color:#0891b2;">◆</span>`,
        hrDeco: hrLine('━━━━━━━━━━', '#67e8f9')
      }
    },
    {
      id: 'mintlify', name: '文档 Mintlify', group: '科技', accent: '#16a34a', bg: '#ffffff', textColor: '#1a1a1a', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#f0fdf4', imgRadius: '8px', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;font-size:19px;font-weight:700;color:#1a1a1a;padding-top:12px;border-top:1px solid #e5e7eb;">${t}</section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#16a34a;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#16a34a;font-size:18px;margin-right:8px;">✦</span>`,
        ulMark: `<span style="color:#16a34a;">▸</span>`,
        hrDeco: hrLine('──────────', '#d1fae5')
      }
    },
    {
      id: 'framer', name: '动感 Framer', group: '暗色', accent: '#0055ff', bg: '#0a0a0a', textColor: '#ffffff', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'none', codeTheme: 'atom-one-dark', dark: true, letterSpacing: '-0.02em',
      h1StyleObj: { fontSize: '34px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-.03em', textAlign: 'left' },
      decor: {
        h2Deco: (t, n) => `<section style="margin:30px 0 14px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.15;">${t}<span style="color:#0055ff;">.</span></section>`,
        h3Deco: t => `<section style="margin:18px 0 10px;color:#8ab4ff;font-weight:600;font-size:16px;">${t}</section>`,
        quoteMark: `<span style="display:block;text-align:center;color:#0055ff;font-size:30px;font-weight:800;">“</span>`,
        ulMark: `<span style="color:#0055ff;">▰</span>`,
        hrDeco: hrLine('▬▬▬▬▬▬', '#0055ff')
      }
    },
    {
      id: 'linearlight', name: '线性浅色', group: '通用', accent: '#5e6ad2', bg: '#ffffff', textColor: '#282a35', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'card', codeTheme: 'github-light', quoteBg: '#f7f7fb', imgRadius: '8px', letterSpacing: '-0.01em',
      decor: {
        h2Deco: (t, n) => `<section style="margin:28px 0 14px;"><span style="font-size:11px;color:#5e6ad2;font-weight:700;letter-spacing:1.5px;">${String(n).padStart(2, '0')}</span><span style="display:block;font-size:19px;font-weight:700;color:#282a35;margin-top:4px;padding-bottom:9px;border-bottom:1px solid #ececf2;">${t}</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#4c5675;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="color:#5e6ad2;font-size:18px;font-weight:700;margin-right:8px;">→</span>`,
        ulMark: `<span style="color:#5e6ad2;">▪</span>`,
        hrDeco: hrLine('━━━━━━━━━━', '#e2e2ee')
      }
    },
    {
      id: 'cursor', name: '编辑器 Cursor', group: '科技', accent: '#e5e5e5', bg: '#18181b', textColor: '#d4d4d8', font: 'sans', h1Style: 'plain', h2Style: 'plain', quoteStyle: 'default', codeTheme: 'atom-one-dark', dark: true, quoteBg: '#212124', letterSpacing: '0',
      decor: {
        h2Deco: (t, n) => `<section style="margin:26px 0 14px;font-size:18px;font-weight:600;color:#f4f4f5;font-family:${fontFamilies.mono};">${t}<span style="color:#6b7280;"> #</span></section>`,
        h3Deco: t => `<section style="margin:16px 0 10px;color:#a1a1aa;font-weight:600;font-size:15px;">${t}</section>`,
        quoteMark: `<span style="font-family:${fontFamilies.mono};font-size:13px;color:#a1a1aa;margin-right:8px;">//</span>`,
        ulMark: `<span style="color:#d4d4d8;">◆</span>`,
        hrDeco: hrLine('───────────', '#3f3f46', `font-family:${fontFamilies.mono};`)
      }
    }
  ];

  const allConfigs = kept.concat(added).concat(designs).concat(moderns);

  // 风格倾向标记：special = 特殊吸睛版式；其余为现代简约 / 科技感
  const specialIds = ['noirgold', 'dracula', 'festival', 'inkwash', 'news', 'timeline', 'neon', 'lamborghini', 'vivid', 'runway', 'sanity', 'sentry'];
  allConfigs.forEach(c => { c.style = specialIds.indexOf(c.id) >= 0 ? 'special' : 'modern'; });

  // 统一管理：所有主题平铺，不再区分「经典 / 新增」
  const builtinThemes = allConfigs.map(c => ({ id: c.id, name: c.name, group: c.group, style: c.style, builtin: true, config: c }));

  const groups = ['全部', '通用', '文艺', '商务', '生活', '科技', '暗色'];
  const builtinConfigs = allConfigs;

  // 编辑样式表单的可选项（中文 label，兼容原项目编辑器）
  const options = {
    fontSize: ['14px', '15px', '16px', '17px', '18px'],
    lineHeight: ['1.5', '1.6', '1.75', '1.8', '2.0'],
    font: [{ value: 'sans', label: '无衬线（系统）' }, { value: 'serif', label: '衬线 / 宋体' }, { value: 'kai', label: '楷体' }, { value: 'mono', label: '等宽' }],
    h1Style: [{ value: 'plain', label: '居中纯文字' }, { value: 'block', label: '色块' }, { value: 'leftborder', label: '左边框' }, { value: 'underline', label: '下划线' }, { value: 'outline', label: '描边框' }, { value: 'gradient', label: '渐变色块' }, { value: 'serifBig', label: '大号衬线' }],
    h2Style: [{ value: 'underline', label: '下划线' }, { value: 'leftborder', label: '左边框' }, { value: 'number', label: '数字序号' }, { value: 'block', label: '色块' }, { value: 'gradientbar', label: '渐变下划线' }, { value: 'plain', label: '纯文字' }, { value: 'center', label: '居中' }],
    codeTheme: [{ value: 'atom-one-dark', label: 'Atom One Dark' }, { value: 'github-light', label: 'GitHub Light' }, { value: 'monokai', label: 'Monokai' }, { value: 'xcode', label: 'Xcode（浅色）' }, { value: 'dracula', label: 'Dracula' }],
    quoteStyle: [{ value: 'default', label: '左边框 + 底色' }, { value: 'card', label: '圆角卡片' }, { value: 'mark', label: '引号装饰' }, { value: 'ticket', label: '虚线票据' }, { value: 'none', label: '无装饰' }],
    imgRadius: ['0', '4px', '8px', '12px', '18px']
  };

  window.THEMES = { buildTheme, builtinThemes, builtinConfigs, codeThemes, groups, fontFamilies, hexToRgba, options };
})();
