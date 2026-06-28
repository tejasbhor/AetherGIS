## 2024-06-28 - F-String HTML Template XSS
**Vulnerability:** Found unescaped user inputs directly interpolated into raw HTML f-strings in backend/app/services/report_service.py.
**Learning:** Python f-strings lack automatic context-aware escaping. When generating HTML strings manually without a templating engine (like Jinja2), injecting variables directly is a high-severity XSS risk. String slicing must be done before escaping to prevent malformed entities.
**Prevention:** Always use `html.escape()` explicitly on dynamic string variables injected into manual HTML construction, or adopt a safe templating engine that defaults to automatic escaping. Ensure string truncations happen prior to escaping.
