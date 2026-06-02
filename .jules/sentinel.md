## 2026-06-02 - [XSS vulnerability via unescaped f-string HTML templates]
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability found in backend HTML report generator.
**Learning:** The application uses raw string concatenation/f-strings to build HTML instead of a templating engine (like Jinja2) that handles auto-escaping. This leaves fields like job_id or error_msg exposed to XSS.
**Prevention:** Avoid building raw HTML strings, but if necessary, always wrap untrusted or dynamic inputs in `html.escape`.
