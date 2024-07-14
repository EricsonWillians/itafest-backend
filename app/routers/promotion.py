from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from typing import List
from app.models.promotion import PromotionCreate, PromotionUpdate, PromotionOut, PromotionCategory
from app.services.promotion import (
    create_promotion,
    get_promotion,
    update_promotion,
    delete_promotion,
    list_promotions,
    list_promotions_by_category,
    list_active_promotions
)

router = APIRouter()

@router.post("/", response_model=PromotionOut, status_code=status.HTTP_201_CREATED)
async def create_new_promotion(promotion_in: PromotionCreate):
    return await create_promotion(promotion_in)

@router.get("/{promotion_id}", response_model=PromotionOut)
async def read_promotion(promotion_id: PydanticObjectId):
    promotion = await get_promotion(promotion_id)
    if not promotion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return promotion

@router.put("/{promotion_id}", response_model=PromotionOut)
async def update_existing_promotion(promotion_id: PydanticObjectId, promotion_in: PromotionUpdate):
    updated_promotion = await update_promotion(promotion_id, promotion_in)
    if not updated_promotion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return updated_promotion

@router.delete("/{promotion_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_promotion(promotion_id: PydanticObjectId):
    success = await delete_promotion(promotion_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    return

@router.get("/", response_model=List[PromotionOut])
async def read_all_promotions(skip: int = 0, limit: int = 10):
    return await list_promotions(skip, limit)

@router.get("/category/{category}", response_model=List[PromotionOut])
async def read_promotions_by_category(category: PromotionCategory, skip: int = 0, limit: int = 10):
    return await list_promotions_by_category(category, skip, limit)

@router.get("/active/", response_model=List[PromotionOut])
async def read_active_promotions(skip: int = 0, limit: int = 10):
    return await list_active_promotions(skip, limit)
