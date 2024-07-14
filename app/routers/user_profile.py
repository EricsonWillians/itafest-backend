from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pydantic import PydanticObjectId
from app.models.user_profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileOut,
    Comment,
    EmojiType
)
from app.services.user_profile import (
    get_user_profile_by_id,
    get_user_profiles,
    create_user_profile,
    update_user_profile,
    delete_user_profile,
    add_comment_to_profile,
    add_emoji_rating_to_profile,
    block_user,
    unblock_user
)

router = APIRouter()

@router.get("/", response_model=List[UserProfileOut])
async def read_user_profiles():
    return await get_user_profiles()

@router.get("/{profile_id}", response_model=UserProfileOut)
async def read_user_profile(profile_id: PydanticObjectId):
    return await get_user_profile_by_id(profile_id)

@router.post("/", response_model=UserProfileOut, status_code=status.HTTP_201_CREATED)
async def create_new_user_profile(profile_in: UserProfileCreate):
    return await create_user_profile(profile_in)

@router.put("/{profile_id}", response_model=UserProfileOut)
async def update_existing_user_profile(profile_id: PydanticObjectId, profile_in: UserProfileUpdate):
    return await update_user_profile(profile_id, profile_in)

@router.delete("/{profile_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_user_profile(profile_id: PydanticObjectId):
    await delete_user_profile(profile_id)

@router.post("/{profile_id}/comments", response_model=UserProfileOut)
async def add_comment(profile_id: PydanticObjectId, comment: Comment):
    return await add_comment_to_profile(profile_id, comment)

@router.post("/{profile_id}/emoji", response_model=UserProfileOut)
async def add_emoji(profile_id: PydanticObjectId, emoji: EmojiType):
    return await add_emoji_rating_to_profile(profile_id, emoji)

@router.post("/{profile_id}/block", response_model=UserProfileOut)
async def block_user_from_profile(profile_id: PydanticObjectId, user_to_block_id: str):
    return await block_user(profile_id, user_to_block_id)

@router.post("/{profile_id}/unblock", response_model=UserProfileOut)
async def unblock_user_from_profile(profile_id: PydanticObjectId, user_to_unblock_id: str):
    return await unblock_user(profile_id, user_to_unblock_id)
