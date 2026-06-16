def test_settings_import():
    from app.config import settings
    assert settings is not None


def test_settings_from_env():
    from app.config import Settings
    s = Settings(
        APP_ENV="test",
        DATABASE_URL="postgresql+asyncpg://test:test@localhost:5432/test",
        REDIS_URL="redis://localhost:6379",
        ZAFRONIX_API_KEY="test_key",
    )
    assert s.app_env == "test"
    assert s.database_url == "postgresql+asyncpg://test:test@localhost:5432/test"


def test_cors_origins_list():
    from app.config import Settings
    s = Settings(
        APP_ENV="test",
        DATABASE_URL="postgresql+asyncpg://test:test@localhost:5432/test",
        REDIS_URL="redis://localhost:6379",
        ZAFRONIX_API_KEY="test_key",
        CORS_ORIGINS="http://localhost:5173,https://cup-budd.pages.dev",
    )
    origins = s.cors_origins_list
    assert origins == ["http://localhost:5173", "https://cup-budd.pages.dev"]


def test_settings_defaults():
    from app.config import Settings
    s = Settings(
        APP_ENV="development",
        DATABASE_URL="postgresql+asyncpg://test:test@localhost:5432/test",
        REDIS_URL="redis://localhost:6379",
        ZAFRONIX_API_KEY="test_key",
    )
    assert s.api_base_url == "http://localhost:8000"
    assert s.poll_interval_live_sec == 30
    assert s.poll_interval_idle_sec == 300
    assert s.fixture_sync_interval_hours == 6
    assert s.vapid_claims_email == "mailto:admin@example.com"
