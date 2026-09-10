# AI 集成指南：让 AI 调用 md2wechat 产出公众号 HTML

> 本文档面向 **AI Agent、编程助手、自动化流水线** 的开发者。目标：让 AI 生成的 Markdown，经过 md2wechat 一键转成可直接粘贴进微信公众号编辑器的全内联样式 HTML。

md2wechat 是**确定性**排版引擎：同样的 Markdown 永远产出同样的 HTML。它不替你"改文章"，只负责"把 Markdown 排好版"。这种确定性正是 AI 流水线最需要的——AI 负责写内容，md2wechat 负责排版，职责清晰，可重复、可测试。

三种调用方式，按场景选择：

| 调用方式 | 适合谁 | 产出 |
| --- | --- | --- |
| CLI（命令行） | AI Agent / Shell 脚本 / CI | 预览壳 HTML 或正文 section HTML |
| Node 模块 | AI 编程助手 / Node 自动化流水线 | 结构化 JSON 或字符串 |
| Skill | DeepSeek Harness / WorkBuddy / Claude Code 等 Agent 平台 | 交给 Agent 自动决策 |

下文所有命令均在仓库根目录（下称 `<repo>`）下实测通过（Node >= 14，零依赖）。

---

## 一、CLI 调用（适合 AI Agent / Shell 脚本）

### 1.1 基础命令：渲染一个 Markdown 文件

```bash
node bin/md2wechat.js input.md -o output.html --theme byte
```

执行后会生成一个**带手机预览壳的 HTML 文件**：顶部有工具栏（主题 chip、字数、"复制到公众号"按钮），正文嵌在 520px 的手机框里。打开后点按钮即可全选复制正文样式。

参数说明：

| 参数 | 取值 | 默认 | 说明 |
| --- | --- | --- | --- |
| `-o, --output <file>` | 路径 | 同目录 `<名>.公众号版.html` | 输出 HTML 路径 |
| `--theme <id>` | 见下方 12 主题列表 | `byte` | 主题 ID |
| `--color <hex>` | 如 `#FF6B35` | 无 | 覆盖当前主题主色 |
| `--title <text>` | 字符串 | 自动取首个 `#` 标题 | 预览壳标题 |
| `--no-footer` | 开关 | 关 | 禁用文末 `---` 后的 footer 分离 |
| `--links <mode>` | `keep` / `text` / `drop` | `text` | 微信禁外链，`text` 模式把 URL 转成转角标 |
| `--images <mode>` | `placeholder` / `drop` / `keep` | `placeholder` | 图片占位卡 / 丢弃 / 保留 |
| `--stdout` | 开关 | 关 | 只输出正文 section HTML，不生成预览壳 |
| `-q, --quiet` | 开关 | 关 | 安静模式（不打印提示） |
| `--list-themes` | 开关 | 关 | 列出全部可用主题 |

12 个内置主题（`--list-themes` 实测输出）：

```
byte         行途蓝  [科技实战]  #056DE8
code         代码极简 [科技实战]  #24292e
business     商业评论 [观点随笔]  #1A59B7
review       评测风   [观点随笔]  #d71a1b
ink          墨韵留白 [成长故事]  #2f3542
warm         暖调故事 [成长故事]  #D97757
pure         纯文字随笔[科技实战]  #1a1a1a
symbol       符号技术风[科技实战]  #ff6a00
editorial    编辑杂志 [观点随笔]  #a14335
terminal     终端极客 [科技实战]  #ff6b35
infotech     InfoQ科技绿[科技实战] #00A651
cyber        电光科技青[科技实战]  #00B8D9
```

旧 ID 仍兼容（别名映射）：`github`→`code`、`focus36`→`business`、`sspai`→`review`、`terracotta`→`warm`。

### 1.2 管道模式：把正文 HTML 接到下游

CLI **不支持 `--stdin` 直接读管道**（v2.3 实测）。它要求输入是一个文件。因此 AI 的标准做法是：

1. 先把生成的 Markdown 写到临时文件；
2. 用 `--stdout` 只取正文 section HTML，接到下游管道。

```bash
# 把 Markdown 写到临时文件
cat > /tmp/article.md <<'EOF'
# 我的文章标题

这是正文，**加粗**、`行内代码`、列表都支持。

- 第一点
- 第二点
EOF

# --stdout 只输出正文 section HTML（无预览壳），重定向到文件
node bin/md2wechat.js /tmp/article.md --theme byte --stdout > /tmp/article.html

# 现在 /tmp/article.html 就是可直接粘贴进公众号的全内联样式 HTML
wc -c /tmp/article.html
```

注意：`--stdout` 输出的是裸 `<section>...</section>`（正文片段），没有 `<html><head>` 外壳。要在浏览器里看效果，请用不带 `--stdout` 的方式生成预览壳。

### 1.3 常用参数组合

```bash
# 换主题 + 自定义主色
node bin/md2wechat.js article.md --theme byte --color "#FF6B35" -o out.html

# 去掉外链、去掉图片占位（纯文字稿）
node bin/md2wechat.js article.md --links drop --images drop -o out.html

# 安静模式（脚本里不打印提示）
node bin/md2wechat.js article.md -o out.html --quiet
```

### 1.4 完整 bash 示例：AI 生成 MD → 渲染 → 浏览器打开预览

下面这个脚本可直接复制运行。它演示了 AI 流水线的完整闭环：生成 Markdown → 调 CLI 渲染 → 用 macOS `open` 打开预览。

```bash
#!/usr/bin/env bash
# ai-render.sh — AI 生成 Markdown 后一键排版并预览
set -euo pipefail

# 1. 准备 md2wechat 路径（按你的实际位置改）
MD2WECHAT="<repo>"   # 例如 /Users/you/md2wechat

# 2. 假设这是 AI 刚生成的 Markdown（实际场景里由 AI Agent 写出）
cat > /tmp/ai_article.md <<'EOF'
# AI 辅助写作的一天

> 一个技术人如何把重复劳动交给 AI。

## 起因

每天写公众号草稿最耗时的不是想观点，是**排版**。

## 做法

1. 用 AI 把口语化思路整理成 Markdown
2. 用 md2wechat 一键渲染成公众号样式
3. 打开预览，点"复制到公众号"

## 小结

工具把排版这件事的边际成本降到了零。

---

**行途技术手记** | 本文由 AI 辅助生成。
EOF

# 3. 调 CLI 渲染（行途蓝主题）
node "$MD2WECHAT/bin/md2wechat.js" /tmp/ai_article.md \
    -o /tmp/ai_article.公众号版.html \
    --theme byte

# 4. 用 macOS 默认浏览器打开预览
open /tmp/ai_article.公众号版.html

echo "预览已生成：/tmp/ai_article.公众号版.html"
```

保存为 `ai-render.sh`，`chmod +x ai-render.sh` 后执行即可。

---

## 二、Node 模块调用（适合 AI 编程助手 / 自动化流水线）

引擎是零依赖的 CommonJS 模块，可在任何 Node 环境里 `require`。

### 2.1 API 总览

```js
const engine = require('md2wechat/lib/engine.js');
// 或在仓库内直接： require('./lib/engine.js')
```

导出的全部成员：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `version` | string | 引擎版本 |
| `render(md, opts)` | function | 渲染，返回 `{html, title, theme, main}` |
| `renderToJSON(md, opts)` | function | 渲染为结构化 JSON（AI 解析友好） |
| `themes` | object | 全部内置主题配置 |
| `themeKeys` | string[] | 全部主题 ID 数组 |
| `themeAliases` | object | 旧 ID → 新 ID 映射 |
| `registerTheme(id, config)` | function | 注册自定义主题 |
| `getTheme(id)` | function | 读取主题配置（解析别名） |
| `listThemes()` | function | 按分组列出主题 |
| `exportTheme(id)` | function | 导出主题配置为 JSON |
| `countWords(html)` | function | 统计中英混排字数 |
| `themeTokens(id)` | function | 取主题渲染 token |

### 2.2 `render(md, opts)` — 基础渲染

**参数**

- `md` (string)：Markdown 原文。
- `opts` (object，可选)：
  - `theme` (string)：主题 ID，默认 `byte`。
  - `color` (string)：覆盖主色 hex。
  - `title` (string)：预览标题，默认自动取首个 `#` 标题。
  - `footer` (boolean)：是否把文末 `---` 之后内容分离为 footer，默认 `true`。
  - `links` (string)：`keep` / `text` / `drop`，默认 `text`。
  - `images` (string)：`placeholder` / `drop` / `keep`，默认 `placeholder`。

**返回**

```js
{
  html:  '<section style="...">...</section>',  // 正文片段，全内联样式
  title: '文章标题',
  theme: 'byte',
  main:  '#056DE8'
}
```

### 2.3 `renderToJSON(md, opts)` — 结构化输出（推荐 AI 用）

`renderToJSON` 在 `render` 之上包了一层元信息，方便 AI 或自动化脚本直接 `JSON.parse` / 消费。实测返回结构：

```js
{
  ok: true,
  title: '文章标题',
  theme: 'pure',
  mainColor: '#1a1a1a',
  wordCount: 712,
  html: '<section style="...">...</section>',
  meta: {
    engineVersion: '2.2.1',
    generatedAt: '2026-09-11T00:00:00.000Z',
    inputLength: 4521,
    outputLength: 10655
  }
}
```

字段含义：

| 字段 | 说明 |
| --- | --- |
| `ok` | 是否成功（当前恒为 `true`，保留给后续错误码扩展） |
| `title` | 提取到的标题 |
| `theme` | 实际使用的主题 ID（别名已解析） |
| `mainColor` | 实际主色（含 `color` 覆盖） |
| `wordCount` | 正文近似字数（去标签后中英混排长度） |
| `html` | 正文 section HTML |
| `meta.engineVersion` | 引擎版本 |
| `meta.generatedAt` | 生成时间 ISO 串 |
| `meta.inputLength` | 输入 Markdown 长度 |
| `meta.outputLength` | 输出 HTML 长度 |

### 2.4 完整 Node 示例：读 MD → 渲染 → 写 HTML → 打印字数与主题

下面这个脚本可直接复制运行（在仓库根目录下）：

```js
#!/usr/bin/env node
// render.js — 读取 md 文件，渲染成公众号 HTML，并打印元信息
const fs = require('fs');
const path = require('path');
const engine = require('./lib/engine.js');   // 发布后可改为 require('md2wechat/lib/engine.js')

const inputPath = process.argv[2] || 'examples/demo.md';
const outputPath = process.argv[3] || '/tmp/demo.公众号版.html';
const theme = process.argv[4] || 'byte';

const md = fs.readFileSync(inputPath, 'utf-8');

// 用 renderToJSON 一次拿到结构化结果
const result = engine.renderToJSON(md, { theme: theme });

// 正文片段就是可粘贴进公众号的 HTML
fs.writeFileSync(outputPath, result.html, 'utf-8');

// 打印元信息（AI/流水线可据此做判断）
console.log('ok:', result.ok);
console.log('标题:', result.title);
console.log('主题:', result.theme, '· 主色', result.mainColor);
console.log('字数:', result.wordCount);
console.log('输出文件:', outputPath, '(' + result.meta.outputLength + ' 字节)');
```

运行：

```bash
node render.js examples/demo.md /tmp/out.html byte
```

输出（实测）：

```
ok: true
标题: AI 时代的工程师工具箱
主题: byte · 主色 #056DE8
字数: 712
输出文件: /tmp/out.html (10655 字节)
```

### 2.5 `registerTheme(id, config)` — 动态注册主题

详见 [customization-guide.md](./customization-guide.md)。一句话：传一个 `{main: '#色值', ...}` 的 JSON 就能注册一个新主题，无需改引擎源码。

---

## 三、Skill 调用（适合 Agent 平台）

仓库自带一个 Agent Skill：`skills/md2wechat-typograph/SKILL.md`。它告诉 DeepSeek Harness / WorkBuddy / Claude Code 这类平台上的 AI **什么时候该用、怎么用、怎么交付**。

### 3.1 AI Agent 的触发时机

当用户说类似下面的话时，Agent 应识别为排版任务：

- "把这篇 md 排好版"
- "这篇文章发公众号，帮我排版"
- "按少数派风格排一下" / "按行途蓝排版"
- "把 md 转成微信格式"

用户**没有**提到公众号/排版时，不要主动触发。

### 3.2 Agent 的执行流程

Skill 规定的标准动作：

1. **识别输入**：Markdown 文本。如果用户的稿来自 Obsidian / 飞书 / 笔记软件，让用户先存成本地 `.md` 文件，**不要把长稿粘贴进对话里渲染**（费 token 且没必要）。
2. **问一次偏好**：主题（默认 `byte`）、是否自定义主色。一次问完，别反复问。
3. **执行 CLI**：

   ```bash
   node /path/to/md2wechat/bin/md2wechat.js /tmp/article.md \
       -o /tmp/article.公众号版.html \
       --theme byte
   ```

4. **交付**：把预览壳路径告诉用户，引导其双击打开 → 点"复制到公众号" → 进微信后台新建图文 → Ctrl+V 粘贴。
5. **增量调整**：用户要换主题或加图注，改 md 重跑 CLI 即可，不要重复造轮子。

### 3.3 一次完整的 Agent 对话示例

> **用户**：把这篇 md 排好版，发公众号。
>
> **Agent**：已识别为公众号排版任务。默认用「行途蓝」主题，可以吗？我直接出预览。
>
> **（Agent 把用户稿件写入 /tmp/post.md，执行）**
>
> ```bash
> node <repo>/bin/md2wechat.js /tmp/post.md \
>     -o /tmp/post.公众号版.html --theme byte
> ```
>
> **Agent**：
> 已生成预览：`/tmp/post.公众号版.html`
> 操作：双击打开 → 点右上角「复制到公众号」→ 进微信后台新建图文 → Ctrl+V 粘贴。
> 文中图片位置会显示占位卡，请在公众号后台对应位置手动上传真实图片。

---

## 四、MCP 接口规划（Model Context Protocol）

MCP（Model Context Protocol）让支持 MCP 的 AI 客户端（如 Claude Desktop、Cursor 等）通过标准协议直接调用工具，无需 AI 自己拼 shell 命令。md2wechat 尚未内置 MCP Server，但封装成本很低——核心就是把 CLI / Node API 包成几个 MCP tool。

### 4.1 概念性工具定义（设计稿，非实现）

建议暴露三个 tool：

**tool 1：`list_themes`**

```json
{
  "name": "list_themes",
  "description": "列出 md2wechat 全部可用主题及其主色、分组",
  "inputSchema": { "type": "object", "properties": {} }
}
```

内部实现直接调 `engine.listThemes()`。返回按分组组织的主题清单，供 AI 选题。

**tool 2：`render_markdown`**

```json
{
  "name": "render_markdown",
  "description": "把 Markdown 渲染成微信公众号全内联样式 HTML",
  "inputSchema": {
    "type": "object",
    "properties": {
      "markdown": { "type": "string", "description": "Markdown 原文" },
      "theme": { "type": "string", "default": "byte" },
      "color": { "type": "string", "description": "覆盖主色 hex，可选" },
      "footer": { "type": "boolean", "default": true },
      "links": { "type": "string", "enum": ["keep", "text", "drop"], "default": "text" },
      "images": { "type": "string", "enum": ["placeholder", "drop", "keep"], "default": "placeholder" }
    },
    "required": ["markdown"]
  }
}
```

内部实现直接调 `engine.renderToJSON(markdown, opts)`，把 `html` 连同 `wordCount`、`title` 一起返回。AI 拿到 HTML 后可自行写入文件或交给下游。

**tool 3：`render_to_file`**

```json
{
  "name": "render_to_file",
  "description": "把 Markdown 渲染并写出带手机预览壳的 HTML 文件，返回文件路径",
  "inputSchema": {
    "type": "object",
    "properties": {
      "inputPath": { "type": "string" },
      "outputPath": { "type": "string" },
      "theme": { "type": "string", "default": "byte" }
    },
    "required": ["inputPath", "outputPath"]
  }
}
```

内部实现等价于 CLI：读文件 → `render` → 套 `buildShell` → 写文件，返回路径供 AI 引导用户打开。

### 4.2 封装要点

- MCP Server 用 Node 写，依赖 `@modelcontextprotocol/sdk`；引擎本身零依赖，直接 `require('./lib/engine.js')`。
- `render_markdown` 返回的 HTML 是**裸 section 片段**，不要包 `<html>` 外壳——客户端要的是能粘进公众号的内容。
- 涉及写文件的 tool 必须让 AI 显式传路径，不要擅自写到用户目录。
- 错误处理：未知主题、文件不存在时，tool 返回 `isError: true` 并附 `list_themes` 的输出，方便 AI 自纠。

> MCP Server 为路线图项，尚未随 v2.3 发布。如有需要，按上述三个 tool 实现约 150 行 Node 即可跑通。

---

## 五、选型速查

| 你的场景 | 用什么 |
| --- | --- |
| AI Agent 会 shell、要一步出 HTML | CLI（第一节） |
| 要在 Node 流水线里拿结构化结果做判断 | `renderToJSON`（第二节） |
| 用的是 Claude Code / WorkBuddy / Harness | 装 Skill（第三节） |
| 客户端原生支持 MCP | 等/自封装 MCP Server（第四节） |

所有调用方式底层都走同一个 `lib/engine.js`，产出 HTML 完全一致。
