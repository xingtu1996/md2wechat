# 免费模板：行途蓝技术文章

面向**技术深度文 / 工程实践 / AI 工具链教程**的排版模板。基于内置 `byte` 主题（行途蓝 #056DE8），左侧色条标题 + 深色代码块，干净留白。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `template.md` | 标准技术文骨架，替换占位文字即可 |
| `theme.json` | 主题配置，可导入工作台或 `registerTheme` |
| `README.md` | 本说明 |

## 使用

### 方式一：直接用内置 byte 主题（最快）

```bash
cp templates/byte-tech-article/template.md my-post.md
# 编辑 my-post.md，替换占位内容
node bin/md2wechat.js my-post.md --theme byte -o my-post.html
```

### 方式二：导入 theme.json 到工作台

1. 打开根目录 `index.html`；
2. 点「导入主题」，选本目录的 `theme.json`；
3. 把 `template.md` 内容粘进左侧编辑器，右侧实时预览。

### 方式三：Node 流水线注册

```js
const engine = require('./lib/engine.js');
engine.registerTheme('byte-tech-article', require('./templates/byte-tech-article/theme.json'));
```

## 结构规范

本模板的 `template.md` 固定为：标题 → 摘要引用 → 为什么写这篇 → 核心做法（三步）→ 小结 → footer。写技术文时保持这个骨架，读者预期最稳定。

## 许可

MIT，可自由使用、改造、二次分发。
