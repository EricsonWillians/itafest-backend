from app.models.ticket import Ticket, TicketCreate, TicketUpdate, TicketOut
from beanie import PydanticObjectId
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime

async def get_ticket_by_id(ticket_id: PydanticObjectId) -> Optional[TicketOut]:
    ticket = await Ticket.get(ticket_id)
    if ticket:
        return TicketOut(
            id=ticket.id,
            event_id=ticket.event_id,
            type=ticket.type,
            price=ticket.price,
            quantity=ticket.quantity,
            status=ticket.status,
            sale_start_date=ticket.sale_start_date,
            sale_end_date=ticket.sale_end_date,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at
        )
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

async def create_ticket(ticket_in: TicketCreate) -> TicketOut:
    new_ticket = Ticket(
        event_id=ticket_in.event_id,
        type=ticket_in.type,
        price=ticket_in.price,
        quantity=ticket_in.quantity,
        sale_start_date=ticket_in.sale_start_date,
        sale_end_date=ticket_in.sale_end_date
    )
    await new_ticket.insert()
    return TicketOut(
        id=new_ticket.id,
        event_id=new_ticket.event_id,
        type=new_ticket.type,
        price=new_ticket.price,
        quantity=new_ticket.quantity,
        status=new_ticket.status,
        sale_start_date=new_ticket.sale_start_date,
        sale_end_date=new_ticket.sale_end_date,
        created_at=new_ticket.created_at,
        updated_at=new_ticket.updated_at
    )

async def update_ticket(ticket_id: PydanticObjectId, ticket_in: TicketUpdate) -> TicketOut:
    ticket = await get_ticket_by_id(ticket_id)
    
    if ticket_in.type:
        ticket.type = ticket_in.type
    if ticket_in.price:
        ticket.price = ticket_in.price
    if ticket_in.quantity:
        ticket.quantity = ticket_in.quantity
    if ticket_in.status:
        ticket.status = ticket_in.status
    if ticket_in.sale_start_date:
        ticket.sale_start_date = ticket_in.sale_start_date
    if ticket_in.sale_end_date:
        ticket.sale_end_date = ticket_in.sale_end_date

    ticket.updated_at = datetime.utcnow()
    await ticket.save()

    return TicketOut(
        id=ticket.id,
        event_id=ticket.event_id,
        type=ticket.type,
        price=ticket.price,
        quantity=ticket.quantity,
        status=ticket.status,
        sale_start_date=ticket.sale_start_date,
        sale_end_date=ticket.sale_end_date,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at
    )

async def delete_ticket(ticket_id: PydanticObjectId) -> None:
    ticket = await get_ticket_by_id(ticket_id)
    await ticket.delete()

async def get_all_tickets() -> List[TicketOut]:
    tickets = await Ticket.find_all().to_list()
    return [
        TicketOut(
            id=ticket.id,
            event_id=ticket.event_id,
            type=ticket.type,
            price=ticket.price,
            quantity=ticket.quantity,
            status=ticket.status,
            sale_start_date=ticket.sale_start_date,
            sale_end_date=ticket.sale_end_date,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at
        ) for ticket in tickets
    ]
