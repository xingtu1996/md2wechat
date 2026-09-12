/**
 * md2wechat engine v2.0
 * 行途排版引擎核心：Markdown → 微信公众号内联样式 HTML
 * ------------------------------------------------------------------
 * 设计哲学：
 *  1. 零依赖（不依赖 marked/markdown-it/任何 npm 包），纯手写解析器
 *  2. 全内联样式：每个元素自带 style，规避微信编辑器吞 <style>/class 的坑
 *  3. 确定性输出：同样的 md + 主题永远产生同样的 HTML（可审计、可离线）
 *  4. 同构：同一份代码跑在 Node（CLI）与浏览器（可视化工作台）
 *
 * 作者：行途（xingtu1996）· 部分代码由 AI 辅助生成
 * License: MIT
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.XingTuMd = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ==================== 工具函数 ==================== */

  // 引擎版本（署名页脚 / JSON 元信息共用，单一事实源）
  const ENGINE_VERSION = '2.4.0';

  // 行途格式件（v2.4）：块级语义前缀 → 样式块
  // 设计原则：只认「标签：内容」这一种写法，不引入新语法；作者照常写中文冒号即可。
  const SEM_BLOCKS = [
    { re: /^(本章摘要|章首摘要)[：:]\s*/, kind: 'summary' },
    { re: /^(个人观点|我的判断|一句话总结|小答案)[：:]\s*/, kind: 'opinion' },
    { re: /^(数据来源|数据口径|数据说明|备注|注)[：:]\s*/, kind: 'note' },
  ];

  function matchSemBlock(text) {
    for (let i = 0; i < SEM_BLOCKS.length; i++) {
      const m = text.match(SEM_BLOCKS[i].re);
      if (m) return { kind: SEM_BLOCKS[i].kind, label: m[1], rest: text.slice(m[0].length) };
    }
    return null;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

  // hex → rgba（公众号编辑器各内核兼容）
  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // 主色 + 中性色派生一套 12 色 token（公众号安全色板，全部高对比）
  function deriveTokens(main, overrides) {
    overrides = overrides || {};
    return {
      main: main,
      text: overrides.text || '#2b2f36',        // 正文
      soft: overrides.soft || '#7a828e',        // 次要文字（引用/图注）
      codeText: overrides.codeText || '#d6317f',    // 行内 code 文字（高亮粉，衬托主色；主题可覆盖）
      codeBg: overrides.codeBg || '#f4f6f8',
      preBg: '#282c34',       // 代码块深底（Mac 风格）
      preHeader: '#21252b',
      preText: '#abb2bf',
      dotRed: '#ff5f56',
      dotYellow: '#ffbd2e',
      dotGreen: '#27c93f',
      blockBg: '#f7f9fc',
      blockLine: '#dfe3e8',
      thBg: '#f0f3f7',
    };
  }

  /* ==================== 主题定义 ====================
   * 风格维度：h2bar 左竖条 | h2center 居中色块(36氪) | h2line 下划线(GitHub)
   *           h3bar 左条  | h3line 下划线
   * quote 类：soft 浅底 | plain 无底
   */
  const THEMES = {
    'byte': { // 行途蓝（默认 · 科技实战）
      name: '行途蓝', group: '科技实战', main: '#056DE8',
      h2: 'bar', h3: 'line', quote: 'soft', pre: 'dark', dot: '#056DE8',
      text: '#3f3f3f', codeText: '#056DE8',
      desc: '品牌默认：沉稳蓝 + 干净留白，适合 AI 工程化/技术深度文'
    },
    'code': { // 代码极简（硬核技术）
      name: '代码极简', group: '科技实战', main: '#24292e',
      h2: 'line', h3: 'bar', quote: 'plain', pre: 'light', dot: '#24292e',
      desc: '莫兰迪灰黑，类代码 README，适合纯代码/硬核干货文'
    },
    'business': { // 商业评论（商业科技媒体）
      name: '商业评论', group: '观点随笔', main: '#1A59B7',
      h2: 'center', h3: 'line', quote: 'soft', pre: 'dark', dot: '#1A59B7',
      desc: '居中蓝底标题块，媒体腔调，适合观点/商业评论'
    },
    'review': { // 评测风（效率/评测）
      name: '评测风', group: '观点随笔', main: '#d71a1b',
      h2: 'lineAccent', h3: 'line', quote: 'soft', pre: 'dark', dot: '#d71a1b',
      desc: '红点缀 + 下划线标题，清爽利落，适合效率/评测'
    },
    'ink': { // 墨韵留白（人文成长）
      name: '墨韵留白', group: '成长故事', main: '#2f3542',
      h2: 'centerText', h3: 'plain', quote: 'softCenter', pre: 'light', dot: '#2f3542',
      desc: '居中大标题 + 诗性引用，适合成长复盘/人物故事'
    },
    'warm': { // 暖调故事（生活感悟）
      name: '暖调故事', group: '成长故事', main: '#D97757',
      h2: 'bar', h3: 'line', quote: 'softWarm', pre: 'dark', dot: '#D97757',
      desc: '暖橙主色 + 暖底引用，适合逆袭故事/生活感悟'
    },
    'pure': { // 纯文字随笔（口语化）
      name: '纯文字随笔', group: '科技实战', main: '#1a1a1a',
      h2: 'plain', h3: 'plain', quote: 'plain', pre: 'light', dot: '#1a1a1a',
      text: '#333333', codeText: '#1a1a1a',
      desc: '纯文字零色块，大量留白，口语化聊天感，适合随笔/深度长文'
    },
    'symbol': { // 符号技术风（技术博客）
      name: '符号技术风', group: '科技实战', main: '#ff6a00',
      h2: 'symbol', h3: 'line', quote: 'soft', pre: 'dark', dot: '#ff6a00',
      text: '#333333', codeText: '#ff6a00',
      desc: '▐ 符号标题 + 代码块公式，极简技术博客感，适合技术深度文'
    },
    'editorial': { // 编辑杂志风（waysera 暖纸米+赤陶+serif大数字）
      name: '编辑杂志', group: '观点随笔', main: '#a14335',
      h2: 'number', h3: 'line', quote: 'softWarm', pre: 'dark', dot: '#a14335',
      text: '#211713', codeText: '#a14335',
      desc: '暖纸米底 + 赤陶主色 + serif 大数字前缀，编辑杂志感，适合深度长文/人物故事'
    },
    'terminal': { // 终端极客风（等宽简洁+琥珀色）
      name: '终端极客', group: '科技实战', main: '#ff6b35',
      h2: 'plain', h3: 'plain', quote: 'plain', pre: 'dark', dot: '#ff6b35',
      text: '#2d2d2d', codeText: '#ff6b35',
      desc: '等宽简洁 + 琥珀色强调，终端极客感，适合技术硬核/CLI教程/代码密集文'
    },
    'infotech': { // InfoQ 科技绿（v2.3 新增 · 编号+分段进度条标题）
      name: 'InfoQ 科技绿', group: '科技实战', main: '#00A651',
      h2: 'techprog', h3: 'line', quote: 'soft', pre: 'dark', dot: '#00A651',
      text: '#2b2f36', codeText: '#00A651',
      desc: '章节编号 + 分段进度条 + 绿色标题（InfoQ 参考），科技资讯/深度技术文'
    },
    'cyber': { // 电光科技青（v2.3 新增 · 赛博科技感）
      name: '电光科技青', group: '科技实战', main: '#00B8D9',
      h2: 'techprog', h3: 'line', quote: 'soft', pre: 'dark', dot: '#00B8D9',
      text: '#2b2f36', codeText: '#00B8D9',
      desc: '电光青主色 + 编号进度条，赛博科技感，适合 AI 前沿/趋势解读'
    },
  };

  // 旧主题 ID → 新 ID 向后兼容映射（v2.1 改名，避免商标侵权）
  const THEME_ALIASES = {
    'github': 'code',
    'focus36': 'business',
    'sspai': 'review',
    'terracotta': 'warm',
    'kazik': 'pure',
    'taobao': 'symbol',
  };

  function themeTokens(id) {
    const resolvedId = THEME_ALIASES[id] || id;
    const t = THEMES[resolvedId] || THEMES['byte'];
    const overrides = { text: t.text, soft: t.soft, codeText: t.codeText, codeBg: t.codeBg };
    return Object.assign({ id: resolvedId, name: t.name, group: t.group, h2: t.h2, h3: t.h3, quote: t.quote, pre: t.pre }, deriveTokens(t.main, overrides));
  }

  /* ==================== 样式表构建（全内联） ==================== */

  function stylesOf(t) {
    const h2s = {
      bar: `font-size:18px;font-weight:bold;line-height:1.5;margin:42px 0 20px;padding:4px 0 4px 12px;border-left:4px solid ${t.main};color:${t.text};`,
      line: `font-size:18px;font-weight:bold;line-height:1.5;margin:42px 0 20px;padding-bottom:8px;border-bottom:2px solid ${t.main};color:${t.text};`,
      lineAccent: `font-size:18px;font-weight:bold;line-height:1.5;margin:42px 0 20px;padding-bottom:6px;border-bottom:3px solid ${t.main};color:${t.main};display:inline-block;`,
      center: `font-size:17px;font-weight:bold;letter-spacing:2px;color:#ffffff;background:${t.main};padding:8px 24px;border-radius:2px;text-align:center;display:inline-block;`,
      centerText: `font-size:20px;font-weight:bold;text-align:center;color:${t.text};margin:52px 0 28px;letter-spacing:4px;`,
      plain: `font-size:18px;font-weight:bold;line-height:1.5;margin:40px 0 18px;color:${t.text};`,
      symbol: `font-size:18px;font-weight:bold;line-height:1.5;margin:42px 0 20px;color:${t.text};`,
      number: `font-size:17px;font-weight:600;line-height:1.6;margin:48px 0 20px;color:${t.text};display:flex;align-items:baseline;gap:14px;`,
      techprog: `font-size:18px;font-weight:bold;line-height:1.5;margin:44px 0 24px;color:${t.text};`,
    };
    const h3s = {
      bar: `font-size:16px;font-weight:bold;line-height:1.5;margin:32px 0 16px;padding:2px 0 2px 10px;border-left:3px solid ${t.main};color:${t.text};`,
      line: `font-size:16px;font-weight:bold;line-height:1.5;margin:32px 0 16px;padding-bottom:6px;border-bottom:1px dashed #d5dae0;color:${t.text};`,
      plain: `font-size:16px;font-weight:bold;line-height:1.5;margin:32px 0 16px;color:${t.text};`,
    };
    const quoteStyle = {
      soft: `margin:24px 0;padding:14px 18px;background:${rgba(t.main, 0.06)};border-left:3px solid ${t.main};border-radius:0 6px 6px 0;color:${t.text};font-size:15px;`,
      softWarm: `margin:24px 0;padding:16px 20px;background:#fdf4f0;border-left:3px solid ${t.main};border-radius:0 8px 8px 0;color:#6b5546;font-size:15px;`,
      softCenter: `margin:32px 0;padding:6px 24px;border:none;text-align:center;color:#8a8578;font-style:italic;font-size:15px;`,
      plain: `margin:24px 0;padding:4px 18px;border-left:4px solid #d0d7de;color:#57606a;font-size:15px;`,
    };
    const preStyle = t.pre === 'light'
      ? { wrap: `background:#f6f8fa;border:1px solid #d0d7de;`, text: `color:#24292e;font-size:13px;` , header: `background:#eaeef2;`, showDots: false }
      : { wrap: `background:${t.preBg};border-radius:8px;`, text: `color:${t.preText};font-size:13px;`, header: `background:${t.preHeader};border-radius:8px 8px 0 0;`, showDots: true };

    return {
      wrapper: `font-size:16px;line-height:1.8;color:${t.text};letter-spacing:0.8px;word-wrap:break-word;-webkit-font-smoothing:antialiased;`,
      p: `margin:0 0 22px 0;text-align:justify;`,
      h2: h2s[t.h2] || h2s.bar,
      h1Later: `font-size:15px;font-weight:bold;line-height:1.5;margin:34px 0 14px;color:${t.text};letter-spacing:1px;`,
      h2CenterWrap: t.h2 === 'center' ? `text-align:center;margin:44px 0 22px;` : null,
      h3: h3s[t.h3] || h3s.bar,
      h4: `font-size:15px;font-weight:bold;margin:26px 0 12px;color:${t.text};`,
      strong: `color:${t.main};font-weight:600;`,
      em: `color:${t.text};font-style:italic;`,
      del: `color:#9aa1ab;`,
      ul: `padding-left:24px;margin:0 0 22px 0;color:${t.text};`,
      ol: `padding-left:26px;margin:0 0 22px 0;color:${t.text};`,
      li: `margin:0 0 8px 0;padding-left:2px;`,
      liP: `margin:0 0 2px 0;`,
      code: `background:${t.codeBg};padding:2px 6px;border-radius:4px;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:0.86em;color:${t.codeText};word-break:break-all;`,
      blockquote: quoteStyle[t.quote] || quoteStyle.soft,
      hr: `border:none;border-top:1px solid #e3e7ec;margin:34px 0;`,
      table: `border-collapse:collapse;width:100%;margin:0 0 22px 0;font-size:14px;line-height:1.7;color:${t.text};`,
      th: `background:${t.thBg};padding:9px 12px;border:1px solid #e3e7ec;font-weight:bold;text-align:left;white-space:nowrap;`,
      td: `padding:9px 12px;border:1px solid #e3e7ec;`,
      imgPlaceholder: `display:flex;align-items:center;justify-content:center;flex-direction:column;background:#fafafa;border:1px dashed #d0d0d5;border-radius:12px;padding:24px 16px;margin:0 0 22px 0;text-align:center;`,
      mediaCard: `display:flex;align-items:center;justify-content:center;background:#fafbfc;border:1.5px dashed #c9d1d9;border-radius:8px;padding:16px 12px;margin:0 0 22px 0;color:#8b949e;font-size:13px;`,
      link: `color:${t.main};text-decoration:underline;word-break:break-all;`,
      footnote: `color:${t.main};font-size:0.72em;vertical-align:super;`,
      caption: `display:block;text-align:center;font-size:13px;color:#8b949e;margin:-14px 0 22px 0;`,
      preWrap: preStyle.wrap,
      preHeader: preStyle.header,
      preDots: preStyle.showDots,
      pre: `padding:14px 16px;overflow-x:auto;margin:0;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;line-height:1.6;` + preStyle.text,
      codeBlock: `font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:13px;` + preStyle.text,
      taskTodo: `color:#c9d1d9;margin-right:4px;`,
      taskDone: `color:#3fb950;margin-right:4px;`,
      footer: `font-size:13px;line-height:1.8;color:#8b949e;`,
      // ===== 行途格式件（v2.4）=====
      // 语义标签块：本章摘要 / 个人观点 / 数据来源 等「块级语义前缀」的统一样式
      semSummary: `margin:0 0 22px 0;padding:12px 16px;background:${t.blockBg};border-left:3px solid ${t.main};border-radius:0 6px 6px 0;font-size:14.5px;line-height:1.78;color:${t.soft};`,
      semOpinion: `margin:0 0 22px 0;padding:12px 16px;background:${rgba(t.main, 0.05)};border-left:4px solid ${t.main};border-radius:0 6px 6px 0;font-size:15.5px;line-height:1.78;color:${t.text};`,
      semNote: `margin:-6px 0 22px 0;font-size:12.5px;line-height:1.7;color:${t.soft};`,
      semLabel: (accent) => `font-weight:700;color:${accent};`,
      // 署名页脚（文末自动追加，--no-signature 可关）
      signature: `margin-top:34px;padding-top:16px;border-top:1px dashed #d5dae0;font-size:12.5px;line-height:1.9;color:#8b949e;text-align:center;`,
    };
  }

  /* ==================== Markdown 行内解析 ==================== */

  // 先隔离 code span，防止其内容被 strong/em 等二次处理
  function inline(text, S, t, opts) {
    const codeSpans = [];
    text = esc(text);

    // 行内 code → 占位
    text = text.replace(/`([^`]+)`/g, function (_, c) {
      codeSpans.push('<code style="' + S.code + '">' + c + '</code>');
      return '\u0000C' + (codeSpans.length - 1) + '\u0000';
    });

    // 图片 ![alt](url) → 三种模式：
    //   placeholder（默认）：占位卡，公众号后台手动上传（最稳妥）
    //   keep：保留真实 <img> 标签，http(s) 外链图公众号会自动上传到素材库
    //   drop：忽略图片
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, function (_, alt, url) {
      if (opts.images === 'drop') return '';
      if (opts.images === 'keep') {
        // 保留模式：输出真实 img 标签（http(s) 外链图公众号会自动上传；本地路径/base64 可能不显示）
        return '<img src="' + esc(url) + '" alt="' + esc(alt || '') + '" style="max-width:100%;height:auto;border-radius:8px;margin:0 0 22px 0;display:block;" />';
      }
      // 默认 placeholder 模式：带序号+alt+建议尺寸的占位卡
      const idx = ++opts._imgCounter.index;
      const altText = esc(alt || ('图 ' + idx));
      return '<div style="' + S.imgPlaceholder + '">' +
        '<div style="font-size:11px;font-weight:600;letter-spacing:1px;color:' + t.main + ';margin-bottom:6px;">图 ' + idx + ' · 图片占位</div>' +
        '<div style="font-size:14px;font-weight:600;color:' + t.text + ';">' + altText + '</div>' +
        '<div style="font-size:11px;color:#b0b0b5;margin-top:6px;">公众号后台此处插入图片 · 建议宽度 900px</div>' +
        '</div>';
    });

    // 链接 [text](url) → 默认仅保留文字（微信禁用外链）
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      if (opts.links === 'keep') {
        return '<a href="' + esc(url) + '" style="' + S.link + '">' + label + '</a>';
      }
      if (opts.links === 'drop') return label;
      return label + '<span style="' + S.footnote + '">[' + url.replace(/^https?:\/\//, '') + ']</span>';
    });

    // 删除线
    text = text.replace(/~~([^~]+)~~/g, '<del style="' + S.del + '">$1</del>');
    // 加粗
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="' + S.strong + '">$1</strong>');
    // 斜体（跳过已被包裹的）
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em style="' + S.em + '">$2</em>');

    // 还原 code
    text = text.replace(/\u0000C(\d+)\u0000/g, function (_, i) { return codeSpans[+i]; });
    return text;
  }

  /* ==================== 表格 ==================== */

  function splitRow(row) {
    let s = row.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|')) s = s.slice(0, -1);
    return s.split('|').map(function (c) { return c.trim(); });
  }

  function renderTable(lines, S, t, opts) {
    const header = splitRow(lines[0]);
    const alignRow = splitRow(lines[1]);
    const aligns = alignRow.map(function (c) {
      if (/^:?-{2,}:?$/.test(c)) {
        if (c.startsWith(':') && c.endsWith(':')) return 'center';
        if (c.endsWith(':')) return 'right';
        return 'left';
      }
      return null;
    });
    const bodyRows = lines.slice(2).map(splitRow).filter(function (r) {
      return r.length > 0 && r.join('').trim() !== '';
    });
    let html = '<table style="' + S.table + '"><thead><tr>';
    header.forEach(function (h, i) {
      const al = aligns[i] ? ';text-align:' + aligns[i] : '';
      html += '<th style="' + S.th + al + '">' + inline(h, S, t, opts) + '</th>';
    });
    html += '</tr></thead><tbody>';
    bodyRows.forEach(function (r) {
      html += '<tr>';
      r.forEach(function (c, i) {
        const al = aligns[i] ? ';text-align:' + aligns[i] : '';
        html += '<td style="' + S.td + al + '">' + inline(c, S, t, opts) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  /* ==================== 列表（含嵌套/有序/任务） ==================== */

  // 返回 { item, indent, ordered } 或 null
  function matchListLine(line) {
    const m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (!m) return null;
    const marker = m[2];
    const ordered = /^\d/.test(marker);
    const startNum = ordered ? parseInt(marker, 10) : 1;
    return { indent: m[1].length, ordered: ordered, startNum: startNum, text: m[3], raw: marker };
  }

  // 递归解析列表（v2.2.2：扁平化输出 <p> 伪列表）
  // 缘由：公众号编辑器粘贴 <ul><li> 时，会把行首 <strong> 之后的内容强制断行（句号孤行）；
  // p 段落 + bullet/数字前缀 + margin 缩进粘贴零损耗，是各排版工具的通行做法。
  // 返回 { html, next, count }
  function parseList(lines, i, S, t, opts) {
    const items = []; // { depth, marker, text }
    function walk(start, depth) {
      const first = matchListLine(lines[start]);
      const baseIndent = first.indent;
      const ordered = first.ordered;
      let num = first.startNum;
      let j = start;
      while (j < lines.length) {
        const line = lines[j];
        if (/^\s*$/.test(line)) { j++; continue; }
        const m = matchListLine(line);
        if (!m || m.indent < baseIndent) break;
        if (m.indent === baseIndent && m.ordered !== ordered) break;
        if (m.indent > baseIndent) {
          // 更深缩进：子列表 → 递归（扁平展开）；非列表续行 → 并入上一项
          if (matchListLine(line)) { j = walk(j, depth + 1); continue; }
          if (items.length) items[items.length - 1].text += ' ' + line.trim();
          j++;
          continue;
        }
        let text = m.text, task = null;
        const tm = text.match(/^\[([ xX])\]\s+(.*)$/);
        if (tm) { task = tm[1].toLowerCase() === 'x'; text = tm[2]; }
        // v2.2.2：有序项尊重作者写的数字（写几显示几），无序用 •
        const marker = task !== null ? (task ? '✅ ' : '⬜ ')
                     : (ordered ? String(parseInt(m.raw, 10) || num) + '. ' : '• ');
        num++;
        items.push({ depth: depth, marker: marker, text: text });
        j++;
      }
      return j;
    }
    const next = walk(i, 0);
    if (items.length === 0) return { html: '', next: next, count: 0 };
    const html = items.map(function (it) {
      const indent = 2 + it.depth * 24;
      return '<p style="margin:0 ' + indent + 'px 8px ' + indent + 'px;color:' + t.text + ';">'
        + it.marker + inline(it.text, S, t, opts) + '</p>';
    }).join('');
    return { html: html, next: next, count: items.length };
  }

  /* ==================== 媒体占位 / 段落 ==================== */

  function isMediaPlaceholder(line) {
    // 支持 [视频：x] / [音频：x]
    let m = line.match(/^\[(视频|音频)：(.*)\]$/);
    if (m) return { type: m[1], title: m[2] };
    // 支持 【配图：x.png】（行途自定义配图占位语法）
    m = line.match(/^【配图：(.*)】$/);
    if (m) return { type: '配图', title: m[1] };
    return null;
  }

  /* ==================== 主渲染 ==================== */

  // 分离 footer：最后一个独立行 --- 之后为 footer（公众号文末声明区）
  // v2.2.1 修复：仅当分隔线之后是「纯文本声明」（无标题/列表/表格/代码块/引用）时才算 footer，
  // 否则该 --- 只是章节分隔线（正文用 --- 分章时，旧逻辑会把后半篇正文整体劫持成 footer）。
  function splitFooter(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const BLOCKY = /^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|\||>)/;
    // 找最后一个既是 --- 又前后有空行/边界、且之后无块级结构的行
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/^---+$/.test(lines[i].trim())) {
        const beforeOk = i === 0 || /^\s*$/.test(lines[i - 1]);
        const afterOk = i === lines.length - 1 || /^\s*$/.test(lines[i + 1]);
        if (beforeOk && afterOk && i > 2) {
          const after = lines.slice(i + 1);
          const structured = after.some(function (l) { return BLOCKY.test(l); });
          if (!structured) {
            return {
              main: lines.slice(0, i).join('\n'),
              footer: after.join('\n'),
            };
          }
        }
      }
    }
    return { main: md, footer: '' };
  }

  function render(md, opts) {
    opts = opts || {};
    const tid = THEME_ALIASES[opts.theme] || opts.theme || 'byte';
    const t = themeTokens(tid);
    if (opts.color) { t.main = opts.color; }
    const S = stylesOf(t);
    const useFooter = opts.footer !== false;
    opts._imgCounter = { index: 0 };
    opts._h2Counter = { index: 0 };

    // v2.2.1：剥离 HTML 注释（如文末「搜一搜关键词」元信息，不应对读者显示）
    md = String(md).replace(/<!--[\s\S]*?-->/g, '');

    let title = opts.title || '';
    let mainText = md;
    let footerText = '';

    if (useFooter) {
      const sp = splitFooter(md);
      mainText = sp.main;
      footerText = sp.footer.trim();
    }

    // 提取标题：首个 # H1（公众号标题单独填，正文剥离但可提取）
    const h1m = mainText.match(/^#\s+(.+)$/m);
    if (!title && h1m) title = h1m[1].trim();
    // 剥离 frontmatter（--- 起头的键值块）
    mainText = mainText.replace(/^\s*---[\s\S]*?---\s*\n?/, '');

    // 统计 H2 总数（供 techprog 分段进度条按章节占比点亮）
    opts._h2Total = (mainText.match(/^##\s+/gm) || []).length;

    // 提取引子文案：首个 > blockquote（供引子图占位卡自动填充设计参考）
    const firstQuote = mainText.match(/^>\s?(.+)$/m);
    opts._heroInfo = {
      title: title,
      intro: firstQuote ? firstQuote[1].trim() : ''
    };

    const lines = mainText.replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let i = 0;
    let h1Seen = false; // 首个 H1 = 文章标题（剥离）；后续 H1 = 文末小节标签（渲染）

    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }

      // 标题
      const hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        const lv = hm[1].length;
        const body = inline(hm[2], S, t, opts);
        if (lv === 1) {
          // v2.2.1：首个 H1 由公众号标题承担；后续 H1（如文末四段式「关于行途」）渲染为小节标签
          if (!h1Seen) { h1Seen = true; i++; continue; }
          out.push('<h3 style="' + S.h1Later + '">' + body + '</h3>');
          i++; continue;
        }
        if (lv === 2) {
          if (t.h2 === 'center') out.push('<div style="' + S.h2CenterWrap + '"><h2 style="' + S.h2 + '">' + body + '</h2></div>');
          else if (t.h2 === 'symbol') out.push('<h2 style="' + S.h2 + '"><span style="color:' + t.main + ';margin-right:8px;font-weight:bold;">▐</span>' + body + '</h2>');
          else if (t.h2 === 'number') {
            const n = ++opts._h2Counter.index;
            const pad = n < 10 ? '0' + n : '' + n;
            out.push('<h2 style="' + S.h2 + '"><span style="font-family:Georgia,\'Times New Roman\',serif;font-size:36px;font-weight:400;color:' + t.main + ';line-height:1;letter-spacing:-1px;">' + pad + '</span><span>' + body + '</span></h2>');
          }
          else if (t.h2 === 'techprog') {
            const n = ++opts._h2Counter.index;
            const total = Math.max(opts._h2Total || n, n);
            let segs = '';
            for (let k = 1; k <= total; k++) {
              segs += '<span style="flex:1;height:5px;border-radius:3px;background:' + (k <= n ? t.main : '#e8eaed') + ';display:block;"></span>';
            }
            out.push('<div style="margin:44px 0 24px;"><div style="display:flex;align-items:center;gap:12px;"><span style="font-size:34px;font-weight:900;line-height:1;color:' + t.main + ';">' + n + '</span><div style="flex:1;display:flex;gap:5px;">' + segs + '</div></div><div style="font-size:18px;font-weight:bold;line-height:1.6;margin-top:10px;color:' + t.main + ';">' + body + '</div></div>');
          }
          else out.push('<h2 style="' + S.h2 + '">' + body + '</h2>');
        } else if (lv === 3) out.push('<h3 style="' + S.h3 + '">' + body + '</h3>');
        else out.push('<h4 style="' + S.h4 + '">' + body + '</h4>');
        i++; continue;
      }

      // 代码块（围栏）
      if (/^```/.test(line)) {
        const lang = line.replace(/^```/, '').trim();
        const buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        if (i < lines.length) i++;
        const codeHtml = esc(buf.join('\n'));
        const dots = S.preDots
          ? '<span style="color:' + t.dotRed + ';font-size:12px;margin-right:4px;line-height:1;">●</span><span style="color:' + t.dotYellow + ';font-size:12px;margin-right:4px;line-height:1;">●</span><span style="color:' + t.dotGreen + ';font-size:12px;line-height:1;">●</span>'
          : '';
        const langHtml = lang ? '<span style="color:#7a828e;font-size:11px;margin-left:auto;">' + esc(lang) + '</span>' : '';
        out.push(
          '<section style="' + S.preWrap + ';overflow:hidden;">' +
          '<div style="display:flex;align-items:center;padding:7px 12px;' + S.preHeader + ';">' + dots + langHtml + '</div>' +
          '<pre style="' + S.pre + '"><code style="' + S.codeBlock + '">' + codeHtml + '</code></pre>' +
          '</section>'
        );
        continue;
      }

      // 分割线
      if (/^([-*_])\s*\1\s*\1\s*$/.test(line)) { out.push('<hr style="' + S.hr + '">'); i++; continue; }

      // 引用
      if (/^>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
        const html = buf.map(function (l) { return inline(l, S, t, opts); }).join('<br>');
        out.push('<blockquote style="' + S.blockquote + '">' + html + '</blockquote>');
        continue;
      }

      // 表格
      if (/^\|/.test(line) && i + 1 < lines.length && /^\|/.test(lines[i + 1])) {
        const tlines = [];
        while (i < lines.length && /^\|/.test(lines[i])) { tlines.push(lines[i]); i++; }
        // 第二行须为对齐分隔行，否则按段落
        const secondCells = splitRow(tlines[1]);
        const isAlign = secondCells.length > 0 && secondCells.every(function (c) { return /^:?-{2,}:?$/.test(c.trim()); });
        if (tlines.length >= 2 && isAlign) {
          out.push(renderTable(tlines, S, t, opts));
        } else {
          out.push('<p style="' + S.p + '">' + inline(tlines.join(' '), S, t, opts) + '</p>');
        }
        continue;
      }

      // 列表
      const lm = matchListLine(line);
      if (lm) {
        const r = parseList(lines, i, S, t, opts);
        if (r.html) out.push(r.html);
        i = r.next;
        continue;
      }

      // 段落（收集至空行/块级起点）
      const buf = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\|/.test(lines[i]) &&
        !matchListLine(lines[i]) &&
        !/^([-*_])\s*\1\s*\1\s*$/.test(lines[i])
      ) {
        buf.push(lines[i]); i++;
      }
      if (buf.length === 0) { i++; continue; }

      // 图注段落（斜体单段 → 居中 caption）
      if (buf.length === 1 && /^[*_](.+)[*_]$/.test(buf[0].trim()) && buf[0].trim().startsWith('图注')) {
        const c = buf[0].trim().replace(/^[*_]/, '').replace(/[*_]$/, '');
        out.push('<span style="' + S.caption + '">' + inline(c, S, t, opts) + '</span>');
        continue;
      }

      // 媒体占位（单段 [视频：x] / [音频：x] / 【配图：x.png】）
      const single = buf.length === 1 ? buf[0].trim() : '';
      const media = single ? isMediaPlaceholder(single) : null;
      if (media) {
        if (media.type === '配图') {
          const idx = ++opts._imgCounter.index;
          const fileName = media.title;
          const isHero = /引子|封面|hero/i.test(fileName);
          if (isHero && opts._heroInfo && opts._heroInfo.intro) {
            // 引子图占位卡：自动提取标题+引子文案，作为设计参考
            out.push('<div style="' + S.imgPlaceholder + ';border-color:' + t.main + ';border-width:2px;">' +
              '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:' + t.main + ';margin-bottom:10px;">★ 引子图 · 图片占位</div>' +
              '<div style="font-size:16px;font-weight:700;color:' + t.text + ';margin-bottom:8px;line-height:1.4;">' + esc(opts._heroInfo.title) + '</div>' +
              '<div style="font-size:13px;color:#666;margin-bottom:12px;line-height:1.7;text-align:left;">' + esc(opts._heroInfo.intro) + '</div>' +
              '<div style="font-size:11px;color:#b0b0b5;line-height:1.6;">文件名：' + esc(fileName) + '<br>建议尺寸 1080×600 · 公众号后台此处插入</div>' +
              '</div>');
          } else {
            // 普通配图占位卡
            out.push('<div style="' + S.imgPlaceholder + '">' +
              '<div style="font-size:11px;font-weight:600;letter-spacing:1px;color:' + t.main + ';margin-bottom:6px;">图 ' + idx + ' · 图片占位</div>' +
              '<div style="font-size:14px;font-weight:600;color:' + t.text + ';">' + esc(fileName) + '</div>' +
              '<div style="font-size:11px;color:#b0b0b5;margin-top:6px;">公众号后台此处插入图片 · 建议宽度 900px</div>' +
              '</div>');
          }
        } else {
          // 视频/音频占位
          const icon = media.type === '视频' ? '🎬' : '🎵';
          out.push('<div style="' + S.mediaCard + '">' + icon + ' ' + esc(media.type) + '插入位置：<b>' + esc(media.title) + '</b> <span style="font-size:12px;color:#b6bdc6;">（公众号后台此处插入）</span></div>');
        }
        continue;
      }

      // 行途格式件（v2.4）：语义标签块（本章摘要 / 个人观点 / 数据来源）
      const semText = buf.join(' ').trim();
      const sem = matchSemBlock(semText);
      if (sem) {
        const label = '<b style="' + S.semLabel(sem.kind === 'note' ? t.soft : t.main) + '">' + sem.label + '</b>：';
        const body = inline(sem.rest, S, t, opts);
        if (sem.kind === 'summary') out.push('<section style="' + S.semSummary + '">' + label + body + '</section>');
        else if (sem.kind === 'opinion') out.push('<section style="' + S.semOpinion + '">' + label + body + '</section>');
        else out.push('<p style="' + S.semNote + '">' + label + body + '</p>');
        continue;
      }

      // 普通段落：支持软换行（行尾 \ 或行尾双空格）
      const soft = [];
      buf.forEach(function (l, idx) {
        let ll = l;
        const isLast = idx === buf.length - 1;
        if (/\\$/.test(ll)) { ll = ll.replace(/\\$/, ''); soft.push(inline(ll, S, t, opts)); if (!isLast) soft.push('<br>'); }
        else if (/ {2}$/.test(ll)) { ll = ll.replace(/ {2}$/, ''); soft.push(inline(ll, S, t, opts)); if (!isLast) soft.push('<br>'); }
        else { soft.push(inline(ll, S, t, opts)); }
      });
      out.push('<p style="' + S.p + '">' + soft.join('') + '</p>');
    }

    let section = '<section style="' + S.wrapper + '">' + out.join('\n');

    // footer（文末声明区小字）
    if (footerText) {
      const fl = footerText.split('\n').filter(function (l) { return l.trim(); });
      const fh = fl.map(function (l) { return inline(l, S, t, opts); }).join('<br>');
      section += '\n<div style="margin-top:36px;padding-top:14px;border-top:1px dashed #d5dae0;' + S.footer + '">' + fh + '</div>';
    }

    // 署名页脚（v2.4 行途格式件）：品牌行 + 排版引擎行 + 版权行
    // 若作者已在文末手写「排版引擎」行则自动跳过，避免重复；--no-signature 可整体关闭
    if (opts.signature !== false && !/排版引擎/.test(footerText)) {
      const yr = new Date().getFullYear();
      section += '\n<div style="' + S.signature + '">'
        + '行途XingTu · AI 时代的工程师成长与效率提升<br>'
        + '排版引擎：墨排 · md2wechat（行途自研，v' + ENGINE_VERSION + '）<br>'
        + '© ' + yr + ' 行途 · 欢迎转载，注明出处 · 禁止未经授权用于 AI 训练'
        + '</div>';
    }
    section += '</section>';

    return { html: section, title: title, theme: tid, main: t.main };
  }

  /* ==================== 插件化 API（AI 友好） ==================== */

  // 外部注册新主题（高内聚：纯 JSON 配置；低耦合：不修改引擎核心）
  function registerTheme(id, config) {
    if (!id || typeof id !== 'string') throw new Error('registerTheme: id (string) required');
    if (!config || typeof config !== 'object') throw new Error('registerTheme: config (object) required');
    if (!config.main) throw new Error('registerTheme: config.main (hex color) required');
    THEMES[id] = Object.assign({
      name: id, group: '自定义', main: '#056DE8',
      h2: 'bar', h3: 'line', quote: 'soft', pre: 'dark', dot: config.main,
      desc: '自定义主题'
    }, config);
    return { ok: true, id: id, theme: THEMES[id] };
  }

  // 读取主题配置（含别名解析）
  function getTheme(id) {
    const resolvedId = THEME_ALIASES[id] || id;
    return THEMES[resolvedId] ? Object.assign({}, THEMES[resolvedId], { id: resolvedId }) : null;
  }

  // 导出主题配置为 JSON（便于分享/备份）
  function exportTheme(id) {
    const t = getTheme(id);
    if (!t) return null;
    const result = {};
    ['name', 'group', 'main', 'h2', 'h3', 'quote', 'pre', 'dot', 'text', 'soft', 'codeText', 'codeBg', 'desc'].forEach(function (k) {
      if (t[k] !== undefined) result[k] = t[k];
    });
    return result;
  }

  // 列出所有主题（按分组，便于 AI 选择）
  function listThemes() {
    const groups = {};
    Object.keys(THEMES).forEach(function (id) {
      const t = THEMES[id];
      if (!groups[t.group]) groups[t.group] = [];
      groups[t.group].push({ id: id, name: t.name, main: t.main, desc: t.desc });
    });
    return groups;
  }

  // 结构化 JSON 输出（便于 AI 解析 / Playwright 自动化接入）
  function renderToJSON(md, opts) {
    const r = render(md, opts);
    return {
      ok: true,
      title: r.title,
      theme: r.theme,
      mainColor: r.main,
      wordCount: countWords(r.html),
      html: r.html,
      meta: {
        engineVersion: ENGINE_VERSION,
        generatedAt: new Date().toISOString(),
        inputLength: md.length,
        outputLength: r.html.length
      }
    };
  }

  /* ==================== 字数统计 ==================== */

  function countWords(html) {
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, '');
    return text.length; // 中英混排近似字数
  }

  return {
    version: ENGINE_VERSION,
    render: render,
    renderToJSON: renderToJSON,
    themes: THEMES,
    themeKeys: Object.keys(THEMES),
    themeAliases: THEME_ALIASES,
    registerTheme: registerTheme,
    getTheme: getTheme,
    listThemes: listThemes,
    exportTheme: exportTheme,
    countWords: countWords,
    themeTokens: themeTokens,
  };
});
