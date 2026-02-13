from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: str = "postgresql+asyncpg://ai_pulse:ai_pulse@db:5432/ai_pulse"
    redis_url: str = "redis://redis:6379/0"
    sse_channel: str = "ai_developments:new"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
