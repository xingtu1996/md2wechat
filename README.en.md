# Mopai (墨排) — Markdown to WeChat HTML

Mopai is a deterministic Markdown formatting engine for WeChat Official Account articles, maintained by **行途 XingTu**. It provides a command-line tool and an offline, single-file browser workbench.

For the full Chinese documentation, screenshots and feature details, see [README.md](README.md).

## Requirements

- Node.js 18 or later for the CLI, as documented in the main README.
- A modern browser for the standalone `index.html` workbench.

## Quick start

```bash
git clone https://github.com/xingtu1996/md2wechat.git
cd md2wechat
npm link
mopai --list-themes
mopai examples/demo.md --theme editorial
```

You can also open `index.html` directly in your browser for the offline workbench.

## Common CLI operations

```bash
mopai examples/demo.md --stdout > body.html
mopai examples/demo.md --check
mopai examples/demo.md --summary
```

The main README documents the current theme choices, image handling modes and publication checks. Check the CLI help and source before relying on version-specific behavior.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Never include real publication credentials, tokens or private drafts in issues or pull requests.

## License

[MIT](LICENSE).
