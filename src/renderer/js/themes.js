(function () {
  const fontFamilies = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: 'Georgia, "Songti SC", "SimSun", serif',
    kai: '"Kaiti SC", "KaiTi", "STKaiti", serif'
  };

  const codeThemes = {
    'atom-one-dark': { background: '#282c34', default: '#abb2bf', keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66', function: '#61afef', title: '#e5c07b', built_in: '#e6c07b', literal: '#56b6c2', attr: '#d19a66', variable: '#e06c75', tag: '#e06c75', name: '#e06c75', type: '#e5c07b', params: '#abb2bf', symbol: '#56b6c2', meta: '#61afef', regexp: '#98c379', link: '#56b6c2', 'selector-tag': '#e06c75', 'selector-class': '#e5c07b', 'selector-id': '#61afef', emphasis: '#c678dd', strong: '#e5c07b' },
    'github-light': { background: '#f6f8fa', default: '#24292e', keyword: '#d73a49', string: '#032f62', comment: '#6a737d', number: '#005cc5', function: '#6f42c1', title: '#6f42c1', built_in: '#005cc5', literal: '#005cc5', attr: '#005cc5', variable: '#e36209', tag: '#22863a', name: '#22863a', type: '#d73a49', params: '#24292e', symbol: '#005cc5', meta: '#6a737d', regexp: '#032f62', link: '#005cc5' },
    'monokai': { background: '#272822', default: '#f8f8f2', keyword: '#f92672', string: '#e6db74', comment: '#75715e', number: '#ae81ff', function: '#a6e22e', title: '#a6e22e', built_in: '#a6e22e', literal: '#ae81ff', attr: '#a6e22e', variable: '#f8f8f2', tag: '#f92672', name: '#a6e22e', type: '#66d9ef', params: '#f8f8f2', symbol: '#ae81ff', meta: '#75715e', regexp: '#e6db74', link: '#ae81ff' },
    'xcode': { background: '#ffffff', default: '#000000', keyword: '#a90d91', string: '#c41a16', comment: '#007400', number: '#1c00cf', function: '#3e6a75', title: '#3e6a75', built_in: '#a90d91', literal: '#a90d91', attr: '#a90d91', variable: '#3e6a75', tag: '#a90d91', name: '#3e6a75', type: '#a90d91', params: '#000000', symbol: '#1c00cf', meta: '#643820', regexp: '#c41a16', link: '#007400' },
    'dracula': { background: '#282a36', default: '#f8f8f2', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', number: '#bd93f9', function: '#50fa7b', title: '#50fa7b', built_in: '#8be9fd', literal: '#bd93f9', attr: '#50fa7b', variable: '#f8f8f2', tag: '#ff79c6', name: '#f8f8f2', type: '#8be9fd', params: '#f8f8f2', symbol: '#8be9fd', meta: '#ffb86c', regexp: '#f1fa8c', link: '#8be9fd', 'selector-tag': '#ff79c6', 'selector-class': '#50fa7b', 'selector-id': '#8be9fd', emphasis: '#ff79c6', strong: '#f1fa8c' }
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
    return '#' + [mix(parseInt(h.slice(0, 2), 16)), mix(parseInt(h.slice(2, 4), 16)), mix(parseInt(h.slice(4, 6), 16))]
      .map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function h1Style(style, accent, textColor) {
    const base = { margin: '24px 0 16px', lineHeight: '1.4', fontWeight: 'bold' };
    switch (style) {
      case 'block': return Object.assign(base, { fontSize: '22px', color: '#fff', backgroundColor: accent, padding: '10px 16px', borderRadius: '6px', textAlign: 'center' });
      case 'underline': return Object.assign(base, { fontSize: '24px', color: accent, borderBottom: '3px solid ' + accent, padding: '6px 0' });
      case 'leftborder': return Object.assign(base, { fontSize: '22px', color: textColor, borderLeft: '5px solid ' + accent, paddingLeft: '12px' });
      case 'gradient': return Object.assign(base, { fontSize: '22px', color: '#fff', textAlign: 'center', padding: '10px 24px', borderRadius: '8px', backgroundColor: accent, backgroundImage: 'linear-gradient(135deg, ' + accent + ' 0%, ' + shadeHex(accent, 0.4) + ' 100%)', boxShadow: '0 4px 12px ' + hexToRgba(accent, 0.3) });
      case 'outline': return Object.assign(base, { fontSize: '22px', color: textColor, textAlign: 'center', border: '2px solid ' + accent, borderRadius: '8px', padding: '10px 16px', letterSpacing: '1px' });
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
    const imgRadius = c.imgRadius || '8px';
    const ct = codeThemes[c.codeTheme] || codeThemes['atom-one-dark'];
    const dark = !!c.dark;
    const subText = dark ? '#b9bcc9' : '#555555';
    const emColor = dark ? '#b0b3c2' : '#666666';
    const delColor = dark ? '#8288a0' : '#999999';
    const borderColor = dark ? '#565b74' : '#dddddd';
    const hrColor = dark ? '#565b74' : '#cccccc';
    const container = {
      backgroundColor: c.bg || '#ffffff', color: textColor, fontSize: fontSize, lineHeight: lineHeight,
      fontFamily: font, letterSpacing: '0.5px', padding: '20px', overflowWrap: 'break-word'
    };
    if (c.bgImage) {
      container.backgroundImage = 'url(' + c.bgImage + ')';
      container.backgroundSize = 'cover';
      container.backgroundPosition = 'center';
    }
    let blockquote, quoteMark = false;
    if (c.quoteStyle === 'card') {
      blockquote = { backgroundColor: quoteBg, color: subText, padding: '14px 16px', margin: '14px 0', borderRadius: '10px', boxShadow: '0 2px 10px ' + hexToRgba(accent, 0.08) };
    } else if (c.quoteStyle === 'mark') {
      blockquote = { color: subText, padding: '6px 4px 6px 14px', margin: '14px 0' };
      quoteMark = true;
    } else if (c.quoteStyle === 'ticket') {
      blockquote = { border: '1px dashed ' + accent, backgroundColor: quoteBg, color: subText, padding: '12px 14px', margin: '14px 0', borderRadius: '6px' };
    } else {
      blockquote = { borderLeft: '4px solid ' + accent, backgroundColor: quoteBg, color: subText, padding: '10px 14px', margin: '14px 0', borderRadius: '0 6px 6px 0' };
    }
    return {
      container: container,
      accent: accent,
      h2Number: c.h2Style === 'number',
      quoteMark: quoteMark,
      h1: h1Style(c.h1Style, accent, textColor),
      h2: h2Style(c.h2Style, accent, textColor),
      h3: { fontSize: '18px', color: textColor, fontWeight: 'bold', borderLeft: '3px solid ' + accent, paddingLeft: '10px', margin: '18px 0 12px', lineHeight: '1.4' },
      h4: { fontSize: '16px', color: textColor, fontWeight: 'bold', margin: '16px 0 10px', lineHeight: '1.4' },
      h5: { fontSize: '15px', color: textColor, fontWeight: 'bold', margin: '14px 0 10px' },
      h6: { fontSize: '14px', color: dark ? '#9aa0b2' : '#888888', fontWeight: 'bold', margin: '14px 0 10px' },
      p: { margin: '12px 0', lineHeight: lineHeight, color: textColor, fontSize: fontSize },
      blockquote: blockquote,
      code_inline: { backgroundColor: hexToRgba(accent, 0.1), color: accent, padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em', fontFamily: 'Consolas, Monaco, "Courier New", monospace' },
      pre: { backgroundColor: ct.background, borderRadius: '8px', padding: '14px', margin: '14px 0', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: ct.default, fontSize: '14px', lineHeight: '1.6', fontFamily: 'Consolas, Monaco, "Courier New", monospace' },
      code_block: { color: ct.default, fontSize: '14px', fontFamily: 'Consolas, Monaco, "Courier New", monospace', lineHeight: '1.6', backgroundColor: 'transparent', padding: '0', whiteSpace: 'pre-wrap', wordWrap: 'break-word' },
      ul: { margin: '12px 0', paddingLeft: '24px' },
      ol: { margin: '12px 0', paddingLeft: '24px' },
      li: { margin: '6px 0', lineHeight: lineHeight, color: textColor },
      table: { borderCollapse: 'collapse', width: '100%', margin: '14px 0', fontSize: '15px' },
      th: { backgroundColor: thColor, color: '#fff', padding: '8px 12px', border: '1px solid ' + thColor, fontWeight: 'bold', textAlign: 'left' },
      td: { padding: '8px 12px', border: '1px solid ' + borderColor, color: textColor },
      img: { maxWidth: '100%', borderRadius: imgRadius, margin: '12px auto', display: 'block' },
      a: { color: accent, borderBottom: '1px solid ' + accent, textDecoration: 'none' },
      hr: { border: 'none', borderTop: '1px dashed ' + hrColor, margin: '24px 0' },
      strong: { color: accent, fontWeight: 'bold' },
      em: { color: emColor, fontStyle: 'italic' },
      del: { color: delColor },
      codeTheme: c.codeTheme || 'atom-one-dark'
    };
  }

  const builtinConfigs = [
    { id: 'moyu', name: '摸鱼绿', accent: '#4caf50', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'block', h2Style: 'underline', codeTheme: 'atom-one-dark', quoteBg: '#f1f8e9', quoteStyle: 'default' },
    { id: 'deepsea', name: '深海蓝', accent: '#2196f3', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'underline', h2Style: 'leftborder', codeTheme: 'atom-one-dark', quoteBg: '#e3f2fd', quoteStyle: 'default' },
    { id: 'orange', name: '活力橙', accent: '#ff9800', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'block', h2Style: 'block', codeTheme: 'monokai', quoteBg: '#fff3e0', quoteStyle: 'default' },
    { id: 'redfei', name: '红绯', accent: '#e91e63', bg: '#ffffff', textColor: '#3f3f3f', font: 'sans', h1Style: 'leftborder', h2Style: 'underline', codeTheme: 'github-light', quoteBg: '#fce4ec', quoteStyle: 'default' },
    { id: 'graphite', name: '石墨极简', accent: '#48484c', bg: '#f6f6f7', textColor: '#2d2d30', font: 'sans', h1Style: 'plain', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#ececee', quoteStyle: 'default', imgRadius: '4px', thColor: '#3a3a3c' },
    { id: 'zen', name: '禅意留白', accent: '#8a8a86', bg: '#fdfdfc', textColor: '#2b2b2a', font: 'kai', lineHeight: '2.0', h1Style: 'plain', h2Style: 'plain', codeTheme: 'github-light', quoteStyle: 'mark', imgRadius: '12px' },
    { id: 'ftpaper', name: '金融时报', accent: '#990f3d', bg: '#fff1e5', textColor: '#33302e', font: 'serif', h1Style: 'leftborder', h2Style: 'underline', codeTheme: 'github-light', quoteBg: '#ffe3d2', quoteStyle: 'card', thColor: '#990f3d' },
    { id: 'olive', name: '橄榄手记', accent: '#6b7a3f', bg: '#f5f4ec', textColor: '#33352c', font: 'sans', h1Style: 'underline', h2Style: 'leftborder', codeTheme: 'github-light', quoteBg: '#e9e8d8', quoteStyle: 'default' },
    { id: 'ticket', name: '摸鱼票据', accent: '#3aa0b5', bg: '#fdfeff', textColor: '#2e3d42', font: 'sans', h1Style: 'block', h2Style: 'leftborder', codeTheme: 'github-light', quoteBg: '#eef7fa', quoteStyle: 'ticket' },
    { id: 'academia', name: '靛蓝学院', accent: '#3f51b5', bg: '#fbfaff', textColor: '#2c2c3a', font: 'serif', h1Style: 'outline', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#eceefb', quoteStyle: 'default', thColor: '#3f51b5' },
    { id: 'sakura', name: '樱花粉', accent: '#d46a7e', bg: '#fdf2f4', textColor: '#43323a', font: 'serif', h1Style: 'underline', h2Style: 'plain', codeTheme: 'github-light', quoteBg: '#fbe4ea', quoteStyle: 'card', imgRadius: '12px' },
    { id: 'cream', name: '奶油编辑部', accent: '#0e9e88', bg: '#faf7f5', textColor: '#291334', font: 'serif', lineHeight: '1.8', h1Style: 'underline', h2Style: 'number', codeTheme: 'github-light', quoteStyle: 'mark' },
    { id: 'amber', name: '琥珀遗产', accent: '#b26400', bg: '#ece3ca', textColor: '#793205', font: 'serif', lineHeight: '1.8', h1Style: 'outline', h2Style: 'gradientbar', codeTheme: 'github-light', quoteBg: '#e4d8b4', quoteStyle: 'card' },
    { id: 'bonehot', name: '骨白热色', accent: '#e4006e', bg: '#f7f6f3', textColor: '#100f0f', font: 'sans', h1Style: 'outline', h2Style: 'underline', codeTheme: 'github-light', imgRadius: '0', thColor: '#100f0f', quoteStyle: 'mark' },
    { id: 'luxforest', name: '静奢森林', accent: '#4a6b54', bg: '#f4f1ea', textColor: '#26291f', font: 'serif', lineHeight: '1.8', h1Style: 'leftborder', h2Style: 'number', codeTheme: 'github-light', quoteBg: '#e7e4d8', quoteStyle: 'card' },
    { id: 'emerald', name: '翠意', accent: '#0b8a5c', bg: '#f7fbf8', textColor: '#333c4d', font: 'sans', h1Style: 'leftborder', h2Style: 'gradientbar', codeTheme: 'github-light', quoteBg: '#e3f5eb', quoteStyle: 'card' },
    { id: 'synthwave', name: '合成波', accent: '#f861b4', bg: '#09002f', textColor: '#a1b1ff', font: 'sans', h1Style: 'gradient', h2Style: 'gradientbar', codeTheme: 'atom-one-dark', quoteBg: '#120b3d', thColor: '#422ad5', quoteStyle: 'mark', dark: true },
    { id: 'cyberblue', name: '赛博蓝', accent: '#22d3ee', bg: '#0a102a', textColor: '#c7d2fe', font: 'sans', h1Style: 'gradient', h2Style: 'plain', codeTheme: 'atom-one-dark', quoteBg: '#111a3f', thColor: '#1e2a6e', quoteStyle: 'default', dark: true },
    { id: 'noirgold', name: '黑金', accent: '#d4af37', bg: '#141414', textColor: '#eae6da', font: 'serif', h1Style: 'outline', h2Style: 'gradientbar', codeTheme: 'atom-one-dark', quoteBg: '#232323', thColor: '#2a2a2a', quoteStyle: 'card', dark: true },
    { id: 'dracula', name: '暗夜公爵', accent: '#bd93f9', bg: '#232530', textColor: '#f8f8f3', font: 'sans', h1Style: 'gradient', h2Style: 'number', codeTheme: 'dracula', quoteBg: '#343746', thColor: '#414558', quoteStyle: 'card', dark: true }
  ];

  const builtinThemes = builtinConfigs.map(c => ({ id: c.id, name: c.name, builtin: true, config: c }));

  const options = {
    font: [{ value: 'sans', label: '无衬线（默认）' }, { value: 'serif', label: '衬线 / 宋体' }, { value: 'kai', label: '楷体' }],
    h1Style: [{ value: 'block', label: '色块' }, { value: 'gradient', label: '渐变色块' }, { value: 'underline', label: '下划线' }, { value: 'leftborder', label: '左边框' }, { value: 'outline', label: '描边框' }, { value: 'plain', label: '居中纯文字' }],
    h2Style: [{ value: 'underline', label: '下划线' }, { value: 'number', label: '数字序号' }, { value: 'gradientbar', label: '渐变下划线' }, { value: 'block', label: '色块' }, { value: 'leftborder', label: '左边框' }, { value: 'plain', label: '纯文字' }],
    quoteStyle: [{ value: 'default', label: '左边框 + 底色' }, { value: 'card', label: '圆角卡片' }, { value: 'mark', label: '引号装饰' }, { value: 'ticket', label: '虚线票据' }],
    codeTheme: [{ value: 'atom-one-dark', label: 'Atom One Dark' }, { value: 'github-light', label: 'GitHub Light' }, { value: 'monokai', label: 'Monokai' }, { value: 'xcode', label: 'Xcode（浅色）' }, { value: 'dracula', label: 'Dracula' }],
    fontSize: ['14px', '15px', '16px', '17px', '18px'],
    lineHeight: ['1.5', '1.6', '1.75', '1.8', '2.0'],
    imgRadius: ['0', '4px', '8px', '12px']
  };

  window.THEMES = { buildTheme, builtinThemes, builtinConfigs, codeThemes, options };
})();