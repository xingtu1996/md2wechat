#!/usr/bin/env node
/**
 * md2wechat · 工作台构建脚本
 * 把 lib/engine.js 内联进 app/template.html → 产出根目录 index.html（单文件、零 CDN、双击即用）
 *
 * 用法: node tools/build-app.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const tplPath = path.join(ROOT, 'app', 'template.html');
const outPath = path.join(ROOT, 'index.html');
const enginePath = path.join(ROOT, 'lib', 'engine.js');

const tpl = fs.readFileSync(tplPath, 'utf-8');
const engine = fs.readFileSync(enginePath, 'utf-8');

if (!tpl.includes('/*__ENGINE__*/')) {
  console.error('错误：template.html 缺少 /*__ENGINE__*/ 注入占位符');
  process.exit(1);
}

const out = tpl.replace('/*__ENGINE__*/', () => engine);
fs.writeFileSync(outPath, out, 'utf-8');
console.log('✅ 已构建: ' + path.relative(ROOT, outPath) + ' (' + (out.length / 1024).toFixed(1) + ' KB, 零依赖单文件)');
