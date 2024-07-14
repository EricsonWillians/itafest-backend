from app.models.user_profile import (
    UserProfile,
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileOut,
    Comment,
    EmojiRating,
    EmojiType,
)
from beanie import PydanticObjectId
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime


async def get_user_profile_by_id(profile_id: PydanticObjectId) -> Optional[UserProfileOut]:
    profile = await UserProfile.get(profile_id)
    if profile:
        return UserProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            profile_picture=profile.profile_picture,
            social_media_links=profile.social_media_links,
            emoji_ratings=profile.emoji_ratings,
            comments=profile.comments,
            show_comments=profile.show_comments,
            allow_chat=profile.allow_chat,
            blocked_users=profile.blocked_users,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")


async def get_user_profiles() -> List[UserProfileOut]:
    profiles = await UserProfile.find_all().to_list()
    return [
        UserProfileOut(
            id=profile.id,
            user_id=profile.user_id,
            bio=profile.bio,
            profile_picture=profile.profile_picture,
            social_media_links=profile.social_media_links,
            emoji_ratings=profile.emoji_ratings,
            comments=profile.comments,
            show_comments=profile.show_comments,
            allow_chat=profile.allow_chat,
            blocked_users=profile.blocked_users,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
        for profile in profiles
    ]


async def create_user_profile(profile_in: UserProfileCreate) -> UserProfileOut:
    new_profile = UserProfile(
        user_id=profile_in.user_id,
        bio=profile_in.bio,
        profile_picture=profile_in.profile_picture,
        social_media_links=profile_in.social_media_links,
        emoji_ratings=EmojiRating(),
        comments=[],
        show_comments=profile_in.show_comments,
        allow_chat=profile_in.allow_chat,
        blocked_users=profile_in.blocked_users,
    )
    await new_profile.insert()
    return UserProfileOut(
        id=new_profile.id,
        user_id=new_profile.user_id,
        bio=new_profile.bio,
        profile_picture=new_profile.profile_picture,
        social_media_links=new_profile.social_media_links,
        emoji_ratings=new_profile.emoji_ratings,
        comments=new_profile.comments,
        show_comments=new_profile.show_comments,
        allow_chat=new_profile.allow_chat,
        blocked_users=new_profile.blocked_users,
        created_at=new_profile.created_at,
        updated_at=new_profile.updated_at,
    )


async def update_user_profile(profile_id: PydanticObjectId, profile_in: UserProfileUpdate) -> UserProfileOut:
    profile = await get_user_profile_by_id(profile_id)
    
    if profile_in.bio is not None:
        profile.bio = profile_in.bio
    if profile_in.profile_picture is not None:
        profile.profile_picture = profile_in.profile_picture
    if profile_in.social_media_links is not None:
        profile.social_media_links = profile_in.social_media_links
    if profile_in.show_comments is not None:
        profile.show_comments = profile_in.show_comments
    if profile_in.allow_chat is not None:
        profile.allow_chat = profile_in.allow_chat
    if profile_in.blocked_users is not None:
        profile.blocked_users = profile_in.blocked_users

    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return UserProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        social_media_links=profile.social_media_links,
        emoji_ratings=profile.emoji_ratings,
        comments=profile.comments,
        show_comments=profile.show_comments,
        allow_chat=profile.allow_chat,
        blocked_users=profile.blocked_users,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def delete_user_profile(profile_id: PydanticObjectId) -> None:
    profile = await get_user_profile_by_id(profile_id)
    await profile.delete()


async def add_comment_to_profile(profile_id: PydanticObjectId, comment: Comment) -> UserProfileOut:
    profile = await get_user_profile_by_id(profile_id)
    profile.comments.append(comment)
    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return UserProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        social_media_links=profile.social_media_links,
        emoji_ratings=profile.emoji_ratings,
        comments=profile.comments,
        show_comments=profile.show_comments,
        allow_chat=profile.allow_chat,
        blocked_users=profile.blocked_users,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def add_emoji_rating_to_profile(profile_id: PydanticObjectId, emoji: EmojiType) -> UserProfileOut:
    profile = await get_user_profile_by_id(profile_id)

    if emoji == EmojiType.HEART:
        profile.emoji_ratings.hearts += 1
    elif emoji == EmojiType.THUMBS_UP:
        profile.emoji_ratings.thumbs_up += 1
    elif emoji == EmojiType.SMILEY_FACE:
        profile.emoji_ratings.smiley_face += 1
    elif emoji == EmojiType.FIRE:
        profile.emoji_ratings.fire += 1
    elif emoji == EmojiType.CLAPPING_HANDS:
        profile.emoji_ratings.clapping_hands += 1
    elif emoji == EmojiType.STAR:
        profile.emoji_ratings.star += 1
    elif emoji == EmojiType.PARTY_POPPER:
        profile.emoji_ratings.party_popper += 1
    elif emoji == EmojiType.MUSICAL_NOTE:
        profile.emoji_ratings.musical_note += 1
    elif emoji == EmojiType.COCKTAIL:
        profile.emoji_ratings.cocktail += 1
    elif emoji == EmojiType.SPARKLES:
        profile.emoji_ratings.sparkles += 1
    elif emoji == EmojiType.NEUTRAL_FACE:
        profile.emoji_ratings.neutral_face += 1

    profile.updated_at = datetime.utcnow()
    await profile.save()
    
    return UserProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        social_media_links=profile.social_media_links,
        emoji_ratings=profile.emoji_ratings,
        comments=profile.comments,
        show_comments=profile.show_comments,
        allow_chat=profile.allow_chat,
        blocked_users=profile.blocked_users,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def block_user(profile_id: PydanticObjectId, user_to_block_id: str) -> UserProfileOut:
    profile = await get_user_profile_by_id(profile_id)
    if user_to_block_id not in profile.blocked_users:
        profile.blocked_users.append(user_to_block_id)
        profile.updated_at = datetime.utcnow()
        await profile.save()
    
    return UserProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        social_media_links=profile.social_media_links,
        emoji_ratings=profile.emoji_ratings,
        comments=profile.comments,
        show_comments=profile.show_comments,
        allow_chat=profile.allow_chat,
        blocked_users=profile.blocked_users,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def unblock_user(profile_id: PydanticObjectId, user_to_unblock_id: str) -> UserProfileOut:
    profile = await get_user_profile_by_id(profile_id)
    if user_to_unblock_id in profile.blocked_users:
        profile.blocked_users.remove(user_to_unblock_id)
        profile.updated_at = datetime.utcnow()
        await profile.save()
    
    return UserProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        bio=profile.bio,
        profile_picture=profile.profile_picture,
        social_media_links=profile.social_media_links,
        emoji_ratings=profile.emoji_ratings,
        comments=profile.comments,
        show_comments=profile.show_comments,
        allow_chat=profile.allow_chat,
        blocked_users=profile.blocked_users,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
