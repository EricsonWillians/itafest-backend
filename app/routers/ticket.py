from fastapi import APIRouter, HTTPException, status
from pydantic import PydanticObjectId
from typing import List
from app.models.ticket import TicketCreate, TicketUpdate, TicketOut
from app.services.ticket import (
    get_ticket_by_id,
    create_ticket,
    update_ticket,
    delete_ticket,
    get_all_tickets
)

router = APIRouter()

@router.post("/", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_new_ticket(ticket_in: TicketCreate):
    return await create_ticket(ticket_in)

@router.get("/{ticket_id}", response_model=TicketOut)
async def read_ticket(ticket_id: PydanticObjectId):
    ticket = await get_ticket_by_id(ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket

@router.put("/{ticket_id}", response_model=TicketOut)
async def update_existing_ticket(ticket_id: PydanticObjectId, ticket_in: TicketUpdate):
    updated_ticket = await update_ticket(ticket_id, ticket_in)
    if not updated_ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return updated_ticket

@router.delete("/{ticket_id}", response_model=None, status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_ticket(ticket_id: PydanticObjectId):
    success = await delete_ticket(ticket_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return

@router.get("/", response_model=List[TicketOut])
async def read_all_tickets():
    return await get_all_tickets()
