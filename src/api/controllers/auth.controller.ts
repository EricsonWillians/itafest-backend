// src/api/controllers/auth.controller.ts

import { Context, Status } from "oak";
import { auth } from "@/utils/firebase-admin.ts";
import type { UserRecord } from "firebase-admin/auth";

/**
 * AuthController demonstrating recommended Firebase practices:
 * - Rely on the Firebase Client SDK to handle email/password sign-in.
 * - Verify the ID token on the server for protected routes.
 * - Use custom tokens only for special cases (like a separate auth system).
 */
export class AuthController {
  /**
   * Server-side user creation (optional).
   * This is typically an admin-only endpoint or for special flows where
   * you want to create a user account in Firebase Auth behind the scenes.
   */
  async register(ctx: Context) {
    try {
      const { email, password, name, phone } = await ctx.request.body().value;

      // Basic validation
      if (!email || !password) {
        ctx.throw(Status.BadRequest, "Email and Password are required");
      }

      // 1. Create the user in Firebase Auth
      const userRecord: UserRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone, // Must be in E.164 format if provided
      });

      // 2. Set custom claims if needed (e.g., role = 'user')
      // await auth.setCustomUserClaims(userRecord.uid, { role: 'user' });

      // 3. Return a success response
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          phoneNumber: userRecord.phoneNumber,
        },
        message: "User created successfully",
      };
    } catch (error) {
      console.error("❌ [AuthController] Registration error:", error);
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        success: false,
        error: "REGISTRATION_FAILED",
        message: error.message,
      };
    }
  }

  /**
   * Example of an endpoint that issues a *custom token* for special scenarios.
   * Typically used if you have your own external authentication
   * and need to sign users into Firebase for advanced features.
   */
  async issueCustomToken(ctx: Context) {
    try {
      // For example, the request might have a verified user from your
      // external service, and you trust that user with a known ID.
      const { externalUserId } = await ctx.request.body().value;

      if (!externalUserId) {
        ctx.throw(Status.BadRequest, "externalUserId is required");
      }

      // 1. Create (or get) a Firebase user that corresponds to this external user
      let userRecord: UserRecord;
      try {
        userRecord = await auth.getUser(externalUserId);
      } catch {
        // If not found, create the user in Firebase
        userRecord = await auth.createUser({ uid: externalUserId });
      }

      // 2. Possibly set custom claims here
      // await auth.setCustomUserClaims(externalUserId, { role: 'external_user' });

      // 3. Create a custom token so the user can sign in client-side
      const token = await auth.createCustomToken(externalUserId);

      ctx.response.body = {
        success: true,
        data: { token },
        message: "Custom token issued",
      };
    } catch (error) {
      console.error("❌ [AuthController] issueCustomToken error:", error);
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        success: false,
        error: "CUSTOM_TOKEN_FAILED",
        message: error.message,
      };
    }
  }

  /**
   * Demonstrates how you might verify an ID token that the client
   * (using the Firebase Client SDK) sends to the server.
   *
   * Best practice: the client signs in with email/password or Google/Facebook
   * on the front end, obtains an ID token, then calls your backend with
   * that ID token in the Authorization header ("Bearer <id-token>").
   *
   * This route is just for demonstration—usually you'd verify
   * the token in a middleware and protect your real endpoints with it.
   */
  async verifyToken(ctx: Context) {
    try {
      const authHeader = ctx.request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ctx.throw(Status.Unauthorized, "Missing or invalid Authorization header");
      }

      const idToken = authHeader.substring(7).trim(); // Remove "Bearer "
      const decoded = await auth.verifyIdToken(idToken);

      // Optionally fetch the user record from Auth if needed
      const userRecord = await auth.getUser(decoded.uid);

      ctx.response.body = {
        success: true,
        data: {
          decodedToken: decoded,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            // Include any claims, roles, or other fields you want to return
            customClaims: userRecord.customClaims,
          },
        },
        message: "ID token verified successfully",
      };
    } catch (error) {
      console.error("❌ [AuthController] verifyToken error:", error);
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "TOKEN_VERIFICATION_FAILED",
        message: "Could not verify ID token",
      };
    }
  }

  /**
   * This approach is only for demonstration: if you truly need
   * a "login" endpoint that verifies email/password server-side,
   * you'd typically use Firebase Identity Toolkit REST API.
   * 
   * Generally, the recommended pattern is:
   * 1. Use `firebase.auth().signInWithEmailAndPassword(email, password)` on the client.
   * 2. The client gets an ID token, which it sends to your backend.
   * 3. Your backend verifies the ID token in a middleware or dedicated endpoint.
   */
  async login(ctx: Context) {
    try {
      ctx.throw(Status.NotImplemented, "Server-side email/password login not implemented. " +
        "Please use client-side Firebase SDK or Identity Toolkit REST API.");
    } catch (error) {
      console.error("❌ [AuthController] login error:", error);
      ctx.response.status = Status.NotImplemented;
      ctx.response.body = {
        success: false,
        error: "NOT_IMPLEMENTED",
        message: error.message,
      };
    }
  }

  /**
   * Example "refresh" approach: for completeness, you typically let the
   * client handle refresh logic automatically (the Client SDK does this).
   * If you DO need a refresh endpoint, you can create a new custom token
   * if you control the user identity. Alternatively, use Firebase sessions.
   */
  async refreshToken(ctx: Context) {
    try {
      ctx.throw(Status.NotImplemented, "Token refresh is handled automatically by the " +
        "Firebase Client SDK. Implementing a custom refresh endpoint is discouraged " +
        "unless you have a special use case.");
    } catch (error) {
      console.error("❌ [AuthController] refreshToken error:", error);
      ctx.response.status = Status.NotImplemented;
      ctx.response.body = {
        success: false,
        error: "NOT_IMPLEMENTED",
        message: error.message,
      };
    }
  }
}
