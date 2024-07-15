from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SocialMediaLinks(BaseModel):
    facebook: Optional[HttpUrl] = None
    twitter: Optional[HttpUrl] = None
    instagram: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None
    website: Optional[HttpUrl] = None

    class Config:
        schema_extra = {
            "example": {
                "facebook": "https://www.facebook.com/yourprofile",
                "twitter": "https://www.twitter.com/yourprofile",
                "instagram": "https://www.instagram.com/yourprofile",
                "linkedin": "https://www.linkedin.com/in/yourprofile",
                "website": "https://www.yourwebsite.com",
            }
        }


class Comment(BaseModel):
    commenter_id: str
    comment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    approved: bool = False

    class Config:
        schema_extra = {
            "example": {
                "commenter_id": "60f5a3d9e13f1b13e1234567",
                "comment": "Great person to hang out with!",
                "timestamp": "2023-06-01T00:00:00Z",
                "approved": True
            }
        }


class EmojiRating(BaseModel):
    hearts: int = 0
    thumbs_up: int = 0
    smiley_face: int = 0
    fire: int = 0
    clapping_hands: int = 0
    star: int = 0
    party_popper: int = 0
    musical_note: int = 0
    cocktail: int = 0
    sparkles: int = 0
    neutral_face: int = 0

    class Config:
        schema_extra = {
            "example": {
                "hearts": 5,
                "thumbs_up": 3,
                "smiley_face": 4,
                "fire": 2,
                "clapping_hands": 6,
                "star": 7,
                "party_popper": 1,
                "musical_note": 2,
                "cocktail": 3,
                "sparkles": 4,
                "neutral_face": 1
            }
        }


class EmojiType(str, Enum):
    HEART = "heart"
    THUMBS_UP = "thumbs_up"
    SMILEY_FACE = "smiley_face"
    FIRE = "fire"
    CLAPPING_HANDS = "clapping_hands"
    STAR = "star"
    PARTY_POPPER = "party_popper"
    MUSICAL_NOTE = "musical_note"
    COCKTAIL = "cocktail"
    SPARKLES = "sparkles"
    NEUTRAL_FACE = "neutral_face"


class UserProfile(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, description="The unique identifier for the profile")
    user_id: str = Field(..., description="The unique identifier for the user")
    bio: Optional[str] = Field(None, description="A short bio for the user")
    profile_picture: Optional[HttpUrl] = Field(None, description="URL to the user's profile picture")
    social_media_links: Optional[SocialMediaLinks] = Field(None, description="Social media links for the user")
    emoji_ratings: EmojiRating = Field(default_factory=EmojiRating, description="Emoji ratings received from other users")
    comments: List[Comment] = Field(default_factory=list, description="List of comments from other users")
    show_comments: bool = Field(default=True, description="Flag to show or hide comments on public profile")
    allow_chat: bool = Field(default=True, description="Flag to allow or disallow chat requests from other users")
    blocked_users: List[str] = Field(default_factory=list, description="List of user IDs who are blocked from sending messages")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Profile creation date")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Profile last update date")

    class Settings:
        collection = "user_profiles"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "user_id": "60f5a3d9e13f1b13e1234567",
                "bio": "Enthusiastic software developer with a passion for creating innovative solutions.",
                "profile_picture": "https://www.example.com/profile.jpg",
                "social_media_links": {
                    "facebook": "https://www.facebook.com/yourprofile",
                    "twitter": "https://www.twitter.com/yourprofile",
                    "instagram": "https://www.instagram.com/yourprofile",
                    "linkedin": "https://www.linkedin.com/in/yourprofile",
                    "website": "https://www.yourwebsite.com",
                },
                "emoji_ratings": {
                    "hearts": 5,
                    "thumbs_up": 3,
                    "smiley_face": 4,
                    "fire": 2,
                    "clapping_hands": 6,
                    "star": 7,
                    "party_popper": 1,
                    "musical_note": 2,
                    "cocktail": 3,
                    "sparkles": 4,
                    "neutral_face": 1
                },
                "comments": [
                    {
                        "commenter_id": "60f5a3d9e13f1b13e1234567",
                        "comment": "Great person to hang out with!",
                        "timestamp": "2023-06-01T00:00:00Z",
                        "approved": True
                    }
                ],
                "show_comments": True,
                "allow_chat": True,
                "blocked_users": ["60f5a3d9e13f1b13e1234568"],
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }


class UserProfileCreate(BaseModel):
    user_id: str
    bio: Optional[str] = None
    profile_picture: Optional[HttpUrl] = None
    social_media_links: Optional[SocialMediaLinks] = None
    show_comments: bool = True
    allow_chat: bool = True
    blocked_users: List[str] = []

    class Config:
        schema_extra = {
            "example": {
                "user_id": "60f5a3d9e13f1b13e1234567",
                "bio": "Enthusiastic software developer with a passion for creating innovative solutions.",
                "profile_picture": "https://www.example.com/profile.jpg",
                "social_media_links": {
                    "facebook": "https://www.facebook.com/yourprofile",
                    "twitter": "https://www.twitter.com/yourprofile",
                    "instagram": "https://www.instagram.com/yourprofile",
                    "linkedin": "https://www.linkedin.com/in/yourprofile",
                    "website": "https://www.yourwebsite.com",
                },
                "show_comments": True,
                "allow_chat": True,
                "blocked_users": []
            }
        }


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    profile_picture: Optional[HttpUrl] = None
    social_media_links: Optional[SocialMediaLinks] = None
    show_comments: Optional[bool] = None
    allow_chat: Optional[bool] = None
    blocked_users: Optional[List[str]] = None

    class Config:
        schema_extra = {
            "example": {
                "bio": "Experienced event organizer with a love for community engagement.",
                "profile_picture": "https://www.example.com/newprofile.jpg",
                "social_media_links": {
                    "facebook": "https://www.facebook.com/yournewprofile",
                    "twitter": "https://www.twitter.com/yournewprofile",
                    "instagram": "https://www.instagram.com/yournewprofile",
                    "linkedin": "https://www.linkedin.com/in/yournewprofile",
                    "website": "https://www.yournewwebsite.com",
                },
                "show_comments": False,
                "allow_chat": False,
                "blocked_users": ["60f5a3d9e13f1b13e1234568"]
            }
        }


class UserProfileOut(BaseModel):
    id: str
    user_id: str
    bio: Optional[str]
    profile_picture: Optional[HttpUrl]
    social_media_links: Optional[SocialMediaLinks]
    emoji_ratings: EmojiRating
    comments: List[Comment]
    show_comments: bool
    allow_chat: bool
    blocked_users: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234567",
                "user_id": "60f5a3d9e13f1b13e1234567",
                "bio": "Enthusiastic software developer with a passion for creating innovative solutions.",
                "profile_picture": "https://www.example.com/profile.jpg",
                "social_media_links": {
                    "facebook": "https://www.facebook.com/yourprofile",
                    "twitter": "https://www.twitter.com/yourprofile",
                    "instagram": "https://www.instagram.com/yourprofile",
                    "linkedin": "https://www.linkedin.com/in/yourprofile",
                    "website": "https://www.yourwebsite.com",
                },
                "emoji_ratings": {
                    "hearts": 5,
                    "thumbs_up": 3,
                    "smiley_face": 4,
                    "fire": 2,
                    "clapping_hands": 6,
                    "star": 7,
                    "party_popper": 1,
                    "musical_note": 2,
                    "cocktail": 3,
                    "sparkles": 4,
                    "neutral_face": 1
                },
                "comments": [
                    {
                        "commenter_id": "60f5a3d9e13f1b13e1234567",
                        "comment": "Great person to hang out with!",
                        "timestamp": "2023-06-01T00:00:00Z",
                        "approved": True
                    }
                ],
                "show_comments": True,
                "allow_chat": True,
                "blocked_users": ["60f5a3d9e13f1b13e1234568"],
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
