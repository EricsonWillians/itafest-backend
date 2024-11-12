// src/api/routes/ad.routes.ts

import { Router } from "oak";
import { AdController } from "@/api/controllers/ad.controller.ts";
import {
  authMiddleware,
  requireRole,
  requireAdOwnership,
} from "@/api/middlewares/auth.middleware.ts";

const router = new Router({ prefix: "/api/v1/ads" });
const controller = new AdController();

console.log("📝 Initializing ad routes...");

// Public routes
router
  .get("/", async (ctx) => {
    console.log("📥 GET /ads - Fetching ads");
    await controller.getAds(ctx);
  })
  .get("/:id", async (ctx) => {
    console.log(`📥 GET /ads/${ctx.params.id} - Fetching ad`);
    await controller.getAdById(ctx);
  })
  .head("/:id", async (ctx) => {
    console.log(`📥 HEAD /ads/${ctx.params.id} - Checking ad existence`);
    await controller.adExists(ctx);
  });

// Protected routes - require authentication
router
  .post(
    "/",
    authMiddleware,
    requireRole(["admin", "business_owner"]),
    async (ctx) => {
      console.log("📥 POST /ads - Creating new ad");
      await controller.createAd(ctx);
    },
  )
  .put(
    "/:id",
    authMiddleware,
    requireAdOwnership,
    async (ctx) => {
      console.log(`📥 PUT /ads/${ctx.params.id} - Updating ad`);
      await controller.updateAd(ctx);
    },
  )
  .delete(
    "/:id",
    authMiddleware,
    requireRole(["admin", "business_owner"]),
    async (ctx) => {
      console.log(`📥 DELETE /ads/${ctx.params.id} - Deleting ad`);
      await controller.deleteAd(ctx);
    },
  )
  .post(
    "/:id/impressions",
    async (ctx) => {
      console.log(
        `📥 POST /ads/${ctx.params.id}/impressions - Incrementing impressions`,
      );
      await controller.incrementImpressions(ctx);
    },
  );

console.log("✅ Ad routes initialized");

export { router as adRouter };
