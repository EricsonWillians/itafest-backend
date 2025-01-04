import { Application, Router, Status } from "oak";
import { oakCors } from "cors";
import { config } from "@/config/env.config.ts";
import { globalErrorHandler } from "@/api/middlewares/error.middleware.ts";

// Import all your routers
import { businessRouter } from "@/api/routes/business.routes.ts";
import { eventRouter } from "@/api/routes/event.routes.ts";
import { adRouter } from "@/api/routes/ad.routes.ts";
import { categoryRouter } from "@/api/routes/category.routes.ts";
import { tagRouter } from "@/api/routes/tag.routes.ts";
import { authRouter } from "@/api/routes/auth.routes.ts";

// Initialize application
const app = new Application();
console.log("🚀 Initializing application...");

/**
 * CORS middleware
 */
app.use(oakCors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 200
}));

/**
 * Request logging middleware
 */
app.use(async (ctx, next) => {
  const start = Date.now();
  const { method, url } = ctx.request;
  console.log(`📥 ${method} ${url.pathname} - Request received`);

  try {
    await next();
    const ms = Date.now() - start;
    console.log(`📤 ${method} ${url.pathname} - ${ctx.response.status} - ${ms}ms`);
  } catch (error) {
    const ms = Date.now() - start;
    console.error(`❌ ${method} ${url.pathname} - Error - ${ms}ms`, error);
    throw error;
  }
});

/**
 * Global error-handling middleware
 * 
 * Move this *before* all route usage so that it can catch
 * errors from any route or middleware below.
 */
app.use(globalErrorHandler);

/**
 * API versioning middleware
 */
app.use(async (ctx, next) => {
  ctx.response.headers.set("X-API-Version", "1.0.0");
  await next();
});

/**
 * Health check route
 */
const healthRouter = new Router();
healthRouter.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: config.app.environment,
    version: "1.0.0",
  };
});
app.use(healthRouter.routes());
app.use(healthRouter.allowedMethods());

// Mount your feature routers
app.use(categoryRouter.routes());
app.use(categoryRouter.allowedMethods());

app.use(tagRouter.routes());
app.use(tagRouter.allowedMethods());

app.use(businessRouter.routes());
app.use(businessRouter.allowedMethods());

app.use(eventRouter.routes());
app.use(eventRouter.allowedMethods());

app.use(adRouter.routes());
app.use(adRouter.allowedMethods());

app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

/**
 * 404 handler - runs if no other route/middleware responded
 */
app.use((ctx) => {
  ctx.response.status = Status.NotFound;
  ctx.response.body = {
    success: false,
    error: "NotFound",
    message: `Route ${ctx.request.url.pathname} not found`,
  };
});

// Start the server
const port = config.app.port;
try {
  console.log(`🚀 Starting server on http://localhost:${port}`);
  console.log(`🌍 Environment: ${config.app.environment}`);
  await app.listen({ port });
  console.log("✅ Server started successfully");
} catch (error) {
  console.error("❌ Failed to start server:", error);
  Deno.exit(1);
}
