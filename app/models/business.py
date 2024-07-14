from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr, HttpUrl
from enum import Enum
from datetime import datetime
from typing import List, Optional

class BusinessCategory(str, Enum):
    FOOD = "food"
    RETAIL = "retail"
    SERVICES = "services"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"

class BusinessStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class Business(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    name: str = Field(...)
    description: Optional[str] = Field(None)
    email: EmailStr = Field(...)
    phone_number: Optional[str] = Field(None)
    website: Optional[HttpUrl] = Field(None)
    address: Optional[str] = Field(None)
    categories: List[BusinessCategory] = Field(default_factory=list)
    status: BusinessStatus = Field(default=BusinessStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "businesses"

class BusinessCreate(BaseModel):
    name: str
    description: Optional[str]
    email: EmailStr
    phone_number: Optional[str]
    website: Optional[HttpUrl]
    address: Optional[str]
    categories: List[BusinessCategory] = []
    status: BusinessStatus = BusinessStatus.PENDING

class BusinessUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    email: Optional[EmailStr]
    phone_number: Optional[str]
    website: Optional[HttpUrl]
    address: Optional[str]
    categories: Optional[List[BusinessCategory]]
    status: Optional[BusinessStatus]

class BusinessOut(BusinessCreate):
    id: PydanticObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
