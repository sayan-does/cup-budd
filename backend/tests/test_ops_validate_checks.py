import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select

from app.db.models import Fixture, Team


@pytest.mark.asyncio
async def test_ops_validate_warns_and_fails(async_session, capsys):
    # Seed with <48 fixtures to trigger FAIL
    t = Team(external_id="TT", name="Tn", code="TT", group="A")
    async_session.add(t)
    await async_session.flush()

    # no fixtures => should cause FAIL for teams with 0 fixtures
    await async_session.commit()

    import importlib.util
    import os

    script_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "ops_fixture_sync_validate.py")
    script_path = os.path.normpath(script_path)
    spec = importlib.util.spec_from_file_location("ops_validate", script_path)
    ops_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ops_mod)

    # Ensure the application's DB schema is initialized for the app-level engine
    from app.db.session import init_db
    await init_db()

    # Patch run_fixture_sync to be a no-op and zafronix_client.close
    ops_mod.run_fixture_sync = AsyncMock()
    ops_mod.zafronix_client.close = AsyncMock()

    rc = await ops_mod.main()
    # main returns 1 on FAIL
    assert rc == 1
