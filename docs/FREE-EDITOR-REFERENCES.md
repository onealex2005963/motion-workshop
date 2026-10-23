# 自由編輯器參考研究（2026-10-22）

以 GitHub 星數作為社群採用度參考，並閱讀原專案 README 與官方文件；以下是與本工具相關的成熟專案選樣，不代表 GitHub 全站排名。星數會變動。

| 專案 | 查閱時約略星數 | 適合參考的部分 |
|---|---:|---|
| [Fabric.js](https://github.com/fabricjs/fabric.js) | 31.5k | Canvas 物件操作、選取、縮放與 SVG 互通 |
| [Graphite](https://github.com/GraphiteEditor/Graphite) | 27.7k | 向量工具、圖層與非破壞式節點架構；其 README 仍將部分 motion graphics 能力列於發展方向 |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | 19.4k | 程式化向量動畫、即時預覽、核心與 UI 分離 |
| [Paper.js](https://github.com/paperjs/paper.js) | 15.1k | 路徑分段、節點控制把手、曲線幾何 |
| [Theatre.js](https://github.com/theatre-js/theatre) | 12.8k | 視覺化屬性編排與程式資料互通；README 說明部分開發暫於私人儲存庫進行 |

直接閱讀 [Paper.js 路徑教學](https://paperjs.org/tutorials/paths/working-with-path-items/)，確認每個 segment 的 point、handleIn、handleOut 模型，以及插入、平滑、封閉和刪除節點的工作方式。

## 本次採用的設計

新增可以直接操作的繪圖工具，讓每個自繪物件具有可編輯節點；形狀和移動軌跡都保存於專案，編輯、預覽、倒退定位與匯出共用相同的取樣資料。新增動作仍保留手動軌道。

本次沒有將以上完整專案移植到小工坊，也沒有引入其執行依賴。vector.js 與 vector-editor.js 為獨立實作；參考設計原理與操作模式，不複製其程式碼或媒體。既有第三方 Motion Prompt 與 Kenney 素材的授權維持隨包提供。

自由畫布與節點功能收錄於 2.1.1。以上專案用於技術研究，未宣稱已整合其引擎或包含全部能力。
