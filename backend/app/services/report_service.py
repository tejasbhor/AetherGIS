"""AetherGIS — Auto-Report Generator (MODULE 15)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional


def _metric_badge(value: Optional[float], good: float, ok: float, unit: str = "") -> str:
    if value is None:
        return "<span style='color:#666'>N/A</span>"
    color = "#4ade80" if value >= good else "#fb923c" if value >= ok else "#f87171"
    return f"<span style='color:{color};font-weight:700'>{value:.3f}{unit}</span>"


def generate_html_report(
    job_id: str,
    pipeline_result: dict,
    trajectories: Optional[list] = None,
    alerts: Optional[list] = None,
    time_series: Optional[dict] = None,
    consistency_issues: Optional[list] = None,
) -> str:
    """Generate a self-contained HTML report for a completed pipeline job."""
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    metrics = pipeline_result.get("metrics") or {}
    frames = pipeline_result.get("frames") or []
    n_total = metrics.get("total_frames", len(frames))
    n_obs = metrics.get("observed_frames", 0)
    n_interp = metrics.get("interpolated_frames", 0)
    avg_psnr = metrics.get("avg_psnr")
    avg_ssim = metrics.get("avg_ssim")
    tcs = metrics.get("tcs")

    alert_count = len(alerts or [])
    high_alerts = sum(1 for a in (alerts or []) if a.get("severity") == "high")
    traj_count = len(trajectories or [])
    issue_count = len(consistency_issues or [])

    alert_rows = ""
    for a in (alerts or [])[:20]:
        sev_color = {"high": "#f87171", "medium": "#fb923c", "low": "#facc15"}.get(a.get("severity", "low"), "#666")
        alert_rows += f"""
        <tr>
          <td>{a.get('frame_index', '—')}</td>
          <td>{a.get('type', '—')}</td>
          <td style='color:{sev_color};font-weight:600'>{a.get('severity', '—').upper()}</td>
          <td>{a.get('description', '—')[:80]}</td>
        </tr>"""

    traj_rows = ""
    for t in (trajectories or [])[:10]:
        traj_rows += f"""
        <tr>
          <td>{t.get('id', '—')}</td>
          <td>{t.get('speed', 0):.5f}</td>
          <td>{t.get('direction_deg', 0):.1f}°</td>
          <td>{t.get('intensity', 0):.4f}</td>
        </tr>"""

    issue_rows = ""
    for iss in (consistency_issues or [])[:15]:
        sev_color = {"high": "#f87171", "medium": "#fb923c", "low": "#facc15"}.get(iss.get("severity", "low"), "#888")
        issue_rows += f"""
        <tr>
          <td>{iss.get('frame', '—')}</td>
          <td>{iss.get('issue', '—')}</td>
          <td style='color:{sev_color}'>{iss.get('severity', '—').upper()}</td>
          <td>{iss.get('mad_score', '—')}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AetherGIS Analysis Report — {job_id[:12]}</title>
  <style>
    body {{ font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0c10; color: #c8d0dc; margin: 0; padding: 24px; }}
    h1 {{ font-size: 22px; color: #fff; border-bottom: 2px solid #1a3f6f; padding-bottom: 8px; }}
    h2 {{ font-size: 15px; color: #60a5fa; margin-top: 28px; border-left: 3px solid #3b82f6; padding-left: 8px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin: 16px 0; }}
    .card {{ background: #111827; border: 1px solid #1f2937; border-radius: 6px; padding: 12px 16px; }}
    .card-val {{ font-size: 24px; font-weight: 700; margin-bottom: 4px; }}
    .card-lbl {{ font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }}
    th {{ background: #111827; color: #9ca3af; text-align: left; padding: 6px 10px; border-bottom: 1px solid #1f2937; }}
    td {{ padding: 5px 10px; border-bottom: 1px solid #161d2a; }}
    tr:hover {{ background: #0f172a; }}
    .badge {{ display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }}
    .badge-warn {{ background: #7f1d1d; color: #fca5a5; }}
    .badge-ok {{ background: #14532d; color: #86efac; }}
    .disclaimer {{ font-size: 10px; color: #4b5563; border: 1px solid #1f2937; padding: 8px 12px; margin-top: 24px; border-radius: 4px; line-height: 1.6; }}
    .meta {{ font-size: 11px; color: #6b7280; font-family: monospace; margin-bottom: 16px; }}
  </style>
</head>
<body>
  <h1>⟁ AetherGIS Analysis Report</h1>
  <div class="meta">
    Job ID: {job_id} &nbsp;·&nbsp;
    Layer: {pipeline_result.get('layer_id', '—')} &nbsp;·&nbsp;
    Generated: {now}
  </div>

  <h2>Quality Metrics</h2>
  <div class="grid">
    <div class="card"><div class="card-val" style="color:#60a5fa">{n_total}</div><div class="card-lbl">Total Frames</div></div>
    <div class="card"><div class="card-val" style="color:#34d399">{n_obs}</div><div class="card-lbl">Observed</div></div>
    <div class="card"><div class="card-val" style="color:#fb923c">{n_interp}</div><div class="card-lbl">AI-Generated</div></div>
    <div class="card"><div class="card-val">{_metric_badge(avg_psnr, 28, 22, ' dB')}</div><div class="card-lbl">Avg PSNR</div></div>
    <div class="card"><div class="card-val">{_metric_badge(avg_ssim, 0.85, 0.70)}</div><div class="card-lbl">Avg SSIM</div></div>
    <div class="card"><div class="card-val">{_metric_badge(tcs, 0.80, 0.65)}</div><div class="card-lbl">TCS</div></div>
    <div class="card"><div class="card-val" style="color:{'#f87171' if high_alerts>0 else '#4ade80'}">{alert_count}</div><div class="card-lbl">Alerts ({high_alerts} HIGH)</div></div>
    <div class="card"><div class="card-val" style="color:#a78bfa">{traj_count}</div><div class="card-lbl">Trajectories</div></div>
    <div class="card"><div class="card-val" style="color:{'#fb923c' if issue_count>0 else '#4ade80'}">{issue_count}</div><div class="card-lbl">Consistency Issues</div></div>
  </div>

  {f'''<h2>Alerts ({alert_count})</h2>
  <table><thead><tr><th>Frame</th><th>Type</th><th>Severity</th><th>Description</th></tr></thead>
  <tbody>{alert_rows}</tbody></table>''' if alert_count else '<h2>Alerts</h2><p style="color:#6b7280;font-size:12px">No alerts detected.</p>'}

  {f'''<h2>Detected Trajectories ({traj_count})</h2>
  <table><thead><tr><th>ID</th><th>Speed</th><th>Direction</th><th>Intensity</th></tr></thead>
  <tbody>{traj_rows}</tbody></table>''' if traj_count else ''}

  {f'''<h2>Temporal Consistency Issues ({issue_count})</h2>
  <table><thead><tr><th>Frame</th><th>Issue</th><th>Severity</th><th>MAD Score</th></tr></thead>
  <tbody>{issue_rows}</tbody></table>''' if issue_count else ''}

  <div class="disclaimer">
    ⚠ <strong>Scientific Disclaimer:</strong> All AI-interpolated frames are synthetically generated approximations intended
    for qualitative temporal analysis only. PSNR and SSIM measure AI self-consistency relative to bracketing observed frames —
    they are NOT independent ground-truth validations. Do not use these outputs for operational forecasting, storm advisory,
    or scientific measurement. Always refer to original observed satellite data for authoritative analysis.
    <br/>Source: NASA GIBS · Platform: AetherGIS 2.0 · Generated: {now}
  </div>
</body>
</html>"""

    return html
