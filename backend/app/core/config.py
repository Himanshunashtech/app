from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'whatsapp-clone-api'
    env: str = Field(default='development')
    api_prefix: str = '/api/v1'

    mongodb_uri: str = Field(default='mongodb://localhost:27017')
    mongodb_name: str = Field(default='chat_app')

    redis_url: str = Field(default='redis://localhost:6379/0')
    socketio_path: str = Field(default='/socket.io')

    cors_origins: list[str] = Field(default_factory=lambda: ['*'])


@lru_cache
def get_settings() -> Settings:
    return Settings()
