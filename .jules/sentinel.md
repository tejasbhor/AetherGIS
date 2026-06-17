## 2026-06-17 - HTML Report XSS Vulnerability
**Vulnerability:** XSS vulnerability in report generation via unsanitized f-strings used for rendering HTML content with variables from user-input and data sources in `generate_html_report()`.
**Learning:** The application uses string formatting to manually construct HTML reports instead of relying on a templating engine like Jinja2 that provides automatic escaping. This leads to XSS vectors when unescaped dictionaries or strings are placed into the HTML.
**Prevention:** Always cast and escape dynamic content with `html.escape(str(val))` before injecting into HTML f-strings, and perform any text manipulations like slicing *before* escaping to prevent broken entity codes.
