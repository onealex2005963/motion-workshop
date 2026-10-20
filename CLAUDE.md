# Motion Workshop

本專案包含可重用的動畫 renderer、Claude skill 與可選的 macOS 編輯器。
需要製作網站、軟體介面動畫或影片分鏡時，讀取 `.claude/skills/motion-workshop/SKILL.md`，或在 Claude Code 使用 `/motion-workshop`。

可攜式工具包位於該 skill 的 `assets/`；參數以 `assets/catalog.json` 為準。
`web/` 是原生編輯器的前端，renderer 與 skill runtime 必須一致；`npm test` 會檢查。
本專案不需要 npm install。`npm run demo` 只在 127.0.0.1 啟動示範；`npm test` 檢查目錄、範例與時間軸。
使用者專案與匯出影片不應提交到儲存庫。範例數字只用於示意。
