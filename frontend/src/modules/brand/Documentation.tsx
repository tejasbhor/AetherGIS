import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Brand.css';
import BrandPageShell from './components/BrandPageShell';

// ─── Section IDs ────────────────────────────────────────────────────────────

type SectionId =
  | 'overview'
  | 'quickstart'
  | 'architecture'
  | 'pipeline'
  | 'ai-system'
  | 'api-run'
  | 'api-status'
  | 'api-results'
  | 'user-guide'
  | 'access-model';

interface NavItem {
  id: SectionId;
  label: string;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview',      label: 'Overview',          group: 'Getting Started' },
  { id: 'quickstart',    label: 'Quick Start',        group: 'Getting Started' },
  { id: 'architecture',  label: 'System Architecture',group: 'Architecture' },
  { id: 'pipeline',      label: 'Pipeline Lifecycle', group: 'Architecture' },
  { id: 'ai-system',     label: 'AI & Interpolation', group: 'AI System' },
  { id: 'api-run',       label: 'POST /pipeline/run', group: 'API Reference' },
  { id: 'api-status',    label: 'GET /jobs/status',   group: 'API Reference' },
  { id: 'api-results',   label: 'GET /jobs/results',  group: 'API Reference' },
  { id: 'user-guide',    label: 'Using the Platform', group: 'User Guide' },
  { id: 'access-model',  label: 'Access Model',       group: 'User Guide' },
];

// ─── Section Components ──────────────────────────────────────────────────────

const SectionOverview: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / Getting Started</p>
      <h1>Overview</h1>
      <p className="brand-docs-lead">
        AetherGIS is an AI-powered WebGIS platform that transforms temporally sparse satellite imagery
        into interpretable visual narratives with confidence control.
      </p>
    </header>

    <section className="brand-doc-cards" style={{ marginTop: 24 }}>
      {[
        { t: 'Multi-Source Ingestion',    d: 'Connect to NASA GIBS (Cloud) and MOSDAC (Local) with unified WMS policy.' },
        { t: 'AI Temporal Enhancement',   d: 'RIFE/FILM interpolation with optical-flow validation for every synthetic frame.' },
        { t: 'Accuracy First',            d: 'Confidence scoring and quality validation gates every generated frame.' },
        { t: 'WebGIS Visualization',      d: 'Interactive map, timeline scrubber, overlays, and side-by-side comparison.' },
      ].map(({ t, d }) => (
        <article key={t}>
          <h3>{t}</h3>
          <p>{d}</p>
        </article>
      ))}
    </section>

    <section className="brand-doc-split" style={{ marginTop: 28 }}>
      <div>
        <h2>What Can You Do?</h2>
        <ul>
          <li>Select an AOI, time range, and supported satellite layer.</li>
          <li>Generate AI-interpolated frames between sparse observations.</li>
          <li>Analyse motion patterns with confidence-aware overlays.</li>
          <li>Compare original and enhanced sequences side-by-side.</li>
          <li>Export videos, frames, and analytical insights.</li>
        </ul>
      </div>
      <img src="/sequence/frame_140_delay-0.066s.webp" alt="AetherGIS dashboard module preview" />
    </section>

    <section style={{ marginTop: 28 }}>
      <h2>Access Model</h2>
      <p>
        Production uses a queue-based single-session lock for stable resource control. Local mode
        supports direct access for development and testing.
      </p>
    </section>
  </>
);

const SectionQuickstart: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / Getting Started</p>
      <h1>Quick Start</h1>
      <p className="brand-docs-lead">Get from zero to your first interpolated frame sequence in minutes.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <ol className="brand-docs-steps">
        <li>
          <h3>1. Open Dashboard</h3>
          <p>Use local mode for development (<code>npm run dev</code>) or authenticated mode for production access via <code>/api/v1/auth/login</code>.</p>
        </li>
        <li>
          <h3>2. Select a Data Source</h3>
          <p>Choose between NASA GIBS (cloud, global coverage) or MOSDAC INSAT (local, Indian subcontinent). The source selector is in the top toolbar.</p>
        </li>
        <li>
          <h3>3. Draw Your AOI</h3>
          <p>Use the rectangle tool (⬚) on the map to define your Area of Interest. A bounding box will be drawn and confirmed in the status bar.</p>
        </li>
        <li>
          <h3>4. Set Time Range</h3>
          <p>Open the Layer Controls panel on the left. Pick a start date, end date, and target frame count using the temporal controls.</p>
        </li>
        <li>
          <h3>5. Run & Review</h3>
          <p>Click <strong>Run Pipeline</strong> in the Analysis Panel. Monitor queue/running status in real time. Once complete, use the Timeline Scrubber to review every frame with confidence overlays.</p>
        </li>
      </ol>
    </section>
  </>
);

const SectionArchitecture: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / Architecture</p>
      <h1>System Architecture</h1>
      <p className="brand-docs-lead">A modular monolith with strict separation between Brand, App, and Pipeline layers.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <div className="brand-docs-arch-grid">
        {[
          {
            layer: 'Frontend',
            badge: 'React + Vite',
            desc: 'Vite-based React application split into two modules: Brand (marketing, docs, legal) and App (GeoAI workspace). Strict alias boundaries prevent cross-contamination.',
          },
          {
            layer: 'Backend',
            badge: 'FastAPI',
            desc: 'Python FastAPI services orchestrate ingestion, preprocessing, AI interpolation, and reporting. Celery task queue manages GPU-bound pipeline jobs.',
          },
          {
            layer: 'AI Pipeline',
            badge: 'RIFE / FILM',
            desc: 'NVIDIA GPU-accelerated RIFE and FILM models perform optical-flow guided temporal interpolation. Every synthetic frame carries a confidence score and quality flag.',
          },
          {
            layer: 'Data Sources',
            badge: 'WMS / Local',
            desc: 'NASA GIBS delivers cloud WMS tiles. MOSDAC INSAT 3DR/3DS datasets are fetched locally with server-side catalog discovery to prevent URL hardcoding.',
          },
        ].map(({ layer, badge, desc }) => (
          <div key={layer} className="brand-docs-arch-card">
            <div className="brand-docs-arch-header">
              <span>{layer}</span>
              <span className="brand-docs-arch-badge">{badge}</span>
            </div>
            <p>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  </>
);

const SectionPipeline: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / Architecture</p>
      <h1>Pipeline Lifecycle</h1>
      <p className="brand-docs-lead">Every run follows a deterministic five-stage lifecycle with checkpointing at each gate.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <ol className="brand-docs-steps">
        {[
          { n: '01', t: 'Ingestion',       d: 'WMS tile fetch for the target AOI and temporal slice set. Cloud or local source selected based on data source configuration.' },
          { n: '02', t: 'Preprocessing',   d: 'Spatial alignment, radiometric normalization, and tensor preparation. Invalid or cloud-covered tiles are flagged before GPU entry.' },
          { n: '03', t: 'Interpolation',   d: 'RIFE or FILM model performs optical-flow guided temporal reconstruction between anchor frames. GPU-exclusive lock prevents queue contention.' },
          { n: '04', t: 'Validation',      d: 'Confidence score estimation and per-frame quality checks. Frames below threshold are marked synthetic-invalid and hidden from the default view.' },
          { n: '05', t: 'Export',          d: 'Frames, video, confidence maps, and metadata manifests are persisted. Results accessible via the API or directly in the Analysis Panel.' },
        ].map(({ n, t, d }) => (
          <li key={n}>
            <span className="brand-docs-step-num">{n}</span>
            <div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  </>
);

const SectionAiSystem: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / AI System</p>
      <h1>AI & Interpolation</h1>
      <p className="brand-docs-lead">
        AetherGIS uses two complementary models, RIFE and FILM, for temporally coherent frame synthesis.
      </p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>RIFE (Real-time Intermediate Flow Estimation)</h2>
      <p>
        RIFE estimates intermediate optical flow fields using a U-Net variant trained on high-frame-rate
        video pairs. It produces visually smooth interpolations with low hallucination rates for clear-sky imagery.
      </p>
    </section>
    <section>
      <h2>FILM (Frame Interpolation for Large Motion)</h2>
      <p>
        FILM handles large inter-frame displacement (clouds, storm tracks, ocean currents) using a
        multi-scale feature pyramid. It trades runtime speed for better handling of non-rigid motion.
      </p>
    </section>
    <section>
      <h2>Confidence Scoring</h2>
      <p>
        Every synthetic frame receives a scalar confidence score in [0, 1] derived from flow consistency,
        photometric error, and source tile quality. Frames with scores below a configurable threshold are
        flagged and excluded from default playback. The raw confidence map is always available in the
        Analysis Panel.
      </p>
    </section>
    <div className="brand-docs-disclaimer-card" style={{ marginTop: 24 }}>
      <h4>Disclaimer</h4>
      <p>
        AI-interpolated frames are synthetic approximations intended for qualitative analysis only.
        They are not suitable for scientific measurement, operational forecasting, or decision-making
        without domain expert review.
      </p>
    </div>
  </>
);

const SectionApiRun: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / API Reference</p>
      <h1>POST /api/v1/pipeline/run</h1>
      <p className="brand-docs-lead">Submit a new pipeline job. Returns a job ID for polling.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>Request Body</h2>
      <pre className="brand-docs-code">{`{
  "bbox": [west, south, east, north],
  "start_date": "YYYY-MM-DD",
  "end_date":   "YYYY-MM-DD",
  "source":     "nasa_gibs" | "insat",
  "layer":      "<layer_id>",
  "frame_count": 12
}`}</pre>
    </section>
    <section>
      <h2>Response</h2>
      <pre className="brand-docs-code">{`{
  "job_id": "uuid-v4",
  "status": "queued",
  "position": 1
}`}</pre>
    </section>
    <section>
      <h2>Status Codes</h2>
      <table className="brand-docs-table">
        <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>202</td><td>Job accepted and queued</td></tr>
          <tr><td>400</td><td>Invalid request parameters</td></tr>
          <tr><td>409</td><td>Queue lock held (KOTH) — another session is running</td></tr>
          <tr><td>503</td><td>GPU unavailable</td></tr>
        </tbody>
      </table>
    </section>
  </>
);

const SectionApiStatus: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / API Reference</p>
      <h1>GET /api/v1/jobs/&#123;job_id&#125;/status</h1>
      <p className="brand-docs-lead">Poll the current state of a submitted pipeline job.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>Response</h2>
      <pre className="brand-docs-code">{`{
  "job_id":   "uuid-v4",
  "status":   "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED",
  "progress": 0.0–1.0,
  "message":  "Preprocessing complete",
  "error":    null | "<error message>"
}`}</pre>
    </section>
    <section>
      <h2>Polling Guidance</h2>
      <p>Poll every 2–5 seconds while status is <code>QUEUED</code> or <code>RUNNING</code>. Stop polling on <code>COMPLETED</code> or <code>FAILED</code>. The frontend uses TanStack Query with a 2-second refetch interval during active jobs.</p>
    </section>
  </>
);

const SectionApiResults: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / API Reference</p>
      <h1>GET /api/v1/jobs/&#123;job_id&#125;/results</h1>
      <p className="brand-docs-lead">Retrieve generated frames, confidence payloads, and metadata for a completed job.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>Response</h2>
      <pre className="brand-docs-code">{`{
  "job_id": "uuid-v4",
  "frames": [
    {
      "index":      0,
      "timestamp":  "ISO-8601",
      "url":        "/outputs/<job_id>/frame_0.webp",
      "confidence": 0.92,
      "is_synthetic": false
    },
    ...
  ],
  "confidence_map_url": "/outputs/<job_id>/confidence.png",
  "metadata": { "source": "nasa_gibs", "layer": "..." }
}`}</pre>
    </section>
  </>
);

const SectionUserGuide: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / User Guide</p>
      <h1>Using the Platform</h1>
      <p className="brand-docs-lead">A walkthrough of the AetherGIS workspace from AOI selection to export.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>Map Interaction</h2>
      <p>The central map uses Leaflet with EPSG:4326 projection. Pan with click-drag, zoom with scroll wheel. Use the Draw AOI tool (⬚ in the toolbar) to draw a bounding box — this activates the pipeline controls.</p>
    </section>
    <section>
      <h2>Layer Controls</h2>
      <p>The left dock shows available satellite layers for the selected source. Toggle layers on/off, adjust opacity, and change blend mode. Active layers are indicated in the status bar.</p>
    </section>
    <section>
      <h2>Timeline Scrubber</h2>
      <p>After a successful pipeline run, the timeline below the map shows all frames with colour-coded confidence. Click any frame to jump to it. Use keyboard shortcuts: <kbd>Space</kbd> to play/pause, <kbd>←</kbd>/<kbd>→</kbd> to step, <kbd>1–4</kbd> for playback speed.</p>
    </section>
    <section>
      <h2>Analysis Panel</h2>
      <p>The right dock provides run configuration, confidence statistics, and export controls. Download frames as WebP sequences, MP4 video, or confidence CSV.</p>
    </section>
  </>
);

const SectionAccessModel: React.FC = () => (
  <>
    <header>
      <p className="eyebrow">Docs / User Guide</p>
      <h1>Access Model</h1>
      <p className="brand-docs-lead">How AetherGIS controls compute access in production and development environments.</p>
    </header>
    <section style={{ marginTop: 24 }}>
      <h2>Production Mode</h2>
      <p>
        Production deployments use Google OAuth via the <code>/api/v1/auth/login</code> flow. Once
        authenticated, users enter the dashboard. A queue-based single-session lock (KOTH — King of the Hill)
        ensures only one pipeline can hold the GPU at a time, preventing resource contention.
      </p>
    </section>
    <section>
      <h2>Local Development Mode</h2>
      <p>
        When <code>MODE=local</code> is set in the backend environment, the auth gate is bypassed and
        the dashboard is accessible directly at <code>/dashboard</code>. The KOTH lock is still enforced
        for job serialisation.
      </p>
    </section>
    <section>
      <h2>Queue Position</h2>
      <p>
        If a pipeline job is already running, new submissions return <code>HTTP 409</code> with the
        current queue position. The frontend displays the position in the Session Manager.
      </p>
    </section>
  </>
);

// ─── Section Registry ────────────────────────────────────────────────────────

const SECTIONS: Record<SectionId, React.FC> = {
  'overview':     SectionOverview,
  'quickstart':   SectionQuickstart,
  'architecture': SectionArchitecture,
  'pipeline':     SectionPipeline,
  'ai-system':    SectionAiSystem,
  'api-run':      SectionApiRun,
  'api-status':   SectionApiStatus,
  'api-results':  SectionApiResults,
  'user-guide':   SectionUserGuide,
  'access-model': SectionAccessModel,
};

// ─── On This Page ────────────────────────────────────────────────────────────

const ON_THIS_PAGE: Record<SectionId, { label: string; anchors: { id: string; label: string }[] }> = {
  'overview':     { label: 'Overview',           anchors: [{ id: 'capabilities', label: 'Capabilities' }, { id: 'what-can-you-do', label: 'What Can You Do?' }] },
  'quickstart':   { label: 'Quick Start',        anchors: [{ id: 'step-1', label: 'Open Dashboard' }, { id: 'step-3', label: 'Draw AOI' }, { id: 'step-5', label: 'Run & Review' }] },
  'architecture': { label: 'Architecture',       anchors: [{ id: 'frontend', label: 'Frontend' }, { id: 'backend', label: 'Backend' }, { id: 'ai-pipeline', label: 'AI Pipeline' }] },
  'pipeline':     { label: 'Pipeline Lifecycle', anchors: [{ id: 'ingestion', label: 'Ingestion' }, { id: 'interpolation', label: 'Interpolation' }, { id: 'validation', label: 'Validation' }] },
  'ai-system':    { label: 'AI System',          anchors: [{ id: 'rife', label: 'RIFE' }, { id: 'film', label: 'FILM' }, { id: 'confidence', label: 'Confidence Scoring' }] },
  'api-run':      { label: 'POST /run',          anchors: [{ id: 'request', label: 'Request Body' }, { id: 'response', label: 'Response' }, { id: 'codes', label: 'Status Codes' }] },
  'api-status':   { label: 'GET /status',        anchors: [{ id: 'response', label: 'Response' }, { id: 'polling', label: 'Polling Guidance' }] },
  'api-results':  { label: 'GET /results',       anchors: [{ id: 'response', label: 'Response Schema' }] },
  'user-guide':   { label: 'User Guide',         anchors: [{ id: 'map', label: 'Map Interaction' }, { id: 'timeline', label: 'Timeline Scrubber' }, { id: 'analysis', label: 'Analysis Panel' }] },
  'access-model': { label: 'Access Model',       anchors: [{ id: 'production', label: 'Production Mode' }, { id: 'local', label: 'Local Development' }, { id: 'queue', label: 'Queue Position' }] },
};

// ─── Documentation Component ─────────────────────────────────────────────────

const Documentation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active section from URL hash or search param
  const getSectionFromUrl = useCallback((): SectionId => {
    const hash = location.hash.replace('#', '');
    if (hash && hash in SECTIONS) return hash as SectionId;
    const search = new URLSearchParams(location.search);
    const s = search.get('section');
    if (s && s in SECTIONS) return s as SectionId;
    return 'overview';
  }, [location.hash, location.search]);

  const [activeSection, setActiveSection] = useState<SectionId>(getSectionFromUrl);

  useEffect(() => {
    setActiveSection(getSectionFromUrl());
  }, [getSectionFromUrl]);

  const navigateTo = (id: SectionId) => {
    navigate(`/docs#${id}`, { replace: false });
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Group nav items
  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group)));

  const ActiveComponent = SECTIONS[activeSection];
  const onThisPage = ON_THIS_PAGE[activeSection];

  return (
    <BrandPageShell contentClassName="brand-docs-layout-ref">
      {/* ── Left Sidebar ── */}
      <aside className="brand-docs-left-rail">
        <h3>Documentation</h3>
        <div className="brand-docs-search">Search documentation…</div>
        <nav>
          {groups.map((group) => (
            <div key={group}>
              <p>{group}</p>
              {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={activeSection === item.id ? 'is-active' : ''}
                  onClick={(e) => { e.preventDefault(); navigateTo(item.id); }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main Panel ── */}
      <article className="brand-docs-main-panel">
        <ActiveComponent />
      </article>

      {/* ── Right Rail ── */}
      <aside className="brand-docs-right-rail">
        <section>
          <h4>On This Page</h4>
          {onThisPage.anchors.map((a) => (
            <a key={a.id} href={`#${a.id}`}>{a.label}</a>
          ))}
        </section>
        <section className="brand-docs-disclaimer-card">
          <h4>Important</h4>
          <p>
            AI-interpolated frames are synthetic approximations for qualitative analysis only.
            Not for scientific measurement or forecasting.
          </p>
        </section>
        <section>
          <h4>System Status</h4>
          <p>NASA GIBS: <span style={{ color: '#4ade80' }}>Active</span></p>
          <p>MOSDAC: <span style={{ color: '#4ade80' }}>Active</span></p>
          <p>Queue: <span style={{ color: '#4ade80' }}>Operational</span></p>
        </section>
      </aside>
    </BrandPageShell>
  );
};

export default Documentation;
