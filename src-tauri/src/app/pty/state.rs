use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
};

use tokio::sync::mpsc::UnboundedSender;

#[derive(Debug)]
pub enum PtyCommand {
    Send(String),
    Close,
}

pub struct PtyConnection {
    pub id: u64,
    pub tx: UnboundedSender<PtyCommand>,
}

impl PtyConnection {
    pub fn new(id: u64, tx: UnboundedSender<PtyCommand>) -> Self {
        Self { id, tx }
    }
}

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct PtyConnectionKey {
    window_label: String,
    pty_id: String,
}

impl PtyConnectionKey {
    pub fn new(window_label: &str, pty_id: &str) -> Self {
        Self {
            window_label: window_label.to_string(),
            pty_id: pty_id.to_string(),
        }
    }

    pub fn window_label(&self) -> &str {
        &self.window_label
    }
}

#[derive(Default)]
pub struct PtyState {
    next_id: AtomicU64,
    active: Mutex<HashMap<PtyConnectionKey, PtyConnection>>,
}

impl PtyState {
    #[inline(always)]
    pub fn id_fetch_add(&self, value: u64) -> u64 {
        self.next_id.fetch_add(value, Ordering::SeqCst)
    }

    pub fn replace(&self, key: PtyConnectionKey, connection: PtyConnection) -> Option<PtyConnection> {
        self.active.lock().expect("pty state poisoned").insert(key, connection)
    }

    pub fn sender(&self, key: &PtyConnectionKey) -> Option<UnboundedSender<PtyCommand>> {
        self.active
            .lock()
            .expect("pty state poisoned")
            .get(key)
            .map(|connection| connection.tx.clone())
    }

    pub fn remove_if_current(&self, key: &PtyConnectionKey, id: u64) {
        let mut guard = self.active.lock().expect("pty state poisoned");
        if guard.get(key).is_some_and(|connection| connection.id == id) {
            guard.remove(key);
        }
    }

    pub fn disconnect(&self, key: &PtyConnectionKey) -> bool {
        let removed = self.active.lock().expect("pty state poisoned").remove(key);
        if let Some(connection) = removed {
            let _ = connection.tx.send(PtyCommand::Close);
            return true;
        }
        false
    }

    pub fn disconnect_window(&self, window_label: &str) {
        let removed = {
            let mut guard = self.active.lock().expect("pty state poisoned");
            let keys: Vec<_> = guard
                .keys()
                .filter(|key| key.window_label() == window_label)
                .cloned()
                .collect();

            keys.into_iter()
                .filter_map(|key| guard.remove(&key))
                .collect::<Vec<_>>()
        };

        for connection in removed {
            let _ = connection.tx.send(PtyCommand::Close);
        }
    }
}
