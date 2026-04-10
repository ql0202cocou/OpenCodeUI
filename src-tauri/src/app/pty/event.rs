use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum PtyEvent {
    Connected,
    #[serde(rename_all = "camelCase")]
    Message { chunk: String },
    Disconnected { code: Option<u16>, reason: String },
    Error { message: String },
}
