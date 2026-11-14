// Generated from schema/host.json by schema/generate.ts. Do not edit.
import Foundation

struct SaveFile: Decodable {
    let name: String
    let mimeType: String
    let text: String
}

struct ShareLink: Decodable {
    let url: String
    let title: String
}

struct PutRecord: Decodable {
    let id: String
    let json: String
}

struct RecordId: Decodable {
    let id: String
}

struct OpenedFile: Encodable {
    let name: String
    let text: String
}
