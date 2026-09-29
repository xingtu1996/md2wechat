/**
 * md2wechat · 引擎单元测试（node:test，零依赖）
 * 覆盖：内联样式 / 12 主题 / 署名开关 / 中文转义 / 发布就绪辅助 / 多平台变体
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const engine = require(path.join(__dirname, '..', 'lib', 'engine.js'));

const SAMPLE = [
  '# 文章主标题',
  '',
  '## 二级标题',
  '',
  '这是**粗体**与`行内代码`的段落。',
  '',
  '- 无序项一',
  '- 无序项二',
  '',
  '1. 有序项一',
  '',
  '```js',
  'const a = 1 < 2 && "x";',
  '```',
].join('\n');

test('内联样式：H2 / 粗体 / 行内 code 都带 style 且用主题主色', () => {
  const { html } = engine.render(SAMPLE, { theme: 'byte' });
  assert.ok(/<h2 style="[^"]*border-left:4px solid #056DE8/.test(html), 'H2 应为 byte 主题左竖条形态');
  assert.ok(html.includes('<strong style="color:#056DE8;font-weight:600;">粗体</strong>'), '粗体应内联主题主色');
  assert.ok(/<code style="[^"]*color:#056DE8[^"]*">行内代码<\/code>/.test(html), '行内 code 应内联样式');
});

test('内联样式：代码块内容被转义，标签不会被浏览器当真', () => {
  const { html } = engine.render(SAMPLE, { theme: 'byte' });
  assert.ok(html.includes('const a = 1 &lt; 2 &amp;&amp; &quot;x&quot;;'), '代码块内的 < & " 必须转义');
  assert.ok(html.includes('<pre style="'), '代码块应为 pre + 内联样式');
});

test('内联样式：列表扁平化为带缩进的 p 伪列表（公众号零失真方案）', () => {
  const { html } = engine.render(SAMPLE, { theme: 'byte' });
  assert.ok(html.includes('• 无序项一'), '无序列表应带 • 前缀');
  assert.ok(html.includes('1. 有序项一'), '有序列表应尊重作者写的数字');
  assert.ok(/<p style="margin:0 2px 8px 2px;/.test(html), '列表项应带左右缩进');
  assert.ok(!html.includes('<ul'), '公众号场景不应输出 ul 标签');
});

test('12 个主题都能无异常渲染，且产出非空 section', () => {
  const keys = engine.themeKeys;
  // README 主题矩阵文档化的 12 个（引擎另含未文档化的 reviewBlack 变体）
  const DOCUMENTED = ['byte', 'code', 'pure', 'symbol', 'infotech', 'cyber',
    'business', 'review', 'ink', 'warm', 'editorial', 'terminal'];
  DOCUMENTED.forEach((id) => assert.ok(keys.includes(id), '缺少主题 ' + id));
  assert.ok(keys.length >= 12, '内置主题应不少于 12 个，实际 ' + keys.length);
  keys.forEach((id) => {
    const r = engine.render(SAMPLE, { theme: id });
    assert.ok(r.html.startsWith('<section style="'), id + ' 应以 section 开头');
    assert.ok(r.html.endsWith('</section>'), id + ' 应以 section 结尾');
    assert.ok(engine.countWords(r.html) > 0, id + ' 字数应大于 0');
    assert.strictEqual(r.theme, engine.themeAliases[id] || id, id + ' 主题 ID 应解析正确');
  });
});

test('署名页脚：默认开启，--no-signature 关闭', () => {
  const on = engine.render('# T\n\n正文', { theme: 'byte' }).html;
  const off = engine.render('# T\n\n正文', { theme: 'byte', signature: false }).html;
  assert.ok(on.includes('排版引擎：墨排'), '默认应带署名页脚');
  assert.ok(!off.includes('排版引擎：墨排'), '--no-signature 后不应有署名页脚');
  assert.ok(on.length > off.length, '署名页脚应增加输出长度');
});

test('中文不被转义破坏：中文原样保留，HTML 敏感字符被转义', () => {
  const md = '# 中文标题\n\n中文段落，含「引号」与 & 符号以及 <script> 标签。\n';
  const { html } = engine.render(md, { theme: 'byte' });
  assert.ok(html.includes('中文段落，含「引号」'), '中文与中文标点应原样保留');
  assert.ok(html.includes('&amp;'), '& 应转义为 &amp;');
  assert.ok(html.includes('&lt;script&gt;'), '<script> 应转义');
  assert.ok(!/&#x?[0-9a-fA-F]+;/.test(html), '不应出现数字实体（中文被编码的迹象）');
  const words = engine.countWords(html);
  assert.ok(words >= 10, '中文应被计入字数，实际 ' + words);
});

test('标题提取与主题解析：H1 提取为标题、旧 ID 自动映射', () => {
  const r = engine.render(SAMPLE, { theme: 'github' });
  assert.strictEqual(r.title, '文章主标题');
  assert.strictEqual(r.theme, 'code', 'github 应映射到 code');
});

test('发布就绪：摘要自动提取 ≤120 字，优先显式摘要', () => {
  const s1 = engine.extractSummary('摘要：这是作者手写的摘要，应被优先采用。\n\n正文段落。\n');
  assert.strictEqual(s1, '这是作者手写的摘要，应被优先采用。');

  const long = '中国人' .repeat(200);
  const s2 = engine.extractSummary('# 标题\n\n' + long + '。第二句。\n');
  assert.ok(s2.length <= 120, '摘要应 ≤120 字，实际 ' + s2.length);
  assert.ok(s2.length > 0, '摘要不应为空');

  assert.strictEqual(engine.extractSummary(''), '', '空输入应返回空摘要');
});

test('发布就绪：封面提示在无图时给出建议', () => {
  const noImg = engine.coverAdvice('# T\n\n纯文字正文。\n');
  assert.strictEqual(noImg.hasImage, false);
  assert.strictEqual(noImg.need, true);
  assert.ok(noImg.advice.some((s) => s.includes('900×383')), '应给出封面尺寸建议');

  const withImg = engine.coverAdvice('# T\n\n【配图：引子图.png】\n');
  assert.strictEqual(withImg.hasImage, true);
  assert.strictEqual(withImg.hasHero, true);
  assert.ok(withImg.advice.some((s) => s.includes('首图作封面')));
});

test('发布就绪：publishCheck 返回 6 项清单且摘要/封面自动填值', () => {
  const r = engine.publishCheck('# 标题\n\n' + '正文内容。'.repeat(200), { theme: 'byte' });
  assert.strictEqual(r.total, 6);
  assert.strictEqual(r.items.length, 6);
  assert.deepStrictEqual(r.items.map((i) => i.key),
    ['title', 'words', 'images', 'summary', 'cover', 'original']);
  const sum = r.items.find((i) => i.key === 'summary');
  assert.strictEqual(sum.status, 'ok');
  assert.ok(sum.value.length > 0 && sum.value.length <= 120);
  assert.ok(r.words >= 1000, '字数应达标');
  assert.ok(r.pass >= 3);
});

test('多平台变体：知乎下沉标题层级、掘金保留', () => {
  const md = '# 主标题\n\n## 小节\n\n正文\n';
  const zhihu = engine.toVariant(md, 'zhihu');
  const juejin = engine.toVariant(md, 'juejin');
  assert.ok(zhihu.startsWith('## 主标题'), '知乎 H1 应下沉为 H2');
  assert.ok(zhihu.includes('### 小节'));
  assert.ok(juejin.startsWith('# 主标题'), '掘金应保留 H1');
  assert.ok(juejin.includes('## 小节'));
});

test('多平台变体：行途私有语法降级 + 去内联样式 + 缩进代码转 fence', () => {
  const md = [
    '---',
    'title: t',
    '---',
    '',
    '<!-- 内部注释 -->',
    '',
    '本章摘要：这是摘要。',
    '',
    '【配图：引子图.png】',
    '',
    '[视频：demo.mp4]',
    '',
    '正文<span style="color:red">带内联样式</span>。',
    '',
    '    缩进代码一',
    '    缩进代码二',
  ].join('\n');
  const out = engine.toVariant(md, 'zhihu');
  assert.ok(!out.includes('title: t'), 'frontmatter 应剥离');
  assert.ok(!out.includes('内部注释'), 'HTML 注释应剥离');
  assert.ok(out.includes('> **本章摘要**：这是摘要。'), '语义块应降级为引用');
  assert.ok(out.includes('![引子图.png](images/引子图.png)'), '配图占位应转标准图片语法');
  assert.ok(out.includes('> 待插入视频：demo.mp4'), '视频占位应降级为提示');
  assert.ok(!out.includes('style='), '内联样式应被去掉');
  assert.ok(out.includes('```\n缩进代码一\n缩进代码二\n```'), '缩进代码块应转标准 fence');
});

test('多平台变体：未知变体应抛错', () => {
  assert.throws(() => engine.toVariant('# T', 'weibo'), /未知变体/);
});

test('零依赖契约：package.json 的 dependencies 为空', () => {
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  assert.ok(!pkg.dependencies, '不应存在 dependencies 字段');
  assert.ok(!pkg.devDependencies, '不应存在 devDependencies 字段');
});
