// src/app.ts
import { Application, Router } from "oak";
import { load } from "dotenv";
import { db } from "@/config/firebase.config.ts";
import { oakCors } from "cors";

// Load environment variables
const env = await load();

// Initialize application
const app = new Application();
const router = new Router();

// CORS middleware
app.use(oakCors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = err.status || 500;
    ctx.response.body = {
      success: false,
      message: err.message,
      stack: env["DENO_ENV"] === "development" ? err.stack : undefined
    };
  }
});

// Health check endpoint
router.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: env["DENO_ENV"] || "development"
  };
});

// API version prefix
const apiRouter = new Router({
  prefix: "/api/v1"
});

// Mount routers
app.use(router.routes());
app.use(router.allowedMethods());
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Start server
const port = parseInt(env["PORT"] || "8000");
console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`🌍 Environment: ${env["DENO_ENV"] || "development"}`);

await app.listen({ port });