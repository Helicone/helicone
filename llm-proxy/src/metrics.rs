use std::{
    sync::atomic::{AtomicU32, AtomicU64, Ordering},
    time::{Duration, Instant},
};

use opentelemetry::metrics::{Counter, Meter};

/// The top level struct that contains all metrics
/// which are exported to OpenTelemetry.
#[derive(Debug, Clone)]
pub struct Metrics {
    pub error_count: Counter<u64>,
}

impl Metrics {
    #[must_use]
    pub fn new(meter: &Meter) -> Self {
        let error_count = meter
            .u64_counter("error_count")
            .with_description("Number of error occurences")
            .build();
        Self { error_count }
    }
}

#[derive(Debug)]
pub struct RollingCounter {
    /// How many buckets to use
    buckets: u32,
    /// How long each bucket represents
    bucket_duration: f64,
    /// The start time of the counter
    start: Instant,
    /// The counters for each bucket
    counters: Vec<AtomicU32>,
    /// The laps for each bucket
    laps: Vec<AtomicU64>,
}

impl RollingCounter {
    #[must_use]
    pub fn new(window: Duration, buckets: u32) -> Self {
        assert!(buckets > 0);
        let bucket_duration = window.as_secs_f64() / f64::from(buckets);
        Self {
            buckets,
            bucket_duration,
            start: Instant::now(),
            counters: (0..buckets).map(|_| AtomicU32::new(0)).collect(),
            laps: (0..buckets).map(|_| AtomicU64::new(0)).collect(),
        }
    }

    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    fn get_index_and_lap(&self, now: Instant) -> (usize, u64) {
        let elapsed = now.duration_since(self.start).as_secs_f64();
        let lap = (elapsed / (self.bucket_duration * f64::from(self.buckets)))
            .floor() as u64;
        let idx = ((elapsed / self.bucket_duration) as usize)
            % (self.buckets as usize);
        (idx, lap)
    }

    pub fn incr(&self) {
        let now = Instant::now();
        let (idx, lap) = self.get_index_and_lap(now);
        let last_lap = self.laps[idx].load(Ordering::Acquire);
        if last_lap != lap {
            // Try to reset the bucket if we are the first in this lap
            if self.laps[idx]
                .compare_exchange(
                    last_lap,
                    lap,
                    Ordering::AcqRel,
                    Ordering::Acquire,
                )
                .is_ok()
            {
                self.counters[idx].store(0, Ordering::Release);
            }
        }
        self.counters[idx].fetch_add(1, Ordering::Relaxed);
    }

    #[must_use]
    pub fn total(&self) -> u32 {
        let (_, now_lap) = self.get_index_and_lap(Instant::now());
        self.counters
            .iter()
            .zip(self.laps.iter())
            .filter_map(|(counter_val, lap_val)| {
                if lap_val.load(Ordering::Acquire) == now_lap {
                    Some(counter_val.load(Ordering::Relaxed))
                } else {
                    None
                }
            })
            .sum()
    }
}

impl Default for RollingCounter {
    fn default() -> Self {
        Self::new(Duration::from_secs(60), 10)
    }
}

#[cfg(test)]
mod tests {
    use std::{sync::Arc, thread, time::Duration};

    use super::*;

    #[test]
    fn test_concurrent_incr() {
        let counter = Arc::new(RollingCounter::new(Duration::from_secs(2), 20));
        let threads: Vec<_> = (0..10)
            .map(|_| {
                let c = counter.clone();
                thread::spawn(move || {
                    for _ in 0..1000 {
                        c.incr();
                    }
                })
            })
            .collect();
        for t in threads {
            t.join().unwrap();
        }
        let total = counter.total();
        assert_eq!(total, 10_000);
    }

    #[test]
    fn test_expiry() {
        let counter = RollingCounter::new(Duration::from_millis(100), 10);
        for _ in 0..10 {
            counter.incr();
        }
        assert_eq!(counter.total(), 10);
        // Wait for the window to expire
        thread::sleep(Duration::from_millis(120));
        counter.incr(); // This should rotate the window
        assert!(
            counter.total() <= 2,
            "total after expiry: {}",
            counter.total()
        );
    }
}
