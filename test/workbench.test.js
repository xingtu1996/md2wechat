/**
 * md2wechat · 工作台内嵌引擎漂移守卫（node:test，零依赖）
 * index.html 是单文件交付物，内嵌一份引擎副本。
 * 本测试把它抽出来实跑，确保与 lib/engine.js 行为完全一致，防止再次出现「工作台与 CLI 渲染不一致」。
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

// 抽出 index.html 里 <script> 内的引擎块（/** … });）
function extractEmbeddedEngine() {
  const lines = fs.readFileSync(INDEX, 'utf-8').split('\n');
  const start = lines.findIndex((l) => l === '/**');
  assert.ok(start > 0, 'index.html 中未找到引擎块起始注释');
  assert.strictEqual(lines[start - 1], '<script>', '引擎块应由 <script> 包裹');
  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i] === '});') { end = i; break; }
  }
  assert.ok(end > start, 'index.html 中未找到引擎块结束符 });');
  return lines.slice(start, end + 1).join('\n') + '\n';
}

function loadEmbedded() {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'md2wechat-wb-')), 'embedded.js');
  fs.writeFileSync(tmp, extractEmbeddedEngine(), 'utf-8');
  return require(tmp);
}

test('工作台内嵌引擎：版本与 CLI 引擎一致', () => {
  const emb = loadEmbedded();
  const cli = require(path.join(ROOT, 'lib', 'engine.js'));
  assert.strictEqual(emb.version, cli.version, '内嵌引擎版本应与 lib/engine.js 一致');
  assert.deepStrictEqual(emb.themeKeys, cli.themeKeys, '主题集合应一致');
});

test('工作台内嵌引擎：所有主题渲染结果与 CLI 逐字节一致', () => {
  const emb = loadEmbedded();
  const cli = require(path.join(ROOT, 'lib', 'engine.js'));
  const md = fs.readFileSync(path.join(ROOT, 'examples', 'demo.md'), 'utf-8');
  emb.themeKeys.forEach((id) => {
    assert.strictEqual(
      emb.render(md, { theme: id }).html,
      cli.render(md, { theme: id }).html,
      '主题 ' + id + ' 在工作台与 CLI 下渲染不一致'
    );
  });
});

test('工作台内嵌引擎：v2.4 能力（格式件 / 署名 / 发布就绪）已同步', () => {
  const emb = loadEmbedded();
  const html = emb.render('本章摘要：摘要内容\n', { theme: 'byte' }).html;
  assert.ok(html.includes('本章摘要'), '行途格式件应生效');
  assert.ok(emb.render('# T\n\n正文', { theme: 'byte' }).html.includes('排版引擎：墨排'), '署名页脚应生效');
  ['extractSummary', 'coverAdvice', 'publishCheck', 'toVariant'].forEach((fn) => {
    assert.strictEqual(typeof emb[fn], 'function', '缺少发布就绪 API：' + fn);
  });
  assert.strictEqual(emb.toVariant('# T\n\n正文', 'zhihu').startsWith('## T'), true, '变体能力应与 CLI 一致');
});

test('工作台内嵌引擎：HTML 注释剥离正则与 CLI 一致（2.2.2 快照曾缺 --）', () => {
  const block = extractEmbeddedEngine();
  assert.ok(block.includes('/<!--[\\s\\S]*?-->/'), '应为 /<!--[\\s\\S]*?-->/');
  assert.ok(!block.includes('/<![\\s\\S]*?-->/'), '不应出现缺 -- 的错误写法');
});
