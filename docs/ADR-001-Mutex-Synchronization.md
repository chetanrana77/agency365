# ADR-001: Centralized Mutex Synchronization

**Status:** Accepted
**Date:** 2026-07-08

## Context
Agency365's Alpha architecture relies heavily on local state (`localStorage`) being continuously synchronized to Supabase as a JSON blob. Multiple UI modules write simultaneously to this same data source during rapid user interactions (e.g., checking off multiple tasks, or adding an expense and immediately navigating away).

## Problem
Because `localStorage.setItem` interceptor operates asynchronously over the network, concurrent writes triggered race conditions. Specifically, overlapping `DELETE` and `INSERT` requests caused complete data loss, duplicate rows, or empty states.

## Decision
Introduce a centralized synchronization queue protected by a non-blocking Mutex lock directly inside the `localStorage.setItem` wrapper in `supabaseClient.js`.

The queue (`pendingSyncData`) holds the most recent state, while the mutex (`syncMutex`) ensures only one active network transaction occurs per table at a given time. Once a network call resolves, the loop automatically processes the latest queued state.

## Consequences

### Positive
- **Single synchronization pipeline:** All modules inherit this safety mechanism automatically without requiring module-level code changes.
- **Lower maintenance:** We only need to monitor one interceptor for data safety.
- **Data Integrity:** Eliminates the possibility of race conditions corrupting the JSON arrays in Supabase.
- **Pull-To-Refresh Safety:** The exported `isSyncing()` lock enables mobile users to safely pull-to-refresh without accidentally cancelling in-flight requests.

### Negative
- **Queue management complexity:** If network requests hang indefinitely, the mutex could theoretically remain locked.
- **Requires monitoring:** Must track unhandled promise rejections inside the sync loop.
- **Transitional Strategy:** This is a stabilization pattern for Alpha. Sprint 2's relational normalization will eventually replace this pattern.
