from fastapi import APIRouter, HTTPException, status
from beanie import PydanticObjectId
from typing import List

from app.models.notification import NotificationCreate, NotificationUpdate, NotificationOut
from app.services.notification_service import (
    get_notification_by_id,
    create_notification,
    update_notification,
    delete_notification,
    get_all_notifications,
)

router = APIRouter()

@router.post("/", response_model=NotificationOut)
async def create_notification_endpoint(notification_in: NotificationCreate):
    return await create_notification(notification_in)

@router.get("/{notification_id}", response_model=NotificationOut)
async def get_notification_endpoint(notification_id: PydanticObjectId):
    return await get_notification_by_id(notification_id)

@router.put("/{notification_id}", response_model=NotificationOut)
async def update_notification_endpoint(notification_id: PydanticObjectId, notification_in: NotificationUpdate):
    return await update_notification(notification_id, notification_in)

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification_endpoint(notification_id: PydanticObjectId):
    await delete_notification(notification_id)

@router.get("/", response_model=List[NotificationOut])
async def get_all_notifications_endpoint():
    return await get_all_notifications()
