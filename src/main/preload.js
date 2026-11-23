const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listArticles: () => ipcRenderer.invoke('store:listArticles'),
  getArticle: (id) => ipcRenderer.invoke('store:getArticle', id),
  saveArticle: (a) => ipcRenderer.invoke('store:saveArticle', a),
  deleteArticle: (id) => ipcRenderer.invoke('store:deleteArticle', id),
  getThemes: () => ipcRenderer.invoke('store:getThemes'),
  saveTheme: (t) => ipcRenderer.invoke('store:saveTheme', t),
  deleteTheme: (id) => ipcRenderer.invoke('store:deleteTheme', id),
  getTopics: () => ipcRenderer.invoke('store:getTopics'),
  saveTopic: (t) => ipcRenderer.invoke('store:saveTopic', t),
  deleteTopic: (id) => ipcRenderer.invoke('store:deleteTopic', id),
  saveTopics: (arr) => ipcRenderer.invoke('store:saveTopics', arr),
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (s) => ipcRenderer.invoke('store:saveSettings', s),
  writeClipboardHTML: (html, text) => ipcRenderer.invoke('clipboard:writeHTML', html, text),
  saveHTMLFile: (html, defaultName) => ipcRenderer.invoke('dialog:saveHTML', html, defaultName),
  setTitle: (title) => ipcRenderer.invoke('app:setTitle', title),
  getDataDir: () => ipcRenderer.invoke('app:dataDir')
});