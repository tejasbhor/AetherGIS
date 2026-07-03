## 2026-07-03 - Cross-Site Scripting (XSS) in HTML Reports
**Vulnerability:** Unsanitized user inputs (e.g., job_id, layer_id, status) were directly interpolated into an HTML template using f-strings in `backend/app/services/report_service.py`, enabling stored/reflected XSS if inputs contain malicious scripts.
**Learning:** Python f-strings lack the automatic HTML escaping provided by template engines like Jinja2. Additionally, a local variable was named `html`, which shadowed the Python standard library `html` module needed for escaping.
**Prevention:** Always use `html.escape(str(value))` when manually constructing HTML strings. Avoid using standard library module names (like `html`) for local variable names to prevent shadowing.
