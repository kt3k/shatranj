import Gawa
import SwiftUI
import UIKit
import WebKit

@main
struct ShatranjApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .ignoresSafeArea()
                // PGN files opened with the app (Files, AirDrop, Mail…).
                .onOpenURL { url in Shell.current?.receive(url) }
        }
    }
}

/// The bundled web app (dist/) in a WKWebView, served as app://localhost/.
struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Shell { Shell() }
    func makeUIView(context: Context) -> WKWebView { context.coordinator.webView }
    func updateUIView(_ webView: WKWebView, context: Context) {}
    static func dismantleUIView(_ webView: WKWebView, coordinator: Shell) {
        coordinator.bridge.detach()
    }
}

/// Owns the web view and answers the page's host methods
/// (src/ui/host.ts → HostMethods).
@MainActor
final class Shell: NSObject, WKNavigationDelegate {
    static let origin = URL(string: "app://localhost")!

    let webView: WKWebView
    let bridge: GawaBridge

    /// The live shell, for files opened with the app.
    static weak var current: Shell?

    struct SaveFile: Decodable { let name: String; let mimeType: String; let text: String }
    struct ShareLink: Decodable { let url: String; let title: String }
    struct PutRecord: Decodable { let id: String; let json: String }
    struct RecordID: Decodable { let id: String }
    struct OpenedFile: Encodable { let name: String; let text: String }

    let records = RecordStore()
    /// Files opened with the app, waiting for the page to take them.
    private var opened: [OpenedFile] = []

    override init() {
        let root = Bundle.main.url(forResource: "dist", withExtension: nil)!
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(GawaSchemeHandler(root: root), forURLScheme: "app")
        webView = WKWebView(frame: .zero, configuration: config)
        bridge = GawaBridge(allowedOrigins: [Shell.origin])
        super.init()

        // The page lays itself out with env(safe-area-inset-*).
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        webView.navigationDelegate = self
        #if DEBUG
            if #available(iOS 16.4, *) { webView.isInspectable = true }
        #endif

        bridge.router.register("files.save") { [weak self] (p: SaveFile) async throws -> Void in
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(p.name)
            try p.text.write(to: url, atomically: true, encoding: .utf8)
            self?.share([url])
        }
        bridge.router.register("share.link") { [weak self] (p: ShareLink) async throws -> Void in
            guard let url = URL(string: p.url) else {
                throw GawaError("invalid_params", "not a URL: \(p.url)")
            }
            self?.share([url])
        }
        // Game records live in the app's own storage, not in the web view's,
        // which the system may clear.
        bridge.router.register("records.list") { [records] () async throws -> [String] in
            try records.list()
        }
        bridge.router.register("records.put") { [records] (p: PutRecord) async throws -> Void in
            try records.put(id: p.id, json: p.json)
        }
        bridge.router.register("records.delete") { [records] (p: RecordID) async throws -> Void in
            try records.delete(id: p.id)
        }
        bridge.router.register("files.takeOpened") { [weak self] () async throws -> [OpenedFile] in
            guard let self else { return [] }
            defer { self.opened = [] }
            return self.opened
        }
        bridge.attach(to: webView)
        Shell.current = self

        webView.load(URLRequest(url: Shell.origin.appendingPathComponent("index.html")))
    }

    /// Reads a PGN file opened with the app and tells the page to import it.
    func receive(_ url: URL) {
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url), data.count <= 5_000_000,
            let text = String(data: data, encoding: .utf8)
                ?? String(data: data, encoding: .isoLatin1)
        else { return }
        opened.append(OpenedFile(name: url.lastPathComponent, text: text))
        try? bridge.emit("files.opened", nil as String?)
    }

    /// Presents the system share sheet (save to Files, AirDrop, Messages…).
    private func share(_ items: [Any]) {
        guard let top = topViewController() else { return }
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        // iPad: anchor the popover to the centre of the screen.
        sheet.popoverPresentationController?.sourceView = webView
        sheet.popoverPresentationController?.sourceRect = CGRect(
            x: webView.bounds.midX, y: webView.bounds.midY, width: 0, height: 0)
        sheet.popoverPresentationController?.permittedArrowDirections = []
        top.present(sheet, animated: true)
    }

    private func topViewController() -> UIViewController? {
        var vc = webView.window?.rootViewController
        while let presented = vc?.presentedViewController { vc = presented }
        return vc
    }

    // MARK: - WKNavigationDelegate

    /// Links to other sites open in the browser, not in the game's view.
    func webView(
        _ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = action.request.url else { return decisionHandler(.cancel) }
        if url.scheme == Shell.origin.scheme && url.host == Shell.origin.host {
            decisionHandler(.allow)
        } else {
            if action.navigationType == .linkActivated { UIApplication.shared.open(url) }
            decisionHandler(.cancel)
        }
    }

    /// The web content process can be killed under memory pressure; reload
    /// (the game itself is restored from storage).
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }
}

/// Game records as JSON files in Application Support/records, one per record.
final class RecordStore: Sendable {
    private let dir: URL

    init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        dir = base.appendingPathComponent("records", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }

    private func file(_ id: String) throws -> URL {
        // Ids come from the page (newId() in src/ui/library.ts).
        guard !id.isEmpty, id.count <= 64,
            id.allSatisfy({ $0.isASCII && ($0.isLetter || $0.isNumber || $0 == "-" || $0 == "_") })
        else { throw GawaError("invalid_params", "bad record id") }
        return dir.appendingPathComponent("\(id).json")
    }

    func list() throws -> [String] {
        let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
        return files.filter { $0.pathExtension == "json" }.compactMap {
            try? String(contentsOf: $0, encoding: .utf8)
        }
    }

    func put(id: String, json: String) throws {
        try json.write(to: try file(id), atomically: true, encoding: .utf8)
    }

    func delete(id: String) throws {
        let url = try file(id)
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }
}
