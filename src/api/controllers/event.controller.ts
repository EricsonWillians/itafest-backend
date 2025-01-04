// src/api/controllers/event.controller.ts
import { Context, Status } from "oak";
import { EventService } from "@/services/event.service.ts";
import type { CreateEventDTO, UpdateEventDTO } from "@/types/event.types.ts";

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  /**
   * Create a new event
   * @route POST /api/v1/events
   */
  async createEvent(ctx: Context) {
    // No local try/catch needed; let the global error handler capture any thrown error
    const body = await ctx.request.body().value as CreateEventDTO;
    console.log(`📝 Creating event: ${body.title}`);

    const event = await this.eventService.createEvent(body);
    ctx.response.status = Status.Created;
    ctx.response.body = {
      success: true,
      data: event,
      message: "Event created successfully",
    };
  }

  /**
   * Get all events with optional pagination
   * @route GET /api/v1/events
   */
  async getEvents(ctx: Context) {
    const { page = "1", limit = "10" } = ctx.request.url.searchParams;

    const currentPage = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;

    console.log(`📋 Fetching events - Page: ${currentPage}, Limit: ${pageLimit}`);
    const result = await this.eventService.getEvents(currentPage, pageLimit);

    ctx.response.body = {
      success: true,
      data: result.events,
      pagination: {
        currentPage,
        totalPages: Math.ceil(result.total / pageLimit),
        totalItems: result.total,
        hasMore: result.hasMore,
        itemsPerPage: pageLimit,
      },
    };
  }

  /**
   * Get an event by ID
   * @route GET /api/v1/events/:id
   */
  async getEventById(ctx: Context) {
    const { id } = ctx.params;
    console.log(`🔍 Fetching event: ${id}`);

    const event = await this.eventService.getEventById(id);
    if (!event) {
      // Throwing an error directly; global middleware will catch it
      throw new Error("Event not found"); 
      // Or, if you want a structured error: throw new EventError("Event not found", "NOT_FOUND");
    }

    ctx.response.body = {
      success: true,
      data: event,
    };
  }

  /**
   * Update an existing event
   * @route PUT /api/v1/events/:id
   */
  async updateEvent(ctx: Context) {
    const { id } = ctx.params;
    const body = await ctx.request.body().value as UpdateEventDTO;

    console.log(`📝 Updating event: ${id}, Title: ${body.title ?? "N/A"}`);

    await this.eventService.updateEvent(id, body);
    const updatedEvent = await this.eventService.getEventById(id);

    ctx.response.body = {
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    };
  }

  /**
   * Delete an event
   * @route DELETE /api/v1/events/:id
   */
  async deleteEvent(ctx: Context) {
    const { id } = ctx.params;
    console.log(`🗑️ Deleting event: ${id}`);

    await this.eventService.deleteEvent(id);

    ctx.response.status = Status.OK;
    ctx.response.body = {
      success: true,
      message: "Event deleted successfully",
    };
  }

  /**
   * Search events by title (with optional category or tag filters)
   * @route GET /api/v1/events/search
   */
  async searchEvents(ctx: Context) {
    const { q: searchTerm, limit = "10", categoryId } = ctx.request.url.searchParams;
    // Throw directly if there's an invalid or missing param
    if (!searchTerm) {
      throw new Error("Search term is required"); 
      // Or throw new EventError("Search term is required", "INVALID_DATA");
    }

    const pageLimit = parseInt(limit, 10) || 10;
    console.log(`🔍 Searching events with term: ${searchTerm}, Category: ${categoryId ?? "N/A"}`);

    const events = await this.eventService.searchEvents(searchTerm.toString(), {
      categoryId: categoryId || undefined,
      limit: pageLimit,
    });

    ctx.response.body = {
      success: true,
      data: events,
    };
  }
}

export default new EventController();
