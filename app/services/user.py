from app.models.user import User, UserCreate, UserUpdate, UserOut
from beanie import PydanticObjectId
from typing import List, Optional
from fastapi import HTTPException, status
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_user_by_id(user_id: PydanticObjectId) -> Optional[User]:
    user = await User.get(user_id)
    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

async def get_user_by_email(email: str) -> Optional[User]:
    user = await User.find_one(User.email == email)
    if user:
        return user
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

async def create_user(user_in: UserCreate) -> UserOut:
    user = await User.find_one(User.email == user_in.email)
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = pwd_context.hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=user_in.role
    )
    await new_user.insert()
    return UserOut(
        id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        role=new_user.role,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )

async def update_user(user_id: PydanticObjectId, user_in: UserUpdate) -> UserOut:
    user = await get_user_by_id(user_id)
    
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role

    user.updated_at = datetime.utcnow()
    await user.save()
    
    return UserOut(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

async def delete_user(user_id: PydanticObjectId) -> None:
    user = await get_user_by_id(user_id)
    await user.delete()

async def get_all_users() -> List[UserOut]:
    users = await User.find_all().to_list()
    return [
        UserOut(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        ) for user in users
    ]
