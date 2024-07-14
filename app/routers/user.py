from fastapi import APIRouter, HTTPException, Depends, status
from app.models.user import UserCreate, UserUpdate, UserOut
from app.services.user import (
    get_user_by_id,
    get_user_by_email,
    create_user,
    update_user,
    delete_user,
    get_all_users
)
from beanie import PydanticObjectId
from typing import List

router = APIRouter()

@router.get("/{user_id}", response_model=UserOut)
async def read_user(user_id: PydanticObjectId):
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.get("/email/{email}", response_model=UserOut)
async def read_user_by_email(email: str):
    user = await get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_new_user(user_in: UserCreate):
    return await create_user(user_in)

@router.put("/{user_id}", response_model=UserOut)
async def update_existing_user(user_id: PydanticObjectId, user_in: UserUpdate):
    return await update_user(user_id, user_in)

@router.delete("/{user_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_user(user_id: PydanticObjectId):
    await delete_user(user_id)
    return

@router.get("/", response_model=List[UserOut])
async def read_all_users():
    return await get_all_users()
