/**
 * useFramePreloader — keeps the next N frames pre-fetched in browser memory.
 *
 * HOW IT WORKS:
 *   We create `new Image()` objects for the surrounding window of frames.
 *   The browser fetches and caches these PNGs before they're needed.
 *   When MapViewer advances the frame index, the image is already in cache
 *   → no network round-trip delay → no visible flicker.
 *
 * MEMORY SAFETY:
 *   We keep a ref-counted Map<frameIndex, HTMLImageElement>.
 *   Frames outside [current - BEHIND, current + AHEAD] are evicted.
 */
import { useEffect, useRef } from 'react';

const AHEAD  = 10;   // how many frames ahead to preload
const BEHIND = 3;    // how many frames back to keep (for scrubbing)

export function useFramePreloader(
  jobId: string | null,
  totalFrames: number,
  currentFrameIndex: number,
) {
  const cacheRef = useRef(new Map<number, HTMLImageElement>());

  useEffect(() => {
    if (!jobId || totalFrames === 0) return;

    const cache = cacheRef.current;
    const low  = Math.max(0, currentFrameIndex - BEHIND);
    const high = Math.min(totalFrames - 1, currentFrameIndex + AHEAD);

    // Evict frames outside the window
    for (const idx of Array.from(cache.keys())) {
      if (idx < low || idx > high) {
        cache.delete(idx);
      }
    }

    // Preload frames in the window
    for (let i = low; i <= high; i++) {
      if (!cache.has(i)) {
        const img = new Image();
        img.src = `/api/v1/pipeline/${jobId}/frames/${i}`;
        cache.set(i, img);
      }
    }
  }, [jobId, totalFrames, currentFrameIndex]);

  return cacheRef.current;
}
