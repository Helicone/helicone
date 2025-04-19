use std::{
    collections::HashMap,
    convert::Infallible,
    hash::Hash,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
};

use tower::{discover::{Change, Discover}, MakeService};

use crate::{app::AppState, dispatcher::{AiProviderDispatcher, Dispatcher}, types::request::Request};

use super::Key;

#[derive(Clone)]
pub struct ConfigDiscover {
    state: AppState,
    /// Iterator over *unannounced* inserts; `None` once we’re done.
    remaining: Option<std::vec::IntoIter<(Key, Dispatcher)>>,
}

impl ConfigDiscover {
    pub fn new(state: AppState) -> Self {
        let mut keys = HashMap::new();
        for (provider, models) in state.0.config.models.0.iter() {
            for model in models.iter() {
                let key = Key::new(model.clone(), provider.clone());
                let dispatcher 
                keys.insert(key, provider.clone());
            }
        }
        let keys = keys.into_iter().collect::<Vec<_>>();

        let remaining = Some(
            state
                .0
                .models
                .clone()                 // clone once, then stream inserts
                .into_iter()
                .collect::<Vec<_>>()
                .into_iter(),
        );
        Self { state, remaining }
    }
}

/// ------------------------------------------------------------------
/// 3.  `tower::discover::Discover` implementation
/// ------------------------------------------------------------------
impl<S> Discover for ConfigDiscover<S>
where
    S: Clone,
{
    type Key     = Key;
    type Service = S;
    type Error   = Infallible;

    fn poll_discover(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
    ) -> Poll<Option<Result<Change<Self::Key, Self::Service>, Self::Error>>> {
        let mut this = self.as_mut();
        if let Some(iter) = &mut self.remaining {
            if let Some((k, svc)) = iter.next() {
                // Still announcing the initial snapshot.
                return Poll::Ready(Some(Ok(Change::Insert(k, svc))));
            }
            // Snapshot done; drop the iterator so we stay Pending forever.
            self.remaining = None;
        }
        Poll::Pending
    }
}
