import httpx
from app.models.notification import Notification, NotificationCreate, NotificationUpdate, NotificationOut
from beanie import PydanticObjectId
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime

# Replace with your Firebase server key
FIREBASE_SERVER_KEY = "YOUR_FIREBASE_SERVER_KEY"

async def get_notification(notification_id: PydanticObjectId) -> Optional[NotificationOut]:
    notification = await Notification.get(notification_id)
    if notification:
        return NotificationOut(
            id=notification.id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            target=notification.target,
            sent_at=notification.sent_at,
            created_at=notification.created_at,
            updated_at=notification.updated_at
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

async def create_notification(notification_in: NotificationCreate) -> NotificationOut:
    new_notification = Notification(
        title=notification_in.title,
        message=notification_in.message,
        type=notification_in.type,
        target=notification_in.target
    )
    await new_notification.insert()

    # Send push notification via Firebase
    await send_push_notification(new_notification)

    return NotificationOut(
        id=new_notification.id,
        title=new_notification.title,
        message=new_notification.message,
        type=new_notification.type,
        target=new_notification.target,
        sent_at=new_notification.sent_at,
        created_at=new_notification.created_at,
        updated_at=new_notification.updated_at
    )

async def update_notification(notification_id: PydanticObjectId, notification_in: NotificationUpdate) -> NotificationOut:
    notification = await get_notification_by_id(notification_id)
    
    if notification_in.title:
        notification.title = notification_in.title
    if notification_in.message:
        notification.message = notification_in.message
    if notification_in.type:
        notification.type = notification_in.type
    if notification_in.target:
        notification.target = notification_in.target

    notification.updated_at = datetime.utcnow()
    await notification.save()
    
    # Send updated push notification via Firebase
    await send_push_notification(notification)

    return NotificationOut(
        id=notification.id,
        title=notification.title,
        message=notification.message,
        type=notification.type,
        target=notification.target,
        sent_at=notification.sent_at,
        created_at=notification.created_at,
        updated_at=notification.updated_at
    )

async def delete_notification(notification_id: PydanticObjectId) -> None:
    notification = await get_notification_by_id(notification_id)
    await notification.delete()

async def get_all_notifications() -> List[NotificationOut]:
    notifications = await Notification.find_all().to_list()
    return [
        NotificationOut(
            id=notification.id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            target=notification.target,
            sent_at=notification.sent_at,
            created_at=notification.created_at,
            updated_at=notification.updated_at
        ) for notification in notifications
    ]

async def send_push_notification(notification: Notification) -> None:
    headers = {
        'Authorization': f'key={FIREBASE_SERVER_KEY}',
        'Content-Type': 'application/json'
    }

    # Create the payload
    payload = {
        "notification": {
            "title": notification.title,
            "body": notification.message
        },
        "priority": "high"
    }

    # Target specific users (This would be based on the FCM tokens stored in your database)
    if notification.target.user_ids:
        payload["registration_ids"] = notification.target.user_ids

    # Send to all users
    if notification.target.all_users:
        payload["to"] = "/topics/all"

    # Send request to Firebase
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://fcm.googleapis.com/fcm/send",
            headers=headers,
            json=payload
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to send push notification")
