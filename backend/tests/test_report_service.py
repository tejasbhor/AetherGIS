from datetime import datetime
from backend.app.services.report_service import generate_html_report

def test_generate_html_report_escapes_xss():
    """Verify that potentially malicious input is properly escaped in HTML report generation."""

    malicious_payload = "<script>alert('XSS')</script>"

    pipeline_result = {
        "metrics": {"total_frames": 1, "observed_frames": 1, "interpolated_frames": 0},
        "frames": [{"model_used": "Test", "confidence_class": "high", "gap_category": "none"}],
        "layer_id": malicious_payload,
        "data_source": malicious_payload,
        "status": malicious_payload,
        "error": malicious_payload,
    }

    alerts = [
        {
            "frame_index": 1,
            "type": malicious_payload,
            "severity": "high",
            "description": malicious_payload
        }
    ]

    consistency_issues = [
        {
            "frame": 1,
            "issue": malicious_payload,
            "severity": "medium",
            "mad_score": 10.0
        }
    ]

    trajectories = [
        {
            "id": malicious_payload,
            "speed": 10.0,
            "direction_deg": 90.0,
            "intensity": 5.0
        }
    ]

    html = generate_html_report(
        job_id=malicious_payload,
        pipeline_result=pipeline_result,
        trajectories=trajectories,
        alerts=alerts,
        consistency_issues=consistency_issues
    )

    assert "<script>" not in html
    assert "&lt;script&gt;alert(&#x27;XSS&#x27;)&lt;/script&gt;" in html
