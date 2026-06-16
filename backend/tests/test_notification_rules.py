class TestNotificationRules:
    def test_module_import(self):
        from app.services import notification_rules
        assert notification_rules is not None

    def test_event_type_map(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        assert "goal" in EVENT_TYPE_MAP
        assert "own_goal" in EVENT_TYPE_MAP
        assert "match_finished" in EVENT_TYPE_MAP
        assert "match_reminder" in EVENT_TYPE_MAP

    def test_event_type_goal_maps_to_goal_alert(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        notification_type, preference_field = EVENT_TYPE_MAP["goal"]
        assert notification_type == "goal_alert"
        assert preference_field == "goal_alerts"

    def test_event_type_own_goal_maps_to_goal_alert(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        notification_type, preference_field = EVENT_TYPE_MAP["own_goal"]
        assert notification_type == "goal_alert"
        assert preference_field == "goal_alerts"

    def test_event_type_match_finished_maps_to_result_summary(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        notification_type, preference_field = EVENT_TYPE_MAP["match_finished"]
        assert notification_type == "result_summary"
        assert preference_field == "result_summaries"

    def test_event_type_match_reminder_maps_to_match_reminder(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        notification_type, preference_field = EVENT_TYPE_MAP["match_reminder"]
        assert notification_type == "match_reminder"
        assert preference_field == "match_reminders"

    def test_unknown_event_type(self):
        from app.services.notification_rules import EVENT_TYPE_MAP
        assert "red_card" not in EVENT_TYPE_MAP
