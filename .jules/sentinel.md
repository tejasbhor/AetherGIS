## 2024-05-24 - Cross-Site Scripting (XSS) in HTML Reports
**Vulnerability:** Unsanitized user inputs (e.g. `job_id`, `layer_id`, `error_msg`, etc.) and variable parameters injected directly into the HTML using f-strings.
**Learning:** Python f-strings lack automatic HTML escaping. User or system-controlled dynamic contents, even if they appear innocuous like a traceback or error code, can lead to XSS execution when the raw HTML is rendered in the browser.
**Prevention:** Explicitly use `html.escape(str(variable))` on all dynamic parameters injected into HTML reports.
