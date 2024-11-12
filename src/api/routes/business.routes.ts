// src/api/routes/business.routes.ts
import { Router } from "oak";
import { BusinessController } from "@/api/controllers/business.controller.ts";
import { authMiddleware, requireRole, requireBusinessOwnership } from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/businesses" });
const controller = new BusinessController();

console.log("📝 Initializing business routes...");

// Public routes
router
  .get("/", async (ctx) => {
    console.log("📥 GET /businesses - Fetching businesses");
    await controller.getBusinesses(ctx);
  })
  .get("/search", async (ctx) => {
    console.log("📥 GET /businesses/search - Searching businesses");
    await controller.searchBusinesses(ctx);
  })
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /businesses/${ctx.params.id} - Fetching business`);
    await controller.getBusinessById(ctx);
  })
  .head("/:id", async (ctx) => {
    console.log(`📥 HEAD /businesses/${ctx.params.id} - Checking business existence`);
    await controller.businessExists(ctx);
  });

// Protected routes - require authentication
router
  .post("/", authMiddleware, requireRole(['admin', 'business_owner']), async (ctx) => {
    console.log("📥 POST /businesses - Creating new business");
    await controller.createBusiness(ctx);
  })
  .put("/:id", authMiddleware, requireBusinessOwnership, async (ctx) => {
    console.log(`📥 PUT /businesses/${ctx.params.id} - Updating business`);
    await controller.updateBusiness(ctx);
  })
  .delete("/:id", authMiddleware, requireRole(['admin']), async (ctx) => {
    console.log(`📥 DELETE /businesses/${ctx.params.id} - Deleting business`);
    await controller.deleteBusiness(ctx);
  });

console.log("✅ Business routes initialized");

export { router as businessRouter };