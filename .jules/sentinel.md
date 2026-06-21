## 2024-06-21 - Fix XSS in Report Generator
**Vulnerability:** Unescaped dictionary values in HTML f-strings allowed XSS payloads to be embedded in NASA-level technical reports (`backend/app/services/report_service.py`).
**Learning:** Python's f-strings provide no automatic escaping. When generating HTML manually without a template engine (like Jinja2), every user-controlled or dynamically generated variable must be explicitly escaped. Furthermore, variables named `html` will shadow the standard library `html` module, requiring careful renaming.
**Prevention:** Always use `html.escape(str(val))` for dynamic values in manual HTML generation, or transition to a proper templating engine that handles auto-escaping.
