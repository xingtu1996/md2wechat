# 墨排 · md2wechat 行途排版引擎

> **Markdown → 微信公众号排版** · 零依赖、全内联样式、12 主题、CLI + 单文件离线工作台、AI 友好
>
> **行途出品** — 从真实公众号发布流程中沉淀的排版工具，先给自己用，再开源分享。
>
> 产品名「墨排」：墨 = 文字/内容，排 = 排版。匠人精神，把每一篇文章排好。

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Version](https://img.shields.io/badge/version-v2.3.0-blue.svg)
![Engine](https://img.shields.io/badge/engine-v2.3-blue.svg)
![Dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14-lightgrey.svg)
![AI Friendly](https://img.shields.io/badge/AI--friendly-%E2%9C%93-orange.svg)
![Brand](https://img.shields.io/badge/%E8%A1%8C%E9%80%94%E5%87%BA%E5%93%81-%E2%9C%93-success.svg)

## 这是什么

把 **Markdown 直接转成微信公众号编辑器可粘贴的 HTML**，所有样式内联、零失真、断网也能跑。

从行途真实的「公众号排版偏好演进史」沉淀而来：吸收了沉浸式排版的 footer 分离、主题矩阵 + Mac 视窗代码块 + 媒体占位卡、以及历代 CLI 版的零依赖离线哲学——合三为一，做成现在这份「既好看、又稳、还好改、还能被 AI 调用」的开源工具。

**产品定位**：不是「AI 智能排版」（确定性是卖点），而是「确定性排版引擎」——同样的输入永远产生同样的输出，可审计、可离线、可自动化。

## 30 秒快速开始

### 方式 1：单文件工作台（零安装，双击即用）

直接双击项目根目录的 `index.html`（59.7KB，零依赖单文件）：

- 左侧 Markdown 编辑器，右侧实时预览
- 顶部一键「复制到公众号」（快捷键 ⌘/Ctrl + Enter）
- 12 主题切换 + 自定义主色 + **整体色系联动**（切换主题时整个工作台色系跟着变）
- **主题专属演示**（每个主题加载对应风格的演示内容）
- 手机 ↔ 宽屏预览切换
- 字数实时统计 + **发布检查清单**（标题/字数/图片/摘要/封面/原创 6 项实时状态）
- 主题导入/导出（JSON 格式，便于分享和备份）

### 方式 2：CLI（流水线友好）

```bash
# 转换文章（默认输出同目录 .公众号版.html）
node bin/md2wechat.js examples/demo.md

# 指定主题（12 主题可选）
node bin/md2wechat.js examples/demo.md --theme editorial

# 自定义主色（覆盖当前主题）
node bin/md2wechat.js examples/demo.md --color #FF6B35

# 仅输出正文 HTML（管道友好，便于 AI/自动化接入）
node bin/md2wechat.js examples/demo.md --stdout > body.html

# 列出所有主题（按分组返回）
node bin/md2wechat.js --list-themes

# 图片模式：placeholder（占位卡，默认）/ keep（外链自动上传）/ drop（忽略）
node bin/md2wechat.js examples/demo.md --images keep
```

### 方式 3：Node 模块（AI / 自动化集成）

```js
const XingTuMd = require('md2wechat/lib/engine.js');

// 基础渲染
const res = XingTuMd.render('# 标题\n\n正文', { theme: 'byte' });
console.log(res.html);   // 全内联样式 HTML
console.log(res.title);  // 提取的标题
console.log(res.theme);  // 实际使用的主题

// AI 友好：结构化 JSON 输出
const json = XingTuMd.renderToJSON('# 标题\n\n正文', { theme: 'byte' });
console.log(json.ok);         // true
console.log(json.wordCount);  // 字数
console.log(json.meta);       // 版本/时间/输入输出长度

// 插件化：动态注册自定义主题
XingTuMd.registerTheme('mytheme', {
  name: '我的主题',
  group: '自定义',
  main: '#FF0000',
  h2: 'number',   // bar/line/lineAccent/center/centerText/plain/symbol/number
  h3: 'line',
  quote: 'soft',  // soft/plain/softWarm/softCenter
  pre: 'dark',    // dark/light
  desc: '自定义主题描述'
});

// 列出所有主题（按分组，便于 AI 选择）
const groups = XingTuMd.listThemes();
// { '科技实战': [...], '观点随笔': [...], '成长故事': [...], '编辑杂志': [...], '极客终端': [...] }

// 读取主题配置
const theme = XingTuMd.getTheme('byte');

// 导出主题为 JSON（便于分享和备份）
const exported = XingTuMd.exportTheme('byte');
```

## 主题矩阵（12 主题）

| ID | 名称 | 分组 | 主色 | H2 形态 | 适用场景 |
|---|---|---|---|---|---|
| `byte` | 行途蓝 | 科技实战 | #056DE8 | 左粗条 | AI 工程化 / 技术深度文（默认） |
| `code` | 代码极简 | 科技实战 | #24292e | 底部灰线 | 纯代码 / 硬核干货 |
| `pure` | 纯文字随笔 | 科技实战 | #1a1a1a | 纯加粗 | 随笔 / 深度长文 / 口语化 |
| `symbol` | 符号技术风 | 科技实战 | #ff6a00 | ▐ 符号前缀 | 技术博客 / 公式密集文 |
| `infotech` | InfoQ 科技绿 | 科技实战 | #00A651 | 编号+分段进度条 | 科技资讯 / 深度技术文（v2.3 新增） |
| `cyber` | 电光科技青 | 科技实战 | #00B8D9 | 编号+分段进度条 | AI 前沿 / 趋势解读（v2.3 新增） |
| `business` | 商业评论 | 观点随笔 | #1A59B7 | 居中色块 | 观点 / 商业评论 |
| `review` | 评测风 | 观点随笔 | #d71a1b | 主色下划线 | 效率 / 评测 |
| `ink` | 墨韵留白 | 成长故事 | #2f3542 | 居中大字 | 成长复盘 / 人物故事 |
| `warm` | 暖调故事 | 成长故事 | #D97757 | 左粗条 | 逆袭故事 / 生活感悟 |
| `editorial` | 编辑杂志 | 编辑杂志 | #a14335 | serif 大数字 | 深度长文 / 人物专访 / 杂志风 |
| `terminal` | 终端极客 | 极客终端 | #ff6b35 | 纯加粗 | CLI 教程 / 技术硬核 / 极客风 |

> 用 `--color #xxx` 可临时覆盖任何主题的主色。
>
> **向后兼容**：旧主题 ID（github→code、focus36→business、sspai→review、terracotta→warm、kazik→pure、taobao→symbol）自动映射，已有脚本不会坏。

## Markdown 子集支持

| 元素 | 语法 | 备注 |
|---|---|---|
| H1 | `# 标题` | 默认剥离（公众号标题单独填），可 `--keep-h1` |
| H2/H3/H4 | `## / ### / ####` | 形态随主题（含 number 大数字前缀 / techprog 编号+分段进度条） |
| 段落 + 软换行 | 行尾 `\` 或两空格 | |
| 加粗 / 斜体 / 删除线 | `**` / `*` / `~~` | 颜色随主题 |
| 行内 code / 代码块 | `` ` `` / ```` ``` ```` | 代码块 Mac 视窗风（深/浅可切） |
| 表格 | `\| a \| b \|` + `:---:` | 表头浅色，支持对齐 |
| 有序/无序列表 | `1.` / `-` | 支持嵌套（缩进 2+ 空格） |
| 任务列表 | `- [ ]` / `- [x]` | checkbox 单独配色 |
| 引用 | `>` | 形态随主题（soft/plain/softWarm/softCenter） |
| 链接 | `[text](url)` | 默认仅保留文字（微信外链受限），可 `--links keep` |
| 图片 | `![alt](url)` | 默认占位卡（带序号图1/N），可 `--images drop/keep` |
| 视频/音频占位 | `[视频：x]` / `[音频：x]` | 虚线占位卡 |
| 图注 | `*图注：xxx*` | 居中灰色小字 |
| 文末 footer | 文末 `---` 之后 | 自动小字化（公众号声明区） |
| 分隔线 | `---` / `***` / `___` | 虚线 hr |
| Frontmatter | 开头 `---` 块 | 自动剥离 |

## 插件开发指南

### 设计原则

- **高内聚**：每个主题是一个纯 JSON 配置，自包含所有样式参数
- **低耦合**：引擎核心只依赖主题配置的接口（h2/h3/quote/pre 等形态枚举），不依赖具体主题
- **零侵入**：注册新主题不需要修改引擎核心代码

### 主题配置字段

```js
{
  name: '主题名称',           // 显示名
  group: '分组名',            // 科技实战 / 观点随笔 / 成长故事 / 编辑杂志 / 极客终端 / 自定义
  main: '#056DE8',           // 主色（hex）
  h2: 'bar',                  // H2 形态：bar / line / lineAccent / center / centerText / plain / symbol / number
  h3: 'line',                 // H3 形态：bar / line / plain
  quote: 'soft',              // 引用形态：soft / plain / softWarm / softCenter
  pre: 'dark',                // 代码块：dark（Mac 视窗）/ light（浅色）
  dot: '#056DE8',             // 代码块红绿灯点缀色（通常=主色）
  text: '#3f3f3f',            // 可选：正文字色覆盖
  codeText: '#056DE8',        // 可选：行内 code 文字色覆盖
  desc: '主题描述'             // 一句话描述
}
```

### H2 形态说明

| 形态 | 效果 |
|---|---|
| `bar` | 左侧 4px 主色粗条 |
| `line` | 底部 2px 主色实线 |
| `lineAccent` | 底部 3px 主色线 + 主色文字 |
| `center` | 居中主色背景色块 + 白字 |
| `centerText` | 居中大字 + 宽字间距 |
| `plain` | 纯加粗，无装饰 |
| `symbol` | ▐ 主色符号前缀 |
| `number` | serif 大数字前缀（01/02/03，Georgia 字体） |

## AI 自动化接入指南

### 为什么 AI 友好

1. **结构化输出**：`renderToJSON()` 返回 `{ok, title, theme, wordCount, html, meta}`，AI 可直接解析
2. **稳定接口**：`render()` / `renderToJSON()` / `registerTheme()` / `getTheme()` / `listThemes()` / `exportTheme()` 语义清晰
3. **零依赖**：纯 Node.js 标准库，AI 环境无需安装额外包
4. **确定性输出**：同样的 md + 主题永远产生同样 HTML，无 LLM 调用、无随机
5. **`--stdout` 管道模式**：CLI 可直接输出正文 HTML，便于 shell 管道和自动化脚本
6. **向后兼容**：旧主题 ID 自动映射到新 ID，已有脚本不会坏
7. **复制友好**：工作台一键复制，输出格式与公众号编辑器完美兼容

### Playwright 自动化接入示例

```js
// 1. 用 md2wechat 生成正文 HTML
const XingTuMd = require('md2wechat/lib/engine.js');
const { html } = XingTuMd.render(markdownContent, { theme: 'byte' });

// 2. Playwright 打开公众号编辑器，注入正文
const { chromium } = require('playwright');
const browser = await chromium.launchPersistentContext('./profile', { channel: 'chrome' });
const page = browser.pages[0];
await page.goto('https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&appmsgid=xxx');

// 3. 找到 ProseMirror 编辑器，注入 HTML（base64 分块避免大文本截断）
await page.evaluate((b64) => {
  window.__htmlB64 = b64;
  // ... 解码 + DOMParser + PM doc 替换
}, Buffer.from(html).toString('base64'));

// 4. 设置标题/摘要/封面/原创，保存草稿
// ...
```

### AI Agent 工作流建议

```
用户输入 Markdown
  → AI 调用 XingTuMd.listThemes() 选择合适主题
  → AI 调用 XingTuMd.renderToJSON(md, {theme}) 生成结构化结果
  → AI 校验 wordCount / meta / html 非空
  → AI 调用 Playwright 自动化注入公众号编辑器
  → AI 回写发布日志 / CHANGELOG
```

## 设计哲学

1. **零依赖是哲学，不是限制**。marked 是好库，但我们更相信手写解析器能给公众号场景做到的最优：完全可控的内联样式 + 完全可审计的产物 + 完全断网可用。
2. **样式内联是底线**。微信公众号编辑器是 Chromium 内核但会剥 `<style>` 与 `class`，所以所有样式必须 inline——这是痛点也是机会。
3. **主题是配置，不是代码**。新增主题 = 一段 JSON 配置，不改引擎。`registerTheme()` 一行注册。
4. **确定性输出**。同一个 md + 主题永远产生同样 HTML（无 LLM 调用、无随机），便于自动化与版本管理。
5. **AI 是一等公民**。`renderToJSON()` 结构化输出、稳定 API、零依赖、向后兼容——从设计之初就考虑 AI 调用场景。
6. **P0 = 自己用好**。当前阶段所有功能以「行途自己用好」为第一优先级，自己用好了，别人才能用好。
7. **Specs 铁律**：No Spec No Code（无规格不写码）、Spec is Truth（规格即真相）、Reverse Sync（代码变更反向同步到 specs）。

## 合规与隐私

- **License**：MIT，真开源，可自由使用、修改、再分发
- **作者隐私**：使用 GitHub noreply 邮箱，不暴露真实联系方式；作者统一署名「行途」
- **AIGC 声明**：本项目部分代码由 AI 辅助生成，架构决策与需求定义由人类主导
- **微信合规**：
  - 图片默认输出占位卡（不落地外链，避免微信剥图）
  - 链接默认仅保留文字（微信对外链有限制）
  - 无任何私域引流代码
- **XSS 防护**：所有用户输入经 `esc()` 转义，code span 先隔离再还原
- **商标合规**：v2.1 起所有主题名称改为描述性名称，避免使用第三方商标
- **演示内容脱敏**：所有演示内容为通用技术主题，不包含个人真实经历、雇主、薪资等敏感信息

## 项目结构

```
md2wechat/
├── bin/
│   └── md2wechat.js          # CLI 入口（Node ≥14）
├── lib/
│   └── engine.js              # 核心引擎：手写解析器 + 12 主题 + 插件 API + AI 友好输出
├── index.html                 # 工作台入口（根目录，双击即用）← 构建产物
├── app/
│   └── template.html          # 可视化工作台模板（含 /*__ENGINE__*/ 占位）
├── examples/
│   └── demo.md                # 示例稿（通用技术主题，AI 时代的工程师工具箱）
├── tools/
│   └── build-app.js           # 把 engine.js 内联进模板 → 根目录 index.html
├── skills/
│   └── md2wechat-typograph/   # AI Agent Skill（DSH 兼容）
│       └── SKILL.md
├── package.json
├── README.md                  # 你正在读的
├── LICENSE                    # MIT
└── .gitignore
```

## 贡献指南

欢迎提交 Issue 和 PR！

### 提交规范

- **Commit 格式**：`feat/fix/docs/style/refactor/perf/test/build/ci/chore: 简述`（Conventional Commits，中文描述）
- **PR 描述**：说明改动目的、影响范围、测试结果
- **代码风格**：保持与现有代码一致，零依赖，不引入外部库

### 开发流程

1. Fork 仓库
2. 创建特性分支（`git checkout -b feat/your-feature`）
3. 提交改动（`git commit -m 'feat: 你的改动描述'`）
4. 推送到分支（`git push origin feat/your-feature`）
5. 创建 Pull Request

### 主题贡献

想新增主题？非常简单！参考「插件开发指南」中的主题配置字段，写一段 JSON 配置，然后：

1. 在 `lib/engine.js` 的 `THEMES` 对象中添加你的主题
2. 在 `app/template.html` 的主题面板中添加主题按钮
3. 在 README 的主题矩阵中添加一行
4. 提交 PR

## 路线图

- [x] v2.0：零依赖引擎 + 6 主题 + Mac 代码块 + 媒体占位 + footer 分离 + CLI + 工作台
- [x] v2.1：主题改名（商标合规）+ 插件化 API（registerTheme）+ AI 友好输出（renderToJSON）+ 向后兼容映射 + 8 主题
- [x] v2.2：品牌层统一（产品名「墨排」）+ 图片占位卡优化（带序号）+ 发布检查清单 + 工作台 SVG icon + 2 新主题（editorial/terminal）+ 主题导入导出 + h2 number 形态 + 10 主题
- [x] v2.2.1：整体色系联动（切换主题时工作台色系跟着变）+ 主题专属演示（5 主题对应风格演示）+ 工作台主题面板滚动支持
- [x] v2.3：新增 2 科技主题（infotech InfoQ 科技绿 / cyber 电光科技青）+ h2 techprog 形态（章节编号 + 分段进度条 + 彩色标题，参考 InfoQ 版式）+ 12 主题 + infotech 专属演示
- [ ] v2.4（规划中，2026-10）：工程化基础（目录结构重构 + 测试体系 + CI/CD）+ MCP 服务化 + AI 最佳实践文档 + Markdown 清洗工具
- [ ] v3.0（计划中，2026-11~12）：主题市场（精选 20+）+ 模板引擎 + 桌面应用 + 微信 API 集成 + 多平台适配 + 团队协作
- [ ] Future（长期）：SaaS 云服务 + AI 智能排版 + 企业级功能（批量排版 + 品牌主题定制 + 数据看板）

> 详细规划见项目 specs 文档：`specs/20260905-md2wechat-行途排版引擎-后续跟进/`

## 关于作者

我是**行途**，一线技术人 + 仍在写代码。这个排版工具来自我做公众号系列文章的真实沉淀——每一篇都要排版，每篇都从工具演进中受益。

- 🔔 公众号 **「行途技术手记」**：微信搜索关注，看 AI 工程化落地实战
- 🐙 GitHub：[@xingtu1996](https://github.com/xingtu1996)
- 📦 仓库：[xingtu1996/md2wechat](https://github.com/xingtu1996/md2wechat)

---

## 📡 AIGC 声明

本项目部分代码由 AI 辅助生成（含解析器、CLI、工作台模板）。所有架构决策、需求定义、风格取舍、测试用例均由行途主导，AI 仅作为「加速器」使用。项目遵循 MIT 协议，欢迎使用、改造、再分发。

> 微信编辑器粘贴最佳实践：① 工作台生成 HTML → 复制 ② 公众号后台新建图文 → 粘贴 ③ 文末图片占位处插入真实图片 ④ 文末 footer 区如有原文链接，微信会自动转为「阅读原文」按钮。

---

## AI 友好

md2wechat 从设计之初就把「AI 能直接调用」当作一等公民。核心引擎是零依赖、确定性的纯函数：AI 负责写内容，md2wechat 负责排版，产出永远可复现。

三种调用方式，按场景选：

- **CLI**（AI Agent / Shell 脚本）：`node bin/md2wechat.js input.md -o output.html --theme byte`，`--stdout` 可接管道。
- **Node 模块**（编程助手 / 流水线）：`require('md2wechat/lib/engine.js')`，`render()` / `renderToJSON()` 直接拿结构化 HTML 与字数、主题元信息。
- **Skill**（Agent 平台）：自带 `skills/md2wechat-typograph/SKILL.md`，告诉 Agent 何时触发、怎么执行、如何交付。

完整教程（含可直接复制运行的脚本与 MCP 接口规划）见 [docs/ai-integration-guide.md](docs/ai-integration-guide.md)。

## 定制化与模板包

md2wechat 采用 **open-core** 模式：核心引擎与 12 个内置主题永久 MIT 开源免费；付费点在增值层。

- **定制化主题**：`registerTheme` 纯 JSON 配置即可注入品牌主题，工作台支持一键导入导出 `.json`。
- **模板包**：对标 shadcn/ui 的「免费组件 + 付费 Blocks」——行业/场景模板包（技术文、小册、企业品牌）在免费引擎之上提供开箱即用的结构与视觉。
- **免费模板**：`templates/` 内置两套引流模板（行途蓝技术文、黑白极简随笔）。

详见：

- 定制化指南（主题注册 / 导入导出 / footer / 服务定价）：[docs/customization-guide.md](docs/customization-guide.md)
- 模板包规划与免费模板：[templates/README.md](templates/README.md)
