## 2024-05-18 - Prevent XSS in Auto-Generated HTML Reports
**Vulnerability:** HTML reports were generated dynamically via f-strings without proper HTML escaping of user-controlled or external data, leading to potential Cross-Site Scripting (XSS) vulnerabilities.
**Learning:** `html.escape` must be strictly applied to untrusted data before interpolation in HTML contexts. Direct interpolation of dictionaries or dynamic external values can expose the application to code injection if rendering bypasses standard templating engines.
**Prevention:** Always use `html.escape(str(value))` when manually rendering HTML templates.
