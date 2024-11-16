// src/app.ts
import { Application, Router, Status, isHttpError } from "oak";
import { load } from "dotenv";
import { oakCors } from "cors";
import { businessRouter } from "@/api/routes/business.routes.ts";
import { adRouter } from "@/api/routes/ad.routes.ts";
import { config } from "@/config/env.config.ts";
import { BusinessError } from "@/services/business.service.ts";
import { AdError } from "@/services/ad.service.ts";
import { categoryRouter } from "@/api/routes/category.routes.ts";
import { tagRouter } from "@/api/routes/tag.routes.ts";

console.log("🚀 Initializing application...");

// Initialize application
const app = new Application();

// CORS middleware
app.use(oakCors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Request logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  const { method, url } = ctx.request;
  console.log(`📥 ${method} ${url.pathname} - Request received`);
  
  try {
    await next();
    
    const ms = Date.now() - start;
    const status = ctx.response.status;
    console.log(`📤 ${method} ${url.pathname} - ${status} - ${ms}ms`);
  } catch (error) {
    const ms = Date.now() - start;
    console.error(`❌ ${method} ${url.pathname} - Error - ${ms}ms`, error);
    throw error;
  }
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error("❌ Error caught in global handler:", error);

    if (error instanceof BusinessError ) {
      // Handle business logic errors
      // TODO AD ROUTES ERROR HANDLING
      const status = {
        'INVALID_DATA': Status.BadRequest,
        'NOT_FOUND': Status.NotFound,
        'INVALID_ID': Status.BadRequest,
        'CREATE_FAILED': Status.InternalServerError,
        'UPDATE_FAILED': Status.InternalServerError,
        'DELETE_FAILED': Status.InternalServerError
      }[error.code] || Status.InternalServerError;

      ctx.response.status = status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message
      };
    } else if (isHttpError(error)) {
      // Handle Oak HTTP errors
      ctx.response.status = error.status;
      ctx.response.body = {
        success: false,
        error: error.name,
        message: error.message
      };
    } else {
      // Handle unexpected errors
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: 'InternalServerError',
        message: 'An unexpected error occurred',
        stack: config.app.environment === "development" ? error.stack : undefined
      };
    }
  }
});

// API versioning middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("X-API-Version", "1.0.0");
  await next();
});

// Health check route
const healthRouter = new Router();
healthRouter.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: config.app.environment,
    version: "1.0.0"
  };
});

// Mount routes
app.use(healthRouter.routes());
app.use(categoryRouter.routes());
app.use(categoryRouter.allowedMethods());
app.use(tagRouter.routes());
app.use(tagRouter.allowedMethods());
app.use(businessRouter.routes());
app.use(businessRouter.allowedMethods());
app.use(adRouter.routes());
app.use(adRouter.allowedMethods());

// 404 handler
app.use((ctx) => {
  ctx.response.status = Status.NotFound;
  ctx.response.body = {
    success: false,
    error: 'NotFound',
    message: `Route ${ctx.request.url.pathname} not found`
  };
});

// Start server
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