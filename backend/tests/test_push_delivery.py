class TestPushDelivery:
    def test_module_import(self):
        from app.services import push_delivery
        assert push_delivery is not None

    def test_push_delivery_has_required_functions(self):
        from app.services.push_delivery import (
            create_and_fan_out,
            fan_out_notification,
            send_notification_to_user,
        )
        assert send_notification_to_user is not None
        assert fan_out_notification is not None
        assert create_and_fan_out is not None
