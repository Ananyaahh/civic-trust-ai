import os
from pathlib import Path

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        GEMINI_API_KEY: str = ""
        APP_NAME: str = "Civic Trust AI"
        DEBUG: bool = True
        CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

        model_config = SettingsConfigDict(env_file=".env")

except ModuleNotFoundError:
    def _load_dotenv(env_path: Path) -> None:
        if not env_path.exists():
            return
        for raw in env_path.read_text().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

    class Settings:
        def __init__(self) -> None:
            _load_dotenv(Path(".env"))
            self.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
            self.APP_NAME = os.getenv("APP_NAME", "Civic Trust AI")
            self.DEBUG = os.getenv("DEBUG", "true").lower() in {"1", "true", "yes", "on"}
            cors_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
            self.CORS_ORIGINS = [item.strip() for item in cors_raw.split(",") if item.strip()]

settings = Settings()
