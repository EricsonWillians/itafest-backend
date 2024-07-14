from pydantic import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Itafest"
    admin_email: str = "admin@itafest.com"
    database_url: str = "sqlite://./test.db"

    class Config:
        env_file = ".env"

settings = Settings()
