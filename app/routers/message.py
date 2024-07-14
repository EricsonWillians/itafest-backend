from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import PydanticObjectId
from app.models.message import MessageCreate, MessageUpdate, MessageOut, EmojiReaction, Reaction
from app.services.message import (
    create_message,
    get_message_by_id,
    update_message,
    delete_message,
    get_all_messages,
    add_reaction_to_message,
    remove_reaction_from_message,
    get_messages_for_user
)

router = APIRouter()

@router.post("/", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_new_message(message_in: MessageCreate):
    return await create_message(message_in)

@router.get("/{message_id}", response_model=MessageOut)
async def read_message(message_id: PydanticObjectId):
    message = await get_message_by_id(message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return message

@router.put("/{message_id}", response_model=MessageOut)
async def update_existing_message(message_id: PydanticObjectId, message_in: MessageUpdate):
    updated_message = await update_message(message_id, message_in)
    if not updated_message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return updated_message

@router.delete("/{message_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_message(message_id: PydanticObjectId):
    success = await delete_message(message_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return

@router.get("/", response_model=List[MessageOut])
async def read_all_messages():
    return await get_all_messages()

@router.post("/{message_id}/reactions", response_model=MessageOut)
async def add_reaction(message_id: PydanticObjectId, reaction: Reaction):
    return await add_reaction_to_message(message_id, reaction)

@router.delete("/{message_id}/reactions", response_model=MessageOut)
async def remove_reaction(message_id: PydanticObjectId, user_id: PydanticObjectId, emoji: EmojiReaction):
    return await remove_reaction_from_message(message_id, user_id, emoji)

@router.get("/user/{user_id}", response_model=List[MessageOut])
async def read_user_messages(user_id: PydanticObjectId):
    return await get_messages_for_user(user_id)
