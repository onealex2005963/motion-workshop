# 影片分鏡、轉場與逐格輸出

## 建立可編輯專案

讀 `assets/catalog.json` 與 `assets/project.schema.json`。複製 `assets/examples/三幕轉場.motion.json`，替換自己的文字、顏色與資料。最多 24 幕、每幕 1–20 秒。支援 16:9、9:16、1:1，720p / 1080p，30 / 60 FPS。

```json
{
  "version": 2, "ratio": "16:9", "quality": 720, "fps": 30,
  "clips": [
    {"effect":"mask-reveal","text":"你的開場","duration":3,"transition":{"type":"push","duration":0.6}},
    {"effect":"card-flyin","text":"三個重點","items":["簡單","清楚","流暢"],"duration":3,"transition":{"type":"cut","duration":0.1}}
  ]
}
```

由本 skill 目錄執行（Node.js 20+，不用 npm install）：

```sh
node assets/render.mjs --project /absolute/project.motion.json --validate
```

此指令輸出 **正規化後的專案**、影格數與時間軸。引擎會補預設值、裁切過長文字、限制數字範圍；不等於嚴格 Schema 檢查，必須確認正規化結果沒有改掉使用者的原意。

## 轉場時間

`transition` 定義本幕接到下一幕。6 種 ID：cut、crossfade、push、wipe、circle、zoom。最後一幕忽略轉場。每個重疊長度是指定秒數、相鄰較短場景 45% 兩者較小值，再對齊影格。

上面兩幕合計 5.4 秒、162 影格。3 幕各 3 秒，兩段 0.6 秒轉場，合計 7.8 秒、234 影格。輸出影格編號為 0 到 frames−1；最後影格時間是 `(frames−1)/fps`。

兩幕在重疊期間都繼續運動。`MotionProject.locate(project, seconds)` 回傳目前與前一幕狀態，`timeline()` 是唯一時間軸來源。不要重新靠浮點累加時間或將轉場當額外片段，以免總長不一致。

## macOS MP4 輸出

先下載完整專案，在 Apple Silicon Mac 安裝 Xcode Command Line Tools，從專案根目錄執行 `./build.sh`。把產生的 `build/動畫小工坊.app` 移到 `~/Applications/`，正常開啟 App。

從本 skill 目錄：

```sh
node assets/render.mjs --project /absolute/project.motion.json --output /absolute/movie.mp4
# 安裝在其他位置時，加 --app /absolute/動畫小工坊.app
```

App 開啟時使用本機工作佇列；關閉時腳本嘗試透過 LaunchServices 啟動 App。執行環境若禁止啟動桌面程式，手動開啟 App 後重試。需要 `~/Library/Application Support/動畫小工坊/jobs` 的讀寫權限，只用於本工具工作。腳本不應修改原本 GUI 的自動儲存專案。成功任務會清理自己的暫存資料；失敗任務保留供檢查。輸出已存在時會停止；使用者要求覆蓋後才加 `--overwrite`。

目前輸出是 **不含音訊的 H.264 MP4**。可手動匯入 Premiere、DaVinci Resolve 等剪輯軟體，再加旁白、配樂與真實影片；沒有直接控制這些剪輯軟體的插件。

## 其他影片框架與逐格渲染

`assets/examples/website/player.js` 的 `createFrameRenderer(canvas, project)` 提供同步的 `renderFrame(frame)`、`frames` 與 `duration`。適合整合到有 DOM/Canvas 的瀏覽器截圖或影片渲染管線：

```js
const renderer = MotionWorkshopPlayer.createFrameRenderer(canvas, project);
renderer.renderFrame(42); // 30 FPS 時是第 1.4 秒；可隨機跳回任何影格
// 等本次繪製完成後，由外層影片框架擷取 canvas / 頁面。
```

在 Remotion 類型的框架中，將外部 `frame` 傳進 `renderFrame`；先等 runtime scripts、字體、Canvas 就緒，才解除該框架的 render delay。不要用 rAF 預覽播放器作為離線影片時鐘。本套件未附 Remotion 專案或 ffmpeg，不宣稱已驗證那些外部渲染器。安裝與匯出方式依所採用框架的官方文件與授權。

跨作業系統的字型、WebGL 驅動可能產生像素差異；同一環境內的固定設定與時間可重現。著色器效果需要 WebGL；可用 `MotionEffects.getDiagnostics()` 檢查，無支援時會退回替代畫面。沒有音訊分析、透明影片或外部素材匯入。
