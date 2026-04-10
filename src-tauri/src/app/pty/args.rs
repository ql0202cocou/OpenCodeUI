use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PtyConnectArgs {
    pty_id: String,
    url: String,
    auth_header: Option<String>,
}

impl PtyConnectArgs {
    #[inline(always)]
    pub fn pty_id(&self) -> &str {
        &self.pty_id
    }

    #[inline(always)]
    pub fn url(&self) -> &str {
        &self.url
    }

    #[inline(always)]
    pub fn auth_header(&self) -> Option<&str> {
        self.auth_header.as_deref()
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PtySendArgs {
    pty_id: String,
    data: String,
}

impl PtySendArgs {
    #[inline(always)]
    pub fn pty_id(&self) -> &str {
        &self.pty_id
    }

    #[inline(always)]
    pub fn data(&self) -> &str {
        &self.data
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PtyDisconnectArgs {
    pty_id: String,
}

impl PtyDisconnectArgs {
    #[inline(always)]
    pub fn pty_id(&self) -> &str {
        &self.pty_id
    }
}
