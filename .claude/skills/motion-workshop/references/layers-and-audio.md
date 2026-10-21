# 自由圖層、關鍵影格與音效（1.4）

使用 `assets/examples/自由圖層與音效.motion.json` 作為起點。這些可選欄位延伸 project v2；需用 1.4 runtime / App，舊版會丟棄新欄位。依序載入 effects.js、effects-extra.js、effects-pro.js、motion-reference.js、reference-templates.js、layers.js、audio.js、engine.js、library.js。

## 圖層與構圖

每幕 `base: {visible, x, y, scale, rotation, opacity}` 控制原有整幕效果。`visible:false` 只留下 `background` 底色，可完全用圖層排版。變形會包含整個底層畫面，不會單獨修改範本內某個物件。

2.0 的 `layers` 最多 32 個，陣列越後面越上層。1.4.2 編輯器清單以最上層在前的順序顯示，拖曳 ⠿ 或名稱可排序；上移即移到畫面前方。可用 Option / Alt + ↑ ↓ 或上下按鈕操作，Esc 或放到清單外取消。一次有效放置只建立一步復原；JSON 陣列順序與既有渲染方式相容。支援 `text`、`rect`、`ellipse`、`line`、`image`；2.0 另加 triangle、polygon、star、arrow。由 `MotionLayers.defaultLayer(type)` 建立，再修改：

| 欄位 | 含義 |
|---|---|
| name, visible, locked | 圖層清單名稱、顯示與編輯鎖定。locked 只影響編輯，不影響匯出 |
| transform | x/y 為畫面寬／高百分比，中心 50/50；scale 倍數、rotation 度、opacity 0–1 |
| width, height | 圖層寬／高占畫面的百分比（1–200），旋轉與縮放前的尺寸 |
| start, end | 場景內顯示的開始與結束秒數，包含端點 |
| fill, stroke, strokeWidth | 六位色碼；描邊粗細以 720 高的畫面為基準 |
| radius | 矩形圓角，以 720 高的畫面為基準 |
| text, fontSize | 最多 400 字，可換行；字級為畫面高度百分比，依 width 自動折行 |
| fontFamily, weight, align | sans/serif/mono；400/700/900；left/center/right |
| blend | source-over、multiply、screen、overlay |
| image | PNG/JPEG/WebP 的 base64 data URI，最多 2,000,000 字元，不接受遠端 URL 或 SVG |

圖片以 contain 保留比例。編輯器會先把圖片縮至最長邊 1200 像素；每份 JSON 專案需小於 20 MB。請將使用者圖片留在其專案，不放進公開範例或效果庫。

含圖片時，在第一次擷取影格前呼叫 `await MotionLayers.prepare(project)`。純文字／圖形的 render 仍為同步。圖片變更時重新 prepare；不要把尚未載入的空白影格當完成輸出。

## 關鍵影格

2.0 每層最多 1201 個 `keyframes`，每格包含 `time`（場景內秒數）、x、y、scale、rotation、opacity、easing。請儲存完整五個變形值。normalize 會將時間對齊 fps、排序，同一時間保留最後一格。

```js
const title = MotionLayers.defaultLayer('text');
title.text = '你的標題';
title.end = 5;
title.keyframes = [
  {time: 0, x: 50, y: 70, scale: .8, rotation: 0, opacity: 0, easing: 'linear'},
  {time: 1, x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, easing: 'back'}
];
```

緩動定義在**到達的那一格**，影響前一格到該格的插值。支援 linear、ease-in、ease-out、ease-in-out、back、bounce、step；2.0 另支援 cubic。第一格之前保持第一格、最後一格之後保持最後一格。rotation 是直接數值插值；要完整轉一圈使用 0→360。

`MotionLayers.sample(layer, localSeconds)` 可檢查結果。所有畫面由絕對秒數計算，不累加狀態，可倒退定位。圖層會先與底層效果合成，再由 MotionProject 處理整幕轉場。

編輯器在已有關鍵格時，修改位置／縮放／旋轉／不透明度會在目前時間新增或更新一格。2.0 可使用獨立 tracks 設定樣式動畫，快速動作改為疊加 motions、保留手動關鍵格；「清除關鍵格」保留目前姿態。

## 音效與混音

`assets/runtime/sounds/catalog.json` 列出 16 個 Kenney Interface Sounds 選用音效及原檔、來源、SHA256、CC0 授權。WAV 為 22050 Hz、單聲道 PCM16，不需額外解碼器。來源：https://kenney.nl/assets/interface-sounds 。保留同資料夾的 `KENNEY-LICENSE.txt`。

專案層級：`audio: {enabled:true, volume:0.8}`。每幕的 `audio` 陣列最多 12 個 cue：

```json
{"sound":"confirm","time":1.2,"volume":0.7,"rate":1,"fadeIn":0,"fadeOut":0.08}
```

time 相對該幕起點，會對齊影格；volume 0–2；rate 0.5–2，同時改變音高與長度；淡入／淡出 0–2 秒，各不超過實際音效片段的一半。聲音超出場景或整部影片結尾會裁切。重疊時相加混音，峰值超過 1 時等比降低整段混音，避免削波。轉場不會自動改變音量包絡。

`MotionAudio.events(project)` 回傳實際全片時間；`renderMix(project)` 產生單聲道 Float32Array；`wav(samples)` 回傳 WAV ArrayBuffer。原生匯出先合成畫面，再混入 AAC，沒有音效時不加音軌。一般網頁以 HTTP 提供 runtime/sounds/，透過使用者動作啟動聲音：

```js
const sound = await MotionAudio.createPlayer(project);
await sound.play(seconds); // seconds 為全片時間，需與視覺播放器同步
sound.pause();
sound.dispose();
```

seek、loop、pause、專案變更時需同步／重建聲音播放器。聲音不會自動在普通網站播放器中啟用。App 使用本機 loader，不會請求外部音效服務。尚未支援外部音樂／旁白檔案、錄音、聲音分析或影片素材。

## 跨平台輸出 WAV

不需要 Mac App，也可用 Node.js 20+ 混音：

```sh
node assets/render-audio.mjs --project project.motion.json --output sound.wav
```

此命令輸出整段故事長度的 PCM16 WAV，已包含場景偏移、速率、音量、淡入淡出與重疊混音。預設不覆寫。可交給其他影片渲染器與畫面合成，該外部合成步驟需另外執行。

## 驗證

先 `node assets/render.mjs --project project.motion.json --validate`，核對正規化後的圖層、圖片與音效。檢查起點、關鍵格、中間插值、轉場兩側、圖片比例及 MP4 的實際音軌與聲音時間。無法執行時交付專案與必要步驟，勿宣稱完成有聲影片。

## 從空白專案開始（1.5.1）

MotionProject.blankProject({ratio: "9:16", duration: 5, quality: 1080, fps: 30, background: "#10171c"}) 回傳一幕沒有文字、圖層或音效的有效專案；base.visible=false。可在 clips[0].layers 依既有格式加入內容。App 使用「新增空白專案」或 ⌘N，會切到圖層面板並停在開頭；可先儲存原作，或建立後復原。

2.0 的獨立軌道、可組合動作、形狀與時間軸操作請讀 [timeline-and-motions.md](timeline-and-motions.md)。
