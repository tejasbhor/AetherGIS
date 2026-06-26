## 2024-05-18 - Fix XSS in HTML Report Generation
**Vulnerability:** Cross-Site Scripting (XSS) in backend report service where user-controlled parameters were unescaped.
**Learning:** The backend generates HTML reports manually via f-strings without an automated templating engine, making manual escaping critical. Also, using `html.escape` with dynamic dictionary lookups requires casting to string first to avoid TypeErrors. When slicing strings, slice before escaping to prevent malformed HTML entities.
**Prevention:** Always use `html.escape()` for any dynamic variables injected into manually constructed HTML strings. When using the `html` library, avoid shadowing it by naming local variables something like `html_content`.
