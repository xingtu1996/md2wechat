#!/usr/bin/env node
/**
 * md2wechat CLI v2.0 — Markdown → 微信公众号排版
 * 行途排版引擎（XingTu Typograph Engine）命令行入口
 *
 * 用法：
 *   node md2wechat.js <input.md> [-o out.html] [选项]
 *   node md2wechat.js <input.md> --stdout        # 仅输出正文 HTML（供管道）
 *
 * 选项：
 *   -o, --output <file>   输出路径（默认同目录 <名>.公众号版.html）
 *   --theme <id>          主题：byte|code|business|review|ink|warm|pure|symbol|editorial|terminal|infotech|cyber（默认 byte，--list-themes 看全量）
 *   --list-themes         列出所有可用主题
 *   --color <hex>         自定义主色，覆盖当前主题（如 --color #FF6B35）
 *   --title <text>        预览标题（默认取 md 首个 # 标题）
 *   --no-footer           禁用文末 --- 后 footer 小字分离
 *   --[no-]signature      文末署名页脚（品牌行 + 排版引擎行 + 版权行，默认开）
 *   --links <mode>        keep|text|drop（默认 text：微信禁外链，url 转角标）
 *   --images <mode>       placeholder|drop|keep（默认 placeholder：图位置占位卡）
 *   --stdout              只打印正文 section HTML，不生成预览壳
 *   -q, --quiet           安静模式
 *
 * 行途格式件（v2.4）：块级语义前缀自动成块——
 *   本章摘要：…（浅底摘要块）｜个人观点：/我的判断：/一句话总结：/小答案：（强调观点块）
 *   数据来源：/数据口径：/备注：/注：（小字注释行）
 *
 * 作者：行途（xingtu1996）· 部分代码由 AI 辅助生成 · MIT
 */
'use strict';
const fs = require('fs');
const path = require('path');
const engine = require('../lib/engine.js');

function parseArgs(argv) {
  const a = { input: null, output: null, theme: 'byte', color: null, title: null,
              footer: true, links: 'text', images: 'placeholder', stdout: false, quiet: false,
              signature: true };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case '-o': case '--output': a.output = next(); break;
      case '--theme': a.theme = next(); break;
      case '--color': a.color = next(); break;
      case '--title': a.title = next(); break;
      case '--links': a.links = next(); break;
      case '--images': a.images = next(); break;
      case '--no-footer': a.footer = false; break;
      case '--signature': a.signature = true; break;
      case '--no-signature': a.signature = false; break;
      case '--stdout': a.stdout = true; break;
      case '-q': case '--quiet': a.quiet = true; break;
      case '--list-themes': a.listThemes = true; break;
      case '-h': case '--help': a.help = true; break;
      default:
        if (arg.startsWith('-')) { console.error('未知参数: ' + arg); a.help = true; }
        else rest.push(arg);
    }
  }
  a.input = rest[0];
  return a;
}

function listThemes() {
  const keys = engine.themeKeys;
  const rows = keys.map(function (k) {
    const t = engine.themeTokens(k);
    return '  ' + k.padEnd(12) + ' ' + t.name + '  [' + t.group + ']  ' + t.main;
  });
  return '可用主题：\n' + rows.join('\n');
}

function buildShell(title, themeId, themeName, main, sectionHtml, words) {
  const isLong = words > 18000;
  const copyJs = `function copyHtml(){const box=document.getElementById('content');const r=document.createRange();r.selectNodeContents(box);const s=getSelection();s.removeAllRanges();s.addRange(r);let ok=false;try{ok=document.execCommand('copy');}catch(e){}s.removeAllRanges();const tip=document.getElementById('tip');if(ok){tip.textContent='✅ 已复制！去公众号编辑器 Ctrl+V 粘贴';tip.style.color='#00a854';}else{tip.textContent='⚠️ 复制失败：请手动全选正文 → Ctrl+C';tip.style.color='#cf1322';}}`;
  const wc = isLong
    ? '<span style="color:#cf1322;font-weight:700;">' + words.toLocaleString() + ' 字 · 超长预警</span>'
    : '<span style="color:#8b949e;">' + words.toLocaleString() + ' 字</span>';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escAttr(title)} · 公众号排版预览</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#eef1f5;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Helvetica Neue',Helvetica,Arial,sans-serif}
  .toolbar{position:sticky;top:0;z-index:10;background:#fff;border-bottom:1px solid #e5e9ef;display:flex;align-items:center;gap:12px;padding:10px 16px}
  .toolbar .t-title{font-weight:700;font-size:15px;color:#1f2329;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .chip{font-size:12px;background:#f2f4f7;border-radius:20px;padding:4px 12px;color:#5c6370;white-space:nowrap}
  .chip.main{background:${main};color:#fff}
  .btn{border:none;border-radius:8px;padding:8px 18px;font-size:14px;font-weight:700;cursor:pointer;background:${main};color:#fff;white-space:nowrap}
  .btn:hover{opacity:.92}
  .hint{font-size:12px;color:#8b949e;text-align:center;margin:14px auto 0;max-width:520px}
  #tip{flex:1;text-align:right;font-size:13px;color:#8b949e}
  .page{max-width:560px;margin:0 auto;padding:22px 0 80px}
  .phone{background:#fff;border-radius:14px;box-shadow:0 12px 32px rgba(31,35,41,.10);overflow:hidden;margin:0 auto;max-width:520px}
  .phone-head{height:44px;background:#f7f8fa;border-bottom:1px solid #eceff3;display:flex;align-items:center;justify-content:center;color:#1f2329;font-size:13px;font-weight:600;letter-spacing:.5px}
  .phone-body{padding:22px 20px 46px}
</style>
</head>
<body>
<div class="toolbar">
  <div class="t-title">${escAttr(title)}</div>
  <div class="chip main">${themeName}</div>
  <div class="chip">${wc}</div>
  <button class="btn" onclick="copyHtml()">复制到公众号</button>
</div>
<div class="hint">⌘ 打开此文件 → 点「复制到公众号」→ 微信编辑器粘贴（样式全内联，零失真）。图片为占位卡，请在公众号后台对应位置插入。修改源 md 后重跑 CLI 即可。</div>
<div class="page"><div class="phone"><div class="phone-head">公众号正文预览</div><div class="phone-body" id="content">${sectionHtml}</div></div><div id="tip" style="padding:14px;text-align:center;"></div></div>
<script>${copyJs}</script>
</body>
</html>`;
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.help) {
    console.log('md2wechat v' + engine.version + ' · 行途排版引擎 CLI\n');
    console.log('用法: node md2wechat.js <input.md> [-o out.html] [选项]');
    console.log('选项见文件头注释。示例:');
    console.log('  node md2wechat.js demo.md --theme pure');
    console.log('  node md2wechat.js demo.md --no-signature --stdout > body.html');
    return;
  }
  if (a.listThemes) { console.log(listThemes()); return; }
  if (!a.input) { console.error('错误：缺少输入文件。\n用法: node md2wechat.js <input.md> [-o out.html]'); process.exit(1); }
  if (!engine.themes[a.theme]) { console.error('未知主题: ' + a.theme + '\n' + listThemes()); process.exit(1); }
  if (!fs.existsSync(a.input)) { console.error('文件不存在: ' + a.input); process.exit(1); }

  const md = fs.readFileSync(a.input, 'utf-8');
  const res = engine.render(md, {
    theme: a.theme,
    color: a.color || undefined,
    title: a.title || undefined,
    footer: a.footer,
    links: a.links,
    images: a.images,
    signature: a.signature,
  });
  const words = engine.countWords(res.html);
  const t = engine.themeTokens(a.theme);

  if (a.stdout) {
    process.stdout.write(res.html + '\n');
    return;
  }

  const base = path.basename(a.input, path.extname(a.input));
  const outPath = a.output || path.join(path.dirname(a.input), base + '.公众号版.html');
  const shell = buildShell(res.title || base, a.theme, t.name, res.main, res.html, words);
  fs.writeFileSync(outPath, shell, 'utf-8');
  if (!a.quiet) {
    console.log('✅ 已生成: ' + outPath);
    console.log('   标题: ' + (res.title || base) + '  · 正文约 ' + words.toLocaleString() + ' 字  · 主题: ' + t.name + ' ' + t.main);
  }
}

main();
