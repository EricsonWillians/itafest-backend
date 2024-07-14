from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class ReviewRating(BaseModel):
    star: int = 0
    thumbs_up: int = 0
    clapping_hands: int = 0
    money_bag: int = 0
    trophy: int = 0
    music: int = 0
    beer_mug: int = 0
    party_popper: int = 0
    dancing: int = 0
    fire: int = 0

    class Config:
        schema_extra = {
            "example": {
                "star": 5,
                "thumbs_up": 4,
                "clapping_hands": 3,
                "money_bag": 2,
                "trophy": 1,
                "music": 5,
                "beer_mug": 4,
                "party_popper": 3,
                "dancing": 2,
                "fire": 1
            }
        }

class Review(Document):
    id: PydanticObjectId = Field(default_factory=PydanticObjectId, alias="_id")
    user_id: str = Field(..., description="The unique identifier for the user who wrote the review")
    target_id: str = Field(..., description="The unique identifier for the target of the review (event or business)")
    target_type: Literal["business", "event"] = Field(..., description="The type of the review target (business or event)")
    rating: ReviewRating = Field(..., description="Emoji ratings for the review")
    comment: Optional[str] = Field(None, description="Comment left by the reviewer")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Review creation date")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Review last update date")

    class Settings:
        collection = "reviews"

    class Config:
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "user_id": "60f5a3d9e13f1b13e1234567",
                "target_id": "60f5a3d9e13f1b13e1234568",
                "target_type": "event",
                "rating": {
                    "star": 5,
                    "thumbs_up": 4,
                    "clapping_hands": 3,
                    "money_bag": 2,
                    "trophy": 1,
                    "music": 5,
                    "beer_mug": 4,
                    "party_popper": 3,
                    "dancing": 2,
                    "fire": 1
                },
                "comment": "Great event with excellent organization and value for money.",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }

class ReviewCreate(BaseModel):
    user_id: str
    target_id: str
    target_type: Literal["business", "event"]
    rating: ReviewRating
    comment: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "user_id": "60f5a3d9e13f1b13e1234567",
                "target_id": "60f5a3d9e13f1b13e1234568",
                "target_type": "event",
                "rating": {
                    "star": 5,
                    "thumbs_up": 4,
                    "clapping_hands": 3,
                    "money_bag": 2,
                    "trophy": 1,
                    "music": 5,
                    "beer_mug": 4,
                    "party_popper": 3,
                    "dancing": 2,
                    "fire": 1
                },
                "comment": "Great event with excellent organization and value for money."
            }
        }

class ReviewUpdate(BaseModel):
    rating: Optional[ReviewRating] = None
    comment: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "rating": {
                    "star": 4,
                    "thumbs_up": 3,
                    "clapping_hands": 2,
                    "money_bag": 1,
                    "trophy": 0,
                    "music": 4,
                    "beer_mug": 3,
                    "party_popper": 2,
                    "dancing": 1,
                    "fire": 0
                },
                "comment": "Good event, but could improve on punctuality."
            }
        }

class ReviewOut(BaseModel):
    id: PydanticObjectId
    user_id: str
    target_id: str
    target_type: Literal["business", "event"]
    rating: ReviewRating
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        schema_extra = {
            "example": {
                "id": "60f5a3d9e13f1b13e1234569",
                "user_id": "60f5a3d9e13f1b13e1234567",
                "target_id": "60f5a3d9e13f1b13e1234568",
                "target_type": "event",
                "rating": {
                    "star": 5,
                    "thumbs_up": 4,
                    "clapping_hands": 3,
                    "money_bag": 2,
                    "trophy": 1,
                    "music": 5,
                    "beer_mug": 4,
                    "party_popper": 3,
                    "dancing": 2,
                    "fire": 1
                },
                "comment": "Great event with excellent organization and value for money.",
                "created_at": "2023-06-01T00:00:00Z",
                "updated_at": "2023-06-01T00:00:00Z"
            }
        }
