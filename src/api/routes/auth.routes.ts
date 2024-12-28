// src/api/routes/auth.routes.ts

import { Router } from "oak";
import { AuthController } from "@/api/controllers/auth.controller.ts";

const router = new Router({ prefix: "/api/v1/auth" });
const authController = new AuthController();

/**
 * Routes for Authentication
 *
 * The recommended approach is:
 *  - Use Firebase Client SDK on the front end for login & password checks
 *  - Verify ID tokens on the back end using authMiddleware or a verify endpoint
 *  - Only use server-side createUser() for admin flows or special scenarios
 */

router
  // Register a new user in Firebase (optional for server-driven user creation)
  .post("/register", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/register - Attempting to register user");
    await authController.register(ctx);
  })

  // Example placeholder for a server-driven login (NOT recommended for production)
  .post("/login", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/login - Attempting login (server-side)");
    await authController.login(ctx);
  })

  // Google SSO sign-in endpoint
  .post("/google", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/google - Processing Google SSO");
    await authController.googleSignIn(ctx);
  })

  // Example placeholder for token refresh (NOT recommended for production)
  .post("/refresh", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/refresh - Attempting token refresh");
    await authController.refreshToken(ctx);
  })

  // Route for issuing custom tokens for external identity bridging
  .post("/issue-custom-token", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/issue-custom-token - Issuing custom token");
    await authController.issueCustomToken(ctx);
  })

  // Route for verifying an ID token (example demonstration endpoint)
  .post("/verify", async (ctx) => {
    console.log("📥 [POST] /api/v1/auth/verify - Verifying ID token");
    await authController.verifyToken(ctx);
  });

export { router as authRouter };
