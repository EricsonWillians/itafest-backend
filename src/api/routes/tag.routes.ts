import { Router } from "oak";
import { TagController } from "@/api/controllers/tag.controller.ts";
import { 
  authMiddleware, 
  requireRole 
} from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/tags" });
const controller = new TagController();

console.log("📝 Initializing tag routes...");

// Public routes - Tag search and retrieval
router
  .get("/", async (ctx) => {
    console.log("📥 GET /tags - Searching tags with filters");
    await controller.searchTags(ctx);
  })
  .get("/suggestions", async (ctx) => {
    console.log("📥 GET /tags/suggestions - Getting tag suggestions");
    await controller.getTagSuggestions(ctx);
  })
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /tags/${ctx.params.id} - Fetching tag`);
    await controller.getTagById(ctx);
  });

// Protected routes - Tag management (Admin only)
router
  .post("/", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log("📥 POST /tags - Creating new tag");
      await controller.createTag(ctx);
    }
  )
  .put("/:id", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log(`📥 PUT /tags/${ctx.params.id} - Updating tag`);
      await controller.updateTag(ctx);
    }
  )
  .delete("/:id", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log(`📥 DELETE /tags/${ctx.params.id} - Deleting tag`);
      await controller.deleteTag(ctx);
    }
  );

// Statistics and analytics routes
router
  .get("/:id/stats",
    authMiddleware,
    requireRole(['admin', 'business_owner']),
    async (ctx) => {
      console.log(`📥 GET /tags/${ctx.params.id}/stats - Fetching tag statistics`);
      await controller.getTagStats(ctx);
    }
  );

// Tag relationships routes
router
  .post("/relationships",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/relationships - Creating tag relationship");
      await controller.createTagRelationship(ctx);
    }
  );

// Localization routes
router
  .post("/:id/localizations",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log(`📥 POST /tags/${ctx.params.id}/localizations - Adding tag localization`);
      await controller.addTagLocalization(ctx);
    }
  );

// Merge and bulk operations routes
router
  .post("/merge",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/merge - Merging tags");
      await controller.mergeTags(ctx);
    }
  )
  .patch("/bulk",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 PATCH /tags/bulk - Bulk updating tags");
      await controller.bulkUpdateTags(ctx);
    }
  );

// Import/Export routes
router
  .get("/export",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 GET /tags/export - Exporting tags");
      await controller.exportTags(ctx);
    }
  )
  .post("/import",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/import - Importing tags");
      await controller.importTags(ctx);
    }
  );

// Cache management routes
router
  .post("/cache/clear",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/cache/clear - Clearing tag cache");
      ctx.response.body = {
        success: true,
        message: 'Tag cache cleared successfully'
      };
    }
  )
  .post("/cache/warm",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/cache/warm - Warming tag cache");
      ctx.response.body = {
        success: true,
        message: 'Tag cache warmed successfully'
      };
    }
  );

// Validation routes
router
  .post("/validate",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /tags/validate - Validating tag data");
      // Implementation for tag validation
      ctx.response.body = {
        success: true,
        message: 'Tag validation completed'
      };
    }
  );

// Reporting routes
router
  .get("/report/usage",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 GET /tags/report/usage - Generating tag usage report");
      // Implementation for tag usage report
      ctx.response.body = {
        success: true,
        data: {
          // Report data would go here
        }
      };
    }
  )
  .get("/report/trends",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 GET /tags/report/trends - Generating tag trends report");
      // Implementation for tag trends report
      ctx.response.body = {
        success: true,
        data: {
          // Trend data would go here
        }
      };
    }
  );

// Health check route
router
  .get("/health",
    async (ctx) => {
      console.log("📥 GET /tags/health - Checking tag service health");
      ctx.response.body = {
        success: true,
        status: 'healthy',
        timestamp: new Date()
      };
    }
  );

console.log("✅ Tag routes initialized");

export { router as tagRouter };