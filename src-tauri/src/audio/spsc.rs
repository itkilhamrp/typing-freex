use std::cell::UnsafeCell;
use std::mem::MaybeUninit;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

struct SpscInner<T, const CAP: usize> {
    head: AtomicUsize,
    tail: AtomicUsize,
    consumer_active: AtomicBool,
    buffer: [UnsafeCell<MaybeUninit<T>>; CAP],
}

// SAFETY: Single-producer writes only at `tail` (enforced via `&mut self` on `SpscProducer`),
// and single-consumer reads only at `head` (enforced via `consumer_active` atomic guard on
// `SpscConsumer`), so `T: Send` suffices for cross-thread queue transfer.
unsafe impl<T: Send, const CAP: usize> Send for SpscInner<T, CAP> {}
unsafe impl<T: Send, const CAP: usize> Sync for SpscInner<T, CAP> {}

impl<T, const CAP: usize> Drop for SpscInner<T, CAP> {
    fn drop(&mut self) {
        let mut head = *self.head.get_mut();
        let tail = *self.tail.get_mut();
        let mask = CAP - 1;
        while head != tail {
            // SAFETY: Slots in `[head, tail)` (mod CAP) were initialized by `try_push` and not yet popped.
            unsafe {
                (*self.buffer[head].get()).assume_init_drop();
            }
            head = (head + 1) & mask;
        }
    }
}

pub struct SpscProducer<T, const CAP: usize> {
    inner: Arc<SpscInner<T, CAP>>,
}

pub struct SpscConsumer<T, const CAP: usize> {
    inner: Arc<SpscInner<T, CAP>>,
}

/// Creates a bounded, zero-allocation lock-free single-producer single-consumer ring buffer.
/// `CAP` must be a power of two greater than 1 (usable capacity is `CAP - 1`).
pub fn channel<T, const CAP: usize>() -> (SpscProducer<T, CAP>, SpscConsumer<T, CAP>) {
    const {
        assert!(CAP > 1 && CAP.is_power_of_two(), "SPSC capacity must be a power of two > 1");
    }
    let inner = Arc::new(SpscInner {
        head: AtomicUsize::new(0),
        tail: AtomicUsize::new(0),
        consumer_active: AtomicBool::new(false),
        buffer: std::array::from_fn(|_| UnsafeCell::new(MaybeUninit::uninit())),
    });
    (
        SpscProducer { inner: Arc::clone(&inner) },
        SpscConsumer { inner },
    )
}

impl<T, const CAP: usize> SpscProducer<T, CAP> {
    /// Non-blocking enqueue. Returns `false` if the ring buffer is full.
    pub fn try_push(&mut self, value: T) -> bool {
        let mask = CAP - 1;
        let tail = self.inner.tail.load(Ordering::Relaxed);
        let next_tail = (tail + 1) & mask;
        let head = self.inner.head.load(Ordering::Acquire);
        if next_tail == head {
            return false;
        }
        // SAFETY: `tail` is exclusively owned by the producer until `tail.store(..., Release)`.
        unsafe {
            (*self.inner.buffer[tail].get()).write(value);
        }
        self.inner.tail.store(next_tail, Ordering::Release);
        true
    }
}

impl<T, const CAP: usize> SpscConsumer<T, CAP> {
    /// Lock-free, allocation-free dequeue safe to invoke directly inside real-time audio callbacks.
    pub fn try_pop(&self) -> Option<T> {
        if self
            .inner
            .consumer_active
            .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
            .is_err()
        {
            return None;
        }

        let head = self.inner.head.load(Ordering::Relaxed);
        let tail = self.inner.tail.load(Ordering::Acquire);
        let result = if head == tail {
            None
        } else {
            // SAFETY: Producer wrote this slot before publishing `tail` with `Release`.
            let value = unsafe { (*self.inner.buffer[head].get()).assume_init_read() };
            let next_head = (head + 1) & (CAP - 1);
            self.inner.head.store(next_head, Ordering::Release);
            Some(value)
        };

        self.inner.consumer_active.store(false, Ordering::Release);
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::AtomicUsize as Counter;

    #[test]
    fn test_spsc_fifo_and_wraparound() {
        let (mut tx, rx) = channel::<u32, 8>();
        assert_eq!(rx.try_pop(), None);

        // Power-of-2 ring of 8 holds 7 items
        for i in 0..7 {
            assert!(tx.try_push(i));
        }
        assert!(!tx.try_push(99));

        for i in 0..4 {
            assert_eq!(rx.try_pop(), Some(i));
        }
        for i in 10..14 {
            assert!(tx.try_push(i));
        }
        for i in 4..7 {
            assert_eq!(rx.try_pop(), Some(i));
        }
        for i in 10..14 {
            assert_eq!(rx.try_pop(), Some(i));
        }
        assert_eq!(rx.try_pop(), None);
    }

    #[test]
    fn test_spsc_drop_cleans_unconsumed_items() {
        struct DropCounter(Arc<Counter>);
        impl Drop for DropCounter {
            fn drop(&mut self) {
                self.0.fetch_add(1, Ordering::Relaxed);
            }
        }

        let drops = Arc::new(Counter::new(0));
        {
            let (mut tx, rx) = channel::<DropCounter, 4>();
            assert!(tx.try_push(DropCounter(Arc::clone(&drops))));
            assert!(tx.try_push(DropCounter(Arc::clone(&drops))));
            drop(rx.try_pop());
            assert_eq!(drops.load(Ordering::Relaxed), 1);
        }
        assert_eq!(drops.load(Ordering::Relaxed), 2);
    }
}
