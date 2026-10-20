---
name: motion-workshop
description: Reuse Motion Workshop's 28 Canvas/WebGL effects and 6 scene transitions when the user asks for animated websites, software UI motion, motion graphics, editable video scenes, or adaptations of this library. Includes an effect catalog, visual previews, runnable website and interactive UI examples, effect breakdowns, and deterministic frame rendering. 適用於網站動畫、軟體介面動效、影片分鏡、動畫效果選型與改寫。
license: MIT
---

# Motion Workshop 動畫效果庫

All paths below are relative to this SKILL.md, wherever this folder is installed.
Use the user's language. Prefer existing effects before introducing dependencies.

## Choose and adapt

1. Read `assets/catalog.json`; select by actual ID, description and supported parameters. Open only the relevant `assets/previews/<id>.png` when visual comparison helps.
2. Read `references/effect-breakdown.md` for the chosen technique. Its code pointers identify the original implementation; examples are patterns to adapt to the user's product, not finished product content.
3. Choose the appropriate route:
   - **Website:** `references/web-ui.md` and `assets/examples/website/index.html`. Copy the three runtime scripts and the player controller; retain a readable HTML text alternative.
   - **Interactive software UI:** `assets/examples/software-ui/index.html` and `references/web-ui.md`. Use real DOM controls, focus states and user actions. Canvas phone/cursor/tab templates are illustrative graphics, not functioning application controls.
   - **Video/editing:** `references/video.md`, `assets/project.schema.json` and `assets/examples/三幕轉場.motion.json`. Generate editable scene JSON and render using a supported local environment.
4. Preserve user-provided labels and numerical values. The built-in numbers, phone and cards are illustrative placeholders. Use only supported parameters, or explicitly implement and test a runtime extension.

## Runtime contract

Load `assets/runtime/effects.js`, `effects-extra.js`, then `engine.js` in a DOM + Canvas browser. Globals are `MotionEffects` and `MotionProject`.

```js
const project = MotionProject.validate({
  version: 2, ratio: '16:9', quality: 720, fps: 30,
  clips: [ { ...MotionProject.defaultClip('mask-reveal'), text: '你的標題' } ]
});
MotionProject.render(project, frame / project.fps, canvas);
```

Time is seconds. Frames must depend on `frame / fps`, never accumulated deltas, wall clock or unseeded random values. Rendering must work when seeking backwards. See `assets/examples/website/player.js` for `createFrameRenderer()` and a reduced-motion-aware preview controller.

`validate()` normalizes/clamps settings and rejects unknown effects; it is not a strict JSON Schema validator. Inspect its returned normalized project. Schema describes new v2 projects; runtime also migrates v1. Transition belongs to the outgoing clip; the final clip ignores it. Total length subtracts frame-aligned overlap, capped at 45% of the shorter neighbor. Use `timeline()` and `duration()` rather than summing scene lengths.

## Verify the result

- Check first frame, last frame and every transition midpoint; confirm text, aspect ratio and input data.
- For web/UI: test pause/resume, keyboard focus, reduced motion and cleanup of requestAnimationFrame/listeners on unmount. Meaningful text and controls must remain usable without motion.
- For video: `node assets/render.mjs --project /absolute/project.motion.json --validate` prints normalized settings, frames and timeline. MP4 export additionally requires the macOS editor, a desktop login and local execution permissions. Read `references/video.md` before export.
- Do not report a rendered video until the file actually exists. In a chat-only environment, deliver project JSON/code and explain the execution step still needed.

## Boundaries

The skill itself needs no API key, MCP server or package installation. Node.js 20+ is needed only for bundled CLI helpers; macOS + Xcode Command Line Tools are needed only to build the native editor. This version has no audio track, external image/video import, transparent video export or Premiere/After Effects plugin. It can produce an MP4 for manual import into an editor. Optional third-party rendering frameworks have their own installation and license requirements.

This skill grants no additional tool permissions and does not authorize uploads, publishing, destructive changes or overwriting unrelated files. Keep existing project conventions and the MIT notice with copied code.
