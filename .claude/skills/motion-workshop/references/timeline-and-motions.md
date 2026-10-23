# 多軌時間軸與可組合動作（2.0）

需使用 2.0 runtime / App。專案仍是 version: 2；1.5 與更早版本會忽略新增的 tracks、motions 與形狀欄位。不要用舊版重新儲存新作品。

## 編輯器操作

切換「圖層／動作」會開啟下方「多軌時間軸」；「場景順序」可切回整片分鏡。「插入多軌動作示範」會新增場景，保留原場景，可復原。時間軸以目前場景起點為 0 秒。

拖曳綠色圖層時段可移動圖層、其關鍵格與動作；拉左右邊緣調整顯示範圍。紫色動作片段可獨立拖曳與調長；音效列顯示內建 WAV 的振幅波形，可拖曳定位。播放頭、影格與片段邊界可吸附，亦可關閉吸附。時間軸提供縮放、高度與垂直捲動。

Shift 點選圖層可多選一起移動；圖層名稱或畫布 Shift 點選同樣有效。對齊按鈕對單個圖層使用畫布邊界，對多選使用選取範圍。畫布右下角控制點縮放、上方控制點旋轉；旋轉時 Shift 對齊 15 度。鎖定圖層不接受編輯。

展開的屬性列中可拖曳菱形關鍵格，Shift 點選多格；支援複製、貼到播放頭與刪除。雙擊屬性列空白處新增該屬性的關鍵格。碰到未選取的同影格關鍵格會拒絕移動；貼上同屬性同影格則更新值。拖曳可按 Esc 取消；放開後形成一步復原。勾選「自動記錄關鍵影格」後，修改靜態屬性也會在目前時間記錄。

## 獨立屬性軌道

每幕最多 32 層；每層每個屬性最多 1201 格，可容納 20 秒 × 60 FPS 加結尾。tracks 的各屬性有自己的時間，不必補齊其他屬性：

```js
const layer = MotionLayers.defaultLayer('star');
layer.end = 6;
layer.width = 20; layer.height = 35;
layer.tracks = {
  x: [{time: 0, value: 25, easing: 'linear'},
      {time: 2, value: 70, easing: 'cubic', curve: [.3, 0, .2, 1]}],
  opacity: [{time: 0, value: 0, easing: 'linear'},
            {time: .6, value: 1, easing: 'ease-out'}],
  fill: [{time: 1, value: '#d8f36a', easing: 'linear'},
         {time: 4, value: '#a59bff', easing: 'ease-in-out'}]
};
MotionLayers.addMotion(layer, 'float', {
  start: 1, duration: 3, repeat: 2, strength: 1,
  direction: 'up', fps: 30, sceneDuration: 6
});
```

可動屬性：x、y、scale、scaleX、scaleY、rotation、opacity、width、height、fill、strokeWidth、radius。時間為場景內秒數，normalize 會對齊 FPS。easing/curve 定義在到達的那一格；第一格前保持第一格，最後一格後保持最後一格。fill 以 RGB 插值。cubic 的 curve 為 [x1,y1,x2,y2]，x 限制 0–1，y 限制 −3–3，可產生過衝。

既有 keyframes 的五屬性整格格式仍可讀取。取樣先算舊 keyframes，再由存在的 tracks 屬性覆蓋；空陣列代表該屬性使用靜態值。MotionLayers.setKey(layer, property, time, value, {fps,duration,easing,curve}) 只將該屬性的舊格轉成獨立軌道，不影響其他屬性。

## 動作片段

每層最多 12 段 motions；以 MotionLayers.motionPresets 查名稱與 phase。進場：rise、slide、pop、spin、fade、zoom、drop；循環：float、pulse、wiggle、orbit、spin-loop；退場：fade-out、slide-out、shrink、spin-out。

每段包含 id、preset、start、duration、strength（0.1–3）、direction（up/down/left/right）、repeat（1–20）、easing、curve、enabled。以 MotionLayers.addMotion() 產生完整且對齊影格的資料。未知 preset 不會產生自訂程式碼。

motions 在手動軌道之後疊加：位移／旋轉相加，縮放／透明度相乘。進場前保持起始偏移，退場後保持結束姿態；圖層 start/end 另外決定可見範圍。多個片段可以重疊，請實際預覽合成後的值。套動作不會刪除手動關鍵影格。

MotionLayers.sample(layer, seconds) 回傳最終樣式與姿態；sampleBase 不含動作。MotionLayers.edit(layer, seconds, values, {key:true,fps,duration,easing,curve}) 會反算目前動作偏移，再寫入手動屬性，以避免編輯時重複套用動作。

MotionLayers.bake(layer, duration, fps) 將動作轉為每個輸出影格的五屬性關鍵格並清空 motions，保留其他樣式軌道。此方法在指定 FPS 的影格上維持相同姿態；不要宣稱影格間連續曲線完全等價。

「我的動作組合」在此電腦可儲存最多 30 組，只含 motions 與參數，不含內容或手動格。分享作品使用 .motion.json；分享組合可將 motions 複製到其他圖層，再 normalize。App 的本機收藏不會自動上傳或包含在專案 ZIP。

## 形狀

類型：text、rect、ellipse、line、image、triangle、polygon、star、arrow。scaleX/scaleY（0.05–5）可分開調整，anchorX/anchorY（0–100）設定變形錨點；sides（3–12）控制多邊形邊數或星角數，innerRadius（0.1–0.9）控制星形內徑。fillMode 為 solid/linear/radial；fillSecondary、gradientAngle、dash 設定漸層與虛線。描邊需 strokeWidth > 0。

可用參數繪製形狀，尚未提供任意 SVG 匯入、圖層群組、父子關係或自訂遮罩。144 個原版套版內部仍依原版設計，不是全部可拆解物件。

## Claude 的使用方式

先讀此文件與 assets/project.schema.json，再使用 assets/examples/多軌動畫工作室.motion.json。依 catalog 的 runtimeOrder 載入原有 10 個 runtime；studio-editor.js 和 timeline.js 只供 App 編輯器，不是嵌入式播放的必要依賴。網站／軟體可把動作原理改寫成自身框架，但要保留使用者內容、鍵盤操作與減少動態偏好。

用 node assets/render.mjs --project 作品.motion.json --validate 檢查正規化結果，再檢查首尾、各屬性關鍵格、動作交界與倒退定位。有原生執行環境才匯出 MP4；雲端聊天不能只憑本機路徑讀檔，必須提供整份 ZIP 與作品 JSON。

2.1 另提供 path 圖層、形狀與移動路徑兩種可動屬性，合計 14 種獨立軌道，詳見 [自由畫布](free-canvas.md)。
