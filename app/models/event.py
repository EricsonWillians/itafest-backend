from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, validator
from enum import Enum
from datetime import datetime
from typing import List, Optional

class EventCategory(str, Enum):
    MUSIC = "music"
    FOOD = "food"
    SPORTS = "sports"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    TECHNOLOGY = "technology"
    OTHER = "other"

class EventStatus(str, Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Event(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    title: str = Field(...)
    description: str = Field(...)
    date: datetime = Field(...)
    end_date: Optional[datetime] = Field(None)
    location: str = Field(...)
    categories: List[EventCategory] = Field(default_factory=list)
    status: EventStatus = Field(default=EventStatus.UPCOMING)
    organizer_id: PydanticObjectId = Field(...)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "events"

    @validator('end_date')
    def validate_end_date(cls, end_date, values):
        if end_date and 'date' in values and end_date < values['date']:
            raise ValueError('End date must be after start date')
        return end_date

class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    end_date: Optional[datetime] = None
    location: str
    categories: List[EventCategory] = []
    status: EventStatus = EventStatus.UPCOMING
    organizer_id: PydanticObjectId

    @validator('end_date')
    def validate_end_date(cls, end_date, values):
        if end_date and 'date' in values and end_date < values['date']:
            raise ValueError('End date must be after start date')
        return end_date

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    categories: Optional[List[EventCategory]] = None
    status: Optional[EventStatus] = None

    @validator('end_date')
    def validate_end_date(cls, end_date, values):
        if end_date and 'date' in values and end_date < values['date']:
            raise ValueError('End date must be after start date')
        return end_date

class EventOut(BaseModel):
    id: PydanticObjectId
    title: str
    description: str
    date: datetime
    end_date: Optional[datetime] = None
    location: str
    categories: List[EventCategory]
    status: EventStatus
    organizer_id: PydanticObjectId
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        allow_population_by_field_name = True
