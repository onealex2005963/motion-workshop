# Motion Prompt：144 個套版、離線字典與圖層配方

1.5 新增日本作者 Shohei Ohtaki 的 Motion Prompt MIT 快照：144 個固定 ID、6 類可直接插入場景的原版 Canvas 套版、英／日原始規格與程式。小工坊另提供完整繁中搜尋名稱，以及 20 組原創、可編輯的圖層改編。兩者不能宣稱完全相同。

## 按名稱或選擇查詢

所有路徑相對於 SKILL.md；指令不需要 API key、網路或 npm 套件。

```sh
node assets/motion-reference.mjs info
node assets/motion-reference.mjs search 錯開
node assets/motion-reference.mjs list --pack motion2
node assets/motion-reference.mjs list --editable
node assets/motion-reference.mjs get 005
node assets/motion-reference.mjs kit motion
```

App 頂部「動效字典 144」可搜尋編號／繁中／英／日、播放或定位原版示範，為多個效果逐一加上用途備註，複製或儲存交接指令。這是明確的文字交接，沒有自動傳送到 Claude、也沒有背景接收器。雲端 Claude 必須收到整份 ZIP；修改現有作品還需提供 .motion.json，電腦路徑不代表已取得檔案。

## 使用原版動作

依選定 ID 執行 `get`，再依它的 pack 執行 `kit`；元素的 CELLS[index] 依賴 kit 的常數、輔助函式及 CELLS 陣列，不能只複製那一行。僅採用實際讀取的程式。來源在 assets/motion-reference/packs/，固定 commit 與各檔雜湊在 origin.json 與 SHA256SUMS.json。

保留 `get` 與 `kit` 第一行的 Motion Prompt 編號、作者及 MIT 註記，以及 assets/motion-reference/LICENSE.txt。原版數值以小卡片尺寸為基準；映射到產品尺寸時等比例縮放距離，保留先後、延遲、緩動與過衝。若需求改變節奏，明確列出改動。替換既有場景前確認起點、長度、FPS 與前後轉場，只替換指定動作。

網站或軟體：ui/lp 的 Canvas 是互動示意，成品要用真實 DOM 控制項、事件與鍵盤焦點，並支援 reduced motion。photo 是攝影／生成提示詞的風格參考，不能把示範圖形當成實際照片濾鏡；對影片模型改寫為文字，不假設逐格精確時間會被遵守。

單獨預覽只需 assets/runtime/motion-reference.js：`MotionReference.render('005', canvas, seconds)`。單獨預覽不依賴專案引擎；不要以牆鐘、隨機數或上一格狀態替代絕對時間。上游參考可用原版的系統字型與示例文字，無任何外部字型或媒體下載。

## 全部 144 個原版套版

App 左側「144 動效套版」可套用目前場景，保留場景長度、轉場與額外圖層。字典「插入原版套版場景」會新增一幕。全部 ID 都可輸出專案與 MP4：

```sh
node assets/motion-reference.mjs template 105 --text "我的品牌" --subtitle "用動作說故事" --duration 5 --ratio 9:16 --sound --output template.motion.json
node assets/render.mjs --project template.motion.json --validate
```

專案 effect 為 mp-001 至 mp-144；載入 catalog.runtimeOrder 的 10 個腳本（motion-reference 在 reference-templates 之前，兩者在 layers / engine 之前）。共用 duration、speed、size、text、subtitle、background，並可用 referenceTemplate: {fit: "contain" | "cover", labels: boolean, loop: boolean}。labels 控制自訂標題覆蓋；原版示範內部文字、顏色與幾何保留原設計，不會自動替換。可疊加自己的文字、圖形、圖片與音效；任意內部元件客製需修改程式，或使用下列全圖層配方。

可選載入 runtime/reference-recipes.js 後使用 MotionReference.createClip()；原版套版的 MotionReference.createTemplate() 由 reference-templates.js 提供。兩者都回傳可驗證的場景 JSON。

## 可編輯的圖層改編

20 個 ID：001、002、003、010、014、016、024、121–128、130、131、134、143、144。這些是小工坊為可編輯場景重新設計的配方，使用既有圖層與關鍵格，沒有把原版渲染器偽裝成新的圖層。

```sh
node assets/motion-reference.mjs create 002 --text "清楚呈現產品價值" --items "快速,清楚,流暢" --duration 5 --stagger 0.16 --strength 1.2 --ratio 9:16 --fps 30 --sound --output scene.motion.json
node assets/render.mjs --project scene.motion.json --validate
```

輸出拒絕覆寫既有檔案。每幕最多 12 層、每層最多 60 格，長度 1–20 秒；產生後檢查正規化數值。波浪／路徑文字依字串長度分組為至多 10 個文字圖層，保留全部文字，單一字元的控制粒度會依長度不同。

App 可在「預覽內容」切換原版與改編；在「調整可編輯配方」改文字、秒數、強度、錯開間隔與 CC0 音效。插入會在目前場景後新增一幕，保留既有場景；能用一次復原移除。插入後直接調整圖層、樣式與關鍵格。

只有特定配方使用錯開間隔；強度依配方影響位移、旋轉或縮放。loop 配方在起終姿態相同，停格、爆發與進場等配方不保證無縫。所有改編都保留可編輯 JSON，原版示範以原始 cycle 循環。

先檢查正規化結果、首尾、關鍵時間、三種比例及轉場。交付時列出使用的原版 ID、改編方式與實際驗證；未渲染的專案不能宣稱已輸出影片。
