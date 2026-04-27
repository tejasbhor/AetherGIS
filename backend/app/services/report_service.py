"""AetherGIS — Auto-Report Generator (MODULE 15)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional


def _metric_badge(value: Optional[float], good: float, ok: float, unit: str = "") -> str:
    if value is None:
        return "<span style='color: #787878; font-style: italic;'>N/A</span>"
    if value >= good:
        color = "#207a30"
        bg = "#e8f6ec"
    elif value >= ok:
        color = "#c06010"
        bg = "#fdf0e0"
    else:
        color = "#b82020"
        bg = "#fde8e8"
    return f"<span class='badge' style='color: {color}; background: {bg}; border: 1px solid {color}33;'>{value:.3f}{unit}</span>"

def _sev_badge(severity: str) -> str:
    s = str(severity).lower()
    if s in ["high", "critical"]:
        return "<span class='badge' style='color: #b82020; background: #fde8e8; border: 1px solid rgba(184,32,32,0.2);'>HIGH</span>"
    elif s == "medium":
        return "<span class='badge' style='color: #c06010; background: #fdf0e0; border: 1px solid rgba(192,96,16,0.2);'>MEDIUM</span>"
    return "<span class='badge' style='color: #207a30; background: #e8f6ec; border: 1px solid rgba(32,122,48,0.2);'>LOW</span>"

def generate_html_report(
    job_id: str,
    pipeline_result: dict,
    trajectories: Optional[list] = None,
    alerts: Optional[list] = None,
    time_series: Optional[dict] = None,
    consistency_issues: Optional[list] = None,
) -> str:
    """Generate a premium, institution-grade HTML report for a completed pipeline job."""
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    metrics = pipeline_result.get("metrics") or {}
    frames = pipeline_result.get("frames") or []
    
    n_total = metrics.get("total_frames", len(frames))
    n_obs = metrics.get("observed_frames", 0)
    n_interp = metrics.get("interpolated_frames", 0)
    avg_psnr = metrics.get("avg_psnr")
    avg_ssim = metrics.get("avg_ssim")
    tcs = metrics.get("tcs")
    
    obs_pct = (n_obs / max(n_total, 1)) * 100
    int_pct = (n_interp / max(n_total, 1)) * 100

    alert_count = len(alerts or [])
    high_alerts = sum(1 for a in (alerts or []) if a.get("severity", "").lower() == "high")
    traj_count = len(trajectories or [])
    issue_count = len(consistency_issues or [])
    
    alert_rows = ""
    for a in (alerts or [])[:20]:
        alert_rows += f"""
        <tr>
          <td class="font-mono">{a.get('frame_index', '—')}</td>
          <td>{str(a.get('type', '—')).replace('_', ' ').capitalize()}</td>
          <td>{_sev_badge(a.get('severity', 'low'))}</td>
          <td style="color: #444444;">{a.get('description', '—')[:120]}</td>
        </tr>"""

    traj_rows = ""
    for t in (trajectories or [])[:10]:
        traj_rows += f"""
        <tr>
          <td class="font-mono">{t.get('id', '—')}</td>
          <td class="font-mono">{t.get('speed', 0):.5f}</td>
          <td class="font-mono">{t.get('direction_deg', 0):.1f}&deg;</td>
          <td class="font-mono">{t.get('intensity', 0):.4f}</td>
        </tr>"""

    issue_rows = ""
    for iss in (consistency_issues or [])[:15]:
        issue_rows += f"""
        <tr>
          <td class="font-mono">{iss.get('frame', '—')}</td>
          <td>{iss.get('issue', '—')}</td>
          <td>{_sev_badge(iss.get('severity', 'low'))}</td>
          <td class="font-mono">{iss.get('mad_score', '—')}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AetherGIS Report &mdash; {job_id[:8]}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #e8e8e8; --panel: #f2f2f2; --panel-hdr: #d8d8d8;
      --b1: #b0b0b0; --b2: #c8c8c8; --input-bg: #ffffff;
      --t1: #1a1a1a; --t2: #444444; --t3: #787878; --blue: #144e8c; --blue-bg: #e8f2fc;
      --green: #207a30; --orange: #c06010; --red: #b82020;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      font-family: 'Barlow', sans-serif; font-size: 13px; line-height: 1.4;
      background-color: var(--bg); color: var(--t1); margin: 0; padding: 20px;
    }}
    .font-mono {{ font-family: 'JetBrains Mono', monospace; font-size: 11px; }}
    .font-cond {{ font-family: 'Barlow Condensed', sans-serif; }}
    
    .container {{
      max-width: 900px; margin: 0 auto; background: var(--panel);
      border: 1px solid var(--b1); box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }}
    .header {{
      background: var(--panel-hdr); border-bottom: 1px solid var(--b1);
      padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
    }}
    .app-title {{ font-family: var(--cond); font-size: 15px; font-weight: 600; letter-spacing: 0.04em; margin: 0; }}
    .app-title .blue {{ color: var(--blue); }}
    .job-meta {{ font-size: 11px; color: var(--t2); margin-top: 2px; }}
    
    .status {{ display: inline-flex; align-items: center; gap: 6px; font-weight: 500; color: var(--t2); font-size: 12px; }}
    .status-dot {{ width: 8px; height: 8px; border-radius: 50%; background: var(--green); }}
    
    .content {{ padding: 20px; }}
    .section-title {{
      font-family: var(--cond); font-size: 13px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--t3); border-bottom: 1px solid var(--b2);
      padding-bottom: 4px; margin: 0 0 12px 0;
    }}
    
    .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--b2); border: 1px solid var(--b2); margin-bottom: 24px; }}
    .card {{ background: var(--input-bg); padding: 12px; display: flex; flex-direction: column; }}
    .card-label {{ font-family: var(--cond); font-size: 11px; text-transform: uppercase; color: var(--t3); letter-spacing: 0.04em; }}
    .card-val {{ font-family: var(--mono); font-size: 16px; font-weight: 500; color: var(--t1); margin-top: 4px; display: flex; align-items: center; justify-content: space-between; }}
    
    .progress-wrap {{ grid-column: span 4; background: var(--input-bg); padding: 12px; }}
    .progress {{ display: flex; height: 6px; border-radius: 0; overflow: hidden; background: var(--panel-hdr); margin: 6px 0; }}
    .prog-obs {{ background: var(--blue); width: {obs_pct}%; }}
    .prog-int {{ background: var(--orange); width: {int_pct}%; }}
    .prog-legend {{ display: flex; justify-content: space-between; font-size: 11px; color: var(--t2); }}
    
    table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid var(--b2); }}
    th {{ background: var(--panel-hdr); color: var(--t2); font-family: var(--cond); font-weight: 600; letter-spacing: 0.02em; padding: 6px 10px; text-align: left; border-bottom: 1px solid var(--b1); }}
    td {{ background: var(--input-bg); padding: 8px 10px; border-bottom: 1px solid var(--b3); vertical-align: middle; }}
    
    .badge {{ font-family: var(--mono); font-size: 10px; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; font-weight: 500; }}
    
    .footer {{ background: var(--input-bg); border-top: 1px solid var(--b1); padding: 16px; font-size: 11px; color: var(--t3); }}
    .footer p {{ margin: 0 0 8px 0; }}
    .footer strong {{ color: var(--t2); font-weight: 600; }}
    .footer-meta {{ display: flex; justify-content: space-between; border-top: 1px solid var(--b3); padding-top: 12px; margin-top: 12px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="app-title font-cond">AETHER<span class="blue">GIS</span> — ENGINEERING ANALYSIS</h1>
        <div class="job-meta font-mono">ID: {job_id} | Layer: {pipeline_result.get('layer_id', 'Unknown')}</div>
      </div>
      <div class="status"><div class="status-dot"></div>Analysis Complete</div>
    </div>
    
    <div class="content">
      <h2 class="section-title">Telemetry & Metrics</h2>
      <div class="grid">
        <div class="progress-wrap">
          <div class="card-label">Frame Composition Ratio</div>
          <div class="progress">
            <div class="prog-obs"></div>
            <div class="prog-int"></div>
          </div>
          <div class="prog-legend">
            <span><strong>{n_obs}</strong> Observed (Primary)</span>
            <span><strong>{n_interp}</strong> AI-Interpolated</span>
          </div>
        </div>
        
        <div class="card">
          <div class="card-label">Avg PSNR</div>
          <div class="card-val">{_metric_badge(avg_psnr, 28, 22, ' dB')}</div>
        </div>
        <div class="card">
          <div class="card-label">Avg SSIM</div>
          <div class="card-val">{_metric_badge(avg_ssim, 0.85, 0.70)}</div>
        </div>
        <div class="card">
          <div class="card-label">TCS Score</div>
          <div class="card-val">{_metric_badge(tcs, 0.80, 0.65)}</div>
        </div>
        <div class="card">
          <div class="card-label">Alerts</div>
          <div class="card-val"><span style="color: {'var(--red)' if high_alerts > 0 else 'var(--t1)'}">{alert_count}</span></div>
        </div>
      </div>

      {f'''
      <h2 class="section-title">Detected Anomalies</h2>
      <table>
        <thead><tr><th>Frame</th><th>Classification</th><th>Severity</th><th>Diagnostic</th></tr></thead>
        <tbody>{{alert_rows}}</tbody>
      </table>
      ''' if alert_count else ''}

      {f'''
      <h2 class="section-title">Vector Trajectories</h2>
      <table>
        <thead><tr><th>ID</th><th>Velocity</th><th>Heading</th><th>Intensity</th></tr></thead>
        <tbody>{{traj_rows}}</tbody>
      </table>
      ''' if traj_count else ''}

      {f'''
      <h2 class="section-title">Consistency Diagnostics</h2>
      <table>
        <thead><tr><th>Frame</th><th>Issue</th><th>Severity</th><th>MAD Variance</th></tr></thead>
        <tbody>{{issue_rows}}</tbody>
      </table>
      ''' if issue_count else ''}
    </div>
    
    <div class="footer">
      <p><strong>Disclaimer:</strong> AI-interpolated frames are synthetically generated algorithms intended for qualitative temporal analysis only. PSNR and SSIM measure AI self-consistency relative to bracketing historical observed frames — they are NOT independent ground-truth validations.</p>
      <p style="margin-bottom: 0;">Do not use these outputs for operational forecasting, active storm advisory, or precise scientific measurement. Always cross-reference with primary orbital assets.</p>
      <div class="footer-meta">
        <span><strong>Source:</strong> NASA GIBS Earthdata API</span>
        <span><strong>Generated:</strong> {now}</span>
        <span><strong>Engine:</strong> AetherGIS 2.0</span>
      </div>
    </div>
  </div>
</body>
</html>"""
    return html
