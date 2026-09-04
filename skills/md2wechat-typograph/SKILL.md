---
name: md2wechat-typograph
version: 1.0.0
description: Markdown → 微信公众号排版 · 把用户的 Markdown 转成可直接粘贴进公众号编辑器的全内联样式 HTML，附手机预览壳（6 主题 + Mac 视窗代码块 + 媒体占位 + footer 分离）。
author: 行途 (xingtu1996)
license: MIT
tags: typograph, markdown, wechat, mp, content
dsh_compatible: true
---

# md2wechat-typograph · 行途排版引擎 Skill

把 Markdown 一键转成微信公众号可粘贴的排版 HTML——全内联样式、零失真、断网也能跑。

## 何时使用

- 用户给出 Markdown 草稿，要求「发到公众号」「公众号排版」「转微信格式」
- 用户要求「按 36氪 / 少数派 / 行途蓝 / GitHub 风格排版」
- 用户要求「把 md 转成公众号版」
- 用户要求「给 md 加封面/插图占位」「文末加免责声明」

不要在用户没有提到排版/公众号时主动触发。

## 工作流

1. **识别输入**：Markdown 文本（可能含 # 标题、`**` 加粗、表格、代码块、图片引用）
2. **询问偏好（一次就够）**：
   - 主题？默认 `byte`（行途蓝）。其他：`code` / `business` / `review` / `ink` / `warm` / `pure` / `symbol`
   - 自定义主色？留空则用主题默认
3. **执行**：
   ```bash
   # 写入临时 md 文件
   path/to/md2wechat/bin/md2wechat.js /tmp/article.md -o /tmp/article.公众号版.html \
       --theme byte \
       --footer
   ```
4. **交付**：
   - 给出预览壳路径：`/tmp/article.公众号版.html`
   - 提示用户双击打开 → 点「复制到公众号」→ 进微信后台新建图文 → 粘贴
   - 若有图片占位，提示用户公众号后台手动插入
5. **可选增量**：用户要求换主题或加图注 → 改 md 重跑 → 不重复造轮子

## 命令清单

| 命令 | 说明 |
| --- | --- |
| `md2wechat <md> [-o html]` | 生成手机预览壳（默认主题 byte） |
| `--theme <id>` | 切换主题（byte/github/focus36/sspai/ink/terracotta） |
| `--color <hex>` | 覆盖主色（如 `--color #FF6B35`） |
| `--stdout` | 只输出正文 HTML（管道） |
| `--no-footer` | 禁用文末 footer 分离 |
| `--list-themes` | 列出全部主题 |
| `--images <mode>` | placeholder / drop / keep |
| `--links <mode>` | text / keep / drop |

## Markdown 子集提示

| 语法 | 用途 |
| --- | --- |
| `# 标题` | 公众号标题单独填，正文 H1 默认不渲染 |
| `## H2` / `### H3` | 章节标题，形态随主题 |
| `**加粗**` `*斜体*` `~~删除~~` | 行内 |
| `` `code` `` ```` ```代码块``` ```` | 行内/块级 |
| `> 引用` | 块级引用 |
| `- [x] 任务项` | 任务列表（checkbox） |
| `\| a \| b \|\n\| --- \| ---: \|` | 表格 + 对齐 |
| `![alt](url)` | 图片占位卡（公众号手动插入） |
| `[视频：标题]` `[音频：标题]` | 媒体占位卡 |
| `*图注：xxx*` | 居中灰色小字 |
| 文末 `---` | 之后内容自动当 footer 小字 |

## 配套命令（深 CLI 友好）

如果用户的 md 来自 Obsidian / 飞书 / 笔记软件，让用户保存到本地 md 文件后调用 CLI。**禁止让用户把 md 粘贴在对话里长篇渲染**（消耗 token 且不必要）。

## 失败模式

- 用户没安装 md2wechat → 指引用户安装或给单文件工作台（根目录 `index.html` 双击）
- 用户要求「AI 智能排版」→ 拒绝（确定性是 md2wechat 的卖点）；引导手动选主题
- 公众号粘贴样式丢失 → 99% 是用户没复制 #content 区域；指引重新操作
- 图片粘贴不出来 → md2wechat 默认输出占位卡（公众号图片需后台手动上传），不是 bug

## 例子

**用户输入**：
> 把这篇文章按行途蓝排版，发公众号

**操作**：
```bash
# 1. 写出临时 md（来自用户附件/粘贴）
# 2. 执行
node /path/to/md2wechat/bin/md2wechat.js /tmp/post.md -o /tmp/post.公众号版.html \
    --theme byte
```

**回复用户**：
> 已生成预览壳：`/tmp/post.公众号版.html`
> 操作：双击打开 → 点右上「复制到公众号」→ 进微信后台新建图文 → Ctrl+V 粘贴。
> 文章中的图片位置会自动显示「🖼️ 图片」占位卡，请在公众号后台对应位置手动插入真实图片。

## 关联资产

- **仓库**：[xingtu1996/md2wechat](https://github.com/xingtu1996/md2wechat)
- **CLI 文档**：`md2wechat --help`
- **引擎**：`lib/engine.js`（Node CommonJS，浏览器 UMD 同源）
- **单文件工作台**：根目录 `index.html`（38KB 零依赖双击即用）

## AIGC 声明

本 Skill 文档由行途 + AI 辅助生成。MIT 协议，欢迎改造与分发。