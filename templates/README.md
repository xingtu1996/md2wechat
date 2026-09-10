# 模板包：核心引擎免费，行业模板付费

> 对标 shadcn/ui 的"免费组件 + 付费 Blocks"模式：**md2wechat 引擎和 12 个内置主题永远 MIT 免费**，付费点是**经过验证的行业/场景模板包**。

---

## 一、定位

md2wechat 解决的是"把 Markdown 排好看"。但很多人的真正痛点不是"不会选主题"，而是**不知道一篇公众号文章该怎么组织结构**——技术文怎么开头、观点文怎么收、小册章节怎么排。

模板包把"选题结构 + 主题配色 + 文末 CTA"打包成开箱即用的文件，让用户**换内容就能发**。这是核心引擎免费之上的增值层。

| 层 | 内容 | 收费 |
| --- | --- | --- |
| 引擎层 | `lib/engine.js` + 12 主题 + CLI + 工作台 | 永久免费（MIT） |
| 模板层 | 行业/场景模板包（主题 JSON + 示例 MD + 预览 + 说明） | 付费 |
| 服务层 | 品牌全套定制、企业私有部署、MCP 封装 | 付费（见 docs/customization-guide.md） |

---

## 二、规划中的付费模板包

### 1. 公众号爆款排版模板包（¥29 - 49）

10 套经过验证的公众号排版模板，覆盖主流文体：

- 技术深度文（byte / symbol / terminal 风）
- 观点评论文（business / editorial 风）
- 教程步骤文（infotech / pure 风）
- 复盘成长文（ink / warm 风）
- 资讯快讯文（cyber / review 风）

每套含：主题 JSON + 标准结构 MD + 渲染后 HTML 预览 + 使用说明。

### 2. 知识付费小册模板包（¥49 - 69）

小册 / 电子书排版模板，针对长图文连载：

- 封面页样式
- 目录页样式
- 章节页（章节编号 + 进度条）
- 文末 CTA（引导关注 / 试听 / 购买）

### 3. 企业品牌定制模板包（¥199 - 499）

企业公众号品牌视觉模板：

- 主色 + 辅助色体系
- 3~5 个主题（新闻稿 / 产品稿 / 文化稿分场景区分）
- 统一的 footer 文末规范
- 企业字体 / logo 占位规范

---

## 三、模板包的技术实现

一个模板包 = 一个目录，固定四件套：

```
templates/<模板名>/
├── theme.json      # 主题配置（可直接导入工作台 / registerTheme）
├── template.md     # 标准结构 Markdown（占位文字，用户替换）
├── preview.html    # 渲染后的 HTML 预览（可选，随包发布）
└── README.md       # 使用说明
```

底层两步走：

1. **注册主题**：`engine.registerTheme(id, require('./theme.json'))`；
2. **套结构**：把用户内容填进 `template.md` 的标准骨架（标题/摘要/正文/代码块/小结/参考链接），再渲染。

主题 JSON 的字段说明见 [../docs/customization-guide.md](../docs/customization-guide.md)。

---

## 四、免费模板（引流）

本目录内置 2 个免费模板，可直接使用、改造、二次分发：

| 模板 | 主题 | 适用 |
| --- | --- | --- |
| [byte-tech-article](./byte-tech-article/) | byte（行途蓝） | 技术文章：标题/摘要/正文/代码块/小结/参考链接 |
| [pure-minimal-article](./pure-minimal-article/) | pure（黑白极简） | 随笔/深度长文：零色块、大量留白 |

快速试用免费模板：

```bash
# 1. 把 template.md 复制成你的稿
cp templates/byte-tech-article/template.md my-post.md

# 2. 把 theme.json 注册进 Node 流水线，或在工作台导入
# 3. 渲染（byte 本身是内置主题，直接 --theme byte 即可）
node bin/md2wechat.js my-post.md --theme byte -o my-post.html
```

> 付费模板包尚未随 v2.3 发布，上述为路线图。免费模板先跑通"主题 JSON + 结构 MD"的交付格式，付费包沿用同一格式。
