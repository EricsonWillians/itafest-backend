from app.models.message import Message, MessageCreate, MessageUpdate, MessageOut, EmojiReaction, Reaction
from beanie import PydanticObjectId
from typing import List, Optional
from fastapi import HTTPException, status

async def get_message_by_id(message_id: PydanticObjectId) -> Optional[Message]:
    message = await Message.get(message_id)
    if message:
        return message
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

async def create_message(message_in: MessageCreate) -> MessageOut:
    new_message = Message(
        sender_id=message_in.sender_id,
        receiver_id=message_in.receiver_id,
        message_type=message_in.message_type,
        content=message_in.content
    )
    await new_message.insert()
    return MessageOut(
        id=new_message.id,
        sender_id=new_message.sender_id,
        receiver_id=new_message.receiver_id,
        message_type=new_message.message_type,
        content=new_message.content,
        sent_at=new_message.sent_at,
        read=new_message.read,
        reactions=new_message.reactions,
        created_at=new_message.created_at,
        updated_at=new_message.updated_at
    )

async def update_message(message_id: PydanticObjectId, message_in: MessageUpdate) -> MessageOut:
    message = await get_message_by_id(message_id)
    
    if message_in.content is not None:
        message.content = message_in.content
    if message_in.read is not None:
        message.read = message_in.read
    if message_in.reactions is not None:
        message.reactions = message_in.reactions

    message.updated_at = datetime.utcnow()
    await message.save()
    
    return MessageOut(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        message_type=message.message_type,
        content=message.content,
        sent_at=message.sent_at,
        read=message.read,
        reactions=message.reactions,
        created_at=message.created_at,
        updated_at=message.updated_at
    )

async def delete_message(message_id: PydanticObjectId) -> None:
    message = await get_message_by_id(message_id)
    await message.delete()

async def get_all_messages() -> List[MessageOut]:
    messages = await Message.find_all().to_list()
    return [
        MessageOut(
            id=message.id,
            sender_id=message.sender_id,
            receiver_id=message.receiver_id,
            message_type=message.message_type,
            content=message.content,
            sent_at=message.sent_at,
            read=message.read,
            reactions=message.reactions,
            created_at=message.created_at,
            updated_at=message.updated_at
        ) for message in messages
    ]

async def add_reaction_to_message(message_id: PydanticObjectId, reaction: Reaction) -> MessageOut:
    message = await get_message_by_id(message_id)
    message.reactions.append(reaction)
    message.updated_at = datetime.utcnow()
    await message.save()
    
    return MessageOut(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        message_type=message.message_type,
        content=message.content,
        sent_at=message.sent_at,
        read=message.read,
        reactions=message.reactions,
        created_at=message.created_at,
        updated_at=message.updated_at
    )

async def remove_reaction_from_message(message_id: PydanticObjectId, user_id: PydanticObjectId, emoji: EmojiReaction) -> MessageOut:
    message = await get_message_by_id(message_id)
    message.reactions = [r for r in message.reactions if not (r.user_id == user_id and r.emoji == emoji)]
    message.updated_at = datetime.utcnow()
    await message.save()
    
    return MessageOut(
        id=message.id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        message_type=message.message_type,
        content=message.content,
        sent_at=message.sent_at,
        read=message.read,
        reactions=message.reactions,
        created_at=message.created_at,
        updated_at=message.updated_at
    )

async def get_messages_for_user(user_id: PydanticObjectId) -> List[MessageOut]:
    messages = await Message.find_many({"receiver_id": user_id}).to_list()
    return [
        MessageOut(
            id=message.id,
            sender_id=message.sender_id,
            receiver_id=message.receiver_id,
            message_type=message.message_type,
            content=message.content,
            sent_at=message.sent_at,
            read=message.read,
            reactions=message.reactions,
            created_at=message.created_at,
            updated_at=message.updated_at
        ) for message in messages
    ]
