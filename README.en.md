# Mopai · Markdown-to-WeChat Formatting Engine

[简体中文](README.md) | English

Mopai is an offline, deterministic Markdown-to-HTML formatting engine for WeChat Official Accounts, built by **XingTu (行途)**. It provides a command-line interface, a single-file browser workbench, and twelve built-in themes. The generated HTML uses inline styles for compatibility with WeChat's editor.

## Highlights

- **Offline-first:** the browser workbench opens locally; the core engine has no runtime dependencies.
- **Deterministic:** the same Markdown and theme settings produce repeatable output.
- **Twelve themes:** switch between technical, editorial, minimal, and other styles.
- **CLI and Node API:** integrate formatting into existing content pipelines.
- **Publishing helpers:** generate summaries, run a pre-publish checklist, and export Zhihu or Juejin Markdown variants.

## Requirements

Node.js **18 or newer** for the CLI and tests. The standalone browser workbench does not require a Node installation.

## Quick start

```sh
git clone https://github.com/xingtu1996/md2wechat.git
cd md2wechat
node bin/mopai.js --list-themes
node bin/mopai.js examples/demo.md --theme byte
```

Alternatively, open `index.html` directly in a browser to use the offline workbench.

To expose the `mopai` command globally, run `npm link` from the repository root.

## Common CLI examples

```sh
mopai examples/demo.md --theme editorial
mopai examples/demo.md --summary
mopai examples/demo.md --check
mopai examples/demo.md --variant zhihu
mopai examples/demo.md --variant juejin
mopai examples/demo.md --stdout > body.html
```

The default HTML output is intended for pasting into the WeChat Official Account editor. External images may require manual upload; review the generated document before publishing.

## Node.js integration

```js
const Mopai = require('./lib/engine.js');

const result = Mopai.render('# Hello\n\nWelcome to Mopai.', {
  theme: 'byte'
});

console.log(result.html);
```

For structured output, use `Mopai.renderToJSON(markdown, options)`. The API also exposes theme discovery and registration helpers. Consult the [Chinese reference](README.md) and [AI integration guide](docs/ai-integration-guide.md) for more examples.

## Development and verification

```sh
npm test
npm run build
```

The project uses Node's built-in test runner. Its offline and zero-dependency properties are part of the project's design; do not add dependencies casually.

## Documentation

- [Full Chinese README / 中文完整说明](README.md)
- [AI integration guide](docs/ai-integration-guide.md)
- [Customization guide](docs/customization-guide.md)
- [Project-local agent instructions](AGENTS.md)

The Chinese README is the detailed reference for theme configuration, compatibility behavior, and publishing workflow. This English overview is intentionally concise rather than a claim of complete translation.

## Security and privacy

Do not commit private article drafts, WeChat credentials, access tokens, or personal data. Review user-supplied Markdown and generated HTML before use in an automated publishing workflow.

## License

[MIT](LICENSE). Created and maintained by [XingTu](https://github.com/xingtu1996).
