from app.models.review import Review, ReviewCreate, ReviewUpdate, ReviewOut
from beanie import PydanticObjectId
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException, status

async def get_review_by_id(review_id: PydanticObjectId) -> Optional[ReviewOut]:
    review = await Review.get(review_id)
    if review:
        return ReviewOut(
            id=review.id,
            user_id=review.user_id,
            target_id=review.target_id,
            target_type=review.target_type,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")


async def get_reviews_by_target_id(target_id: str, target_type: str) -> List[ReviewOut]:
    reviews = await Review.find(Review.target_id == target_id, Review.target_type == target_type).to_list()
    return [
        ReviewOut(
            id=review.id,
            user_id=review.user_id,
            target_id=review.target_id,
            target_type=review.target_type,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            updated_at=review.updated_at
        ) for review in reviews
    ]


async def create_review(review_in: ReviewCreate) -> ReviewOut:
    review = Review(
        user_id=review_in.user_id,
        target_id=review_in.target_id,
        target_type=review_in.target_type,
        rating=review_in.rating,
        comment=review_in.comment
    )
    await review.insert()
    return ReviewOut(
        id=review.id,
        user_id=review.user_id,
        target_id=review.target_id,
        target_type=review.target_type,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at
    )


async def update_review(review_id: PydanticObjectId, review_in: ReviewUpdate) -> ReviewOut:
    review = await get_review_by_id(review_id)
    
    if review_in.rating:
        review.rating = review_in.rating
    if review_in.comment:
        review.comment = review_in.comment

    review.updated_at = datetime.utcnow()
    await review.save()
    
    return ReviewOut(
        id=review.id,
        user_id=review.user_id,
        target_id=review.target_id,
        target_type=review.target_type,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        updated_at=review.updated_at
    )


async def delete_review(review_id: PydanticObjectId) -> None:
    review = await get_review_by_id(review_id)
    await review.delete()
