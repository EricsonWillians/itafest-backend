// src/api/routes/event.routes.ts

import { Router } from "oak";
import EventController from "@/api/controllers/event.controller.ts";
import { 
  authMiddleware, 
  requireRole, 
  // If you want to check if the user owns the event or 
  // if there's a "business ownership" concept related to events, 
  // you could add an equivalent middleware here:
  // requireEventOwnership
} from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/events" });
const controller = EventController;

console.log("📝 Initializing event routes...");

/**
 * Public routes for event listing, searching, etc.
 */
router
  /**
   * Get all events with optional pagination
   * @route GET /api/v1/events
   */
  .get("/", async (ctx) => {
    console.log("📥 GET /events - Fetching events with optional pagination");
    await controller.getEvents(ctx);
  })

  /**
   * Search events by title (with optional category or other filters)
   * @route GET /api/v1/events/search
   */
  .get("/search", async (ctx) => {
    console.log("📥 GET /events/search - Searching events by query");
    await controller.searchEvents(ctx);
  });

/**
 * Public routes for category or tag specific listing (if applicable)
 */
router
  /**
   * Get events by category
   * @route GET /api/v1/events/category/:categoryId
   */
  .get("/category/:categoryId", async (ctx) => {
    console.log(`📥 GET /events/category/${ctx.params.categoryId} - Fetching events by category`);
    // If you create a method in EventController called getEventsByCategory, call it here:
    // await controller.getEventsByCategory(ctx);
    // Currently, you might integrate this functionality into searchEvents or a dedicated method.
    ctx.response.body = {
      success: false,
      message: "Route not implemented. Please handle in EventController."
    };
  })

  /**
   * Get events by tags
   * @route GET /api/v1/events/tags/:tags
   */
  .get("/tags/:tags", async (ctx) => {
    console.log(`📥 GET /events/tags/${ctx.params.tags} - Fetching events by tags`);
    // If you create a method in EventController called getEventsByTags, call it here:
    // await controller.getEventsByTags(ctx);
    ctx.response.body = {
      success: false,
      message: "Route not implemented. Please handle in EventController."
    };
  });

/**
 * Public routes for single event retrieval
 */
router
  /**
   * Get a single event by ID
   * @route GET /api/v1/events/:id
   */
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /events/${ctx.params.id} - Fetching event`);
    await controller.getEventById(ctx);
  })

  /**
   * HEAD route for checking event existence
   * @route HEAD /api/v1/events/:id
   */
  .head("/:id", async (ctx) => {
    console.log(`📥 HEAD /events/${ctx.params.id} - Checking event existence`);
    // If you want a HEAD route similar to businessExists, 
    // you can add a method in EventController: eventExists(ctx)
    ctx.response.body = {
      success: false,
      message: "Route not implemented. Please handle in EventController."
    };
  });

/**
 * Protected routes for event creation and management.
 * You can customize role-based checks, ownership checks, etc.
 */
router
  /**
   * Create a new event
   * @route POST /api/v1/events
   */
  .post("/", 
    authMiddleware, 
    requireRole(["admin", "business_owner"]), 
    async (ctx) => {
      console.log("📥 POST /events - Creating new event");
      await controller.createEvent(ctx);
    }
  )

  /**
   * Update an event
   * @route PUT /api/v1/events/:id
   */
  .put("/:id", 
    authMiddleware, 
    // requireEventOwnership, // If you have an equivalent ownership check
    async (ctx) => {
      console.log(`📥 PUT /events/${ctx.params.id} - Updating event`);
      await controller.updateEvent(ctx);
    }
  )

  /**
   * Delete an event
   * @route DELETE /api/v1/events/:id
   */
  .delete("/:id", 
    authMiddleware, 
    requireRole(["admin"]), 
    async (ctx) => {
      console.log(`📥 DELETE /events/${ctx.params.id} - Deleting event`);
      await controller.deleteEvent(ctx);
    }
  );

/**
 * Tag management routes for events (if applicable)
 */
router
  /**
   * Add tags to an event
   * @route POST /api/v1/events/:id/tags
   */
  .post("/:id/tags",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 POST /events/${ctx.params.id}/tags - Adding tags to event`);
      // If you implement something like addEventTags in EventController:
      // await controller.addEventTags(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  )
  /**
   * Remove a tag from an event
   * @route DELETE /api/v1/events/:id/tags/:tagId
   */
  .delete("/:id/tags/:tagId",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 DELETE /events/${ctx.params.id}/tags/${ctx.params.tagId} - Removing tag from event`);
      // If you implement removeEventTag in EventController:
      // await controller.removeEventTag(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  )
  /**
   * Reorder event tags
   * @route PUT /api/v1/events/:id/tags/reorder
   */
  .put("/:id/tags/reorder",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 PUT /events/${ctx.params.id}/tags/reorder - Reordering event tags`);
      // If you implement reorderEventTags in EventController:
      // await controller.reorderEventTags(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  );

/**
 * Analytics routes for events (if you need them)
 */
router
  /**
   * Fetch event analytics
   * @route GET /api/v1/events/:id/analytics
   */
  .get("/:id/analytics",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 GET /events/${ctx.params.id}/analytics - Fetching event analytics`);
      // If you implement getEventAnalytics in EventController:
      // await controller.getEventAnalytics(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  );

/**
 * Category management routes for events (if you need them)
 */
router
  /**
   * Add categories to an event
   * @route POST /api/v1/events/:id/categories
   */
  .post("/:id/categories",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 POST /events/${ctx.params.id}/categories - Adding categories to event`);
      // If you implement addEventCategories in EventController:
      // await controller.addEventCategories(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  )
  /**
   * Remove a category from an event
   * @route DELETE /api/v1/events/:id/categories/:categoryId
   */
  .delete("/:id/categories/:categoryId",
    authMiddleware,
    // requireEventOwnership,
    async (ctx) => {
      console.log(`📥 DELETE /events/${ctx.params.id}/categories/${ctx.params.categoryId} - Removing category from event`);
      // If you implement removeEventCategory in EventController:
      // await controller.removeEventCategory(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  );

/**
 * Bulk operations routes for events (if you need them)
 */
router
  /**
   * Bulk updating event tags
   * @route POST /api/v1/events/bulk/tags
   */
  .post("/bulk/tags",
    authMiddleware,
    requireRole(["admin"]),
    async (ctx) => {
      console.log("📥 POST /events/bulk/tags - Bulk updating event tags");
      // If you implement bulkUpdateEventTags in EventController:
      // await controller.bulkUpdateEventTags(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  )
  /**
   * Bulk updating event categories
   * @route POST /api/v1/events/bulk/categories
   */
  .post("/bulk/categories",
    authMiddleware,
    requireRole(["admin"]),
    async (ctx) => {
      console.log("📥 POST /events/bulk/categories - Bulk updating event categories");
      // If you implement bulkUpdateEventCategories in EventController:
      // await controller.bulkUpdateEventCategories(ctx);
      ctx.response.body = {
        success: false,
        message: "Route not implemented. Please handle in EventController."
      };
    }
  );

console.log("✅ Event routes initialized");

export { router as eventRouter };
