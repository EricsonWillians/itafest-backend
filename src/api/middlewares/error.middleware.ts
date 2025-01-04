import { Context, isHttpError, Status } from "oak";
import { BusinessError } from "@/services/business.service.ts";
import { EventError } from "@/services/event.service.ts";
import { AdError } from "@/services/ad.service.ts";

// Map your custom error codes to HTTP status codes
const businessStatusMap: Record<string, Status> = {
  INVALID_DATA: Status.BadRequest,
  NOT_FOUND: Status.NotFound,
  INVALID_ID: Status.BadRequest,
  CREATE_FAILED: Status.InternalServerError,
  UPDATE_FAILED: Status.InternalServerError,
  DELETE_FAILED: Status.InternalServerError,
};

const adStatusMap: Record<string, Status> = {
  INVALID_AD_DATA: Status.BadRequest,
  AD_NOT_FOUND: Status.NotFound,
  INVALID_AD_ID: Status.BadRequest,
  CREATE_AD_FAILED: Status.InternalServerError,
  UPDATE_AD_FAILED: Status.InternalServerError,
  DELETE_AD_FAILED: Status.InternalServerError,
};

const eventStatusMap: Record<string, Status> = {
  INVALID_DATA: Status.BadRequest,
  INVALID_TITLE: Status.BadRequest,
  INVALID_DATE: Status.BadRequest,
  INVALID_BUSINESS: Status.BadRequest,
  INVALID_CATEGORY: Status.BadRequest,
  CATEGORY_TYPE_MISMATCH: Status.BadRequest,
  INACTIVE_CATEGORY: Status.BadRequest,
  NOT_FOUND: Status.NotFound,
  INVALID_ID: Status.BadRequest,
  CREATE_FAILED: Status.InternalServerError,
  UPDATE_FAILED: Status.InternalServerError,
  DELETE_FAILED: Status.InternalServerError,
  FETCH_FAILED: Status.InternalServerError,
  SEARCH_FAILED: Status.InternalServerError,
  INIT_FAILED: Status.ServiceUnavailable,
};

/**
 * A reusable middleware function that catches any errors thrown
 * within downstream middleware/routes and maps them to consistent
 * HTTP responses.
 */
export async function globalErrorHandler(ctx: Context, next: () => Promise<unknown>) {
  try {
    await next();
  } catch (error) {
    console.error("❌ Global error handler caught:", error);

    // 1) Check for known business errors
    if (error instanceof BusinessError) {
      ctx.response.status = businessStatusMap[error.code] ?? Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
      };
      return;
    }

    // 2) Check for known ad errors
    if (error instanceof AdError) {
      ctx.response.status = adStatusMap[error.code] ?? Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
      };
      return;
    }

    // 3) Check for known event errors
    if (error instanceof EventError) {
      ctx.response.status = eventStatusMap[error.code] ?? Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
      };
      return;
    }

    // 4) Handle Oak's built-in HTTP errors
    if (isHttpError(error)) {
      ctx.response.status = error.status;
      ctx.response.body = {
        success: false,
        error: error.name,
        message: error.message,
      };
      return;
    }

    // 5) Handle unexpected or generic errors
    ctx.response.status = Status.InternalServerError;
    ctx.response.body = {
      success: false,
      error: "InternalServerError",
      message: "An unexpected error occurred",
      // Optionally expose stack in development
      stack: Deno.env.get("ENV") === "development" ? error.stack : undefined,
    };
  }
}
