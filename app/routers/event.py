from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from beanie import PydanticObjectId
from app.models.event import EventCreate, EventUpdate, EventOut, EventCategory
from app.services.event import (
    create_event,
    get_event,
    update_event,
    delete_event,
    list_events,
    list_events_by_category,
    list_upcoming_events,
    list_past_events
)

router = APIRouter()

@router.post("/", response_model=EventOut, status_code=status.HTTP_201_CREATED)
async def create_new_event(event_in: EventCreate):
    return await create_event(event_in)

@router.get("/{event_id}", response_model=EventOut)
async def read_event(event_id: PydanticObjectId):
    event = await get_event(event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=EventOut)
async def update_existing_event(event_id: PydanticObjectId, event_in: EventUpdate):
    updated_event = await update_event(event_id, event_in)
    if not updated_event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return updated_event

@router.delete("/{event_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_event(event_id: PydanticObjectId):
    success = await delete_event(event_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return

@router.get("/", response_model=List[EventOut])
async def read_all_events(skip: int = 0, limit: int = 10):
    return await list_events(skip, limit)

@router.get("/category/{category}", response_model=List[EventOut])
async def read_events_by_category(category: EventCategory, skip: int = 0, limit: int = 10):
    return await list_events_by_category(category, skip, limit)

@router.get("/upcoming", response_model=List[EventOut])
async def read_upcoming_events(skip: int = 0, limit: int = 10):
    return await list_upcoming_events(skip, limit)

@router.get("/past", response_model=List[EventOut])
async def read_past_events(skip: int = 0, limit: int = 10):
    return await list_past_events(skip, limit)
