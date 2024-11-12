// src/api/routes/auth.routes.ts
import { Router } from "oak";
import { AuthController } from "@/api/controllers/auth.controller.ts";

const router = new Router({ prefix: "/api/v1/auth" });
const controller = new AuthController();

router
  .post("/register", async (ctx) => {
    console.log("📥 POST /auth/register - New user registration");
    await controller.register(ctx);
  })
  .post("/login", async (ctx) => {
    console.log("📥 POST /auth/login - User login");
    await controller.login(ctx);
  })
  .post("/refresh", async (ctx) => {
    console.log("📥 POST /auth/refresh - Token refresh");
    await controller.refreshToken(ctx);
  });

export { router as authRouter };