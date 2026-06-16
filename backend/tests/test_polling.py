class TestPolling:
    def test_module_import(self):
        from app.services import polling
        assert polling is not None

    def test_extract_group(self):
        from app.services.polling import _extract_group
        assert _extract_group("group_a") == "A"
        assert _extract_group("group_l") == "L"
        assert _extract_group("round_of_32") == ""
        assert _extract_group("final") == ""
