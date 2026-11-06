import Gawa
import SwiftUI
import UIKit
import WebKit

@main
struct ShatranjApp: App {
    var body: some Scene {
        WindowGroup {
            GameView().ignoresSafeArea()
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

    struct SaveFile: Decodable { let name: String; let mimeType: String; let text: String }
    struct ShareLink: Decodable { let url: String; let title: String }

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
        bridge.attach(to: webView)

        webView.load(URLRequest(url: Shell.origin.appendingPathComponent("index.html")))
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
