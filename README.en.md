# Motion Workshop

## 2.0 multitrack animation studio

Open Layers / Motion to reveal the scene-local timeline. Insert the multitrack demo to start with editable content. Drag layer intervals, motion segments, keyframes and sound cues; adjust zoom, height and snapping.

Includes 12 independently keyed properties, auto-key, cubic easing, key copy/paste, 16 composable entrance/loop/exit presets, local motion bundles and frame-accurate baking. Up to 32 layers per scene; nine layer types, anchors, nonuniform scale, gradients, dashed strokes, multiple selection, alignment and canvas transform handles. Existing 184 scene templates, 10 transitions and 16 CC0 sounds remain available.

Read [the timeline contract](.claude/skills/motion-workshop/references/timeline-and-motions.md) and use the bundled multitrack project example. Project version remains 2; use the bundled 2.0 runtime to retain new fields. Pen nodes, arbitrary SVG import, custom masks, groups and external audio/video import are future work.

184 Canvas/WebGL scene templates (40 original + 144 MIT Motion Prompt templates), 10 transitions, a portable Claude skill, runnable website and interactive UI examples, and an optional Traditional Chinese macOS editor. Offline, no API keys, CDN or npm dependencies. MIT licensed.

Version 1.4 adds editable text/shape/image layers, draggable composition, 60 keyframes per layer, 7 easing curves, motion presets, embedded PNG/JPEG/WebP and 16 Kenney CC0 sounds with synchronized AAC export. See [customization API](.claude/skills/motion-workshop/references/layers-and-audio.md) and [sound credits](THIRD_PARTY.md).

Version 1.3 added 8 editable four-scene stories, exact durations, favorites, focused/hover previews, undo/redo and a prompt builder for websites, software UI and videos. The native app can export the full Skill ZIP. New effects include charts, networks, timelines, code windows, terminal demos and editorial cards.

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

Open `.claude/skills/motion-workshop/assets/examples/website/index.html` directly, or run `npm run demo` and visit http://127.0.0.1:4173. No `npm install`. The default route opens the full editor; `/examples/website/index.html` opens the standalone player. It includes all 184 effects, scrubbing and PNG export, plus a separate working DOM UI example.

## Reuse

Load `effects.js`, `effects-extra.js`, `effects-pro.js`, `motion-reference.js`, `reference-templates.js`, `layers.js`, `audio.js`, `engine.js`, then `library.js` from the skill's `assets/runtime/`. `MotionProject.render(project, frame / fps, canvas)` renders deterministic frames in a browser. Catalog parameters and full examples are in `assets/catalog.json`. See [the gallery](docs/GALLERY.md), [implementation breakdowns](.claude/skills/motion-workshop/references/effect-breakdown.md), [web/UI guide](.claude/skills/motion-workshop/references/web-ui.md) and [video guide](.claude/skills/motion-workshop/references/video.md). Reference guides are primarily in Traditional Chinese; Claude can explain them in your language.

The optional native app currently builds for Apple Silicon macOS using Xcode Command Line Tools: `./build.sh`. It exports H.264 with optional built-in AAC sound MP4 and editable project JSON. No external audio/video import, audio analysis, transparent video or editing-application plugin. Web runtime and Node validation are cross-platform; native MP4 export requires a logged-in macOS desktop. Native frameworks need a port of the technique rather than direct browser-script imports.

`npm test` verifies the portable package; `npm run pack` creates ZIP archives. See [verification notes](docs/VERIFICATION.md). Independently implemented with conceptual inspiration from [RAR](https://rar.design/posts/pure-code-animation-claude-code-12-effects) and [Grenade](https://grenade.tw/blog/claude-motion-graphics/); no article media or source code is included.

## Version 1.5: all 144 as usable scene templates

Use the editor’s 144-template filter or insert a scene from the offline dictionary. Every template supports aspect ratio, custom title/subtitle overlays, speed, scale, contain/cover, loop/once, extra layers, transitions and MP4 export. Inner demo content retains its original design; 20 separate layer-based recipes provide full object/keyframe editing. Search in Traditional Chinese, English, Japanese or by ID, and export selected specs with per-effect notes for Claude.

Motion Prompt by [Shohei Ohtaki](https://github.com/showheyohtaki/motion-prompt) is vendored under MIT, with pinned source hashes and original notices. UI/landing-page samples are Canvas illustrations, and photo samples illustrate styles rather than filtering imported photos. See the bundled [reference guide](.claude/skills/motion-workshop/references/motion-prompt.md) for the offline CLI and attribution.

Version 1.5.1 adds a blank-project dialog with ratio, duration, resolution, FPS and background controls, save-before-create/cancel options, and undo recovery. Native shortcut: Cmd+N. Use MotionProject.blankProject(options) for the equivalent project JSON.
