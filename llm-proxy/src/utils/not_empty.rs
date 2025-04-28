use core::{iter, mem};
use std::vec;

use serde::{
    Deserialize, Serialize,
    ser::{SerializeSeq, Serializer},
};

#[derive(Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct NonEmpty<T> {
    pub head: T,
    pub tail: Option<Vec<T>>,
}

// Nb. `Serialize` is implemented manually, as serde's `into` container
// attribute requires a `T: Clone` bound which we'd like to avoid.
impl<T> Serialize for NonEmpty<T>
where
    T: Serialize,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut seq = serializer.serialize_seq(Some(self.len()))?;
        for e in self {
            seq.serialize_element(e)?;
        }
        seq.end()
    }
}

impl<'de, T> Deserialize<'de> for NonEmpty<T>
where
    T: Deserialize<'de>,
{
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let vec = Vec::<T>::deserialize(deserializer)?;
        NonEmpty::from_vec(vec).ok_or_else(|| {
            serde::de::Error::custom("Expected non-empty sequence")
        })
    }
}

pub struct Iter<'a, T> {
    head: Option<&'a T>,
    tail: &'a [T],
}

impl<'a, T> Iterator for Iter<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        if let Some(value) = self.head.take() {
            Some(value)
        } else if let Some((first, rest)) = self.tail.split_first() {
            self.tail = rest;
            Some(first)
        } else {
            None
        }
    }
}

impl<T> ExactSizeIterator for Iter<'_, T> {
    fn len(&self) -> usize {
        self.tail.len() + self.head.map_or(0, |_| 1)
    }
}

impl<T> core::iter::FusedIterator for Iter<'_, T> {}

impl<T> NonEmpty<T> {
    pub const fn new(e: T) -> Self {
        Self::singleton(e)
    }

    pub fn as_ref(&self) -> NonEmpty<&T> {
        NonEmpty {
            head: &self.head,
            tail: self.tail.as_ref().map(|t| t.iter().collect()),
        }
    }

    pub fn collect<I>(iter: I) -> Option<NonEmpty<T>>
    where
        I: IntoIterator<Item = T>,
    {
        let mut iter = iter.into_iter();
        let head = iter.next()?;
        let tail_vec: Vec<T> = iter.collect();
        let tail = if tail_vec.is_empty() {
            None
        } else {
            Some(tail_vec)
        };
        Some(Self { head, tail })
    }

    pub const fn singleton(head: T) -> Self {
        NonEmpty { head, tail: None }
    }

    pub const fn is_empty(&self) -> bool {
        false
    }

    pub const fn first(&self) -> &T {
        &self.head
    }

    pub fn first_mut(&mut self) -> &mut T {
        &mut self.head
    }

    pub fn tail(&self) -> Option<&Vec<T>> {
        self.tail.as_ref()
    }

    pub fn push(&mut self, e: T) {
        match &mut self.tail {
            Some(tail) => tail.push(e),
            None => self.tail = Some(vec![e]),
        }
    }

    pub fn len(&self) -> usize {
        match &self.tail {
            Some(tail) => tail.len() + 1,
            None => 1,
        }
    }

    pub fn last(&self) -> &T {
        match &self.tail {
            Some(tail) if !tail.is_empty() => tail.last().unwrap(),
            _ => &self.head,
        }
    }

    pub fn last_mut(&mut self) -> &mut T {
        match &mut self.tail {
            Some(tail) if !tail.is_empty() => tail.last_mut().unwrap(),
            _ => &mut self.head,
        }
    }

    pub fn contains(&self, x: &T) -> bool
    where
        T: PartialEq,
    {
        self.iter().any(|e| e == x)
    }

    pub fn get(&self, index: usize) -> Option<&T> {
        if index == 0 {
            Some(&self.head)
        } else {
            self.tail.as_ref().and_then(|tail| tail.get(index - 1))
        }
    }

    pub fn get_mut(&mut self, index: usize) -> Option<&mut T> {
        if index == 0 {
            Some(&mut self.head)
        } else {
            self.tail.as_mut().and_then(|tail| tail.get_mut(index - 1))
        }
    }

    pub fn iter(&self) -> Iter<T> {
        Iter {
            head: Some(&self.head),
            tail: self.tail.as_ref().map_or(&[], |t| t.as_slice()),
        }
    }

    pub fn from_slice(slice: &[T]) -> Option<NonEmpty<T>>
    where
        T: Clone,
    {
        slice.split_first().map(|(h, t)| {
            let tail = if t.is_empty() { None } else { Some(t.to_vec()) };
            NonEmpty {
                head: h.clone(),
                tail,
            }
        })
    }

    pub fn from_vec(mut vec: Vec<T>) -> Option<NonEmpty<T>> {
        if vec.is_empty() {
            None
        } else {
            let head = vec.remove(0);
            let tail = if vec.is_empty() { None } else { Some(vec) };
            Some(NonEmpty { head, tail })
        }
    }

    pub fn split_first(&self) -> (&T, &[T]) {
        (&self.head, self.tail.as_ref().map_or(&[], |t| t.as_slice()))
    }

    pub fn split(&self) -> (&T, &[T], Option<&T>) {
        match &self.tail {
            None => (&self.head, &[], None),
            Some(tail) if tail.is_empty() => (&self.head, &[], None),
            Some(tail) => {
                let last = tail.last().unwrap();
                let middle = &tail[..tail.len() - 1];
                (&self.head, middle, Some(last))
            }
        }
    }

    pub fn append(&mut self, other: &mut Vec<T>) {
        if other.is_empty() {
            return;
        }

        match &mut self.tail {
            Some(tail) => tail.append(other),
            None => self.tail = Some(mem::take(other)),
        }
    }

    pub fn map<U, F>(self, mut f: F) -> NonEmpty<U>
    where
        F: FnMut(T) -> U,
    {
        let mapped_tail =
            self.tail.map(|tail| tail.into_iter().map(&mut f).collect());
        NonEmpty {
            head: f(self.head),
            tail: mapped_tail,
        }
    }

    pub fn try_map<E, U, F>(self, mut f: F) -> Result<NonEmpty<U>, E>
    where
        F: FnMut(T) -> Result<U, E>,
    {
        let mapped_tail = match self.tail {
            Some(tail) => {
                let result: Result<Vec<U>, E> =
                    tail.into_iter().map(&mut f).collect();
                Some(result?)
            }
            None => None,
        };

        Ok(NonEmpty {
            head: f(self.head)?,
            tail: mapped_tail,
        })
    }

    pub fn flat_map<U, F>(self, mut f: F) -> NonEmpty<U>
    where
        F: FnMut(T) -> NonEmpty<U>,
    {
        let mut heads = f(self.head);

        if let Some(tail) = self.tail {
            let mut tails = Vec::new();
            for t in tail {
                let mapped = f(t);
                let mut mapped_vec: Vec<U> = mapped.into();
                tails.append(&mut mapped_vec);
            }
            heads.append(&mut tails);
        }

        heads
    }

    pub fn flatten(full: NonEmpty<NonEmpty<T>>) -> Self {
        full.flat_map(|n| n)
    }

    pub fn sort(&mut self)
    where
        T: Ord,
    {
        if let Some(tail) = &mut self.tail {
            tail.sort();

            // Find where the head should go in the sorted tail
            let index = match tail.binary_search(&self.head) {
                Ok(index) => index,
                Err(index) => index,
            };

            if !tail.is_empty() && index == 0 {
                // Head should be first in the sorted list, so swap with current
                // first in tail
                let new_head = tail.remove(0);
                let old_head = mem::replace(&mut self.head, new_head);
                tail.insert(index, old_head);
            }
        }
    }
}

impl<T: Default> Default for NonEmpty<T> {
    fn default() -> Self {
        Self::new(T::default())
    }
}

impl<T> From<NonEmpty<T>> for Vec<T> {
    fn from(nonempty: NonEmpty<T>) -> Vec<T> {
        let mut result = vec![nonempty.head];
        if let Some(mut tail) = nonempty.tail {
            result.append(&mut tail);
        }
        result
    }
}

impl<T> From<NonEmpty<T>> for (T, Vec<T>) {
    fn from(nonempty: NonEmpty<T>) -> (T, Vec<T>) {
        (nonempty.head, nonempty.tail.unwrap_or_else(Vec::new))
    }
}

impl<T> From<(T, Vec<T>)> for NonEmpty<T> {
    fn from((head, tail): (T, Vec<T>)) -> Self {
        let tail = if tail.is_empty() { None } else { Some(tail) };
        NonEmpty { head, tail }
    }
}

impl<T> IntoIterator for NonEmpty<T> {
    type Item = T;
    type IntoIter = iter::Chain<iter::Once<T>, vec::IntoIter<T>>;

    fn into_iter(self) -> Self::IntoIter {
        let tail_iter = self.tail.unwrap_or_else(Vec::new).into_iter();
        iter::once(self.head).chain(tail_iter)
    }
}

impl<'a, T> IntoIterator for &'a NonEmpty<T> {
    type Item = &'a T;
    type IntoIter = iter::Chain<iter::Once<&'a T>, core::slice::Iter<'a, T>>;

    fn into_iter(self) -> Self::IntoIter {
        let tail_iter = self.tail.as_ref().map_or([].iter(), |t| t.iter());
        iter::once(&self.head).chain(tail_iter)
    }
}

impl<T> core::ops::Index<usize> for NonEmpty<T> {
    type Output = T;

    fn index(&self, index: usize) -> &T {
        if index == 0 {
            &self.head
        } else if let Some(tail) = &self.tail {
            &tail[index - 1]
        } else {
            panic!(
                "index out of bounds: the len is 1 but the index is {}",
                index
            )
        }
    }
}

impl<T> core::ops::IndexMut<usize> for NonEmpty<T> {
    fn index_mut(&mut self, index: usize) -> &mut T {
        if index == 0 {
            &mut self.head
        } else if let Some(tail) = &mut self.tail {
            &mut tail[index - 1]
        } else {
            panic!(
                "index out of bounds: the len is 1 but the index is {}",
                index
            )
        }
    }
}

impl<A> Extend<A> for NonEmpty<A> {
    fn extend<T: IntoIterator<Item = A>>(&mut self, iter: T) {
        let iter_collected: Vec<A> = iter.into_iter().collect();
        if iter_collected.is_empty() {
            return;
        }

        match &mut self.tail {
            Some(tail) => tail.extend(iter_collected),
            None => self.tail = Some(iter_collected),
        }
    }
}
