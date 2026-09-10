# 免费模板：黑白极简随笔

面向**随笔 / 个人思考 / 深度长文**的排版模板。基于内置 `pure` 主题（#1a1a1a），零色块、纯文字标题、灰边素引用、浅色代码块，大量留白，像一本排版克制的小册子。

## 文件说明

| 文件 | 用途 |
| --- | --- |
| `template.md` | 极简随笔骨架，替换占位文字即可 |
| `theme.json` | 主题配置，可导入工作台或 `registerTheme` |
| `README.md` | 本说明 |

## 使用

### 方式一：直接用内置 pure 主题（最快）

```bash
cp templates/pure-minimal-article/template.md my-essay.md
# 编辑 my-essay.md，替换占位内容
node bin/md2wechat.js my-essay.md --theme pure -o my-essay.html
```

### 方式二：导入 theme.json 到工作台

1. 打开根目录 `index.html`；
2. 点「导入主题」，选本目录的 `theme.json`；
3. 把 `template.md` 内容粘进左侧编辑器，右侧实时预览。

### 方式三：Node 流水线注册

```js
const engine = require('./lib/engine.js');
engine.registerTheme('pure-minimal-article', require('./templates/pure-minimal-article/theme.json'));
```

## 设计原则

- 不用任何彩色块，让文字本身成为主角；
- 标题不加色条/下划线，靠字号和留白分层；
- 适合 1500~5000 字、需要读者安静读完的长文。

## 许可

MIT，可自由使用、改造、二次分发。
