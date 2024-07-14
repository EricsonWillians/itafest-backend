from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId
from app.models.event import Event, EventCreate, EventUpdate, EventOut, EventCategory, EventStatus

async def create_event(event_in: EventCreate) -> EventOut:
    event = Event(**event_in.dict())
    await event.insert()
    return EventOut(**event.dict())

async def get_event(event_id: PydanticObjectId) -> Optional[EventOut]:
    event = await Event.get(event_id)
    if event:
        return EventOut(**event.dict())
    return None

async def update_event(event_id: PydanticObjectId, event_in: EventUpdate) -> Optional[EventOut]:
    event = await Event.get(event_id)
    if not event:
        return None
    await event.update({"$set": event_in.dict(exclude_unset=True)})
    await event.save()
    return EventOut(**event.dict())

async def delete_event(event_id: PydanticObjectId) -> bool:
    event = await Event.get(event_id)
    if not event:
        return False
    await event.delete()
    return True

async def list_events(skip: int = 0, limit: int = 10) -> List[EventOut]:
    events = await Event.find_all().skip(skip).limit(limit).to_list()
    return [EventOut(**event.dict()) for event in events]

async def list_events_by_category(category: EventCategory, skip: int = 0, limit: int = 10) -> List[EventOut]:
    events = await Event.find(Event.categories == category).skip(skip).limit(limit).to_list()
    return [EventOut(**event.dict()) for event in events]

async def list_upcoming_events(skip: int = 0, limit: int = 10) -> List[EventOut]:
    now = datetime.utcnow()
    events = await Event.find(Event.date >= now, Event.status == EventStatus.UPCOMING).skip(skip).limit(limit).to_list()
    return [EventOut(**event.dict()) for event in events]

async def list_past_events(skip: int = 0, limit: int = 10) -> List[EventOut]:
    now = datetime.utcnow()
    events = await Event.find(Event.date < now, Event.status == EventStatus.COMPLETED).skip(skip).limit(limit).to_list()
    return [EventOut(**event.dict()) for event in events]
