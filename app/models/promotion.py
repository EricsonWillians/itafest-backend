from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

class PromotionCategory(str, Enum):
    FOOD = "food"
    RETAIL = "retail"
    SERVICES = "services"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"

class PromotionStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    UPCOMING = "upcoming"

class Promotion(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    title: str = Field(...)
    description: str = Field(...)
    discount: Decimal = Field(..., gt=0, le=100)
    start_date: datetime = Field(...)
    end_date: datetime = Field(...)
    categories: List[PromotionCategory] = Field(default_factory=list)
    status: PromotionStatus = Field(default=PromotionStatus.UPCOMING)
    business_id: PydanticObjectId = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "promotions"

class PromotionCreate(BaseModel):
    title: str
    description: str
    discount: Decimal
    start_date: datetime
    end_date: datetime
    categories: List[PromotionCategory] = []
    status: PromotionStatus = PromotionStatus.UPCOMING
    business_id: PydanticObjectId

class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    discount: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    categories: Optional[List[PromotionCategory]] = None
    status: Optional[PromotionStatus] = None

class PromotionOut(PromotionCreate):
    id: PydanticObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
