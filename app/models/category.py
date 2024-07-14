from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class CategoryType(str, Enum):
    EVENT = "event"
    PROMOTION = "promotion"
    BUSINESS = "business"
    OTHER = "other"

class Category(Document):
    name: str = Field(...)
    description: Optional[str] = Field(None)
    type: CategoryType = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "categories"

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str]
    type: CategoryType

class CategoryUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    type: Optional[CategoryType]

class CategoryOut(CategoryCreate):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
