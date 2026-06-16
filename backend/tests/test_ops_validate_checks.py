import importlib.util
import os
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app import db as app_db_module
from app.db.models import Base, Team


@pytest.mark.asyncio
async def test_ops_validate_warns_and_fails():
    test_url = "sqlite+aiosqlite://"
    test_engine = create_async_engine(test_url, echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    test_session_maker = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_session_maker() as session:
        t = Team(external_id="TT", name="Tn", code="TT", group="A")
        session.add(t)
        await session.flush()
        await session.commit()

    script_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "ops_fixture_sync_validate.py")
    script_path = os.path.normpath(script_path)
    spec = importlib.util.spec_from_file_location("ops_validate", script_path)
    ops_mod = importlib.util.module_from_spec(spec)

    original_engine = app_db_module.session.engine
    original_maker = app_db_module.session.async_session_maker
    app_db_module.session.engine = test_engine
    app_db_module.session.async_session_maker = test_session_maker

    try:
        spec.loader.exec_module(ops_mod)
        ops_mod.run_fixture_sync = AsyncMock()
        ops_mod.zafronix_client.close = AsyncMock()
        rc = await ops_mod.main()
    finally:
        app_db_module.session.engine = original_engine
        app_db_module.session.async_session_maker = original_maker

    assert rc == 1
    await test_engine.dispose()
