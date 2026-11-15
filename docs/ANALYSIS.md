# 公众号排版工具 · 技术分析

> 本文拆解 `src/` 下的实现：一个 Electron 桌面应用如何把 Markdown 变成微信公众号编辑器能正确吃进去的富文本。

## 1. 架构总览

```
┌─ 主进程 (Node / Electron) ──────────────────────┐
│  main.js      窗口、中文菜单、IPC handler         │
│  preload.js   contextBridge → window.api         │
│  store.js     本地 JSON 文件读写                  │
│  image-upload.js  图床上传（fetch / FormData）    │
└──────────────────┬──────────────────────────────┘
                   │ ipcRenderer.invoke ⇄ ipcMain.handle
┌──────────────────┴──────────────────────────────┐
│  渲染进程 (Chromium，无 Node 集成)                │
│  index.html / app.css   三栏工作台                │
│  boot.js               明暗模式初始化             │
│  app.js                状态、事件、防抖渲染        │
│  themes.js             主题配置 → 完整样式对象     │
│  engine.js             Markdown → 内联样式 HTML   │
│  lib/                  markdown-it + highlight.js │
└─────────────────────────────────────────────────┘
```

`webPreferences` 里 `contextIsolation: true`、`nodeIntegration: false`，渲染层拿不到 Node，只能通过 `preload.js` 暴露的 16 个 `window.api.*` 方法访问文件系统与剪贴板。这是Electron 应用的标准隔离做法，代价是所有 IO 都要写一遍 IPC handler（`main.js` 的 `registerIpc()` 基本是 store 方法的直连映射）。

三栏工作台：左侧「文章 / 主题 / 素材」标签页，中间 Markdown 编辑器，右侧公众号预览。窗口默认 1320×840、最小 1024×680。

## 2. 启动与数据流

1. `app.whenReady()` → `buildChineseMenu()` 设置中文菜单 → `new Store(getDataDir())` → `registerIpc()` → `createWindow()`
2. `BrowserWindow` 加载 `renderer/index.html`；`boot.js` 先读 `localStorage.uiMode`，无值则跟随 `prefers-color-scheme`，把 `data-ui` 写到 `<html>` 上，避免明暗闪烁
3. `app.js` 的 `init()` 并行取 `getSettings / getThemes / listArticles / getImages`，渲染三个列表，绑定事件，加载第一篇文章
4. 编辑器输入 → `onEditorInput()` → 120 ms 防抖 `render()`（实时预览用 `Engine.render`）+ 800 ms 防抖自动保存
5. 点「复制到公众号」→ `Engine.renderForWechat()` → `api.writeClipboardHTML()` → 主进程 `clipboard.write()` 同时写入 `text/html` 与 `text/plain`

数据目录在开发态是 `app.getAppPath()/数据`，打包后是 `PORTABLE_EXECUTABLE_DIR/数据`（便携版跟随 exe 所在目录）。

## 3. 主题系统（`themes.js`）

### 3.1 配置即数据

`builtinConfigs` 是 20 个普通对象，每个只描述**差异**：

| 字段 | 作用 |
| --- | --- |
| `id` / `name` | 标识与显示名 |
| `accent` | 主色，用于标题、加粗、链接、表头、引用边线 |
| `bg` / `textColor` | 文章底色与正文色 |
| `font` | `sans` / `serif` / `kai` 三套字体栈 |
| `fontSize` / `lineHeight` | 正文排版尺度 |
| `h1Style` / `h2Style` | 标题造型分支 |
| `quoteStyle` | 引用造型分支 |
| `codeTheme` | 5 套代码高亮配色之一 |
| `quoteBg` / `thColor` / `imgRadius` / `dark` | 局部覆盖项 |

`buildTheme(config)` 把这些差异展开成一张完整的样式表：`container`、`h1`…`h6`、`p`、`blockquote`、`pre`、`code_inline`、`code_block`、`ul/ol/li`、`table/th/td`、`img`、`a`、`hr`、`strong/em/del`。默认值用 `||` 兜底，所以自定义主题只需给想改的字段。

几个造型分支值得单独看：

- `h1Style`：`block` 色块、`gradient` 渐变（`shadeHex()` 把主色往白色提亮 40% 做渐变终点）、`underline`、`leftborder`、`outline`、`plain`
- `h2Style`：`underline`、`number`（配合 `h2Number` 在渲染时插入 01/02 序号）、`gradientbar`（用 `background-image` + `background-size: 100% 3px` 做底部渐变细线）、`block`、`leftborder`、`plain`
- `quoteStyle`：`default` 左边框+底色、`card` 圆角卡片（带 `box-shadow`）、`mark`（渲染时插一个大引号字符）、`ticket` 虚线票据

代码配色 `codeThemes` 有 5 套（Atom One Dark / GitHub Light / Monokai / Xcode / Dracula），把 `hljs-*` class 映射成具体颜色值，供 `engine.js` 内联化。

`window.THEMES` 暴露 `buildTheme / builtinThemes / builtinConfigs / codeThemes / options`，`options` 同时是编辑弹窗的下拉选项来源 —— 配置和 UI 共用一份定义，加一套主题不用改两处。

### 3.2 自定义主题

「编辑样式」弹窗由 `app.js` 按 `options` 动态生成表单，改动后 `state.config` 立即变化并触发 `render()`，保存时经 `api.saveTheme()` 落到 `数据/主题.json`，下次启动 `getThemes()` 读回来与内置主题合并展示。内置主题不可删除，自定义主题可删。

## 4. 渲染管线（`engine.js`）

```
Markdown 文本
  → markdown-it(html:false, linkify:true, table, strikethrough)
  → renderTaskLists() 把 [ ] / [x] 换成 ☐ / ☑
  → buildTheme(config) 得到样式对象
  → applyTheme()：template 解析 → <section style=容器样式> → walk() 递归注入
  → 预览 HTML
```

`walk()` 是关键：遍历生成的 DOM，按标签名取 `theme[tag]`，用 `objToStyle()`（驼峰转 kebab）把样式对象写成字符串塞进 `style` 属性；`code` 标签区分行内与 `pre` 内代码块；`span.task-checkbox` 单独处理。额外做两件装饰：`h2Number` 时插入序号 `<span leaf>`，`quoteMark` 时在引用首段前插引号字符。代码高亮部分把 `hljs-*` span 的 class 换成内联 `color` 并移除 class —— 因为公众号会丢弃 class。

`html: false` 是个正确的安全取舍：文稿里的原始 HTML 不会被当标记解析，避免粘贴来路不明的 Markdown 时注入脚本。

## 5. 公众号适配变换（`transformForWechat`）

预览用的 HTML 还不能直接粘。`renderForWechat()` 会再跑一遍变换，每一步都对应公众号编辑器的一个限制：

| 变换 | 解决的问题 |
| --- | --- |
| 移除所有 `class` / `id` | 后台编辑器会过滤掉，靠 class 的样式全失效 |
| 给 `p/li/td/th/blockquote/h*` 补齐 `font-size`、`line-height`、`color`、`font-family` | 微信不保证继承，容器上的字号行距会丢 |
| 把 `<ol>` 改写成一组 `<p>` + 序号 `<span>` | 公众号对有序列表的渲染不稳定，序号常消失 |
| 独立成段的图片所在 `<p>` 补 `text-align:center` | 保持居中 |
| `normalizeMargins()` 折叠相邻块的上下 margin | 避免微信里出现双倍段间距 |
| 所有样式值追加 `!important` | 对抗后台编辑器自带的样式覆盖 |
| `removeWhitespaceNodes()` 删掉块级元素之间的空白文本节点 | 微信会把这些空白渲染成多余空行 |
| `wrapTextNodesWithLeaf()` 给每个文本节点包 `<span leaf="">` | 公众号编辑器对文本节点的结构要求 |
| 尾部追加隐藏的 `<mp-style-type data-value="3">` 标记 | 标识内容类型 |

最终 `exportDoc()` 会把这段 `<section>` 包进一个完整 HTML 文档供导出；复制走的是变换后的裸 `<section>`，同时写一份纯文本到 `text/plain` 作为降级。

这套「先内联、再变换」的两段式设计很实用：**预览所见即所得，复制用另一条管线针对目标平台加固**，两者共用同一份主题配置，不会漂移。

## 6. 剪贴板、导出与图床

- 剪贴板：`main.js` 用 `clipboard.write([new ClipboardItem({ 'text/html': html, 'text/plain': text })])` 写双格式。只写 `text/html` 的话，某些目标编辑器会降级失败，带上纯文本是稳妥做法。
- 导出：`dialog.showSaveDialog()` 拿路径 → `fs.writeFileSync()` 写 UTF-8 HTML。
- 图床：`image-upload.js` 用 Node 原生 `fetch` + `FormData`/`Blob`，四种 provider：
  - Catbox：免登录，返回纯文本 URL
  - SM.MS：`Authorization` 头带 Token，处理 `image_repeated` 复用
  - ImgBB：base64 表单 + query 里的 key
  - 自定义：可配 API 地址、文件字段名、Token 头、额外表单字段、响应 URL 路径（支持 `data.url` 这类点号路径，也兼容纯文本响应）
  
  上传发生在**主进程**，绕开渲染层的 CSP 与跨域限制；渲染层只把 `ArrayBuffer` 传过去。

## 7. 本地存储与设置

`Store` 是零依赖的 JSON 文件存储，没有数据库：

```
数据/
  文章/<id>.json      每篇文章一个文件（title/content/config/themeId/时间戳）
  主题.json           自定义主题数组
  素材.json           图片素材数组
  设置.json           图床配置、自动保存、默认主题
```

`readJSON()` 出错时返回 fallback，所以单个文件损坏不会让整个应用起不来；`listArticles()` 按 `updatedAt` 倒序。设置里 `autoSave: true` 默认开启，`defaultThemeId: 'moyu'`。

**注意**：图床 Token 以明文存在 `设置.json`。这是本地工具可以接受的取舍，但如果以后要同步/开源这份数据，必须先清理；`.gitignore` 已排除整个 `数据/` 目录。

## 8. UI 与打包

- 明暗界面靠 CSS 变量：`:root, [data-ui="light"]` 定义一套，`[data-ui="dark"]` 覆盖；`boot.js` 在页面最早阶段写 `data-ui`，避免闪白。玻璃拟态（`--glass` 系列）与强调色 `--ui-accent` 都走变量，主题色与 UI 色互不干扰。
- 渲染层 CSP 是 `default-src 'self'`，脚本只允许本地文件，markdown-it 与 highlight.js 都放在 `lib/` 本地打包，**没有 CDN 依赖**，完全离线可用。
- `package.json` 的 `electron-builder` 配置输出 `portable` 与 `zip` 两种 Windows 产物，`build/icon.ico` 由 `build/build-icon.js` 生成。

## 9. 截图是怎么来的

仓库 `screenshots/` 里的图不是设计稿，是无头 Chrome 真实渲染的结果：

- 界面图：加载真实的 `renderer/index.html`，注入一个 mock `window.api`（模拟 Electron 的 IPC 返回），由 `app.js` 自己完成初始化、文章加载与预览渲染后截图
- 20 张案例图：加载 `themes.js` + `engine.js`，对 `builtinConfigs` 逐项调用 `Engine.render(sample.md, config)`，把输出放进 460 px 宽的文章容器截图
- 总览图：同一段示例 Markdown 在 4×5 网格里各渲染一次，整页截图

因此主题样式、字体、配色与软件实际输出完全一致，主题配置变动时重新生成即可。

## 10. 设计取舍与可改进点

做得好的地方：配置驱动的 20 套主题、预览与导出共用配置、双管线（预览 / 微信加固）、离线无 CDN、存储零依赖、渲染进程无 Node 权限。

如果要继续迭代，我会优先考虑这几件事：

1. **主题配置抽成独立 JSON/YAML**。现在内置主题写死在 `themes.js` 里，社区贡献一套主题要改源码；抽成数据文件后可以做成「导入 / 导出主题」。
2. **给 `transformForWechat()` 加快照测试**。这是全项目最容易踩坑、也最难肉眼验证的一段；把示例 Markdown 的变换结果存成快照，改样式时不至于悄悄破坏复制功能。
3. **图床 Token 交给系统凭据库**（Electron `safeStorage` 或系统 keychain），而不是明文 JSON。
4. **表格兼容性**。公众号对 HTML 表格的支持向来不稳，可以在变换阶段把表格降级为「卡片式段落」作为一个可选开关。
5. **暗色主题的实际可用性**。暗色文章粘到公众号后，微信正文默认是白底，深色主题在不同客户端可能出现反色或背景丢失，值得在真机上验一轮并给出提示。
