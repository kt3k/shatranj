package io.github.kt3k.shatranj

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.ViewGroup
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.core.content.IntentCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import io.github.kt3k.gawa.GawaAssets
import io.github.kt3k.gawa.GawaBridge
import io.github.kt3k.gawa.GawaError
import io.github.kt3k.gawa.GawaWebViewClient
import java.io.File
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel

/** Game records as JSON files in filesDir/records, one per record. */
class RecordStore(base: File) {
    private val dir = File(base, "records").apply { mkdirs() }
    private val idPattern = Regex("^[A-Za-z0-9_-]{1,64}$")

    private fun file(id: String): File {
        // Ids come from the page (newId() in src/ui/library.ts).
        if (!idPattern.matches(id)) throw GawaError("invalid_params", "bad record id")
        return File(dir, "$id.json")
    }

    fun list(): List<String> =
        dir.listFiles { f -> f.extension == "json" }?.mapNotNull {
            runCatching { it.readText() }.getOrNull()
        } ?: emptyList()

    fun put(id: String, json: String) {
        // Write then rename, so a crash never leaves a half-written record.
        val tmp = File(dir, "$id.json.tmp")
        tmp.writeText(json)
        if (!tmp.renameTo(file(id))) throw GawaError("io", "could not save record")
    }

    /** The record's JSON, or null when that id is not stored. */
    fun get(id: String): String? {
        val f = file(id)
        return if (f.exists()) f.readText() else null
    }

    fun delete(id: String) {
        file(id).delete()
    }
}

/**
 * Shows the bundled web app (assets/www, from dist/) at
 * https://appassets.androidplatform.net/ and answers the page's host
 * methods (src/ui/host.ts → HostMethods).
 */
class MainActivity : ComponentActivity() {
    private val scope = MainScope()
    private lateinit var webView: WebView
    private lateinit var bridge: GawaBridge

    private lateinit var records: RecordStore

    /** PGN files opened with the app, waiting for the page to take them. */
    private val opened = mutableListOf<OpenedFile>()

    /** Pending `<input type="file">` request from the page. */
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickFiles =
        registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
            fileCallback?.onReceiveValue(uris.toTypedArray())
            fileCallback = null
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true)

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true // localStorage / IndexedDB
        webView.setBackgroundColor(getColor(R.color.background))
        webView.webViewClient = object : GawaWebViewClient(GawaAssets.loader(this)) {
            /** The renderer can be killed under memory pressure: start over
             *  (the game itself is restored from storage). */
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                recreate()
                return true
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            // PGN import: Android shows nothing for <input type="file">
            // unless the app opens a picker.
            override fun onShowFileChooser(
                view: WebView,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams,
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                pickFiles.launch("*/*")
                return true
            }
        }

        // Edge to edge: keep the page clear of the status and navigation bars
        // and display cutouts; the window background shows behind them.
        val root = FrameLayout(this)
        root.addView(
            webView,
            ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
        )
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or
                    WindowInsetsCompat.Type.ime(),
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)

        records = RecordStore(filesDir)
        bridge = GawaBridge(webView, scope = scope)
        // Game records live in the app's own storage, not in the WebView's.
        bridge.router.register<Unit, List<String>>("records.list") { records.list() }
        bridge.router.register<PutRecord, Unit>("records.put") { records.put(it.id, it.json) }
        bridge.router.register<RecordId, Unit>("records.delete") { records.delete(it.id) }
        bridge.router.register<RecordId, String?>("records.get") { records.get(it.id) }
        bridge.router.register<Unit, List<OpenedFile>>("files.takeOpened") {
            val files = opened.toList()
            opened.clear()
            files
        }
        bridge.router.register<SaveFile, Unit>("files.save") { p -> shareFile(p) }
        bridge.router.register<ShareLink, Unit>("share.link") { p ->
            if (!p.url.startsWith("https://") && !p.url.startsWith("http://")) {
                throw GawaError("invalid_params", "not a URL: ${p.url}")
            }
            val send = Intent(Intent.ACTION_SEND)
                .setType("text/plain")
                .putExtra(Intent.EXTRA_TEXT, p.url)
                .putExtra(Intent.EXTRA_SUBJECT, p.title)
            startActivity(Intent.createChooser(send, p.title))
        }

        // Back: the page keeps dialogs and the record viewer in its history,
        // so step back there first; leave the app from the main screen.
        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )

        if (savedInstanceState == null) receive(intent)
        if (savedInstanceState != null) webView.restoreState(savedInstanceState)
        if (webView.url == null) webView.loadUrl(GawaAssets.url())
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        receive(intent)
    }

    /** Reads a PGN file opened or shared with the app and tells the page. */
    private fun receive(intent: Intent?) {
        val uri: Uri = when (intent?.action) {
            Intent.ACTION_VIEW -> intent.data
            Intent.ACTION_SEND -> IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri::class.java)
            else -> null
        } ?: return
        try {
            val name = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)
                ?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
                ?: uri.lastPathSegment ?: "game.pgn"
            val bytes = contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: return
            if (bytes.size > 5_000_000) return
            opened += OpenedFile(name, String(bytes, Charsets.UTF_8))
            bridge.emit("files.opened")
        } catch (e: Exception) {
            // Unreadable file: nothing to import.
        }
    }

    /** Writes a file (e.g. a PGN) to the cache and opens the share sheet,
     *  from which it can be saved to Files / Drive or sent. */
    private fun shareFile(p: SaveFile) {
        val dir = File(cacheDir, "shared").apply { mkdirs() }
        val safeName = p.name.replace(Regex("[/\\\\]"), "_").ifBlank { "game.pgn" }
        val file = File(dir, safeName)
        file.writeText(p.text)
        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
        val send = Intent(Intent.ACTION_SEND)
            .setType(p.mimeType)
            .putExtra(Intent.EXTRA_STREAM, uri)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        send.clipData = ClipData.newRawUri(safeName, uri)
        startActivity(Intent.createChooser(send, safeName))
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        bridge.dispose()
        scope.cancel()
        webView.destroy()
        super.onDestroy()
    }
}
