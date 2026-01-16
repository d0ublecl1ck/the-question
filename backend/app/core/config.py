from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  model_config = SettingsConfigDict(env_file='.env', extra='ignore')

  PROJECT_NAME: str = 'Skill Chatbot API'
  API_V1_PREFIX: str = '/api/v1'
  DB_URL: str = 'sqlite:///./app.db'

  SECRET_KEY: str = 'change-me'
  ALGORITHM: str = 'HS256'
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
  REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7


settings = Settings()
