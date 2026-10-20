# 完整故事與 Claude 指令

## 8 套故事範本

| ID | 用途 | 四幕順序 |
|---|---|---|
| product-launch | 產品發表 | 幾何標誌 → 功能總覽 → 斜角卡片 → 文字收尾 |
| app-demo | App 介紹 | 分割標題 → 示意手機 → 通知堆疊 → 卡片重點 |
| data-report | 數據報告 | 指標計數 → 折線趨勢 → 環形比例 → 結論 |
| explainer | 概念解說 | 文字開場 → 資料網絡 → 里程碑 → 步驟 |
| type-showreel | 文字動態集錦 | 大字聚焦 → 分割標題 → 呼吸字體 → 關鍵字輪替 |
| brand-intro | 品牌形象 | 流光漸層 → 幾何標誌 → 引言 → 粒子 |
| developer-release | 軟體更新 | 程式視窗 → 終端機 → 資料網絡 → 文字收尾 |
| social-reel | 直式短影音 | 分割標題 → 通知 → 節拍換卡 → 幾何標誌 |

原始目錄：`assets/story-presets.json`。可直接開啟的專案：`assets/examples/stories/<id>.motion.json`。所有資料均為本專案獨立製作，沒有複製外部作品的影片或提示詞。

## 直接產生專案

從 skill 根目錄執行（Node.js 20+，不安裝套件）：

```sh
node assets/create-project.mjs --list
node assets/create-project.mjs --story product-launch --brand "你的品牌" \
  --headline "讓想法清楚被看見" --items "簡單,清楚,流暢" \
  --duration 15 --ratio 16:9 --palette 0 --fps 30 --output project.motion.json
node assets/render.mjs --project project.motion.json --validate
```

總長可選 12、15、20、30 秒；比例 16:9、9:16、1:1；影格率 30 或 60；palette 0–3 對應萊姆紫、夕陽藍、粉紅綠、暖白金。已存在的輸出檔預設拒絕覆寫。

`MotionLibrary.createStory(id, options)` 先計算轉場重疊，再把總影格預算分配給四幕。個別場景時長可能含小數，請保留內部精度；顯示可以四捨五入。不要將每幕任意截成整秒，否則無法維持指定總長。

程式碼／終端機效果只繪製字串，不執行指令。圖表、指標、幾何標誌、通知與手機均是示意。發布前替換資料與文案；這些範本不會自動匯入產品截圖、音訊或使用者 Logo。

## 產生對應作品的提示詞

完整編輯器的「Claude 指令」可選整份作品／目前場景，以及網站、軟體、影片三種用途。它會帶入實際效果、程式檔名、時間軸、顏色與 JSON，而不是只有泛用文字。

在已載入七個 runtime script 的環境，也可使用：

```js
const project = MotionLibrary.createStory('developer-release', {brand:'Studio',duration:20});
const prompt = MotionLibrary.createPrompt(project, {
  mode: 'software', // video | website | software
  brief: '參考這份分鏡，替目前專案實作可操作的介面動效。'
});
```

這是離線字串組合器，不會呼叫 Claude 或其他模型。請把生成指令與完整 Skill ZIP 一起提供給對方。Skill 能讓 Claude 讀取實作範例；真正的執行與渲染能力仍由使用者的環境提供。
