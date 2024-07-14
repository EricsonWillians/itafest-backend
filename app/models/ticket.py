from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum


class TicketType(str, Enum):
    GENERAL_ADMISSION = "General Admission"
    VIP = "VIP"
    EARLY_BIRD = "Early Bird"
    STUDENT = "Student"
    OTHER = "Other"


class TicketStatus(str, Enum):
    AVAILABLE = "Available"
    SOLD_OUT = "Sold Out"
    RESERVED = "Reserved"
    CANCELLED = "Cancelled"


class Ticket(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    event_id: str = Field(...)
    type: TicketType = Field(...)
    price: Decimal = Field(...)
    quantity: int = Field(...)
    status: TicketStatus = Field(default=TicketStatus.AVAILABLE)
    sale_start_date: Optional[datetime] = Field(None)
    sale_end_date: Optional[datetime] = Field(None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        collection = "tickets"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "event_id": "60f5a3d9e13f1b13e1234567",
                "type": "VIP",
                "price": 150.00,
                "quantity": 100,
                "status": "Available",
                "sale_start_date": "2023-07-01T00:00:00Z",
                "sale_end_date": "2023-07-15T00:00:00Z",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }


class TicketCreate(BaseModel):
    event_id: str
    type: TicketType
    price: Decimal
    quantity: int
    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None

    class Config:
        schema_extra = {
            "example": {
                "event_id": "60f5a3d9e13f1b13e1234567",
                "type": "VIP",
                "price": 150.00,
                "quantity": 100,
                "sale_start_date": "2023-07-01T00:00:00Z",
                "sale_end_date": "2023-07-15T00:00:00Z"
            }
        }


class TicketUpdate(BaseModel):
    type: Optional[TicketType]
    price: Optional[Decimal]
    quantity: Optional[int]
    status: Optional[TicketStatus]
    sale_start_date: Optional[datetime]
    sale_end_date: Optional[datetime]

    class Config:
        schema_extra = {
            "example": {
                "type": "General Admission",
                "price": 100.00,
                "quantity": 200,
                "status": "Available",
                "sale_start_date": "2023-07-01T00:00:00Z",
                "sale_end_date": "2023-07-15T00:00:00Z"
            }
        }


class TicketOut(BaseModel):
    id: PydanticObjectId
    event_id: str
    type: TicketType
    price: Decimal
    quantity: int
    status: TicketStatus
    sale_start_date: Optional[datetime]
    sale_end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "event_id": "60f5a3d9e13f1b13e1234567",
                "type": "VIP",
                "price": 150.00,
                "quantity": 100,
                "status": "Available",
                "sale_start_date": "2023-07-01T00:00:00Z",
                "sale_end_date": "2023-07-15T00:00:00Z",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
}
