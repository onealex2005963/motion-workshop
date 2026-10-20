import AppKit
import WebKit
import AVFoundation
import UniformTypeIdentifiers
import ImageIO

let appName = "動畫小工坊"
let sourceURL = URL(string: "https://rar.design/posts/pure-code-animation-claude-code-12-effects")!

enum WorkshopError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let text) = self { return text }; return nil }
}

final class VideoEncoder {
    let writer: AVAssetWriter
    let input: AVAssetWriterInput
    let adapter: AVAssetWriterInputPixelBufferAdaptor
    let temporary: URL
    let destination: URL
    let width: Int
    let height: Int
    let fps: Int32
    let frameCount: Int
    var index = 0

    init(destination: URL, width: Int, height: Int, fps: Int, frames: Int) throws {
        guard width >= 100, height >= 100, width <= 1920, height <= 1920, width % 2 == 0, height % 2 == 0,
              [30,60].contains(fps), frames > 0, frames <= 28800 else { throw WorkshopError.message("影片設定不正確。") }
        self.destination = destination; self.width = width; self.height = height; self.fps = Int32(fps); self.frameCount = frames
        temporary = FileManager.default.temporaryDirectory.appendingPathComponent("MotionWorkshop-\(UUID().uuidString).mp4")
        writer = try AVAssetWriter(outputURL: temporary, fileType: .mp4)
        input = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: min(20_000_000, max(2_000_000, width * height * fps / 6)), AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel],
            AVVideoColorPropertiesKey: [AVVideoColorPrimariesKey: AVVideoColorPrimaries_ITU_R_709_2, AVVideoTransferFunctionKey: AVVideoTransferFunction_ITU_R_709_2, AVVideoYCbCrMatrixKey: AVVideoYCbCrMatrix_ITU_R_709_2]
        ])
        input.expectsMediaDataInRealTime = false
        adapter = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
            kCVPixelBufferWidthKey as String: width, kCVPixelBufferHeightKey as String: height,
            kCVPixelBufferCGImageCompatibilityKey as String: true, kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
        ])
        guard writer.canAdd(input) else { throw WorkshopError.message("這台電腦無法建立 H.264 影片。") }
        writer.add(input)
        guard writer.startWriting() else { throw writer.error ?? WorkshopError.message("影片編碼器無法啟動。") }
        writer.startSession(atSourceTime: .zero)
    }

    func append(base64: String, frame: Int) throws {
        guard frame == index, index < frameCount else { throw WorkshopError.message("影片影格順序不正確。") }
        guard base64.count < 32_000_000, let data = Data(base64Encoded: base64),
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let image = CGImageSourceCreateImageAtIndex(source, 0, nil), image.width == width, image.height == height else { throw WorkshopError.message("無法讀取動畫影格。") }
        let deadline = Date().addingTimeInterval(15)
        while !input.isReadyForMoreMediaData {
            if writer.status != .writing { throw writer.error ?? WorkshopError.message("影片寫入中斷。") }
            if Date() > deadline { throw WorkshopError.message("影片編碼逾時，請降低畫質後重試。") }
            Thread.sleep(forTimeInterval: 0.005)
        }
        guard let pool = adapter.pixelBufferPool else { throw WorkshopError.message("無法配置影片畫面。") }
        var buffer: CVPixelBuffer?
        guard CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer) == kCVReturnSuccess, let pixel = buffer else { throw WorkshopError.message("記憶體不足，請降低畫質。") }
        CVPixelBufferLockBaseAddress(pixel, [])
        defer { CVPixelBufferUnlockBaseAddress(pixel, []) }
        guard let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue | CGBitmapInfo.byteOrder32Big.rawValue) else { throw WorkshopError.message("無法繪製影片。") }
        context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        guard adapter.append(pixel, withPresentationTime: CMTime(value: Int64(index), timescale: fps)) else { throw writer.error ?? WorkshopError.message("影片影格寫入失敗。") }
        index += 1
    }

    func finish(completion: @escaping (Result<String, Error>) -> Void) {
        guard index == frameCount else { cancel(); completion(.failure(WorkshopError.message("影片影格尚未完成。"))); return }
        input.markAsFinished()
        writer.endSession(atSourceTime: CMTime(value: Int64(frameCount), timescale: fps))
        writer.finishWriting {
            do {
                guard self.writer.status == .completed else { throw self.writer.error ?? WorkshopError.message("影片未能完成。") }
                if FileManager.default.fileExists(atPath: self.destination.path) { _ = try FileManager.default.replaceItemAt(self.destination, withItemAt: self.temporary) }
                else { try FileManager.default.moveItem(at: self.temporary, to: self.destination) }
                completion(.success(self.destination.lastPathComponent))
            } catch { try? FileManager.default.removeItem(at: self.temporary); completion(.failure(error)) }
        }
    }
    func cancel() { writer.cancelWriting(); try? FileManager.default.removeItem(at: temporary) }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandlerWithReply, WKNavigationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var web: WKWebView!
    var encoder: VideoEncoder?
    var encoderOwner: WKWebView?
    var exportPanelOpen = false
    let encodeQueue = DispatchQueue(label: "dev.local.motionworkshop.encoder", qos: .userInitiated)
    let fm = FileManager.default
    var testDirectory: URL?
    var testStarted = false
    var batchProject: String?
    var batchOutput: URL?
    var batchReport: URL?
    var batchCompleted = false
    var allowOverwrite = false
    var queueTimer: Timer?
    var queueWeb: WKWebView?
    var queueJob: URL?
    var queueProject: String?
    var lastHeartbeat = Date.distantPast
    var jobsURL: URL { autosaveURL.deletingLastPathComponent().appendingPathComponent("jobs",isDirectory:true) }
    var bundledWeb: URL { Bundle.main.resourceURL!.appendingPathComponent("web", isDirectory: true) }
    var autosaveURL: URL { fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent(appName, isDirectory: true).appendingPathComponent("project.json") }

    func applicationDidFinishLaunching(_ notification: Notification) {
        func argument(_ name: String) -> String? { guard let i = CommandLine.arguments.firstIndex(of:name), CommandLine.arguments.count > i+1 else { return nil }; return CommandLine.arguments[i+1] }
        let batchSource = argument("--render") ?? Bundle.main.object(forInfoDictionaryKey:"WorkshopBatchProject") as? String
        if let input = batchSource {
            let out = argument("--output") ?? Bundle.main.object(forInfoDictionaryKey:"WorkshopBatchOutput") as? String
            let report = argument("--report") ?? Bundle.main.object(forInfoDictionaryKey:"WorkshopBatchReport") as? String
            batchReport = report.map { URL(fileURLWithPath:$0).standardizedFileURL }
            allowOverwrite = CommandLine.arguments.contains("--overwrite")
            do {
                guard let out else { throw WorkshopError.message("請提供 --output 影片路徑。") }
                let inputURL = URL(fileURLWithPath:input).standardizedFileURL
                guard (try fm.attributesOfItem(atPath:inputURL.path)[.size] as? Int ?? Int.max) < 1_000_000 else { throw WorkshopError.message("專案檔案過大。") }
                batchProject = try String(contentsOf:inputURL,encoding:.utf8); batchOutput = URL(fileURLWithPath:out).standardizedFileURL
                guard batchOutput!.pathExtension.lowercased() == "mp4" else { throw WorkshopError.message("輸出副檔名必須是 .mp4。") }
                guard allowOverwrite || !fm.fileExists(atPath:batchOutput!.path) else { throw WorkshopError.message("輸出檔已存在；要覆蓋請加 --overwrite。") }
                guard fm.fileExists(atPath:batchOutput!.deletingLastPathComponent().path) else { throw WorkshopError.message("影片輸出資料夾不存在。") }
            } catch { completeBatch(["ok":false,"error":error.localizedDescription]); NSApp.terminate(nil); return }
        }
        var verificationPath = Bundle.main.object(forInfoDictionaryKey: "WorkshopVerificationDirectory") as? String
        if let i = CommandLine.arguments.firstIndex(of: "--self-test"), CommandLine.arguments.count > i + 1 { verificationPath = CommandLine.arguments[i+1] }
        if let path = verificationPath {
            let target = URL(fileURLWithPath: path, isDirectory: true).standardizedFileURL
            // Self-test exports must use an explicitly supplied, empty directory.
            // This keeps verification portable without overwriting an existing project.
            let exists = fm.fileExists(atPath: target.path)
            let empty = !exists || ((try? fm.contentsOfDirectory(atPath: target.path).isEmpty) == true)
            if target.path != "/" && empty {
                do { try fm.createDirectory(at: target, withIntermediateDirectories: true); testDirectory = target }
                catch { fputs("Unable to create self-test directory: \(error.localizedDescription)\n", stderr); NSApp.terminate(nil); return }
            } else {
                fputs("--self-test requires an empty output directory.\n", stderr); NSApp.terminate(nil); return
            }
        }
        let menu = NSMenu(); let appItem = NSMenuItem(); menu.addItem(appItem)
        let appMenu = NSMenu(); appMenu.addItem(withTitle: "關於\(appName)", action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(.separator()); appMenu.addItem(withTitle: "結束\(appName)", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"); appItem.submenu = appMenu
        let editItem = NSMenuItem(); menu.addItem(editItem); let editMenu = NSMenu(title: "編輯")
        for (title,selector,key) in [("復原","undo:","z"),("重做","redo:","Z"),("剪下","cut:","x"),("複製","copy:","c"),("貼上","paste:","v"),("全選","selectAll:","a")] { editMenu.addItem(withTitle: title, action: Selector(selector), keyEquivalent: key) }; editItem.submenu = editMenu; NSApp.mainMenu = menu
        let config = WKWebViewConfiguration(); config.websiteDataStore = .nonPersistent()
        config.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "workshop")
        web = WKWebView(frame: .zero, configuration: config); web.navigationDelegate = self
        web.setValue(false, forKey: "drawsBackground")
        let visible = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: min(1440, visible.width-50), height: min(900, visible.height-50)), styleMask: [.titled,.closable,.miniaturizable,.resizable], backing: .buffered, defer: false)
        window.title = appName; window.minSize = NSSize(width: 1000, height: 700); window.contentView = web; window.delegate = self; window.center(); window.isReleasedWhenClosed = false
        window.backgroundColor = NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.12, alpha: 1)
        web.loadFileURL(bundledWeb.appendingPathComponent("index.html"), allowingReadAccessTo: bundledWeb)
        if testDirectory == nil && batchProject == nil { window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true) }
        else { window.orderBack(nil) }
        if testDirectory == nil && batchProject == nil {
            try? fm.createDirectory(at:jobsURL,withIntermediateDirectories:true)
            queueTimer=Timer(timeInterval:1,repeats:true){[weak self] _ in self?.checkQueue()};RunLoop.main.add(queueTimer!,forMode:.common);checkQueue()
        }
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        queueTimer?.invalidate()
        if let job=queueJob { writeQueueReport(job,["ok":false,"error":"動畫小工坊已關閉，任務取消。請重新提交。"]); }
        if testDirectory == nil && batchProject == nil { try? Data("{\"active\":false}".utf8).write(to:jobsURL.appendingPathComponent("heartbeat.json"),options:.atomic) }
        if batchProject != nil && !batchCompleted { completeBatch(["ok":false,"error":"使用者已關閉自動輸出視窗，影片匯出取消。"]); }
        encodeQueue.sync { encoder?.cancel(); encoder = nil }; return .terminateNow
    }
    @objc func showAbout() { NSApp.orderFrontStandardAboutPanel(options: [.applicationName:appName,.applicationVersion:"1.1",.credits:NSAttributedString(string:"28 種動態範本 · 6 種場景交接 · 繁體中文\nClaude 效果工具包 · 離線製作\n靈感來源：RAR 設計攻略、Grenade 手榴彈\n本工具為獨立實作。")]) }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url, url.isFileURL, url.standardizedFileURL.path.hasPrefix(bundledWeb.path + "/") else { decisionHandler(.cancel); return }; decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if webView === queueWeb, let raw=queueProject, let job=queueJob {
            Task { @MainActor in
                let result:[String:Any]
                do { let data=try await webView.callAsyncJavaScript("return await window.workshopRenderBatch(project);",arguments:["project":raw],in:nil,contentWorld:.page);result=["ok":true,"result":data ?? NSNull()] }
                catch { result=["ok":false,"error":error.localizedDescription];encodeQueue.sync{if encoderOwner === webView {encoder?.cancel();encoder=nil;encoderOwner=nil}} }
                writeQueueReport(job,result);queueWeb=nil;queueJob=nil;queueProject=nil
                web.evaluateJavaScript("window.workshopQueueStatus(false)",completionHandler:nil)
            }
            return
        }
        if let raw = batchProject {
            guard !testStarted else { return }; testStarted = true
            Task { @MainActor in
                do { let result = try await web.callAsyncJavaScript("return await window.workshopRenderBatch(project);", arguments:["project":raw],in:nil,contentWorld:.page); completeBatch(["ok":true,"result":result ?? NSNull()]) }
                catch { completeBatch(["ok":false,"error":error.localizedDescription]) }
                NSApp.terminate(nil)
            }
            return
        }
        guard let dir = testDirectory, !testStarted else { return }; testStarted = true
        Task { @MainActor in
            let output: [String:Any]
            do { let data = try await web.callAsyncJavaScript("return await window.workshopSelfTest();", arguments: [:], in: nil, contentWorld: .page); output = ["ok":true,"result":data ?? NSNull()] }
            catch { output = ["ok":false,"error":error.localizedDescription] }
            if let data = try? JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted,.sortedKeys]) { try? data.write(to: dir.appendingPathComponent("verification.json"), options: .atomic) }
            NSApp.terminate(nil)
        }
    }
    func completeBatch(_ result:[String:Any]) {
        batchCompleted = true
        guard let data=try? JSONSerialization.data(withJSONObject:result,options:[.prettyPrinted,.sortedKeys]) else { return }
        if let url=batchReport { try? data.write(to:url,options:.atomic) }
        else { FileHandle.standardOutput.write(data);FileHandle.standardOutput.write(Data([10])) }
    }
    func writeQueueReport(_ job:URL,_ result:[String:Any]) {
        if let data=try? JSONSerialization.data(withJSONObject:result,options:[.prettyPrinted,.sortedKeys]){try? data.write(to:job.appendingPathComponent("report.json"),options:.atomic)}
    }
    func checkQueue() {
        if Date().timeIntervalSince(lastHeartbeat)>3 {
            let heartbeat:[String:Any]=["active":true,"updatedAt":Date().timeIntervalSince1970,"version":"1.1"]
            if let data=try? JSONSerialization.data(withJSONObject:heartbeat){try? data.write(to:jobsURL.appendingPathComponent("heartbeat.json"),options:.atomic)};lastHeartbeat=Date()
        }
        guard queueJob == nil, !exportPanelOpen, encodeQueue.sync(execute:{encoder == nil}), let entries=try? fm.contentsOfDirectory(at:jobsURL,includingPropertiesForKeys:[.isSymbolicLinkKey,.isDirectoryKey]) else { return }
        for job in entries.sorted(by:{$0.lastPathComponent<$1.lastPathComponent}) where job.pathExtension == "mwjob" {
            guard let info=try? job.resourceValues(forKeys:[.isSymbolicLinkKey,.isDirectoryKey]),info.isDirectory == true,info.isSymbolicLink != true,
                  fm.fileExists(atPath:job.appendingPathComponent("ready.json").path),!fm.fileExists(atPath:job.appendingPathComponent("report.json").path) else {continue}
            let input=job.appendingPathComponent("project.json")
            do {
                let attrs=try fm.attributesOfItem(atPath:input.path)
                guard attrs[.type] as? FileAttributeType == .typeRegular,(attrs[.size] as? Int ?? Int.max)<1_000_000 else {throw WorkshopError.message("任務專案無效或過大。")}
                guard !fm.fileExists(atPath:job.appendingPathComponent("result.mp4").path) else {throw WorkshopError.message("任務已有輸出，請重新提交新任務。")}
                queueProject=try String(contentsOf:input,encoding:.utf8);queueJob=job
                let config=WKWebViewConfiguration();config.websiteDataStore = .nonPersistent();config.userContentController.addScriptMessageHandler(self,contentWorld:.page,name:"workshop")
                queueWeb=WKWebView(frame:NSRect(x:0,y:0,width:1280,height:800),configuration:config);queueWeb!.navigationDelegate=self
                web.evaluateJavaScript("window.workshopQueueStatus(true)",completionHandler:nil)
                queueWeb!.loadFileURL(bundledWeb.appendingPathComponent("index.html"),allowingReadAccessTo:bundledWeb)
                return
            } catch {writeQueueReport(job,["ok":false,"error":error.localizedDescription]);queueProject=nil;queueJob=nil}
        }
    }
    func reply(_ handler: @escaping (Any?, String?) -> Void, _ result: Result<Any,Error>) {
        DispatchQueue.main.async { switch result { case .success(let value): handler(value,nil); case .failure(let error): handler(nil,error.localizedDescription) } }
    }
    func savePanel(name: String, type: UTType, completion: @escaping (URL?) -> Void) {
        let panel = NSSavePanel(); panel.title = "儲存作品"; panel.prompt = "儲存"; panel.nameFieldLabel = "檔案名稱："; panel.nameFieldStringValue = name; panel.allowedContentTypes = [type]; panel.canCreateDirectories = true
        panel.beginSheetModal(for: window) { response in completion(response == .OK ? panel.url : nil) }
    }
    func beginEncoder(_ body: [String:Any], destination: URL, owner:WKWebView, handler: @escaping (Any?,String?)->Void) {
        encodeQueue.async {
            do {
                guard self.encoder == nil else { throw WorkshopError.message("已有影片正在匯出。") }
                self.encoder = try VideoEncoder(destination: destination, width: body["width"] as? Int ?? 0, height: body["height"] as? Int ?? 0, fps: body["fps"] as? Int ?? 0, frames: body["frames"] as? Int ?? 0)
                self.encoderOwner = owner
                self.reply(handler,.success(["ok":true]))
            } catch { self.reply(handler,.failure(error)) }
        }
    }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard let caller=message.webView,message.frameInfo.isMainFrame, let url = message.frameInfo.request.url, url.isFileURL, url.standardizedFileURL.path.hasPrefix(bundledWeb.path + "/"), let body = message.body as? [String:Any], let type = body["type"] as? String else { replyHandler(nil,"無法辨識的操作。"); return }
        switch type {
        case "loadAutosave":
            replyHandler(["data":testDirectory == nil && batchProject == nil && message.webView !== queueWeb ? (try? String(contentsOf:autosaveURL,encoding:.utf8)) ?? "" : ""],nil)
        case "autosave":
            guard let data = (body["data"] as? String)?.data(using:.utf8), data.count < 1_000_000 else { replyHandler(nil,"專案太大。"); return }
            do { if testDirectory == nil && batchProject == nil && message.webView !== queueWeb { try fm.createDirectory(at: autosaveURL.deletingLastPathComponent(), withIntermediateDirectories:true); try data.write(to:autosaveURL,options:.atomic) }; replyHandler(["ok":true],nil) } catch { replyHandler(nil,error.localizedDescription) }
        case "toolkit":
            NSWorkspace.shared.open(Bundle.main.resourceURL!.appendingPathComponent("Claude-動畫工具包",isDirectory:true));replyHandler(["ok":true],nil)
        case "source": NSWorkspace.shared.open(sourceURL); replyHandler(["ok":true],nil)
        case "save":
            let kind = body["kind"] as? String ?? ""; guard ["json","png"].contains(kind), let raw = body["data"] as? String, raw.count < 32_000_000 else { replyHandler(nil,"檔案內容不正確。"); return }
            let data = kind == "png" ? Data(base64Encoded:raw) : raw.data(using:.utf8)
            guard let data else { replyHandler(nil,"無法讀取檔案內容。"); return }
            savePanel(name: body["name"] as? String ?? "動畫", type: kind == "png" ? .png : .json) { url in
                guard let url else { replyHandler(["cancelled":true],nil); return }
                do { try data.write(to:url,options:.atomic); replyHandler(["ok":true],nil) } catch { replyHandler(nil,error.localizedDescription) }
            }
        case "openProject":
            let panel = NSOpenPanel(); panel.title = "開啟動畫專案"; panel.prompt = "開啟"; panel.allowedContentTypes = [.json]; panel.allowsMultipleSelection = false; panel.canChooseDirectories = false
            panel.beginSheetModal(for:window) { response in
                guard response == .OK, let url = panel.url else { replyHandler(["cancelled":true],nil); return }
                do { let attrs = try self.fm.attributesOfItem(atPath:url.path); guard (attrs[.size] as? Int ?? Int.max) < 1_000_000 else { throw WorkshopError.message("專案檔案過大。") }; replyHandler(["data":try String(contentsOf:url,encoding:.utf8)],nil) } catch { replyHandler(nil,error.localizedDescription) }
            }
        case "beginVideo":
            exportPanelOpen = true
            savePanel(name:body["name"] as? String ?? "我的動畫.mp4",type:.mpeg4Movie) { url in
                self.exportPanelOpen = false
                guard let url else { replyHandler(["cancelled":true],nil); return }; self.beginEncoder(body,destination:url,owner:caller,handler:replyHandler)
            }
        case "videoFrame":
            guard let data = body["data"] as? String, let frame = body["index"] as? Int else { replyHandler(nil,"影格內容不正確。"); return }
            encodeQueue.async { do { guard let encoder = self.encoder,self.encoderOwner === caller else { throw WorkshopError.message("影片尚未開始，或編碼器正在處理其他任務。"); }; try autoreleasepool { try encoder.append(base64:data,frame:frame) }; self.reply(replyHandler,.success(["ok":true])) } catch { self.reply(replyHandler,.failure(error)) } }
        case "finishVideo":
            encodeQueue.async {
                guard let encoder = self.encoder,self.encoderOwner === caller else { self.reply(replyHandler,.failure(WorkshopError.message("沒有正在匯出的影片。"))); return }
                encoder.finish { result in
                    self.encodeQueue.async { self.encoder = nil;self.encoderOwner=nil }
                    switch result { case .success(let name): self.reply(replyHandler,.success(["name":name])); case .failure(let error): self.reply(replyHandler,.failure(error)) }
                }
            }
        case "cancelVideo": encodeQueue.async { if self.encoderOwner === caller {self.encoder?.cancel();self.encoder=nil;self.encoderOwner=nil};self.reply(replyHandler,.success(["ok":true])) }
        case "testImage":
            guard let dir = testDirectory, let name = body["name"] as? String, name.hasSuffix(".png"), !name.contains("/"), let raw = body["data"] as? String, let data = Data(base64Encoded:raw) else { replyHandler(nil,"無效的測試。"); return }
            do { try data.write(to:dir.appendingPathComponent(name),options:.atomic); replyHandler(["ok":true],nil) } catch { replyHandler(nil,error.localizedDescription) }
        case "beginTestVideo":
            guard let dir = testDirectory else { replyHandler(nil,"無效的測試。"); return }; beginEncoder(body,destination:dir.appendingPathComponent("verification.mp4"),owner:caller,handler:replyHandler)
        case "beginBatchVideo":
            let destination=message.webView === queueWeb ? queueJob?.appendingPathComponent("result.mp4") : batchOutput
            guard let destination else { replyHandler(nil,"尚未提供自動輸出路徑。");return }; beginEncoder(body,destination:destination,owner:caller,handler:replyHandler)
        default: replyHandler(nil,"不支援的操作。")
        }
    }
}

if CommandLine.arguments.contains("--catalog") {
    if let resource=Bundle.main.resourceURL,let data=try? Data(contentsOf:resource.appendingPathComponent("Claude-動畫工具包/catalog.json")) { FileHandle.standardOutput.write(data);exit(0) }
    FileHandle.standardError.write(Data("找不到效果清單。\n".utf8));exit(1)
}
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
