# 網站與軟體介面整合

## 可直接執行的範例

從本 skill 資料夾開啟 `assets/examples/website/index.html`，不需要伺服器。它載入相對路徑的十個 runtime script，沒有 CDN 或網路請求。
`assets/examples/software-ui/index.html` 是可操作的 DOM 範例，可用左右方向鍵、Home、End 切換標籤。

## 嵌入你的網站

複製 `assets/runtime/`、`assets/examples/website/player.js` 與 MIT 授權到專案的公開資產目錄。依序載入 effects.js、effects-extra.js、effects-pro.js、motion-reference.js、reference-templates.js、vector.js、layers.js、audio.js、engine.js、library.js、player.js。

```html
<canvas id="motion" width="1400" height="720" aria-label="產品動畫"></canvas>
<p>產品的文字說明。動畫不取代主要資訊。</p>
<button id="toggle" type="button">播放</button>
```

```js
const canvas = document.querySelector('#motion');
const project = {
  version: 2, ratio: '16:9', quality: 720, fps: 30,
  clips: [{ ...MotionProject.defaultClip('card-flyin'),
    text: '三個好點子', items: ['簡單', '清楚', '流暢'] }]
};
const player = MotionWorkshopPlayer.createPreviewPlayer(canvas, project);
document.querySelector('#toggle').onclick = () =>
  player.playing ? player.pause() : player.play();
// SPA 頁面卸載時：player.dispose();
```

Canvas CSS 尺寸和繪圖解析度是兩件事。範例以固定 1400×720 繪製，再用 `width:100%;height:auto` 等比縮放。不要只改 CSS 高寬而讓比例失真；大量高解析度 Canvas 同時播放也會佔用 GPU。主內容留在 DOM，Canvas 作為附加視覺，手機可改用單一效果或靜態海報。

## React / Vue / Electron / WebView

這是瀏覽器全域腳本，沒有框架套件。SSR 環境只在 client mount 後載入。讓十個 runtime 腳本在整個頁面生命週期只載入一次；先等載入完成，再建立 player。元件卸載呼叫 `dispose()`，專案改變時先 dispose 舊 player。不要在 render 函式中重建播放循環。

Electron、Tauri 或其他桌面 WebView 可以重用 Canvas；**不能直接當成原生 SwiftUI、React Native 或 Flutter 控制項**。原生介面可依效果拆解改寫對應動畫；播放器與原生 MP4 輸出是分開的能力。

## 從影片範本改成真實介面

| 視覺效果 | 對應 DOM 做法 | 必須保留的行為 |
|---|---|---|
| tab-indicator | 定位滑塊，從實際 tab 的 offsetLeft / offsetWidth 取得位置 | aria-selected、roving tabindex、方向鍵、ResizeObserver |
| card-flyin | translateY + opacity，卡片逐張延遲 | 閱讀順序不變、最後內容可選取、動畫取消不隱藏內容 |
| cursor-click | 真實按鈕事件觸發漣漪 | Enter/Space 操作、文字狀態更新、禁用重複提交由產品邏輯控制 |
| mask-reveal | 外層 overflow:hidden，文字 translateY | 輔助科技只讀一次完整標題 |
| chart-build | 由固定原始值算柱高，動畫插值 | 表格／文字摘要仍提供完整數字 |

完整例子在 `assets/examples/software-ui/ui.js`。它沒有假裝發送請求；點擊只更新本機次數。接入產品時，在真實成功／失敗事件顯示回饋。

## 驗收

檢查鍵盤焦點、切換後面板與標籤一致、縮放後滑塊位置、暫停與分頁隱藏。開啟系統「減少動態效果」後，介面動畫應取消，內容與按鈕仍可用。影片中的游標／手機示意不應冒充真實可操作控件。

## 1.4 圖層與聲音

讀 [客製化說明](layers-and-audio.md)。圖片需在擷取影格前呼叫 MotionLayers.prepare(project)。音效採使用者動作啟動，與視覺播放器分開管理；呼叫 MotionAudio.createPlayer(project)，在播放／暫停／定位時同步，卸載時 dispose()。保留 runtime/sounds/ 的 WAV 和 CC0 授權；音效經 HTTP 或本機 App loader 載入，直接 file:// 開頁時瀏覽器可能拒絕讀取。
