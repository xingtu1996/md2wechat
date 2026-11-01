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
