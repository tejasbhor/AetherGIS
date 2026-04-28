/**
 * useFramePreloader — aggressive blob-based frame cache for smooth production playback.
 *
 * THE PRODUCTION STUTTER PROBLEM:
 *   In production, each frame is fetched from `/api/v1/pipeline/<id>/frames/<n>`.
 *   OpenLayers creates a new XHR for every `new Static({url: ...})` call, regardless
 *   of browser HTTP cache headers. On a remote OCI host, this round-trip latency
 *   causes visible stutter during playback even at 1 fps.
 *
 * THE FIX — Blob URL caching:
 *   1. We fetch each frame as a Blob (binary) using the Fetch API.
 *   2. We create a persistent blob URL via `URL.createObjectURL()`.
 *   3. We expose a `getBlobUrl(frameIndex)` function that MapViewer calls.
 *   4. MapViewer passes the blob URL to OL's ImageStatic — no network round-trip,
 *      just an in-memory lookup → zero-latency frame switches.
 *   5. On job change or unmount, we revoke all blob URLs to free memory.
 *
 * MEMORY SAFETY:
 *   - We maintain a sliding window: [current - BEHIND, current + AHEAD].
 *   - Frames outside the window are revoked and evicted.
 *   - Concurrent fetches are de-duped via a `fetching` Set.
 *   - Aborted/failed fetches log warnings and don't crash the playback loop.
 */
import { useEffect, useRef, useCallback } from 'react';

const AHEAD  = 12;  // frames ahead to preload
const BEHIND = 4;   // frames back to keep for scrubbing

export function useFramePreloader(
  jobId: string | null,
  totalFrames: number,
  currentFrameIndex: number,
) {
  // Map<frameIndex, blobUrl>
  const cacheRef = useRef(new Map<number, string>());
  // Set of frame indices currently being fetched (de-duplication)
  const fetchingRef = useRef(new Set<number>());
  // AbortController per-frame to cancel in-flight requests on eviction
  const abortControllersRef = useRef(new Map<number, AbortController>());
  // Track the last jobId so we can flush on job change
  const lastJobIdRef = useRef<string | null>(null);

  /** Revoke and evict a single frame from cache */
  const evict = useCallback((idx: number) => {
    const blobUrl = cacheRef.current.get(idx);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      cacheRef.current.delete(idx);
    }
    // Abort any in-flight request
    abortControllersRef.current.get(idx)?.abort();
    abortControllersRef.current.delete(idx);
    fetchingRef.current.delete(idx);
  }, []);

  /** Flush all cached blobs (on job change or unmount) */
  const flushAll = useCallback(() => {
    for (const idx of Array.from(cacheRef.current.keys())) {
      evict(idx);
    }
    cacheRef.current.clear();
    fetchingRef.current.clear();
    abortControllersRef.current.clear();
  }, [evict]);

  /** Fetch a single frame as a blob and store its object URL */
  const prefetchFrame = useCallback(
    async (jobId: string, idx: number) => {
      if (cacheRef.current.has(idx) || fetchingRef.current.has(idx)) return;

      fetchingRef.current.add(idx);
      const controller = new AbortController();
      abortControllersRef.current.set(idx, controller);

      try {
        const res = await fetch(`/api/v1/pipeline/${jobId}/frames/${idx}`, {
          signal: controller.signal,
          // Tell browser not to reuse cached headers; we manage our own blob cache
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        // Only store if we're still in the window (not evicted while fetching)
        if (fetchingRef.current.has(idx)) {
          const blobUrl = URL.createObjectURL(blob);
          cacheRef.current.set(idx, blobUrl);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn(`[FramePreloader] Failed to prefetch frame ${idx}:`, err?.message);
        }
      } finally {
        fetchingRef.current.delete(idx);
        abortControllersRef.current.delete(idx);
      }
    },
    [],
  );

  useEffect(() => {
    if (!jobId || totalFrames === 0) return;

    // Flush cache on job change
    if (jobId !== lastJobIdRef.current) {
      flushAll();
      lastJobIdRef.current = jobId;
    }

    const low  = Math.max(0, currentFrameIndex - BEHIND);
    const high = Math.min(totalFrames - 1, currentFrameIndex + AHEAD);

    // Evict frames outside the window
    for (const idx of Array.from(cacheRef.current.keys())) {
      if (idx < low || idx > high) evict(idx);
    }

    // Prefetch frames in window (prioritise ahead, then behind)
    for (let i = currentFrameIndex; i <= high; i++) prefetchFrame(jobId, i);
    for (let i = currentFrameIndex - 1; i >= low; i--) prefetchFrame(jobId, i);
  }, [jobId, totalFrames, currentFrameIndex, prefetchFrame, evict, flushAll]);

  // Flush all blob URLs on unmount
  useEffect(() => {
    return () => flushAll();
  }, [flushAll]);

  /**
   * Returns the blob URL for a frame if it's already cached,
   * or the fallback API URL if the blob isn't ready yet.
   * MapViewer should call this every time it needs a frame URL.
   */
  const getFrameUrl = useCallback(
    (frameIndex: number): string => {
      const cached = cacheRef.current.get(frameIndex);
      if (cached) return cached;
      // Fallback: direct API URL (will work but may stutter)
      return jobId ? `/api/v1/pipeline/${jobId}/frames/${frameIndex}` : '';
    },
    [jobId],
  );

  return { getFrameUrl, cache: cacheRef.current };
}
