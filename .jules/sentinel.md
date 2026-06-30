## 2025-02-14 - XSS in HTML Report Generation
**Vulnerability:** Found multiple XSS vulnerabilities in `backend/app/services/report_service.py` where dynamic pipeline results, alerts, trajectories, consistency issues, and frames were injected unescaped into the generated HTML.
**Learning:** Manual HTML report generation via string interpolation `f-strings` is prone to XSS when processing unsanitized dynamic user-controlled strings (like job parameters and pipeline metadata). No automatic HTML template escaping is present without a proper templating engine.
**Prevention:** Cast dictionary items explicitly to strings and then use `html.escape()` for all dynamically interpolated variables inserted into HTML generation. Do not shadow standard library names.
