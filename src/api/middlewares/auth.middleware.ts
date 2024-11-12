// src/api/middlewares/auth.middleware.ts
import { Context, Status } from "oak";
import { auth } from "@/utils/firebase-admin.ts";
import { config } from "@/config/env.config.ts";

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = Status.Unauthorized
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extracts the token from the Authorization header
 */
const extractToken = (authHeader: string | null): string => {
  if (!authHeader) {
    throw new AuthError('No authorization header', 'NO_AUTH_HEADER');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthError('Invalid authorization header format', 'INVALID_AUTH_FORMAT');
  }

  const token = authHeader.substring(7);
  if (!token) {
    throw new AuthError('No token provided', 'NO_TOKEN');
  }

  return token;
};

/**
 * Authentication middleware for Oak
 */
export const authMiddleware = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  try {
    console.log("🔒 Authenticating request...");
    
    // Skip auth in development if SKIP_AUTH is true
    if (config.app.environment === "development" && config.app.skipAuth) {
      console.log("⚠️ Skipping authentication in development");
      ctx.state.user = { uid: 'dev-user', role: 'admin' };
      await next();
      return;
    }

    // Get the authorization header
    const authHeader = ctx.request.headers.get('authorization');
    const token = extractToken(authHeader);

    // Verify the token
    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Get the user details
      const user = await auth.getUser(decodedToken.uid);
      
      // Add user to context state
      ctx.state.user = {
        uid: user.uid,
        email: user.email,
        role: user.customClaims?.role || 'user',
        businessId: user.customClaims?.businessId,
        createdAt: user.metadata.creationTime,
      };

      console.log(`✅ Authenticated user: ${user.uid}`);
      await next();
    } catch (error) {
      console.error("❌ Token verification failed:", error);
      
      if (error.code === 'auth/id-token-expired') {
        throw new AuthError('Token has expired', 'TOKEN_EXPIRED');
      } else if (error.code === 'auth/id-token-revoked') {
        throw new AuthError('Token has been revoked', 'TOKEN_REVOKED');
      } else {
        throw new AuthError('Invalid token', 'INVALID_TOKEN');
      }
    }
  } catch (error) {
    console.error("❌ Authentication failed:", error);

    if (error instanceof AuthError) {
      ctx.response.status = error.status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message
      };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: 'AUTH_ERROR',
        message: 'An unexpected authentication error occurred'
      };
    }
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    const user = ctx.state.user;
    
    if (!user) {
      throw new AuthError('User not authenticated', 'NO_USER');
    }

    if (!allowedRoles.includes(user.role)) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = {
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient permissions'
      };
      return;
    }

    await next();
  };
};

/**
 * Business owner authorization middleware
 */
export const requireBusinessOwnership = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  const user = ctx.state.user;
  const businessId = ctx.params.id;

  if (!user) {
    throw new AuthError('User not authenticated', 'NO_USER');
  }

  if (user.role === 'admin') {
    await next();
    return;
  }

  if (!user.businessId || user.businessId !== businessId) {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = {
      success: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to access this business'
    };
    return;
  }

  await next();
};

/**
 * Ad owner authorization middleware
 */
export const requireAdOwnership = async (
  ctx: Context,
  next: () => Promise<void>
) => {
  const user = ctx.state.user;
  const adId = ctx.params.id;

  if (!user) {
    throw new AuthError('User not authenticated', 'NO_USER');
  }

  if (user.role === 'admin') {
    await next();
    return;
  }

  if (!adId) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      success: false,
      error: 'INVALID_AD_ID',
      message: 'Ad ID is required',
    };
    return;
  }

  // Fetch the ad to check ownership
  const ad = await AdService.getAdById(adId);

  if (!ad) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = {
      success: false,
      error: 'NOT_FOUND',
      message: 'Advertisement not found',
    };
    return;
  }

  // Check if the user owns the ad (by comparing businessId)
  if (!user.businessId || ad.businessId !== user.businessId) {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = {
      success: false,
      error: 'FORBIDDEN',
      message: 'You do not have permission to access this advertisement',
    };
    return;
  }

  await next();
};

// Types for extending Oak's State interface
declare module "oak" {
  interface State {
    user?: {
      uid: string;
      email?: string;
      role: string;
      businessId?: string;
      createdAt?: string;
    };
  }
}