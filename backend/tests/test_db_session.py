def test_db_import():
    from app.db.session import async_session_maker, engine, get_db
    assert engine is not None
    assert async_session_maker is not None
    assert get_db is not None


def test_base_import():
    from app.db.models import Base
    assert Base is not None


def test_db_session_is_async():
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.db.session import async_session_maker
    assert isinstance(async_session_maker, async_sessionmaker)
