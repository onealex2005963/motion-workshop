# Motion Workshop

40 original Canvas/WebGL effects, 10 transitions, a portable Claude skill, runnable website and interactive UI examples, and an optional Traditional Chinese macOS editor. Offline, no API keys, CDN or npm dependencies. MIT licensed.

Version 1.3 adds 8 editable four-scene stories, exact durations, favorites, focused/hover previews, undo/redo and a prompt builder for websites, software UI and videos. The native app can export the full Skill ZIP. New effects include charts, networks, timelines, code windows, terminal demos and editorial cards.

## Use with Claude Code

Download or clone this repository and start Claude Code here. Invoke `/motion-workshop` and describe your website, UI or motion graphics task. The skill lives at `.claude/skills/motion-workshop/SKILL.md` and includes its own runtime, catalog, previews and references.

To copy it into another existing project (Node.js 20+):

```sh
node scripts/install-skill.mjs --project /absolute/path/to/project
```

Or extract [the standalone skill ZIP](downloads/motion-workshop-skill.zip) into your project's `.claude/skills/` directory. It refuses to overwrite an existing skill. Restart Claude Code in that project. No MCP server or package installation is needed.

Example prompt:

> /motion-workshop Build an accessible product page using card-flyin and a real interactive tab indicator. Read the catalog and implementation, adapt them to my content, preserve keyboard navigation and reduced motion, then verify the result.

## Run examples

Open `.claude/skills/motion-workshop/assets/examples/website/index.html` directly, or run `npm run demo` and visit http://127.0.0.1:4173. No `npm install`. The default route opens the full editor; `/examples/website/index.html` opens the standalone player. It includes all 40 effects, scrubbing and PNG export, plus a separate working DOM UI example.

## Reuse

Load `effects.js`, `effects-extra.js`, `effects-pro.js`, `engine.js`, then `library.js` from the skill's `assets/runtime/`. `MotionProject.render(project, frame / fps, canvas)` renders deterministic frames in a browser. Catalog parameters and full examples are in `assets/catalog.json`. See [the gallery](docs/GALLERY.md), [implementation breakdowns](.claude/skills/motion-workshop/references/effect-breakdown.md), [web/UI guide](.claude/skills/motion-workshop/references/web-ui.md) and [video guide](.claude/skills/motion-workshop/references/video.md). Reference guides are primarily in Traditional Chinese; Claude can explain them in your language.

The optional native app currently builds for Apple Silicon macOS using Xcode Command Line Tools: `./build.sh`. It exports silent H.264 MP4 and editable project JSON. No audio, external media import, transparent video or editing-application plugin. Web runtime and Node validation are cross-platform; native MP4 export requires a logged-in macOS desktop. Native frameworks need a port of the technique rather than direct browser-script imports.

`npm test` verifies the portable package; `npm run pack` creates ZIP archives. See [verification notes](docs/VERIFICATION.md). Independently implemented with conceptual inspiration from [RAR](https://rar.design/posts/pure-code-animation-claude-code-12-effects) and [Grenade](https://grenade.tw/blog/claude-motion-graphics/); no article media or source code is included.
