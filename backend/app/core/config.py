from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    PROJECT_NAME: str = 'Skill Chatbot API'
    API_V1_PREFIX: str = '/api/v1'
    ENV: str = 'development'
    DEBUG: bool = False

    DB_URL: str = 'sqlite:///./app.db'
    LOG_LEVEL: str = 'INFO'
    CORS_ORIGINS: list[str] = ['*']

    SECRET_KEY: str = 'change-me'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    SKILL_CONTENT_MAX_LEN: int = 20000
    OPENAI_API_KEY: str = ''
    OPENAI_BASE_URL: str = 'https://api.openai.com/v1'

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, value):  # type: ignore[override]
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value == '*':
                return ['*']
            return [item.strip() for item in value.split(',') if item.strip()]
        return value


settings = Settings()
