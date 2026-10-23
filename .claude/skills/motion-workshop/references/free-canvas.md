# 自由畫布、路徑節點與形狀變形（2.1）

2.1.1 提供直接繪圖、手動新增節點與可編輯動畫資料；macOS 編輯器為可選工具，重用效果不必安裝 App。

## 實際操作

畫布上方新增工具列。V 選取、R 拖曳畫矩形、E 畫橢圓、S 畫星形；P 鋼筆點選節點，按住拖曳可拉出曲線把手，點起點封閉、Enter 完成開放路徑、Esc 取消。B 手繪可直接畫線。N 新增節點：選好形狀後，單擊線段精準插入、單擊空白在所選節點後新增。沒有形狀時可逐點建立新路徑，至少兩點後按 Enter 或「完成路徑」；Esc 取消草稿。側欄「插入線段中點」保留一鍵細分。H 平移；＋／−、Ctrl/Cmd 滾輪縮放，「符合畫面」重設。

A 節點工具會將選取的參數形狀轉成可編輯路徑，可復原。拖方形節點改輪廓，拖圓形把手改曲率，Alt 讓單邊把手獨立；可平滑、尖角、插入或刪除節點。雙擊線段會在該位置切開曲線，保持幾何輪廓。「封閉形狀」和「填色」可切換。

先按「記錄形狀關鍵格」，移動播放頭，再拖節點，就能製作形狀變形。增刪節點會同步所有形狀格，保持拓撲一致；每條路徑最多 64 節點。同一形狀的局部座標以原始圖層框為 0–100，節點可超出原框。

M 為所選圖層建立可拖曳的移動路徑。拖端點改目的地、拖把手改曲線；下方「移動路徑」屬性列菱形控制到達時間。「插入節點」在目前播放頭加位置點，新增點後可調整曲率。勾選「沿路徑方向旋轉」讓圖層跟隨切線。移動路徑會優先於既有 X/Y 軌道，停用可回到原軌道；動作範本的位移仍另外疊加。

「插入自由繪圖示範」會新增一幕可編輯的形狀變形與軌跡箭頭，保留原場景。可按復原。所有繪圖與拖曳修改都寫進專案資料，並非只生成文字指令。

## 路徑資料

使用 2.1 runtime，依 catalog.runtimeOrder 載入 **10** 個腳本：effects、effects-extra、effects-pro、motion-reference、reference-templates、vector、layers、audio、engine、library（副檔名 .js）。vector.js 須在 layers.js 前。project.version 仍為 2，舊版會丟棄新欄位。

```js
const layer = MotionLayers.defaultLayer('path');
layer.end = 6;
layer.path = {closed: true, segments: [
  {x: 10, y: 20, inX: 0, inY: 0, outX: 30, outY: -20},
  {x: 90, y: 25, inX: -20, inY: -10, outX: 0, outY: 30},
  {x: 50, y: 90, inX: 25, inY: 0, outX: -20, outY: -10}
]};
const target = structuredClone(layer.path);
target.segments[1].y = 50;
MotionLayers.setKey(layer, 'path', 0, layer.path, {fps: 30});
MotionLayers.setKey(layer, 'path', 3, target, {fps: 30, easing: 'ease-in-out'});
MotionLayers.setKey(layer, 'position', 0,
  {x: 20, y: 50, outX: 15, outY: -20}, {fps: 30});
MotionLayers.setKey(layer, 'position', 6,
  {x: 80, y: 50, inX: -15, inY: 20}, {fps: 30, easing: 'linear'});
```

path.segments 的 x/y 是圖層局部百分比，inX/inY、outX/outY 是相對節點的控制把手向量。tracks.path 的 value 是完整 path，只有 closed 和節點數一致時才插值；不一致時保持前一格直到下一格。UI 增刪節點會同步所有格，不同拓撲的自訂程式輸入需自行對齊。

tracks.position 的 value 為場景百分比位置及控制向量；time 為場景內秒數。easing 設在到達的那一格，與其他屬性相同。沒有把手的直線以線性空間插值運動，有把手時使用三次貝茲曲線。positionEnabled（預設 true）控制路徑；orientToPath（預設 false）控制切線方向旋轉。

MotionLayers.sample(layer, seconds, ratio) 的第三參數用數值寬高比（如 16/9），用來計算正確切線角度。一般 MotionProject.render 自動傳遞比例。直接編輯沿路徑旋轉的圖層時，MotionLayers.edit 的 options.ratio 也應提供相同值。

MotionVector 提供 normalize、cubic、split、insert、closest、smooth、bounds、fromShape、toWorld、toLocal、toSVG 等幾何 API。split 使用三次曲線細分，保持原輪廓；bounds 包含曲線極值。資料模型參考 Paper.js 的節點與控制把手概念，程式為本專案獨立實作。

## 重用與輸出

讀 assets/examples/自由路徑與形狀變形.motion.json；或使用 MotionLibrary.createVectorDemo({ratio, fps}) 建立示範。使用者的 SVG 匯出為所選路徑圖層的靜態 SVG，透明背景，保留目前形狀、填色、描邊、位置、縮放與旋轉；不包含其他圖層或時間動畫。可直接借用其 path 幾何於網站。MotionVector.toSVG(layer, pose, ratio) 提供相同輸出。

可編輯動畫以 .motion.json 保存。MP4 使用同一套取樣與繪圖資料；Claude 可直接建立／修改 tracks.path、tracks.position，先 validate，再以 frame / fps 渲染。不要把文件或本機路徑當作已經輸出的影片。

目前沒有任意 SVG 匯入、布林聯集／相減、群組／父子關係、遮罩、骨架或外部影片／音訊素材匯入。這些不應被列為已完成能力。

2.1.1 補充：MotionVector.insert(path, afterIndex, point) 在指定節點後新增，最多 64 點；回傳是否成功。closest(path, point, map?) 可提供顯示座標轉換，以螢幕像素判斷距離。UI 手動新增會同步靜態形狀及全部形狀關鍵格，並可單次復原。
