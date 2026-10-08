from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings, read from environment variables or backend/.env."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    database_url: str = "sqlite:///./data/app.db"
    cors_origins: str = "http://localhost:3000"

    # Business settings
    timezone: str = "Asia/Kolkata"  # defines "today" for date validation
    currency: str = "INR"  # all money is stored as integer minor units (paise)
    service_fee_bps: int = 1200  # mock service fee in basis points (12%)

    # Create tables and load seed data at startup when the database is empty.
    seed_on_startup: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def resolved_database_url(self) -> str:
        """Resolve a relative SQLite path against backend/ so the working directory doesn't matter."""
        prefix = "sqlite:///"
        if self.database_url.startswith(prefix):
            path = Path(self.database_url.removeprefix(prefix))
            if not path.is_absolute():
                path = (BACKEND_DIR / path).resolve()
            path.parent.mkdir(parents=True, exist_ok=True)
            return f"{prefix}{path}"
        return self.database_url


settings = Settings()
