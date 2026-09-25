from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, loaded from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str
    supabase_publishable_key: str

    # Jev / TypeSafe
    typesafe_api_key: str = ""
    typesafe_base_url: str = "https://api.typesafe.ai/v1/systemone"
    typesafe_default_model: str = "jev-latest"

    # Optional AI auto-draft assist
    ai_gateway_api_key: str = ""
    ai_gateway_base_url: str = "https://ai-gateway.vercel.sh/v1"
    ai_gateway_model: str = "openai/gpt-5.1"

    # CORS - comma-separated list of allowed origins (Next.js dev server, etc.)
    frontend_origin: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def frontend_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
