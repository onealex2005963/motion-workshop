# 動畫小工坊：給 Claude 的效果工具包

這個資料夾提供已實作的 184 個場景效果（40 個原創效果＋144 個 Motion Prompt 套版）、10 種轉場、可編輯專案格式及離線繪圖程式。不需要 API 金鑰。請優先重用現有的效果 ID 與 renderer。

## 先讀什麼

1. 讀取 `catalog.json`，依 `id`、`category`、`description` 選效果；每一筆都有參數清單與可執行的 example。
2. 查看 `previews/<效果 id>.png`，確認視覺方向。
3. 依 `project.schema.json` 與 `examples/三幕轉場.motion.json` 建立新的 `.motion.json` 檔案。
4. 修改資料內容時，保留畫面上的必要資訊與使用者提供的原始數字。範例數字純粹示意，不是外部事實。

## 如何製作

專案全域設定：`version: 2`、`ratio: "16:9" | "9:16" | "1:1"`、`quality: 720 | 1080`、`fps: 30 | 60`、`clips: [...]`。

場景共用設定：`effect` 為效果 ID；`text` 可用換行，`subtitle` 為小字，`color`／`secondary`／`background` 為六位十六進位色碼；`duration` 是此幕包含轉場的完整長度（1–20 秒），`speed` 為 0.25–2.5，`size` 為 0.6–1.5。

卡片、關鍵字與流程使用 `items` 陣列（最多 6 個）；圖表使用 `items` 與 `values`，數字計數使用 `value` 與 `suffix`；節拍換卡使用 `bpm`。每個效果實際使用的欄位以 catalog 的 `parameters` 為準。

每幕的 `transition: {"type":"push","duration":0.6}` 定義「接到下一幕」的轉場。最後一幕忽略轉場。可用 `cut`、`crossfade`、`push`、`wipe`、`circle`、`zoom`、`slide-up`、`diagonal`、`blur`、`flash`。轉場期間前後兩幕都繼續運動；總長度 = 場景長度總和 − 相鄰轉場重疊。重疊會限制在相鄰較短一幕的 45% 內，再對齊影格。

## 檢查與輸出

有 Node.js 時，以下工具只用內建模組，不安裝套件：

```sh
node render.mjs --list
node render.mjs --project examples/三幕轉場.motion.json --validate
node render.mjs --project /絕對路徑/作品.motion.json --output /絕對路徑/作品.mp4
```

先開啟電腦上的「動畫小工坊」。工具會優先將專案交給 App 的本機任務佇列，在背景輸出影片，主視窗仍可繼續編輯。任務資料夾位於 `~/Library/Application Support/動畫小工坊/jobs`，本機代理需要該資料夾的讀寫權限。它只包含本工具的暫存專案、產片結果與狀態，成功任務會由腳本清除。

預設 App 路徑為 `~/Applications/動畫小工坊.app`；可用 `--app` 指定其他位置。輸出檔已存在會停止，只有使用者明確要求覆蓋時才加 `--overwrite`。匯出完成會回傳 JSON（解析度、影格率、影格數、總長與時間軸）。MP4 需要有桌面登入的 macOS。App 未開啟時，工具也會嘗試啟動一次；若執行環境限制啟動桌面程式，請手動開啟 App 後重試。

也可以直接呼叫已安裝 App，不需要 Node：

```sh
"$HOME/Applications/動畫小工坊.app/Contents/MacOS/MotionWorkshop" --catalog
open -n "$HOME/Applications/動畫小工坊.app" --args --render /絕對路徑/作品.motion.json --output /絕對路徑/作品.mp4 --report /絕對路徑/結果.json
```

若執行環境限制本機任務資料夾的讀寫，可先保留已驗證的 `.motion.json`，用 App 的「開啟專案」與「匯出 MP4」完成；不要回報沒有實際產生的影片。一般 Claude 網頁聊天可以閱讀工具包／專案，直接執行匯出則需要 Claude Code 或有本機執行能力的 Claude。

## 在其他影片專案重用

依 catalog.json 的 runtimeOrder 載入 9 個腳本：effects.js、effects-extra.js、effects-pro.js、motion-reference.js、reference-templates.js、layers.js、audio.js、engine.js、library.js。motion-reference.js 包含 Shohei Ohtaki 的 MIT 原始動效，其餘檔案為小工坊整合與原創實作；重用時保留各自授權。依此順序載入，就能在 Canvas 環境使用：

```js
const project = MotionProject.validate(projectJSON);
const timeline = MotionProject.timeline(project);
MotionProject.render(project, seconds, canvas);
// 單一效果：
MotionEffects.render(ctx, width, height, seconds, MotionProject.defaultClip('card-flyin'));
```

這些 API 不會讀網路、執行專案中的程式碼或採用非固定亂數。同一設定與時間應產生相同影格。接到 Remotion 等流程時，請用 `frame / fps` 作為秒數；需要 DOM／Canvas／WebGL 的瀏覽器渲染環境。

1.4 支援額外圖層、關鍵影格、內嵌 PNG/JPEG/WebP 與 16 種 CC0 音效。詳細欄位請讀 ../references/layers-and-audio.md；舊版 App 會忽略新欄位。尚不支援外部音樂、旁白或影片素材匯入。卡片、手機與圖表為程序化的示意範本。請不要宣稱支援未實作的能力。

## 靈感來源

- https://rar.design/posts/pure-code-animation-claude-code-12-effects
- https://grenade.tw/blog/claude-motion-graphics/

原有 40 個效果採獨立實作，沒有複製上述文章媒體。1.5 另整合 MIT 授權的 Motion Prompt 原始程式（作者 Shohei Ohtaki），保留來源標記與授權；詳見 ../references/motion-prompt.md。

## 144 套版與 20 組可編輯配方

使用 mp-001 至 mp-144 作為 effect，查 catalog 與 previews；可調 referenceTemplate: {fit: "contain" | "cover", labels: true | false, loop: true | false}，以及共用 text/subtitle/speed/size/background。原示範內部的內容不會由 text 自動替換，自訂標題為額外覆蓋。用現有圖層加上 Logo、照片或更多文字。MotionReference 的 template/get/kit/create CLI 詳見 ../references/motion-prompt.md。一般雲端 Claude 需要整份 ZIP，不能只提供本機路徑。
