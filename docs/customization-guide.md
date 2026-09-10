# 定制化指南：主题、模板与付费定制服务

> 本文档面向**想自定义 md2wechat 主题**的用户，以及考虑购买定制化服务的客户。md2wechat 核心引擎 MIT 开源、永远免费；定制化主题、行业模板包、品牌定制服务是官方支持的增值方向。

---

## 一、主题配置长什么样

一个主题本质上就是一个 **JSON 对象**。核心字段只有一个必填（`main` 主色），其余都有默认值。

| 字段 | 必填 | 取值 | 说明 |
| --- | --- | --- | --- |
| `main` | 是 | hex，如 `#056DE8` | 主色，贯穿标题/强调/代码色 |
| `name` | 否 | 字符串 | 主题名，默认用 ID |
| `group` | 否 | 字符串 | 分组，默认 `自定义` |
| `h2` | 否 | 见下表 | 二级标题样式 |
| `h3` | 否 | 见下表 | 三级标题样式 |
| `quote` | 否 | 见下表 | 引用块样式 |
| `pre` | 否 | `dark` / `light` | 代码块明暗，默认 `dark` |
| `dot` | 否 | hex | 强调点色，默认等于 `main` |
| `text` | 否 | hex | 正文文字色 |
| `codeText` | 否 | hex | 行内代码色 |
| `codeBg` | 否 | hex | 行内代码背景色 |
| `desc` | 否 | 字符串 | 主题描述 |

`h2` 可选形态：

| 值 | 效果 |
| --- | --- |
| `bar` | 左侧色条标题 |
| `line` | 下划线标题 |
| `lineAccent` | 主色下划线 + 主色字 |
| `center` | 居中主色块标题 |
| `centerText` | 居中大标题（成长/故事风） |
| `plain` | 纯文字标题，无色块 |
| `symbol` | 符号前缀技术风 |
| `number` | 序号大数字（编辑杂志风） |
| `techprog` | 章节编号 + 分段进度条（InfoQ 风） |

`h3` 可选：`bar`（左侧色条）、`line`（虚线）、`plain`（纯文字）。

`quote` 可选：`soft`（主色淡底）、`softWarm`（暖底）、`softCenter`（居中斜体）、`plain`（灰边素引用）。

---

## 二、用 registerTheme 注册自定义主题（完整可运行示例）

不改引擎源码，在 Node 里调 `registerTheme(id, config)` 即可注入新主题。下面这个脚本完整可跑（在仓库根目录）：

```js
#!/usr/bin/env node
// custom-theme.js — 注册一个自定义主题并渲染验证
const fs = require('fs');
const engine = require('./lib/engine.js');

// 1. 定义品牌主题（配色取自品牌 VI）
const myBrand = {
  name: '我的品牌蓝绿',
  group: '品牌定制',
  main: '#0E7C66',          // 品牌主色（必填）
  text: '#2b2b2b',          // 正文色
  codeText: '#0E7C66',      // 行内代码色
  dot: '#0E7C66',
  h2: 'bar',                // 左侧色条
  h3: 'line',               // 虚线副标题
  quote: 'soft',            // 主色淡底引用
  pre: 'dark',              // 深色代码块
  desc: '为某品牌定制的公众号正文主题'
};

// 2. 注册（返回 {ok, id, theme}）
const reg = engine.registerTheme('my-brand', myBrand);
console.log('注册结果:', JSON.stringify(reg.ok), reg.id);

// 3. 用新主题渲染
const md = fs.readFileSync('examples/demo.md', 'utf-8');
const result = engine.renderToJSON(md, { theme: 'my-brand' });

// 4. 写出预览壳需要的正文 HTML
fs.writeFileSync('/tmp/my-brand-preview.html', result.html, 'utf-8');
console.log('主色:', result.mainColor, '| 字数:', result.wordCount);
```

运行：

```bash
node custom-theme.js
```

> 深色代码块的背景/文字色由引擎根据 `main` 自动推导，无需手填；要浅色代码块就把 `pre` 设为 `light`。

---

## 三、主题 JSON 的导入与导出（工作台）

单文件工作台 `index.html` 内置了图形化的主题导入/导出，不用写代码。

### 3.1 导出当前主题

在工作台里选好任意主题，点顶部工具栏的**「导出主题」**按钮，浏览器会下载一个 `md2wechat-theme-<主题ID>.json` 文件。它的结构就是第三节那张表，例如：

```json
{
  "name": "行途蓝",
  "group": "科技实战",
  "main": "#056DE8",
  "h2": "bar",
  "h3": "line",
  "quote": "soft",
  "pre": "dark",
  "dot": "#056DE8",
  "text": "#3f3f3f",
  "codeText": "#056DE8",
  "desc": "品牌默认：沉稳蓝 + 干净留白，适合 AI 工程化/技术深度文",
  "id": "byte"
}
```

### 3.2 导入主题

点**「导入主题」**按钮，选一个 `.json` 文件即可。工作台内部流程：

1. 读文件 → `JSON.parse`；
2. 校验必须有 `main` 字段，否则报错；
3. 用 `config.id` 作为主题 ID（没有就自动生成 `custom_<时间戳>`）；
4. 调 `registerTheme(id, config)` 注册并立即应用。

这意味着：**主题 JSON 可以直接发给别人，对方导入即用**，是主题包/定制服务的交付物格式。

### 3.3 用 Node 导出内置主题 JSON

不打开工作台，也可以用命令行把内置主题导成 JSON：

```bash
node -e '
const e = require("./lib/engine.js");
const fs = require("fs");
const cfg = e.exportTheme("byte");
cfg.id = "byte";
fs.writeFileSync("/tmp/byte-theme.json", JSON.stringify(cfg, null, 2));
console.log("已导出", Object.keys(cfg).join(", "));
'
```

---

## 四、定制 footer / 文末模块

md2wechat 的"文末区"不是一个可填色的组件，而是 **Markdown 末尾的 `---` 分隔线之后的纯文本**。规则（v2.2.1 起）：

- 在正文最后放一行独立的 `---`；
- 它之后的内容**必须是纯文本**（没有标题、列表、表格、代码块、引用），才会被识别为 footer，渲染成虚线分隔 + 灰色小字；
- 如果 `---` 后面还有标题/列表等，引擎认为这只是章节分隔线，不会劫持成 footer。

示例（见 `examples/demo.md` 末尾）：

```markdown
## 三、我的工具观

工具不是目的，**解决问题才是**。

---

**行途技术手记** | 关注 AI 时代的工程师成长与效率提升。
排版 | md2wechat 行途排版引擎（v2.2）
声明：未经授权，禁止抓取本文用于训练 AI 大模型。
```

关闭 footer 分离：

- CLI：加 `--no-footer`；
- Node：`engine.render(md, { footer: false })`。

footer 的样式由引擎统一控制（13px、灰色、顶部虚线），当前版本不开放逐字段自定义。要更花哨的文末模块（二维码卡片、关注引导），建议在公众号编辑器里正文粘贴后再手动追加，或走定制服务。

---

## 五、付费定制化服务（定价参考）

> 以下价格为官方建议区间，仅供参考，最终以实际沟通为准。核心引擎与 12 个内置主题永远 MIT 免费。

| 档位 | 价格区间 | 交付内容 |
| --- | --- | --- |
| 单主题定制 | ¥199 - 499 | 1 个品牌主题 JSON（含主色/标题形态/代码块风格），交付可导入工作台的 `.json` + 1 篇示例预览 |
| 行业/场景模板包 | ¥49 - 299 | 见 `templates/README.md`，多套主题 JSON + 示例 Markdown + 预览 |
| 品牌全套定制 | ¥999 - 2999 | 企业公众号全套视觉：主色体系 + 3~5 个主题 + footer/文末规范 + 排版 SOP 文档 |
| 企业级定制 | ¥5000+ | 引擎二次开发、私有部署、团队多账号规范、CI 接入、MCP Server 封装等 |

定制流程：沟通品牌 VI / 目标读者 → 出 1~2 稿主题 JSON → 客户导入工作台试排 → 按反馈微调 → 交付 `.json` 与使用说明。

---

## 六、技术要点

- 主题是**纯数据 JSON**，不是 CSS 文件；换肤零代码改动。
- 所有样式在渲染时**内联到每个标签**，公众号粘贴不失真。
- `registerTheme` 只往内存里加主题，不写盘、不改引擎文件；持久化靠导出 JSON。
- 主题包的技术实现 = `registerTheme` + 一套预设的 Markdown 结构规范（见 `templates/`）。
