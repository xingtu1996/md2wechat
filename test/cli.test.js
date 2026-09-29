/**
 * md2wechat · CLI 端到端测试（node:test + child_process，零依赖）
 * 真实跑 bin/md2wechat.js，验证开关与退出码
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const BIN = path.join(ROOT, 'bin', 'md2wechat.js');
const DEMO = path.join(ROOT, 'examples', 'demo.md');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2wechat-test-'));
const WORK = path.join(tmpDir, 'sample.md');
fs.writeFileSync(WORK, [
  '# 零依赖排版引擎',
  '',
  '> 这是引子段落，用于检验摘要自动提取是否优先取引用块。',
  '',
  '## 小节一',
  '',
  '中文段落，含**粗体**与`代码`。',
  '',
  '【配图：引子图.png】',
  '',
  '```js',
  'const a = 1 < 2;',
  '```',
].join('\n') + '\n', 'utf-8');

function run(args) {
  return execFileSync(process.execPath, [BIN].concat(args), { encoding: 'utf-8' });
}

function runFail(args) {
  try {
    execFileSync(process.execPath, [BIN].concat(args), { encoding: 'utf-8', stdio: 'pipe' });
    return { code: 0, out: '', err: '' };
  } catch (e) {
    return { code: e.status, out: e.stdout || '', err: e.stderr || '' };
  }
}

test('CLI：--stdout 输出正文 HTML，默认带署名页脚', () => {
  const out = run([WORK, '--stdout']);
  assert.ok(out.startsWith('<section style="'), '应输出 section');
  assert.ok(out.includes('排版引擎：墨排'), '默认应带署名页脚');
  assert.ok(out.includes('中文段落，含'), '中文应原样保留');
  assert.ok(out.includes('const a = 1 &lt; 2;'), '代码块应转义');
});

test('CLI：--no-signature 开关生效', () => {
  const out = run([WORK, '--stdout', '--no-signature']);
  assert.ok(!out.includes('排版引擎：墨排'), '--no-signature 后不应有署名');
  const on = run([WORK, '--stdout', '--signature']);
  assert.ok(on.includes('排版引擎：墨排'), '--signature 应显式开启署名');
});

test('CLI：--summary 输出 ≤120 字摘要', () => {
  const out = run([WORK, '--summary']).trim();
  const first = out.split('\n')[0];
  assert.ok(first.length > 0, '摘要不应为空');
  assert.ok(first.length <= 120, '摘要应 ≤120 字，实际 ' + first.length);
  assert.ok(first.includes('引子段落'), '应优先取引用块作为摘要');
});

test('CLI：--check 输出 6 项发布检查清单', () => {
  const out = run([WORK, '--check']);
  assert.ok(out.includes('发布检查清单'), '应有清单标题');
  ['文章标题', '正文字数', '图片数量', '摘要', '封面', '原创声明'].forEach((label) => {
    assert.ok(out.includes(label), '清单应包含：' + label);
  });
  assert.ok(/（\d\/6 项达标）/.test(out), '应输出达标计数');
});

test('CLI：--variant zhihu / juejin 输出 Markdown 变体', () => {
  const zhihu = run([WORK, '--variant', 'zhihu', '--stdout']);
  assert.ok(zhihu.startsWith('## 零依赖排版引擎'), '知乎 H1 应下沉为 H2');
  assert.ok(zhihu.includes('![引子图.png](images/引子图.png)'), '配图应转标准图片语法');
  assert.ok(!zhihu.includes('<section'), '变体不应含公众号 HTML');

  const juejin = run([WORK, '--variant', 'juejin', '--stdout']);
  assert.ok(juejin.startsWith('# 零依赖排版引擎'), '掘金应保留 H1');
});

test('CLI：--variant 写盘生成 .知乎版.md', () => {
  const out = run([WORK, '--variant', 'zhihu']);
  const target = path.join(tmpDir, 'sample.知乎版.md');
  assert.ok(fs.existsSync(target), '应生成 ' + target);
  assert.ok(out.includes('已生成'), '应打印成功提示');
});

test('CLI：--list-themes 列出 12 主题', () => {
  const out = run(['--list-themes']);
  assert.ok(out.includes('行途蓝'), '应包含默认主题');
  const lines = out.split('\n').filter((l) => /^\s+\S+\s+\S+\s+\[/.test(l));
  assert.ok(lines.length >= 12, '应列出不少于 12 个主题，实际 ' + lines.length);
});

test('CLI：--theme 主题切换生效', () => {
  const pure = run([WORK, '--stdout', '--theme', 'pure']);
  assert.ok(pure.includes('color:#1a1a1a'), 'pure 主题主色应为 #1a1a1a');
});

test('CLI：错误输入应非零退出', () => {
  const bad = runFail([WORK, '--theme', '不存在的主题']);
  assert.strictEqual(bad.code, 1, '未知主题应退出码 1');
  assert.ok(bad.err.includes('未知主题'), '应提示未知主题');

  const missing = runFail([path.join(tmpDir, '不存在.md')]);
  assert.strictEqual(missing.code, 1, '文件不存在应退出码 1');

  const badVariant = runFail([WORK, '--variant', 'weibo']);
  assert.strictEqual(badVariant.code, 1, '未知变体应退出码 1');
});

test('CLI：默认转换 examples/demo.md 生成 .公众号版.html', () => {
  const outPath = path.join(tmpDir, 'demo.公众号版.html');
  const out = run([DEMO, '-o', outPath, '--theme', 'editorial', '-q']);
  assert.strictEqual(out.trim(), '', '-q 静默模式不应打印');
  assert.ok(fs.existsSync(outPath), '应生成输出文件');
  const shell = fs.readFileSync(outPath, 'utf-8');
  assert.ok(shell.includes('<!DOCTYPE html>'), '应生成预览壳');
  assert.ok(shell.includes('编辑杂志'), '预览壳应显示主题名');
});

test('CLI：--help 输出用法且退出码 0', () => {
  const out = run(['--help']);
  assert.ok(out.includes('md2wechat v' + require(path.join(ROOT, 'lib', 'engine.js')).version), '应输出引擎版本');
  assert.ok(out.includes('用法'), '应输出用法');
});

test('版本对齐：package.json / engine / README badge 三处一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const eng = require(path.join(ROOT, 'lib', 'engine.js'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
  assert.strictEqual(pkg.version, eng.version, 'package.json 与 engine 版本应一致');
  const m = readme.match(/badge\/version-v([\d.]+)-blue/);
  assert.ok(m, 'README 应有 version badge');
  assert.strictEqual(m[1], pkg.version, 'README badge 版本应与 package.json 一致');
});
