## 2025-02-14 - XSS Vulnerability in Auto-Report Generator
**Vulnerability:** XSS vulnerability in `generate_html_report` via missing HTML escaping of user inputs (like job_id, layer_id, descriptions, trajectories, models) in the generated manual string templates.
**Learning:** Python f-string templating without built-in escaping requires manually escaping inputs via `html.escape`. Data originating from external databases/API results was not escaped.
**Prevention:** Always use `html.escape()` or use proper template engines (like Jinja2) that auto-escape strings, specifically for dynamic outputs rendered into HTML.
