from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = Field(default="development", alias="APP_ENV")
    api_base_url: str = Field(default="http://localhost:8000", alias="API_BASE_URL")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    cors_origin_regex: str = Field(default="", alias="CORS_ORIGIN_REGEX")

    database_url: str = Field(alias="DATABASE_URL")
    database_url_test: str = Field(default="", alias="DATABASE_URL_TEST")

    redis_url: str = Field(alias="REDIS_URL")

    zafronix_api_key: str = Field(alias="ZAFRONIX_API_KEY")
    zafronix_api_base_url: str = Field(
        default="https://api.zafronix.com/fifa/worldcup/v1", alias="ZAFRONIX_API_BASE_URL"
    )
    zafronix_tournament_year: int = Field(default=2026, alias="ZAFRONIX_TOURNAMENT_YEAR")

    vapid_public_key: str = Field(default="", alias="VAPID_PUBLIC_KEY")
    vapid_private_key: str = Field(default="", alias="VAPID_PRIVATE_KEY")
    vapid_claims_email: str = Field(default="mailto:admin@example.com", alias="VAPID_CLAIMS_EMAIL")

    poll_interval_live_sec: int = Field(default=30, alias="POLL_INTERVAL_LIVE_SEC")
    poll_interval_idle_sec: int = Field(default=300, alias="POLL_INTERVAL_IDLE_SEC")
    fixture_sync_interval_hours: int = Field(default=6, alias="FIXTURE_SYNC_INTERVAL_HOURS")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cors_origin_regex_or_none(self) -> str | None:
        """Return the configured CORS origin regex or None when unset/empty.

        This is used by the application to conditionally pass allow_origin_regex
        to FastAPI's CORSMiddleware. Keeping this helper keeps template logic
        concise in main.py.
        """
        return self.cors_origin_regex.strip() or None


settings = Settings()
