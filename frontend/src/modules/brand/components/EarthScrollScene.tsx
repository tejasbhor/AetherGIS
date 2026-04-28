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

const TOTAL_FRAMES = 360;

interface EarthScrollSceneProps {
  onEnterDashboard?: () => void;
}



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
