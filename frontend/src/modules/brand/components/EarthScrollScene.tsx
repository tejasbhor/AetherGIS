import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";
import HeroSection from "./sections/HeroSection";
import ProblemSection from "./sections/ProblemSection";
import SystemSection from "./sections/SystemSection";
import DifferentiatorSection from "./sections/DifferentiatorSection";
import DataSourcesSection from "./sections/DataSourcesSection";
import AccessModelSection from "./sections/AccessModelSection";
import UseCasesSection from "./sections/UseCasesSection";
import DashboardTransitionSection from "./sections/DashboardTransitionSection";

const SNAPPING_MILESTONES = [
  // Triggers at ~40% of the way into each section's transition window
  { threshold: 0.04, target: 0.10, index: 0 }, // Problem (Window 0.0-0.1)
  { threshold: 0.19, target: 0.25, index: 1 }, // System (Window 0.15-0.25)
  { threshold: 0.34, target: 0.40, index: 2 }, // Differentiator (Window 0.3-0.4)
  { threshold: 0.49, target: 0.55, index: 3 }, // Data Sources (Window 0.45-0.55)
  { threshold: 0.64, target: 0.70, index: 4 }, // Access Model (Window 0.6-0.7)
  { threshold: 0.79, target: 0.85, index: 5 }, // Use Cases (Window 0.75-0.85)
  { threshold: 0.93, target: 0.98, index: 6 }, // Final CTA (Window 0.9-1.0)
];

interface EarthScrollSceneProps {
  onEnterDashboard?: () => void;
}

interface NarrativeSection {
  id: string;
  progress: number;
  heading: string;
  content?: string;
  cta?: boolean;
}

// Files are named frame_000 … frame_359 → 360 total frames
const TOTAL_FRAMES = 360;

const narrativeSections: NarrativeSection[] = [
  { id: "hero", progress: 0, heading: "See Earth as it truly moves." },
  {
    id: "problem",
    progress: 0.18,
    heading: "Satellite data shows moments — not motion.",
    content:
      "Most satellite systems capture Earth at fixed time intervals.\n\nBetween those frames, critical motion is lost — making it difficult to understand how atmospheric and environmental events actually evolve.\n\nUsers are forced to interpret changes manually, increasing complexity and reducing clarity.",
  },
  {
    id: "solution",
    progress: 0.34,
    heading: "Reconstructing motion from observation gaps.",
    content:
      "AetherGIS bridges temporal gaps in satellite imagery using AI-based frame interpolation.\n\nIt generates smooth transitions between real observations — transforming disconnected frames into continuous visual narratives.",
  },
  {
    id: "system",
    progress: 0.50,
    heading: "A system designed for real analysis.",
    content:
      "From region selection to temporal playback, AetherGIS provides a complete WebGIS environment for exploring satellite data.\n\n• Select region, layer, and time range\n• Run AI interpolation pipeline\n• Visualize results with timeline playback\n• Compare original and generated frames",
  },
  {
    id: "differentiator",
    progress: 0.65,
    heading: "Not just interpolation. Controlled interpolation.",
    content:
      "Every generated frame is evaluated before it is shown.\n\nAetherGIS integrates a multi-layer validation system:\n\n• Optical flow consistency checks\n• Temporal gap-aware interpolation\n• Pixel-difference thresholding\n• Confidence scoring per frame\n\nYou don't just see motion — you understand its reliability.",
  },
  {
    id: "access",
    progress: 0.80,
    heading: "Engineered for stability.",
    content:
      "AetherGIS uses a controlled access model to ensure reliable performance.\n\n• Single active compute session\n• Queue-based user access\n• Dedicated processing window per session\n\nThis guarantees consistent GPU performance and prevents system overload.",
  },
  {
    id: "disclaimer",
    progress: 0.92,
    heading: "AI-generated content — handle with care.",
    content:
      "Interpolated frames are visually plausible approximations.\n\nThey are NOT suitable for:\n• Scientific measurement\n• Forecasting\n• Operational decision-making\n\nAlways refer to original satellite data for authoritative analysis.",
  },
  {
    id: "cta",
    progress: 1,
    heading: "Explore the system.",
    content:
      "Access is limited to ensure performance and accuracy. Start a session and experience AetherGIS in action.",
    cta: true,
  },
];

const EarthScrollScene: React.FC<EarthScrollSceneProps> = ({ onEnterDashboard }) => {
  const containerRef   = useRef<HTMLDivElement>(null);
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const framesRef      = useRef<HTMLImageElement[]>([]);
  const renderedIdxRef = useRef<number>(-1);
  const rafRef         = useRef<number | null>(null);

  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [loadPct,         setLoadPct]         = useState(0);

  // ── KEY FIX: target the container so scrollYProgress is relative to THIS section ──
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const frameFloat    = useTransform(scrollYProgress, [0, 1], [0, TOTAL_FRAMES - 1]);
  const canvasOpacity = useTransform(scrollYProgress, [0.90, 1], [1, 0.35]);

  // ── Canvas: draw one frame ─────────────────────────────────
  const renderFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = framesRef.current[index];
    if (!img?.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr  = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w    = Math.max(1, Math.round(rect.width  * dpr));
    const h    = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }

    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw    = img.naturalWidth  * scale;
    const dh    = img.naturalHeight * scale;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  // ── Preload sequence ───────────────────────────────────────
  useEffect(() => {
    let alive = true;

    const loadFrame = (i: number): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        const img = new Image();
        const name = `frame_${String(i).padStart(3, "0")}_delay-0.066s.webp`;
        img.decoding = "async";
        img.onload   = () => resolve(img);
        img.onerror  = () => resolve(null);
        img.src      = `/sequence/${name}`;
      });

    const run = async () => {
      // Step 1 — first frame immediately for "above the fold" feel
      const f0 = await loadFrame(0);
      if (!alive) return;
      if (f0) {
        framesRef.current[0] = f0;
        setFirstFrameReady(true);
        requestAnimationFrame(() => renderFrame(0));
      }

      // Step 2 — rest in small chunks
      const CHUNK = 12;
      let done = f0 ? 1 : 0;
      for (let i = 1; i < TOTAL_FRAMES; i += CHUNK) {
        if (!alive) break;
        await Promise.all(
          Array.from({ length: Math.min(CHUNK, TOTAL_FRAMES - i) }, (_, j) => {
            const idx = i + j;
            return loadFrame(idx).then((img) => {
              if (!alive) return;
              if (img) framesRef.current[idx] = img;
              done++;
              setLoadPct(Math.round((done / TOTAL_FRAMES) * 100));
            });
          })
        );
        // catch-up: render current frame if it just became available
        const cur = Math.round(frameFloat.get());
        if (framesRef.current[cur] && cur !== renderedIdxRef.current) {
          renderFrame(cur);
          renderedIdxRef.current = cur;
        }
      }
    };

    run().catch(console.error);
    return () => { alive = false; };
  }, [renderFrame, frameFloat]);

  // ── Scroll → frame ────────────────────────────────────────
  useMotionValueEvent(frameFloat, "change", (latest) => {
    const idx = Math.round(latest);
    if (idx === renderedIdxRef.current) return;
    if (!framesRef.current[idx]) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      renderFrame(idx);
      renderedIdxRef.current = idx;
    });
  });

  // ── Resize ────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      const idx = renderedIdxRef.current >= 0 ? renderedIdxRef.current : 0;
      if (framesRef.current[idx]) renderFrame(idx);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [renderFrame]);

   // ── Active narrative section ──────────────────────────────
   useMotionValueEvent(scrollYProgress, "change", (_v) => {
     let bestDist = Infinity;
     // only consider sections up to current progress (prefer "behind" sections)
     for (const sec of narrativeSections) {
       if (sec.progress > _v + 0.01) continue;
       const dist = _v - sec.progress;
       if (dist < bestDist) { bestDist = dist; }
     }
   });

  // --- Cinematic Snap Logic (Downward Only) ---
  const lastSnappedIndex = React.useRef<number>(-1);
  const lastScrollY = React.useRef<number>(0);
  const isSnapping = React.useRef<boolean>(false);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const currentScrollY = window.scrollY;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    lastScrollY.current = currentScrollY;

    if (!isScrollingDown || isSnapping.current) return;

    const milestone = SNAPPING_MILESTONES.find(m => 
      progress > m.threshold && 
      progress < m.target && 
      m.index > lastSnappedIndex.current
    );

    if (milestone) {
      isSnapping.current = true;
      lastSnappedIndex.current = milestone.index;
      
      const containerTop = containerRef.current?.offsetTop || 0;
      const containerHeight = containerRef.current?.offsetHeight || 0;
      
      // Calculate target with absolute precision to align with peak opacity
      const targetScroll = containerTop + (containerHeight * milestone.target);

      window.scrollTo({
        top: targetScroll,
        behavior: "smooth"
      });

      // Extended lock to prevent "jitter" during the smooth transition
      setTimeout(() => {
        isSnapping.current = false;
      }, 1200);
    }
  });

  return (
    // Outer: tall enough for scroll progression (pinning handle)
    <section
      ref={containerRef}
      style={{ position: "relative", height: "900vh", display: "block" }}
    >
      {/* Thin top-bar loading indicator */}
      {loadPct < 100 && (
        <div className="brand-top-loader">
          <div className="brand-top-loader-bar" style={{ width: `${loadPct}%` }} />
        </div>
      )}

      {/* Inner: sticky viewport */}
      <div className="brand-earth-sticky">

        {/* ── Canvas background ── */}
        <motion.canvas
          ref={canvasRef}
          className="brand-earth-canvas"
          style={{ opacity: firstFrameReady ? canvasOpacity : 0 }}
        />

        {/* Radial vignette overlay */}
        <div className="brand-earth-gradient" />
      </div>

      <div className="brand-content-scroll">
        <HeroSection onEnterDashboard={onEnterDashboard} />
        <ProblemSection />
        <SystemSection />
        <DifferentiatorSection />
        <DataSourcesSection />
        <AccessModelSection />
        <UseCasesSection />
        <DashboardTransitionSection />
      </div>
    </section>
  );
};

export default EarthScrollScene;
