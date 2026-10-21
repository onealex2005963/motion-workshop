# 40 種效果：技法拆解與改寫方向

這些是本專案的獨立實作。每個條目對應實際 renderer；可調參數以 catalog 為準。

## 共用骨架

```js
const clamp = v => Math.max(0, Math.min(1, v));
const easeOut = v => 1 - (1 - clamp(v)) ** 3;
const progress = easeOut((seconds - index * 0.16) / 0.9);
const y = targetY + (1 - progress) * 120;
// 每次由時間算出完整狀態，不累加上一影格的位移。
```

## 彈跳小球 · `bounce`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.bounce`。
- 核心：週期相位算拋物感位移，接地時用高斯脈衝壓扁與拉長；較早時間的位置產生殘影。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：落地回饋、提示圖示；保留形變與位移的因果關係。
- [查看預覽](../assets/previews/bounce.png)。

## 呼吸文字 · `type`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.type`。
- 核心：逐字套用不同相位的 sin/cos 位移與縮放，外圍文字用描邊降低存在感。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：短標題與品牌文字；程式會限制主字數，不適合長段落。
- [查看預覽](../assets/previews/type.png)。

## 形狀變奏 · `morph`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.morph`。
- 核心：在極座標取 240 個角度，插值圓、方形、星形與花形的半徑，再旋轉繪製。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：載入標記、轉換概念；保持相同採樣點數避免跳變。
- [查看預覽](../assets/previews/morph.png)。

## 黏土立體 · `clay`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.clay`。
- 核心：WebGL 片段著色器以距離場與 ray marching 尋找表面，估算法線與柔和光照。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：抽象產品開場；需要 WebGL，先檢查 getDiagnostics()。
- [查看預覽](../assets/previews/clay.png)。

## 節奏拼貼 · `rhythm`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.rhythm`。
- 核心：以網格座標產生固定偽亂數，不同格子有不同相位，再插值色塊與幾何形狀。
- 可調欄位：`text`、`color`、`secondary`、`background`、`duration`、`speed`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：活動主視覺與節奏背景；文字區需要留白。
- [查看預覽](../assets/previews/rhythm.png)。

## 流動線條 · `flow`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.flow`。
- 核心：多層曲線由兩組正弦波疊加，時間移動波相；線條顏色與透明度建立層次。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：頁首背景、流程連續感；內容文字放在 DOM。
- [查看預覽](../assets/previews/flow.png)。

## 玻璃透鏡 · `glass`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.glass`。
- 核心：先將條紋與標題繪到離屏 Canvas，以圓形 clip 放大局部，再疊徑向高光。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：放大鏡與玻璃視覺；是簡化透鏡，不是完整物理折射。
- [查看預覽](../assets/previews/glass.png)。

## 光影隧道 · `tunnel`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.tunnel`。
- 核心：與 clay 共用 WebGL 管線，以不同 mode 的距離場產生環形隧道與光照。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：章節開場與速度感；減少動態偏好時改用靜態影格。
- [查看預覽](../assets/previews/tunnel.png)。

## 星塵粒子 · `particles`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.particles`。
- 核心：固定偽亂數產生環面位置，時間控制旋轉、爆散與透視縮放。amount 對應約 500–4000 顆。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`amount`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：抽象聚合與散開；控制同時播放數量以免拖慢介面。
- [查看預覽](../assets/previews/particles.png)。

## 有機生長 · `reaction`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.reaction`。
- 核心：96×96 Gray–Scott 反應擴散網格，以固定步進預先快取狀態，再按時間插值取樣。
- 可調欄位：`text`、`color`、`background`、`duration`、`speed`、`size`、`transition`、`amount`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：有機紋理背景；第一次改 amount 會重建快取。
- [查看預覽](../assets/previews/reaction.png)。

## 網點印刷 · `halftone`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.halftone`。
- 核心：規則網格中，以徑向波與角度決定圓點半徑，顏色隨橫向波切換。
- 可調欄位：`text`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`amount`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：印刷風格背景；amount 增加點密度。
- [查看預覽](../assets/previews/halftone.png)。

## 物理遊樂場 · `physics`

- 實作：[effects.js](../assets/runtime/effects.js) 中的 `renderers.physics`。
- 核心：固定 1/120 秒步進模擬重力、邊界與圓形碰撞；快取軌跡，再按時間插值。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`amount`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：字母球與玩具感；不是任意多邊形或完整物理引擎。
- [查看預覽](../assets/previews/physics.png)。

## 逐字揭幕 · `mask-reveal`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['mask-reveal']`。
- 核心：每個字有固定延遲，相位脈衝經 ease/smooth 後向上移動；行級 clip 遮住未進場部分。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：開場標題、段落揭幕；DOM 改寫時完整文字只讀一次。
- [查看預覽](../assets/previews/mask-reveal.png)。

## 大字聚焦 · `kinetic-zoom`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['kinetic-zoom']`。
- 核心：以週期進度算主字縮放與透明度，疊多層低透明字形形成遠近拖影。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：一句重點的強調；避免連續大幅縮放干擾閱讀。
- [查看預覽](../assets/previews/kinetic-zoom.png)。

## 關鍵字輪替 · `text-morph`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['text-morph']`。
- 核心：按時間選目前與下一個 items，使用交疊透明度和垂直位移完成輪替；膠囊寬度另行呼吸。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：短關鍵字輪替；這是文字交疊，不是字形輪廓變形。
- [查看預覽](../assets/previews/text-morph.png)。

## 數字計數 · `number-roll`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['number-roll']`。
- 核心：目標 value 乘以動畫進度，用固定格式顯示數字；副線同步填滿。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`value`、`suffix`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：統計摘要；保留原始 value，最後顯示精確目標值。
- [查看預覽](../assets/previews/number-roll.png)。

## 打字機 · `typewriter`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers.typewriter`。
- 核心：按秒數推導可見字數，slice 固定文字；游標按週期閃爍。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：短句輸入示範；不是即時文字輸入元件。
- [查看預覽](../assets/previews/typewriter.png)。

## 卡片飛入 · `card-flyin`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['card-flyin']`。
- 核心：每張卡用 index × delay 錯開，三次方緩出插值位置、旋轉與透明度。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：功能卡片；DOM 版以真實內容與閱讀順序為主。
- [查看預覽](../assets/previews/card-flyin.png)。

## 卡片翻轉 · `card-flip`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['card-flip']`。
- 核心：以 cos(angle) 的絕對值模擬水平壓縮，越過半圈切換卡面標籤。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：正反面資訊切換；此版本是 2D 投影近似。
- [查看預覽](../assets/previews/card-flip.png)。

## 卡片環繞 · `orbit-cards`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['orbit-cards']`。
- 核心：sin/cos 生成橢圓軌道，以 z 排序、縮放與透明度營造深度。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：多項目循環展示；不是可拖曳 3D 場景。
- [查看預覽](../assets/previews/orbit-cards.png)。

## 便當格展開 · `bento-grid`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['bento-grid']`。
- 核心：六個區塊從中心出發，以固定延遲改變位置與尺寸。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：功能總覽；不足六個 items 時會補示意文字，發布前替換。
- [查看預覽](../assets/previews/bento-grid.png)。

## 長條圖生長 · `chart-build`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['chart-build']`。
- 核心：先從原始 values 取最大值，再算正規化柱高；依序緩出柱高與顯示值。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`、`values`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：數據說明；標籤和 values 長度應一致，另提供可讀資料。
- [查看預覽](../assets/previews/chart-build.png)。

## 流程連線 · `path-draw`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['path-draw']`。
- 核心：按時間推進步驟索引，逐段插值連線長度；完成節點切成勾號。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：工作流程與 onboarding；真實完成狀態應由產品資料驅動。
- [查看預覽](../assets/previews/path-draw.png)。

## 手機展示 · `phone-scroll`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['phone-scroll']`。
- 核心：在手機形狀內 clip 程序化列表，以時間平移內容；外框與標題不動。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：產品概念分鏡；不是外部手機截圖或網站擷取。
- [查看預覽](../assets/previews/phone-scroll.png)。

## 標籤滑塊 · `tab-indicator`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['tab-indicator']`。
- 核心：固定週期選下一個標籤，滑塊以插值位置移動。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：示意影片；真實 UI 請用 software-ui 範例的 DOM 控制項。
- [查看預覽](../assets/previews/tab-indicator.png)。

## 游標點擊 · `cursor-click`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['cursor-click']`。
- 核心：時間決定游標往按鈕的路徑與點擊脈衝，點擊時畫擴散圓環。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：教學分鏡；互動版應由使用者按鈕事件觸發。
- [查看預覽](../assets/previews/cursor-click.png)。

## 光感玻璃卡 · `glass-card`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['glass-card']`。
- 核心：先畫移動徑向色光，再畫半透明圓角卡與細邊線；進度控制浮起位置。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：質感資訊卡；此範本不是通用背景模糊濾鏡。
- [查看預覽](../assets/previews/glass-card.png)。

## 節拍換卡 · `beat-sync`

- 實作：[effects-extra.js](../assets/runtime/effects-extra.js) 中的 `renderers['beat-sync']`。
- 核心：b = seconds × bpm / 60；整數決定項目與配色，小數相位產生尺寸脈衝與旋轉。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`、`bpm`。完整預設例子見 [catalog.json](../assets/catalog.json)。
- 應用：按固定 BPM 剪接；不是對音樂做自動節拍偵測。
- [查看預覽](../assets/previews/beat-sync.png)。

## 折線趨勢 · `line-chart`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['line-chart']`。
- 核心：依原始 values 正規化座標，用線性路徑與左到右裁切揭露折線；半透明面積建立層次。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`、`values`。
- 應用：統計報告、指標趨勢；保留資料順序與標籤。
- [查看預覽](../assets/previews/line-chart.png)。

## 環形比例 · `donut-chart`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['donut-chart']`。
- 核心：各值除以總和決定圓弧角度，以固定時間進度展開；零總和顯示破折號。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`、`values`。
- 應用：佔比與組成；圖例百分比四捨五入可能不精確加總到 100%。
- [查看預覽](../assets/previews/donut-chart.png)。

## 資料網絡 · `network-flow`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['network-flow']`。
- 核心：節點排列於橢圓周圍，固定相位光點在中心與節點間插值。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：系統關係與資料流；不是即時資料連線圖。
- [查看預覽](../assets/previews/network-flow.png)。

## 里程碑時間軸 · `timeline-story`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['timeline-story']`。
- 核心：進度控制水平線長度，節點依索引錯開浮現並交替上下位置。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：產品歷程與步驟時間線；事件內容來自 items。
- [查看預覽](../assets/previews/timeline-story.png)。

## 程式碼視窗 · `code-window`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['code-window']`。
- 核心：繪製程序化視窗、行號與逐行錯開的文字揭露。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：開發工具介紹；顯示文字，不會執行字串中的程式碼。
- [查看預覽](../assets/previews/code-window.png)。

## 終端機演示 · `terminal-run`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['terminal-run']`。
- 核心：以時間決定各行的字數與透明度，指令前加提示符號，完成項目使用勾號。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：指令操作分鏡；不是真正的命令執行環境。
- [查看預覽](../assets/previews/terminal-run.png)。

## 幾何標誌揭幕 · `logo-reveal`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['logo-reveal']`。
- 核心：四個圓角部件在同一局部座標中縮放旋轉，緩出後形成抽象標誌。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。
- 應用：原創幾何品牌開場；不是匯入使用者 Logo。
- [查看預覽](../assets/previews/logo-reveal.png)。

## 分割標題 · `split-title`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['split-title']`。
- 核心：將 Unicode 字元切成兩段，分別從相反水平方向進入裁切區。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。
- 應用：標題與節奏切換；不是自動語意斷詞。
- [查看預覽](../assets/previews/split-title.png)。

## 引言卡片 · `quote-card`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['quote-card']`。
- 核心：引言、色條與署名放在半透明卡片上，時間同時控制位移與透明度。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。
- 應用：重點結論、署名與評語；文字需有來源或由使用者提供。
- [查看預覽](../assets/previews/quote-card.png)。

## 流光漸層 · `gradient-mesh`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['gradient-mesh']`。
- 核心：三個移動徑向漸層疊在固定背景上，以不同正弦相位緩慢移動。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`。
- 應用：品牌氛圍背景；並非 Three.js 材質或完整 3D。
- [查看預覽](../assets/previews/gradient-mesh.png)。

## 斜角堆疊 · `isometric-stack`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['isometric-stack']`。
- 核心：用二維仿射矩陣建立等角感卡片，按順序調整高度與透明度。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：功能層級與系統堆疊；是程序化 2D 畫面。
- [查看預覽](../assets/previews/isometric-stack.png)。

## 通知堆疊 · `notification-stack`

- 實作：[effects-pro.js](../assets/runtime/effects-pro.js) 中的 `renderers['notification-stack']`。
- 核心：每張通知使用不同起始延遲，緩出插值水平位置與透明度。
- 可調欄位：`text`、`subtitle`、`color`、`secondary`、`background`、`duration`、`speed`、`size`、`transition`、`items`。
- 應用：產品回饋分鏡；真實介面應接實際事件。
- [查看預覽](../assets/previews/notification-stack.png)。

## 轉場拆解

共用實作：[engine.js](../assets/runtime/engine.js)。先將前後兩幕各繪到離屏 Canvas，再以平滑進度 `u = p*p*(3-2*p)` 合成。

| ID | 合成方式 |
|---|---|
| cut | 不重疊，在交界切換 |
| crossfade | 前幕不透明，後幕 alpha = u |
| push | 前幕移到 -u × 寬度，後幕從 (1-u) × 寬度進場 |
| wipe | 後幕由左側矩形裁切區揭露 |
| circle | 以中心向外擴大的圓形 clip 揭露後幕 |
| zoom | 前幕微放大，後幕由 0.86 倍放大到 1 倍並淡入 |

新增轉場：slide-up 垂直推移兩幕；diagonal 使用斜角三角形裁切；blur 在交疊中加入正弦模糊半徑；flash 在交疊中加入一次白光脈衝。首尾回到未變形的原始影格。

每種轉場都有對應預覽 `assets/previews/transition-<id>.png`。時間軸先以整數影格分配重疊；詳見 [影片說明](video.md)。

## 另有 144 個 Motion Prompt 套版

mp-001 至 mp-144 的六類原始技法、精確規格、共用 kit 與授權，請讀 [Motion Prompt 指南](motion-prompt.md)。透過 motion-reference.mjs get/kit 取得指定程式，不要把原始示範與 20 個全圖層改編混為一談。
