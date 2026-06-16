from pathlib import Path


def test_template_directory_exists():
    template_dir = Path("app/templates/notifications")
    assert template_dir.is_dir()


def test_template_files_exist():
    template_dir = Path("app/templates/notifications")
    expected_templates = [
        "goal_alert.j2",
        "result_summary.j2",
        "match_reminder_1h.j2",
        "match_reminder_15m.j2",
    ]
    for t in expected_templates:
        assert (template_dir / t).is_file(), f"Missing template: {t}"


def test_template_engine_import():
    from app.services.notification_templates import env
    assert env is not None


def test_template_rendering_goal_alert():
    from app.services.notification_templates import _render
    result = _render("goal_alert.j2", {
        "team_name": "Argentina",
        "opponent_name": "Spain",
        "minute": 72,
        "home_score": 1,
        "away_score": 0,
        "group": "C",
        "standing_position": None,
        "standing_points": None,
    })
    assert "GOAL" in result["title"]
    assert "Argentina" in result["title"]
    assert "Spain" in result["title"]
    assert result["body"]


def test_template_rendering_result_summary():
    from app.services.notification_templates import _render
    result = _render("result_summary.j2", {
        "home_team_name": "Argentina",
        "away_team_name": "Spain",
        "home_score": 2,
        "away_score": 1,
        "group": "C",
        "winner": "Argentina",
        "home_standing_position": 1,
        "home_standing_points": 6,
        "home_form": ["W", "W"],
    })
    assert "Full Time" in result["title"]
    assert "Argentina" in result["title"]
    assert result["body"]


def test_template_rendering_reminder_1h():
    from app.services.notification_templates import _render
    result = _render("match_reminder_1h.j2", {
        "team_name": "Argentina",
        "opponent_name": "Spain",
        "group": "C",
        "reminder_offset": "1h",
        "kickoff_local": "8:00 PM",
        "standing_position": 1,
        "standing_points": 6,
    })
    assert "1 hour" in result["title"]
    assert result["body"]


def test_template_rendering_reminder_15m():
    from app.services.notification_templates import _render
    result = _render("match_reminder_15m.j2", {
        "team_name": "Argentina",
        "opponent_name": "Spain",
        "group": "C",
        "reminder_offset": "15m",
        "kickoff_local": "8:00 PM",
        "standing_position": None,
        "standing_points": None,
    })
    assert "15 minutes" in result["title"]
    assert result["body"]
