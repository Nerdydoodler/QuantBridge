import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "FinSight"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Private Financial Data Platform"

    # Server
    HOST: str = os.getenv("FINSIGHT_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("FINSIGHT_PORT", "8000"))
    DEBUG: bool = os.getenv("FINSIGHT_DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = os.getenv("FINSIGHT_DB_URL", "sqlite+aiosqlite:///./finsight.db")

    # Auth
    SECRET_KEY: str = os.getenv("FINSIGHT_SECRET_KEY", "change-this-in-production-to-a-random-secret")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("FINSIGHT_TOKEN_EXPIRE", "1440"))

    # External API Keys (optional, for enhanced data)
    ALPHA_VANTAGE_KEY: str = os.getenv("ALPHA_VANTAGE_API_KEY", "")
    FINNHUB_KEY: str = os.getenv("FINNHUB_API_KEY", "")
    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")
    FRED_API_KEY: str = os.getenv("FRED_API_KEY", "")

    # Redis (optional, for caching)
    REDIS_URL: str = os.getenv("FINSIGHT_REDIS_URL", "")

    # CORS
    ALLOWED_ORIGINS: list = os.getenv("FINSIGHT_CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")


settings = Settings()
