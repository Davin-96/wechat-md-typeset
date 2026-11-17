const { app, BrowserWindow, ipcMain, clipboard, dialog, Menu, ClipboardItem } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('./store');
const { uploadImage } = require('./image-upload');

// 开发验证专用：仅在设置 WB_DEBUG 环境变量时开启 CDP，生产运行不生效
if (process.env.WB_DEBUG) {
  try { app.commandLine.appendSwitch('remote-debugging-port', process.env.WB_DEBUG); } catch (e) {}
}

let store;

function getDataDir() {
  if (app.isPackaged) {
    const base = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
    return path.join(base, '数据');
  }
  return path.join(app.getAppPath(), '数据');
}

function buildChineseMenu() {
  const template = [
    { label: '文件', submenu: [
      { role: 'quit', label: '退出' }
    ]},
    { label: '编辑', submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' },
      { role: 'selectAll', label: '全选' }
    ]},
    { label: '视图', submenu: [
      { role: 'reload', label: '重新加载' },
      { role: 'forceReload', label: '强制刷新' },
      { role: 'toggleDevTools', label: '开发者工具' },
      { type: 'separator' },
      { role: 'resetZoom', label: '实际大小' },
      { role: 'zoomIn', label: '放大' },
      { role: 'zoomOut', label: '缩小' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: '进入全屏' }
    ]},
    { label: '窗口', submenu: [
      { role: 'minimize', label: '最小化' },
      { role: 'zoom', label: '调整大小' },
      { role: 'close', label: '关闭窗口' }
    ]},
    { label: '帮助', submenu: [
      { label: '关于公众号排版工具', click: () => {
        dialog.showMessageBox({
          type: 'info',
          title: '关于',
          message: '公众号排版工具',
          detail: 'Markdown 转微信公众号排版\n版本 1.0'
        });
      }}
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#f7f8fa',
    title: '公众号排版工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  buildChineseMenu();
  store = new Store(getDataDir());
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerIpc() {
  ipcMain.handle('store:listArticles', () => store.listArticles());
  ipcMain.handle('store:getArticle', (e, id) => store.getArticle(id));
  ipcMain.handle('store:saveArticle', (e, a) => store.saveArticle(a));
  ipcMain.handle('store:deleteArticle', (e, id) => store.deleteArticle(id));
  ipcMain.handle('store:getThemes', () => store.getThemes());
  ipcMain.handle('store:saveTheme', (e, t) => store.saveTheme(t));
  ipcMain.handle('store:deleteTheme', (e, id) => store.deleteTheme(id));
  ipcMain.handle('store:getImages', () => store.getImages());
  ipcMain.handle('store:saveImage', (e, img) => store.saveImage(img));
  ipcMain.handle('store:deleteImage', (e, id) => store.deleteImage(id));
  ipcMain.handle('store:getSettings', () => store.getSettings());
  ipcMain.handle('store:saveSettings', (e, s) => store.saveSettings(s));
  ipcMain.handle('clipboard:writeHTML', async (e, html, text) => {
    await clipboard.write([new ClipboardItem({
      'text/html': html,
      'text/plain': text || ''
    })]);
    return true;
  });
  ipcMain.handle('dialog:saveHTML', async (e, html, defaultName) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    const r = await dialog.showSaveDialog(win, {
      defaultPath: defaultName || 'article.html',
      filters: [{ name: 'HTML', extensions: ['html'] }]
    });
    if (r.canceled || !r.filePath) return false;
    fs.writeFileSync(r.filePath, html, 'utf8');
    return r.filePath;
  });
  ipcMain.handle('image:upload', async (e, arr, filename) => {
    const settings = store.getSettings();
    return uploadImage(Buffer.from(arr), filename, settings);
  });
  ipcMain.handle('app:dataDir', () => store.dir);
}