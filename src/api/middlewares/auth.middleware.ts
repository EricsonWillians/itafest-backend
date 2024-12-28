// src/api/middlewares/auth.middleware.ts

import { Context, Status } from "oak";
import { auth } from "@/utils/firebase-admin.ts";
import { config } from "@/config/env.config.ts";
import { AdService } from "@/services/ad.service.ts"; // Example service
import { UserRole } from "@/types/role.types.ts";
import type { User } from "@/types/user.types.ts";

// -------------------------------------------------------------------
// 1. AuthError Class
// -------------------------------------------------------------------
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = Status.Unauthorized
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// -------------------------------------------------------------------
// 2. Utility: Extract Bearer Token
// -------------------------------------------------------------------
function extractBearerToken(authHeader: string | null): string {
  if (!authHeader) {
    throw new AuthError("No authorization header", "NO_AUTH_HEADER");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw new AuthError("Invalid authorization header format", "INVALID_AUTH_FORMAT");
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AuthError("No token provided", "NO_TOKEN");
  }

  return token;
}

// -------------------------------------------------------------------
// 3. Core Authentication Middleware
// -------------------------------------------------------------------
export const authMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  try {
    // Optional verbose logging in development
    if (config.app.environment === "development") {
      console.log("🔒 [authMiddleware] Authenticating request...");
    }

    // Skip auth in development if SKIP_AUTH is true
    if (config.app.environment === "development" && config.app.skipAuth) {
      console.warn("⚠️ [authMiddleware] SKIP_AUTH is true—bypassing token check.");
      ctx.state.user = {
        id: "dev-user",
        email: "dev@localhost",
        role: UserRole.ADMIN, // For dev convenience
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await next();
      return;
    }

    // Extract the Bearer token
    const authHeader = ctx.request.headers.get("authorization");
    const token = extractBearerToken(authHeader);

    // Verify token via Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);

    // Fetch the full user record from Firebase Auth
    const firebaseUser = await auth.getUser(decodedToken.uid);

    // Optionally, if you store additional user data in Firestore, 
    // you could fetch it here:
    // const dbUserDoc = await getFirestoreUserData(firebaseUser.uid);
    // and then merge the info into a single `user` object.

    // Construct partial user state from Firebase data:
    ctx.state.user = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      displayName: firebaseUser.displayName,
      phoneNumber: firebaseUser.phoneNumber,
      photoURL: firebaseUser.photoURL,
      role: (firebaseUser.customClaims?.role as UserRole) || UserRole.USER,
      businessId: firebaseUser.customClaims?.businessId as string,
      isEmailVerified: firebaseUser.emailVerified,
      disabled: firebaseUser.disabled,
      // Timestamps
      createdAt: new Date(firebaseUser.metadata.creationTime ?? new Date()),
      updatedAt: new Date(firebaseUser.metadata.lastRefreshTime ?? new Date()),
      lastLoginAt: firebaseUser.metadata.lastSignInTime
        ? new Date(firebaseUser.metadata.lastSignInTime)
        : undefined,
      // providerData, marketingOptIn, etc. can be pulled as needed
    } as User; // Casting to `User` for convenience

    if (config.app.environment === "development") {
      console.log(`✅ [authMiddleware] Authenticated user: ${ctx.state.user.id}`);
    }

    await next();
  } catch (error) {
    console.error("❌ [authMiddleware] Authentication failed:", error);

    if (error instanceof AuthError) {
      ctx.response.status = error.status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
      };
    } else if (error?.code === "auth/id-token-expired") {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "TOKEN_EXPIRED",
        message: "Token has expired",
      };
    } else if (error?.code === "auth/id-token-revoked") {
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "TOKEN_REVOKED",
        message: "Token has been revoked",
      };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: "AUTH_ERROR",
        message: "An unexpected authentication error occurred",
      };
    }
  }
};

// -------------------------------------------------------------------
// 4. Role-Based Authorization Middleware
// -------------------------------------------------------------------
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    const user = ctx.state.user;

    if (!user) {
      throw new AuthError("User not authenticated", "NO_USER");
    }

    if (!allowedRoles.includes(user.role)) {
      ctx.response.status = Status.Forbidden;
      ctx.response.body = {
        success: false,
        error: "FORBIDDEN",
        message: "Insufficient permissions",
      };
      return;
    }

    await next();
  };
};

// -------------------------------------------------------------------
// 5. Business Ownership Middleware
// -------------------------------------------------------------------
export const requireBusinessOwnership = async (ctx: Context, next: () => Promise<void>) => {
  const user = ctx.state.user;
  const businessId = ctx.params.id; // or wherever you're storing business ID in route params

  if (!user) {
    throw new AuthError("User not authenticated", "NO_USER");
  }

  // Admin bypass
  if (user.role === UserRole.ADMIN) {
    await next();
    return;
  }

  if (!businessId || !user.businessId || user.businessId !== businessId) {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = {
      success: false,
      error: "FORBIDDEN",
      message: "You do not have permission to access this business",
    };
    return;
  }

  await next();
};

// -------------------------------------------------------------------
// 6. Ad Ownership Middleware
// -------------------------------------------------------------------
export const requireAdOwnership = async (ctx: Context, next: () => Promise<void>) => {
  const user = ctx.state.user;
  const adId = ctx.params.id; // e.g. /ads/:id

  if (!user) {
    throw new AuthError("User not authenticated", "NO_USER");
  }

  // Admin bypass
  if (user.role === UserRole.ADMIN) {
    await next();
    return;
  }

  if (!adId) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      success: false,
      error: "INVALID_AD_ID",
      message: "Ad ID is required",
    };
    return;
  }

  // Example: check ownership from DB or service
  const ad = await AdService.getAdById(adId);
  if (!ad) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = {
      success: false,
      error: "NOT_FOUND",
      message: "Advertisement not found",
    };
    return;
  }

  if (!user.businessId || ad.businessId !== user.businessId) {
    ctx.response.status = Status.Forbidden;
    ctx.response.body = {
      success: false,
      error: "FORBIDDEN",
      message: "You do not have permission to access this advertisement",
    };
    return;
  }

  await next();
};

// -------------------------------------------------------------------
// 7. Extend Oak's State to include our typed User
// -------------------------------------------------------------------
declare module "oak" {
  interface State {
    user?: User; 
    // If you only want to store partial data, you can do:
    // user?: Pick<User, "id" | "email" | "role" | "businessId" | ...>;
  }
}
