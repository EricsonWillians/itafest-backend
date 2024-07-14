from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class NotificationType(str, Enum):
    EVENT = "event"
    PROMOTION = "promotion"
    GENERAL = "general"
    USER = "user"

class NotificationTarget(BaseModel):
    user_ids: Optional[List[str]] = Field(None, description="List of user IDs to notify")
    roles: Optional[List[str]] = Field(None, description="List of user roles to notify")
    all_users: bool = Field(False, description="Notify all users")

    class Config:
        schema_extra = {
            "example": {
                "user_ids": ["60f5a3d9e13f1b13e1234567", "60f5a3d9e13f1b13e1234568"],
                "roles": ["user", "admin"],
                "all_users": False
            }
        }

class Notification(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    title: str = Field(..., description="Title of the notification")
    message: str = Field(..., description="Content of the notification")
    type: NotificationType = Field(..., description="Type of notification")
    target: NotificationTarget = Field(..., description="Target users for the notification")
    sent_at: datetime = Field(default_factory=datetime.utcnow, description="Time when the notification was sent")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Notification creation date")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Notification last update date")

    class Settings:
        collection = "notifications"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "title": "New Event Added!",
                "message": "Check out the new event happening in Itajubá this weekend.",
                "type": "event",
                "target": {
                    "user_ids": ["60f5a3d9e13f1b13e1234567", "60f5a3d9e13f1b13e1234568"],
                    "roles": ["user", "admin"],
                    "all_users": False
                },
                "sent_at": "2023-06-01T00:00:00Z",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: NotificationType
    target: NotificationTarget

    class Config:
        schema_extra = {
            "example": {
                "title": "New Event Added!",
                "message": "Check out the new event happening in Itajubá this weekend.",
                "type": "event",
                "target": {
                    "user_ids": ["60f5a3d9e13f1b13e1234567", "60f5a3d9e13f1b13e1234568"],
                    "roles": ["user", "admin"],
                    "all_users": False
                }
            }
        }

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[NotificationType] = None
    target: Optional[NotificationTarget] = None

    class Config:
        schema_extra = {
            "example": {
                "title": "Updated Event Notification",
                "message": "Don't miss the updated event details for this weekend.",
                "type": "event",
                "target": {
                    "user_ids": ["60f5a3d9e13f1b13e1234567"],
                    "roles": ["user"],
                    "all_users": False
                }
            }
        }

class NotificationOut(BaseModel):
    id: PydanticObjectId
    title: str
    message: str
    type: NotificationType
    target: NotificationTarget
    sent_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "title": "New Event Added!",
                "message": "Check out the new event happening in Itajubá this weekend.",
                "type": "event",
                "target": {
                    "user_ids": ["60f5a3d9e13f1b13e1234567", "60f5a3d9e13f1b13e1234568"],
                    "roles": ["user", "admin"],
                    "all_users": False
                },
                "sent_at": "2023-06-01T00:00:00Z",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
