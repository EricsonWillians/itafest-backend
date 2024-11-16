import { Router } from "oak";
import { CategoryController } from "@/api/controllers/category.controller.ts";
import { 
  authMiddleware, 
  requireRole 
} from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/categories" });
const controller = new CategoryController();

console.log("📝 Initializing category routes...");

// Public routes - Category listing and retrieval
router
  .get("/", async (ctx) => {
    console.log("📥 GET /categories - Fetching categories with filters");
    await controller.getCategories(ctx);
  })
  .get("/tree", async (ctx) => {
    console.log("📥 GET /categories/tree - Fetching category tree structure");
    await controller.getCategoryTree(ctx);
  })
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /categories/${ctx.params.id} - Fetching category`);
    await controller.getCategoryById(ctx);
  })
  .head("/:id", async (ctx) => {
    console.log(`📥 HEAD /categories/${ctx.params.id} - Checking category existence`);
    await controller.categoryExists(ctx);
  });

// Protected routes - Category management (Admin only)
router
  .post("/", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log("📥 POST /categories - Creating new category");
      await controller.createCategory(ctx);
    }
  )
  .put("/:id", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log(`📥 PUT /categories/${ctx.params.id} - Updating category`);
      await controller.updateCategory(ctx);
    }
  )
  .delete("/:id", 
    authMiddleware, 
    requireRole(['admin']), 
    async (ctx) => {
      console.log(`📥 DELETE /categories/${ctx.params.id} - Deleting category`);
      await controller.deleteCategory(ctx);
    }
  );

// Statistics and analytics routes
router
  .get("/:id/stats",
    authMiddleware,
    requireRole(['admin', 'business_owner']),
    async (ctx) => {
      console.log(`📥 GET /categories/${ctx.params.id}/stats - Fetching category statistics`);
      await controller.getCategoryStats(ctx);
    }
  );

// Bulk operations routes (Admin only)
router
  .patch("/bulk",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 PATCH /categories/bulk - Bulk updating categories");
      await controller.bulkUpdateCategories(ctx);
    }
  );

// Tag management routes
router
  .post("/:id/recommended-tags",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log(`📥 POST /categories/${ctx.params.id}/recommended-tags - Adding recommended tags`);
      await controller.addRecommendedTags(ctx);
    }
  )
  .delete("/:id/recommended-tags/:tagId",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log(`📥 DELETE /categories/${ctx.params.id}/recommended-tags/${ctx.params.tagId} - Removing recommended tag`);
      await controller.removeRecommendedTag(ctx);
    }
  )
  .get("/:id/recommended-tags",
    async (ctx) => {
      console.log(`📥 GET /categories/${ctx.params.id}/recommended-tags - Getting recommended tags`);
      await controller.getRecommendedTags(ctx);
    }
  );

// Subcategory management routes
router
  .post("/:id/subcategories",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log(`📥 POST /categories/${ctx.params.id}/subcategories - Adding subcategory`);
      await controller.addSubcategory(ctx);
    }
  )
  .put("/:id/subcategories/reorder",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log(`📥 PUT /categories/${ctx.params.id}/subcategories/reorder - Reordering subcategories`);
      await controller.reorderSubcategories(ctx);
    }
  )
  .get("/:id/subcategories",
    async (ctx) => {
      console.log(`📥 GET /categories/${ctx.params.id}/subcategories - Getting subcategories`);
      await controller.getSubcategories(ctx);
    }
  );

// Validation routes
router
  .post("/validate",
    authMiddleware,
    requireRole(['admin']),
    async (ctx) => {
      console.log("📥 POST /categories/validate - Validating category data");
      await controller.validateCategoryData(ctx);
    }
  );

// Meta information routes
router
  .get("/types", async (ctx) => {
    console.log("📥 GET /categories/types - Getting available category types");
    await controller.getCategoryTypes(ctx);
  })
  .get("/schema", async (ctx) => {
    console.log("📥 GET /categories/schema - Getting category schema");
    await controller.getCategorySchema(ctx);
  });

console.log("✅ Category routes initialized");

export { router as categoryRouter };