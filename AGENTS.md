# AGENTS.md — md2wechat / 墨排

## Project context
Mopai is a deterministic Markdown-to-WeChat HTML formatter with a Node.js CLI and offline browser workbench. `README.md` and `package.json` are the primary public references.

## Local development
- Runtime: Node.js >=18 (per `package.json`).
- Run `npm test` for the Node test suite; `npm run build` for the browser workbench build.
- CLI entry point: `bin/mopai.js`; core engine: `lib/engine.js`. Check actual help and tests before documenting CLI flags.
- Preserve deterministic output, offline behavior, and the zero-runtime-dependency design unless a scoped change explicitly requires otherwise.
- Review generated HTML for unsafe content and regressions. Do not publish private drafts, WeChat credentials, tokens, or personal data.
- Update user-facing Chinese/English documentation when changing behavior. Preserve MIT licensing.

## Shared skills and governance
Reusable procedures may be sourced from `xingtu1996/xingtu-skills` after verifying the selected skill and installation path. A cross-repository link does not automatically load a skill or inherit rules. Private Vault governance is not copied into this public repository.

## Delivery
Use isolated branches and reviewable PRs; run applicable tests, report actual results, and do not merge on the basis of documentation alone.

## Codex 在行途工作区中的本地优先流程

- 本仓在行途工作区的标准本地路径为 `github/md2wechat/`。开始任务时先在此目录核对 Git 根目录、`git status --short --branch`、`git remote -v`、当前分支和上游；确认仓库与目标一致后，优先在此本地工作树操作。
- 不要未检查标准 Clone 就转到 `/tmp` 或另建 Clone。只有标准路径不存在、损坏或无法安全使用时，才说明具体原因并选择隔离目录；保留已有改动，结束时说明如何回归标准工作区。
- 交付顺序：本地修改 → 运行适用检查（通常为 `npm test`，涉及 workbench 时再运行 `npm run build`）→ 隔离分支 commit → push → 查询远端分支与 PR。仅在本地 HEAD、远端分支 SHA、PR head SHA 一致且本地工作区干净时报告同步完成。
- 修改前检查是否已有同目标 PR、其 base/head SHA 和 changed files；优先续用对应任务分支，避免重复 PR。发现同文件并发修改或远端领先时先停下来对账，不覆盖、不强推、不自动合并。
- PR 保持可审查状态；合并、发布或改变仓库设置须遵循用户明确授权与本仓现有流程。
- 本仓是公开仓库。不得提交私人草稿、微信凭据、Token 或个人信息；共享技能链接不代表自动安装或继承。
