from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    project_name: str = 'Feedback Service'
    environment: str = 'development'
    mongo_uri: str = Field(default='mongodb://localhost:27017')
    mongo_db_name: str = Field(default='government_monitoring')
    jwt_secret_key: str = Field(default='change-me')
    jwt_algorithm: str = Field(default='HS256')
    cors_origins: list[str] = Field(default_factory=lambda: ['http://localhost:5173'])


@lru_cache
def get_settings() -> Settings:
    return Settings()
