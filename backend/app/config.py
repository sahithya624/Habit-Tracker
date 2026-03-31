from functools import lru_cache

from dotenv import load_dotenv
from pydantic.v1 import BaseSettings, Field

load_dotenv()


class Settings(BaseSettings):
    supabase_url: str = Field(alias="SUPABASE_URL")
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_KEY")
    supabase_anon_key: str = Field(alias="SUPABASE_ANON_KEY")
    groq_api_key: str = Field(alias="GROQ_API_KEY")
    jwt_secret: str = Field(alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=10080, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    frontend_url: str = Field(default="http://localhost:5173", alias="FRONTEND_URL")

    class Config:
        case_sensitive = False
        env_file = ".env"
        env_file_encoding = "utf-8"
        allow_population_by_field_name = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
