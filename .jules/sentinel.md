
## 2024-05-30 - [Fix XSS in Report Generator]
**Vulnerability:** XSS vulnerability in `backend/app/services/report_service.py` due to manual HTML string construction injecting user-controlled data without escaping.
**Learning:** Python f-strings used for HTML generation require explicit escaping for dynamic values (unlike template engines like Jinja2). Also, local variables named `html` shadow the standard library `html` module, preventing its use. Truncation must happen before escaping.
**Prevention:** Always use `html.escape()` for all dynamically injected variables into manually constructed HTML templates, ensure truncation happens before escaping, and avoid naming variables `html`.
