from backend.app.services.report_service import generate_html_report

def test_generate_html_report_xss():
    res = {
        "layer_id": "<script>alert('xss1')</script>",
        "data_source": "<script>alert('xss2')</script>",
        "status": "<script>alert('xss3')</script>",
        "error": "<script>alert('xss4')</script>",
    }
    alerts = [{"description": "<script>alert('xss5')</script>", "type": "<script>alert('xss6')</script>"}]
    trajectories = [{"id": "<script>alert('xss7')</script>"}]
    consistency_issues = [{"issue": "<script>alert('xss8')</script>", "frame": "<script>alert('xss9')</script>"}]

    out = generate_html_report("job123", res, alerts=alerts, trajectories=trajectories, consistency_issues=consistency_issues)

    for i in range(1, 10):
        assert f"<script>alert('xss{i}')</script>" not in out
