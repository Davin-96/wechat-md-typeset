const fs = require('fs');
const path = require('path');

function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}
function uid(prefix) {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 6);
}

class Store {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
    this.articlesDir = path.join(dir, '文章');
    fs.mkdirSync(this.articlesDir, { recursive: true });
    this.themesFile = path.join(dir, '主题.json');
    this.settingsFile = path.join(dir, '设置.json');
    this.topicsFile = path.join(dir, '选题.json');
  }

  listArticles() {
    const files = fs.readdirSync(this.articlesDir).filter(f => f.endsWith('.json'));
    const arr = files.map(f => readJSON(path.join(this.articlesDir, f), null)).filter(Boolean);
    arr.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return arr;
  }
  getArticle(id) {
    return readJSON(path.join(this.articlesDir, id + '.json'), null);
  }
  saveArticle(article) {
    if (!article.id) article.id = uid('a');
    article.updatedAt = Date.now();
    if (!article.createdAt) article.createdAt = article.updatedAt;
    writeJSON(path.join(this.articlesDir, article.id + '.json'), article);
    return article;
  }
  deleteArticle(id) {
    const f = path.join(this.articlesDir, id + '.json');
    if (fs.existsSync(f)) fs.unlinkSync(f);
    return true;
  }

  getThemes() { return readJSON(this.themesFile, []); }
  saveTheme(theme) {
    if (!theme.id) theme.id = uid('t');
    const arr = this.getThemes();
    const i = arr.findIndex(t => t.id === theme.id);
    if (i >= 0) arr[i] = theme; else arr.push(theme);
    writeJSON(this.themesFile, arr);
    return theme;
  }
  deleteTheme(id) {
    writeJSON(this.themesFile, this.getThemes().filter(t => t.id !== id));
    return true;
  }

  // ===== 选题工作台 =====
  getTopics() { return readJSON(this.topicsFile, []); }
  saveTopic(topic) {
    if (!topic.id) topic.id = uid('p');
    topic.updatedAt = Date.now();
    if (!topic.createdAt) topic.createdAt = topic.updatedAt;
    const arr = this.getTopics();
    const i = arr.findIndex(t => t.id === topic.id);
    if (i >= 0) arr[i] = topic; else arr.unshift(topic);
    writeJSON(this.topicsFile, arr);
    return topic;
  }
  deleteTopic(id) {
    writeJSON(this.topicsFile, this.getTopics().filter(t => t.id !== id));
    return true;
  }
  saveTopics(topics) { writeJSON(this.topicsFile, topics); return topics; }

  getSettings() {
    return Object.assign({
      imageHost: 'catbox',
      smmsToken: '',
      imgbbKey: '',
      customApiUrl: '',
      customFileField: 'file',
      customTokenHeader: 'Authorization',
      customToken: '',
      customResponsePath: 'data.url',
      customExtraFields: '',
      autoSave: true,
      defaultThemeId: 'moyu',
      appTitle: '选题排版工作台'
    }, readJSON(this.settingsFile, {}));
  }
  saveSettings(s) { writeJSON(this.settingsFile, s); return s; }
}

module.exports = Store;