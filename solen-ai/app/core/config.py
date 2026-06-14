from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "solen-ai"
    version: str = "1.0.0"
    environment: str = "development"
    port: int = 8005
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    anthropic_api_key: str

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
