from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum
from beanie import Document, PydanticObjectId

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    BUSINESS_OWNER = "business_owner"
    EVENT_ORGANIZER = "event_organizer"
    MODERATOR = "moderator"

class User(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    email: EmailStr = Field(...)
    hashed_password: str = Field(...)
    full_name: str = Field(...)
    is_active: bool = Field(default=True)
    role: UserRole = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "users"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "email": "user@example.com",
                "hashed_password": "hashed_password",
                "full_name": "John Doe",
                "is_active": True,
                "role": "user",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.USER

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "password",
                "full_name": "John Doe",
                "role": "user"
            }
        }

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None

    class Config:
        schema_extra = {
            "example": {
                "full_name": "John Doe",
                "role": "admin"
            }
        }

class UserOut(BaseModel):
    id: PydanticObjectId
    email: EmailStr
    full_name: str
    is_active: bool
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "role": "user",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
