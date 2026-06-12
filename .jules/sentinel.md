## 2024-06-05 - Fix XSS in Manual HTML Generation
**Vulnerability:** XSS/HTML Injection due to manual HTML construction via f-strings with user-controlled data (`layer_id`, `data_source`, etc.) without escaping.
**Learning:** Python's `html.escape` must be used for all dynamic variables inserted into manually built HTML strings. Crucially, ensure the standard module `html` is imported, and local variables are NOT named `html` to prevent shadowing which causes `UnboundLocalError`.
**Prevention:** Always use `html.escape` and verify that module imports are not shadowed by local scope variable names when doing manual string templating.
