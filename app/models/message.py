from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MessageType(str, Enum):
    USER_TO_USER = "user_to_user"
    USER_TO_BUSINESS = "user_to_business"
    BUSINESS_TO_USER = "business_to_user"

class EmojiReaction(str, Enum):
    HEART = "❤️"
    THUMBS_UP = "👍"
    SMILEY_FACE = "😊"
    FIRE = "🔥"
    CLAPPING_HANDS = "👏"
    STAR = "⭐"
    PARTY_POPPER = "🎉"
    MUSICAL_NOTE = "🎵"
    TROPICAL_DRINK = "🍹"
    NEUTRAL_FACE = "😐"

class Reaction(BaseModel):
    emoji: EmojiReaction = Field(..., description="Emoji reaction")
    user_id: PydanticObjectId = Field(..., description="ID of the user who reacted")

    class Config:
        schema_extra = {
            "example": {
                "emoji": "❤️",
                "user_id": "60f5a3d9e13f1b13e1234567"
            }
        }

class Message(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    sender_id: PydanticObjectId = Field(..., description="ID of the sender (user or business)")
    receiver_id: PydanticObjectId = Field(..., description="ID of the receiver (user or business)")
    message_type: MessageType = Field(..., description="Type of message")
    content: str = Field(..., description="Content of the message")
    sent_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the message was sent")
    read: bool = Field(default=False, description="Indicates if the message has been read")
    reactions: List[Reaction] = Field(default_factory=list, description="List of emoji reactions to the message")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Message creation date")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Message last update date")

    class Settings:
        collection = "messages"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "sender_id": "60f5a3d9e13f1b13e1234567",
                "receiver_id": "60f5a3d9e13f1b13e1234568",
                "message_type": "user_to_user",
                "content": "Hey, are you going to the event this weekend?",
                "sent_at": "2023-06-01T00:00:00Z",
                "read": False,
                "reactions": [
                    {
                        "emoji": "❤️",
                        "user_id": "60f5a3d9e13f1b13e1234569"
                    },
                    {
                        "emoji": "👍",
                        "user_id": "60f5a3d9e13f1b13e1234570"
                    }
                ],
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }

class MessageCreate(BaseModel):
    sender_id: PydanticObjectId
    receiver_id: PydanticObjectId
    message_type: MessageType
    content: str

    class Config:
        schema_extra = {
            "example": {
                "sender_id": "60f5a3d9e13f1b13e1234567",
                "receiver_id": "60f5a3d9e13f1b13e1234568",
                "message_type": "user_to_user",
                "content": "Hey, are you going to the event this weekend?"
            }
        }

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    read: Optional[bool] = None
    reactions: Optional[List[Reaction]] = None

    class Config:
        schema_extra = {
            "example": {
                "content": "Hey, are you going to the updated event this weekend?",
                "read": True,
                "reactions": [
                    {
                        "emoji": "❤️",
                        "user_id": "60f5a3d9e13f1b13e1234569"
                    },
                    {
                        "emoji": "👍",
                        "user_id": "60f5a3d9e13f1b13e1234570"
                    }
                ]
            }
        }

class MessageOut(BaseModel):
    id: PydanticObjectId
    sender_id: PydanticObjectId
    receiver_id: PydanticObjectId
    message_type: MessageType
    content: str
    sent_at: datetime
    read: bool
    reactions: List[Reaction]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "sender_id": "60f5a3d9e13f1b13e1234567",
                "receiver_id": "60f5a3d9e13f1b13e1234568",
                "message_type": "user_to_user",
                "content": "Hey, are you going to the event this weekend?",
                "sent_at": "2023-06-01T00:00:00Z",
                "read": False,
                "reactions": [
                    {
                        "emoji": "❤️",
                        "user_id": "60f5a3d9e13f1b13e1234569"
                    },
                    {
                        "emoji": "👍",
                        "user_id": "60f5a3d9e13f1b13e1234570"
                    }
                ],
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
