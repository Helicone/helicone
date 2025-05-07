use std::{future::Future, ops::Deref};

pub use prometheus::TEXT_FORMAT as CONTENT_TYPE;
use prometheus::{
    Error, IntCounterVec, IntGaugeVec, TextEncoder, core::Collector,
    register_int_counter_vec, register_int_gauge_vec,
};

/// Gathers all metrics and returns them in their text format.
#[must_use]
#[allow(clippy::missing_panics_doc)] // never actually panics
pub fn gather() -> String {
    TextEncoder
        .encode_to_string(&prometheus::gather())
        .expect("can always encode to a string")
}

#[derive(Clone)]
pub struct Event<const N: usize> {
    count: UnregisterOnDrop<IntCounterVec>,
}

impl<const N: usize> Event<N> {
    /// Creates metrics for an event with a given name.
    ///
    /// # Panics
    ///
    /// This will panic if an event with the given name has already been
    /// registered.
    #[must_use]
    pub fn register(
        namespace: Option<&str>,
        name: &str,
        labels: [&str; N],
    ) -> Self {
        Self::try_register(namespace, name, labels)
            .expect("name has not previously been registered")
    }

    /// Creates metrics for an event with a given name.
    ///
    /// # Errors
    ///
    /// This will return an error if an event with the given name has already
    /// been registered.
    pub fn try_register(
        namespace: Option<&str>,
        name: &str,
        labels: [&str; N],
    ) -> Result<Self, Error> {
        let namespace = namespace
            .map(heck::ToSnakeCase::to_snake_case)
            .map(|n| format!("{n}_"))
            .unwrap_or_default();
        let count = register_int_counter_vec!(
            format!("{namespace}{name}_count"),
            format!("The number of times {name} has occurred"),
            &labels,
        )
        .map(UnregisterOnDrop::new)?;

        Ok(Self { count })
    }

    pub fn record(&self, labels: [&str; N]) {
        self.count.with_label_values(&labels).inc();
    }
}

#[derive(Clone)]
pub struct Operation<const N: usize> {
    hit_count: UnregisterOnDrop<IntCounterVec>,
    in_progress: UnregisterOnDrop<IntGaugeVec>,
    error_count: UnregisterOnDrop<IntCounterVec>,
}

impl<const N: usize> Operation<N> {
    /// Creates metrics for an operation with a given name.
    ///
    /// # Panics
    ///
    /// This will panic if an operation with the given name has already been
    /// registered.
    #[must_use]
    pub fn register(
        namespace: Option<&str>,
        name: &str,
        labels: [&str; N],
    ) -> Self {
        Self::try_register(namespace, name, labels)
            .expect("name has not previously been registered")
    }

    /// Creates metrics for an operation with a given name.
    ///
    /// # Errors
    ///
    /// This will return an error if an operation with the given name has
    /// already been registered.
    pub fn try_register(
        namespace: Option<&str>,
        name: &str,
        labels: [&str; N],
    ) -> Result<Self, Error> {
        let namespace = namespace
            .map(heck::ToSnakeCase::to_snake_case)
            .map(|n| format!("{n}_"))
            .unwrap_or_default();
        let hit_count = register_int_counter_vec!(
            format!("{namespace}{name}_hit_count"),
            format!("The number of times {name} has been hit"),
            &labels,
        )
        .map(UnregisterOnDrop::new)?;

        let in_progress = register_int_gauge_vec!(
            format!("{namespace}{name}_in_progress"),
            format!("The number of in progress calls to {name}"),
            &labels,
        )
        .map(UnregisterOnDrop::new)?;

        let error_count = register_int_counter_vec!(
            format!("{namespace}{name}_error_count"),
            format!("The number of times {name} has returned an error"),
            &[labels.as_slice(), ["error_kind"].as_slice()].concat(),
        )
        .map(UnregisterOnDrop::new)?;

        Ok(Self {
            hit_count,
            in_progress,
            error_count,
        })
    }

    pub async fn observe<F, Fut, O>(&self, labels: [&str; N], f: F) -> O
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = O>,
    {
        self.hit_count.with_label_values(&labels).inc();
        self.in_progress.with_label_values(&labels).inc();
        let output = f().await;
        self.in_progress.with_label_values(&labels).dec();
        output
    }

    pub fn observe_sync<F, O>(&self, labels: [&str; N], f: F) -> O
    where
        F: FnOnce() -> O,
    {
        self.hit_count.with_label_values(&labels).inc();
        self.in_progress.with_label_values(&labels).inc();
        let output = f();
        self.in_progress.with_label_values(&labels).dec();
        output
    }

    pub fn record_error(&self, labels: [&str; N], error: &str) {
        // TODO: Is it possible to avoid this allocation? We know the length
        // statically (N + 1).
        let labels = [labels.as_slice(), [error].as_slice()].concat();
        self.error_count.with_label_values(&labels).inc();
    }
}

#[derive(Clone)]
struct UnregisterOnDrop<C>
where
    C: Collector + 'static,
{
    collector: Option<C>,
}

impl<C> UnregisterOnDrop<C>
where
    C: Collector + 'static,
{
    fn new(collector: C) -> Self {
        Self {
            collector: Some(collector),
        }
    }
}

impl<C> Deref for UnregisterOnDrop<C>
where
    C: Collector + 'static,
{
    type Target = C;

    fn deref(&self) -> &Self::Target {
        self.collector.as_ref().expect("always exists before drop")
    }
}

impl<C> Drop for UnregisterOnDrop<C>
where
    C: Collector + 'static,
{
    fn drop(&mut self) {
        let collector =
            self.collector.take().expect("always exists before drop");
        let _result = prometheus::unregister(Box::new(collector));
    }
}
