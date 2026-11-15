const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listArticles: () => ipcRenderer.invoke('store:listArticles'),
  getArticle: (id) => ipcRenderer.invoke('store:getArticle', id),
  saveArticle: (a) => ipcRenderer.invoke('store:saveArticle', a),
  deleteArticle: (id) => ipcRenderer.invoke('store:deleteArticle', id),
  getThemes: () => ipcRenderer.invoke('store:getThemes'),
  saveTheme: (t) => ipcRenderer.invoke('store:saveTheme', t),
  deleteTheme: (id) => ipcRenderer.invoke('store:deleteTheme', id),
  getImages: () => ipcRenderer.invoke('store:getImages'),
  saveImage: (img) => ipcRenderer.invoke('store:saveImage', img),
  deleteImage: (id) => ipcRenderer.invoke('store:deleteImage', id),
  getSettings: () => ipcRenderer.invoke('store:getSettings'),
  saveSettings: (s) => ipcRenderer.invoke('store:saveSettings', s),
  writeClipboardHTML: (html, text) => ipcRenderer.invoke('clipboard:writeHTML', html, text),
  saveHTMLFile: (html, defaultName) => ipcRenderer.invoke('dialog:saveHTML', html, defaultName),
  uploadImage: (buffer, filename) => ipcRenderer.invoke('image:upload', buffer, filename),
  getDataDir: () => ipcRenderer.invoke('app:dataDir')
});