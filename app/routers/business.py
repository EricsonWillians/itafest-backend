from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import PydanticObjectId
from app.models.business import BusinessCreate, BusinessUpdate, BusinessOut, BusinessCategory
from app.services.business import (
    create_business,
    get_business,
    update_business,
    delete_business,
    list_businesses,
    list_businesses_by_category,
    list_active_businesses
)

router = APIRouter()

@router.post("/", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
async def create_new_business(business_in: BusinessCreate):
    return await create_business(business_in)

@router.get("/{business_id}", response_model=BusinessOut)
async def read_business(business_id: PydanticObjectId):
    business = await get_business(business_id)
    if not business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return business

@router.put("/{business_id}", response_model=BusinessOut)
async def update_existing_business(business_id: PydanticObjectId, business_in: BusinessUpdate):
    updated_business = await update_business(business_id, business_in)
    if not updated_business:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return updated_business

@router.delete("/{business_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_business(business_id: PydanticObjectId):
    success = await delete_business(business_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Business not found")
    return

@router.get("/", response_model=List[BusinessOut])
async def read_all_businesses(skip: int = 0, limit: int = 10):
    return await list_businesses(skip, limit)

@router.get("/category/{category}", response_model=List[BusinessOut])
async def read_businesses_by_category(category: BusinessCategory, skip: int = 0, limit: int = 10):
    return await list_businesses_by_category(category, skip, limit)

@router.get("/active", response_model=List[BusinessOut])
async def read_active_businesses(skip: int = 0, limit: int = 10):
    return await list_active_businesses(skip, limit)
