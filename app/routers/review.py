from fastapi import APIRouter, HTTPException, status
from pydantic import PydanticObjectId
from typing import List
from app.models.review import ReviewCreate, ReviewUpdate, ReviewOut
from app.services.review import (
    get_review_by_id,
    get_reviews_by_target_id,
    create_review,
    update_review,
    delete_review
)

router = APIRouter()

@router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
async def create_new_review(review_in: ReviewCreate):
    return await create_review(review_in)

@router.get("/{review_id}", response_model=ReviewOut)
async def read_review(review_id: PydanticObjectId):
    review = await get_review_by_id(review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return review

@router.put("/{review_id}", response_model=ReviewOut)
async def update_existing_review(review_id: PydanticObjectId, review_in: ReviewUpdate):
    updated_review = await update_review(review_id, review_in)
    if not updated_review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return updated_review

@router.delete("/{review_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_review(review_id: PydanticObjectId):
    success = await delete_review(review_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return

@router.get("/target/{target_id}/{target_type}", response_model=List[ReviewOut])
async def read_reviews_by_target(target_id: str, target_type: str):
    return await get_reviews_by_target_id(target_id, target_type)
