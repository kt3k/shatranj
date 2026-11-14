// Generated from schema/host.json by schema/generate.ts. Do not edit.
package io.github.kt3k.shatranj

import kotlinx.serialization.Serializable

@Serializable
data class SaveFile(val name: String, val mimeType: String, val text: String)

@Serializable
data class ShareLink(val url: String, val title: String)

@Serializable
data class PutRecord(val id: String, val json: String)

@Serializable
data class RecordId(val id: String)

@Serializable
data class OpenedFile(val name: String, val text: String)
