import { Router } from "oak";
import { BusinessController } from "@/api/controllers/business.controller.ts";
import { 
  authMiddleware, 
  requireRole, 
  requireBusinessOwnership 
} from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/businesses" });
const controller = new BusinessController();

console.log("📝 Initializing business routes...");

// Public routes - General business listing and search
router
  .get("/", async (ctx) => {
    console.log("📥 GET /businesses - Fetching businesses with filters");
    await controller.getBusinesses(ctx);
  })
  .get("/search", async (ctx) => {
    console.log("📥 GET /businesses/search - Searching businesses");
    await controller.searchBusinesses(ctx);
  });

// Public routes - Category and tag specific
router
  .get("/category/:categoryId", async (ctx) => {
    console.log(`📥 GET /businesses/category/${ctx.params.categoryId} - Fetching businesses by category`);
    await controller.getBusinessesByCategory(ctx);
  })
  .get("/tags/:tags", async (ctx) => {
    console.log(`📥 GET /businesses/tags/${ctx.params.tags} - Fetching businesses by tags`);
    await controller.getBusinessesByTags(ctx);
  })
  .get("/suggestions", async (ctx) => {
    console.log("📥 GET /businesses/suggestions - Getting business suggestions based on tags");
    await controller.getBusinessSuggestions(ctx);
  });

// Public routes - Single business operations
router
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /businesses/${ctx.params.id} - Fetching business`);
    await controller.getBusinessById(ctx);
  })
  .head("/:id", async (ctx) => {
    console.log(`📥 HEAD /businesses/${ctx.params.id} - Checking business existence`);
    await controller.businessExists(ctx);
  });

// Protected routes - Business creation and management
router
  .post("/", 
    authMiddleware, 
    requireRole(['admin', 'business_owner']), 
    async (ctx) => {
      console.log("📥 POST /businesses - Creating new business");
      await controller.createBusiness(ctx);
    }
  )
  .put("/:id", 
    authMiddleware, 
    requireBusinessOwnership, 
    async (ctx) => {
      console.log(`📥 PUT /businesses/${ctx.params.id} - Updating business`);
      await controller.updateBusiness(ctx);
    }
  )
  .delete("/:id", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log(`📥 DELETE /businesses/${ctx.params.id} - Deleting business`);
      await controller.deleteBusiness(ctx);
    }
  );

// Tag management routes
router
  .post("/:id/tags",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 POST /businesses/${ctx.params.id}/tags - Adding tags to business`);
      await controller.addBusinessTags(ctx);
    }
  )
  .delete("/:id/tags/:tagId",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 DELETE /businesses/${ctx.params.id}/tags/${ctx.params.tagId} - Removing tag from business`);
      await controller.removeBusinessTag(ctx);
    }
  )
  .put("/:id/tags/reorder",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 PUT /businesses/${ctx.params.id}/tags/reorder - Reordering business tags`);
      await controller.reorderBusinessTags(ctx);
    }
  );

// Analytics routes - Protected and require specific roles
router
  .get("/:id/analytics",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 GET /businesses/${ctx.params.id}/analytics - Fetching business analytics`);
      await controller.getBusinessAnalytics(ctx);
    }
  )
  .get("/:id/tags/analytics",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 GET /businesses/${ctx.params.id}/tags/analytics - Fetching tag analytics`);
      await controller.getBusinessTagAnalytics(ctx);
    }
  );

// Category management routes
router
  .post("/:id/categories",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 POST /businesses/${ctx.params.id}/categories - Adding categories to business`);
      await controller.addBusinessCategories(ctx);
    }
  )
  .delete("/:id/categories/:categoryId",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 DELETE /businesses/${ctx.params.id}/categories/${ctx.params.categoryId} - Removing category from business`);
      await controller.removeBusinessCategory(ctx);
    }
  );

// Subscription management routes
router
  .post("/:id/subscription",
    authMiddleware,
    requireBusinessOwnership,
    async (ctx) => {
      console.log(`📥 POST /businesses/${ctx.params.id}/subscription - Managing subscription`);
      await controller.manageSubscription(ctx);
    }
  );

// Bulk operations routes
router
  .post("/bulk/tags",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /businesses/bulk/tags - Bulk updating business tags");
      await controller.bulkUpdateTags(ctx);
    }
  )
  .post("/bulk/categories",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /businesses/bulk/categories - Bulk updating business categories");
      await controller.bulkUpdateCategories(ctx);
    }
  );

console.log("✅ Business routes initialized");

export { router as businessRouter };