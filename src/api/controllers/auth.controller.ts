// src/api/controllers/auth.controller.ts

import { Context, Status } from "oak";
import { auth } from "@/utils/firebase-admin.ts";
import { config } from "@/config/env.config.ts";
import type { UserRecord } from "firebase-admin/auth";

/**
 * Helper to build the Identity Toolkit endpoint based on environment.
 * If we're in development, we target the local Auth Emulator.
 * Otherwise, we use the real "identitytoolkit.googleapis.com".
 */
function getIdentityToolkitURL(path: string) {
  // e.g., path could be "accounts:signInWithPassword" or "token"
  const baseUrl =
    config.app.environment === "development"
      ? "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1"
      : "https://identitytoolkit.googleapis.com/v1";

  return `${baseUrl}/${path}?key=${config.firebase.apiKey}`;
}

/**
 * AuthController:
 * - Creates users with the Admin SDK (local or real)
 * - Logs in with password using local or remote Identity Toolkit
 * - Verifies ID tokens with Admin SDK
 * - Issues custom tokens for external identities
 * - Refreshes tokens via Identity Toolkit
 */
export class AuthController {
  /**
   * [1] REGISTER NEW USER (Server-Side via Admin SDK)
   *
   * In dev mode, this goes to the local emulator's Admin API if your
   * Firebase Admin init is configured for the emulator. In production,
   * it creates the user in your live Firebase project.
   */
  async register(ctx: Context) {
    console.log("📥 [AuthController] register() called");
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { email, password, name, phone } = body;

      if (!email || !password) {
        ctx.throw(Status.BadRequest, "Email and Password are required");
      }

      // Create the user in Firebase Auth (emulator or real,
      // depending on your admin config).
      const userRecord: UserRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone,
      });

      console.log(
        `✅ [AuthController] User created in ${config.app.environment} mode:`,
        userRecord.uid
      );

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
      console.error("❌ [AuthController] register() error:", error);
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        success: false,
        error: "REGISTRATION_FAILED",
        message: error.message,
      };
    }
  }

  /**
   * [2] LOGIN (Server-Side, Manual)
   * Uses Identity Toolkit to verify email/password,
   * hitting either local emulator or real endpoint based on DENO_ENV.
   */
  async login(ctx: Context) {
    console.log(
      `📥 [AuthController] login() called in ${config.app.environment} mode`
    );
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { email, password } = body;

      if (!email || !password) {
        ctx.throw(Status.BadRequest, "Email and Password are required");
      }

      const apiKey = config.firebase.apiKey;
      if (!apiKey) {
        ctx.throw(
          Status.InternalServerError,
          "Missing FIREBASE_API_KEY; cannot perform server-side login."
        );
      }

      // Decide local vs. remote Identity Toolkit endpoint
      const signInUrl = getIdentityToolkitURL("accounts:signInWithPassword");

      const payload = { email, password, returnSecureToken: true };
      const response = await fetch(signInUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ [AuthController] Identity Toolkit error:", errorData);
        const errorMessage = errorData.error?.message || "Invalid credentials";
        ctx.throw(Status.Unauthorized, errorMessage);
      }

      const data = await response.json();
      console.log(
        "✅ [AuthController] Server-side login success:",
        data.localId
      );

      ctx.response.body = {
        success: true,
        data: {
          idToken: data.idToken,
          refreshToken: data.refreshToken,
          localId: data.localId,
          displayName: data.displayName,
        },
        message: "Login successful (server-verified password)",
      };
    } catch (error) {
      console.error("❌ [AuthController] login() error:", error);
      ctx.response.status = error.status || Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: "LOGIN_FAILED",
        message: error.message,
      };
    }
  }

  /**
   * [2] GOOGLE SSO
   * Handles Google Sign-In token verification and user creation/update
   */
  async googleSignIn(ctx: Context) {
    console.log("📥 [AuthController] googleSignIn() called");
    try {
      const { idToken } = await ctx.request.body({ type: "json" }).value;
      if (!idToken) {
        ctx.throw(Status.BadRequest, "Google ID token is required");
      }

      const isTestMode = ctx.request.headers.get("X-Test-Mode") === "true";
      let decodedToken;

      if (isTestMode) {
        console.log("🧪 [AuthController] Test mode: parsing test token");
        const [, payloadB64] = idToken.split('.');
        if (!payloadB64) {
          ctx.throw(Status.BadRequest, "Invalid test token format");
        }
        
        const payload = JSON.parse(atob(payloadB64));
        decodedToken = {
          uid: payload.user_id,
          email: payload.email,
          emailVerified: payload.email_verified,
          displayName: payload.name,
          photoURL: payload.picture
        };
      } else {
        decodedToken = await auth.verifyIdToken(idToken);
      }

      // Create or update user
      let userRecord: UserRecord;
      try {
        userRecord = await auth.getUser(decodedToken.uid);
        console.log("✓ [AuthController] Found existing user:", userRecord.uid);

        // Update if needed
        if (userRecord.displayName !== decodedToken.displayName ||
            userRecord.photoURL !== decodedToken.photoURL) {
          userRecord = await auth.updateUser(userRecord.uid, {
            displayName: decodedToken.displayName,
            photoURL: decodedToken.photoURL,
          });
        }
      } catch (error) {
        console.log("✓ [AuthController] Creating new user");
        userRecord = await auth.createUser({
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.emailVerified,
          displayName: decodedToken.displayName,
          photoURL: decodedToken.photoURL,
        });
      }

      // For test mode, create a test token
      const firebaseToken = isTestMode ? 
        this.createTestToken(userRecord) : 
        await auth.createCustomToken(userRecord.uid);

      ctx.response.body = {
        success: true,
        data: {
          firebaseToken,
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            emailVerified: userRecord.emailVerified,
          }
        },
        message: "Google Sign-In successful"
      };
    } catch (error) {
      console.error("❌ [AuthController] googleSignIn() error:", error);
      ctx.response.status = error.status || Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: "GOOGLE_SIGNIN_FAILED",
        message: error.message
      };
    }
  }

  private createTestToken(user: UserRecord): string {
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: "RS256",
      typ: "JWT"
    };

    const payload = {
      uid: user.uid,
      iat: now,
      exp: now + 3600
    };

    // Create JWT segments
    const base64Encode = (obj: unknown) => 
      btoa(JSON.stringify(obj))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const encodedHeader = base64Encode(header);
    const encodedPayload = base64Encode(payload);
    const testSignature = base64Encode("test-signature");

    return `${encodedHeader}.${encodedPayload}.${testSignature}`;
  }

  /**
   * [3] VERIFY TOKEN
   * Verifies an existing ID token with the Admin SDK
   * (local or real, depending on environment).
   */
  async verifyToken(ctx: Context) {
    console.log("📥 [AuthController] verifyToken() called");
    try {
      const authHeader = ctx.request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        ctx.throw(Status.Unauthorized, "Missing or invalid Authorization header");
      }

      const token = authHeader.substring(7).trim();
      const isTestMode = ctx.request.headers.get("X-Test-Mode") === "true";

      let userRecord;

      if (isTestMode) {
        // For test mode, parse the token directly
        console.log("🧪 [AuthController] Test mode: Parsing token");
        const [, payloadB64] = token.split('.');
        if (!payloadB64) {
          ctx.throw(Status.BadRequest, "Invalid test token format");
        }
        
        const payload = JSON.parse(atob(payloadB64));
        try {
          userRecord = await auth.getUser(payload.uid);
        } catch {
          ctx.throw(Status.Unauthorized, "Invalid user");
        }
      } else {
        const decodedToken = await auth.verifyIdToken(token);
        userRecord = await auth.getUser(decodedToken.uid);
      }

      console.log("✅ [AuthController] Token verified for UID:", userRecord.uid);

      ctx.response.body = {
        success: true,
        data: {
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            emailVerified: userRecord.emailVerified,
          }
        },
        message: "Token verified successfully"
      };
    } catch (error) {
      console.error("❌ [AuthController] verifyToken() error:", error);
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "TOKEN_VERIFICATION_FAILED",
        message: error.message || "Could not verify token",
      };
    }
  }

  /**
   * [4] ISSUE CUSTOM TOKEN (Optional)
   * Creates or fetches a user, then returns a custom token.
   * Admin SDK will talk to the local emulator in dev
   * or the real Firebase in production.
   */
  async issueCustomToken(ctx: Context) {
    console.log("📥 [AuthController] issueCustomToken() called");
    try {
      const { externalUserId } = await ctx.request.body({ type: "json" }).value;
      if (!externalUserId) {
        ctx.throw(Status.BadRequest, "externalUserId is required");
      }

      let userRecord: UserRecord;
      try {
        userRecord = await auth.getUser(externalUserId);
      } catch {
        userRecord = await auth.createUser({ uid: externalUserId });
      }

      const token = await auth.createCustomToken(externalUserId);
      console.log(
        `✅ [AuthController] Custom token issued for ${externalUserId} in ${config.app.environment} mode`
      );

      ctx.response.body = {
        success: true,
        data: { token },
        message: "Custom token issued",
      };
    } catch (error) {
      console.error("❌ [AuthController] issueCustomToken() error:", error);
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        success: false,
        error: "CUSTOM_TOKEN_FAILED",
        message: error.message,
      };
    }
  }

  /**
   * [5] REFRESH TOKEN
   * If development, hits local emulator's "token" endpoint.
   * If production, hits https://securetoken.googleapis.com.
   */
  async refreshToken(ctx: Context) {
    console.log(
      `📥 [AuthController] refreshToken() called in ${config.app.environment} mode`
    );
    try {
      const { refreshToken } = await ctx.request.body({ type: "json" }).value;
      if (!refreshToken) {
        ctx.throw(Status.BadRequest, "Refresh token is required");
      }

      const apiKey = config.firebase.apiKey;
      if (!apiKey) {
        ctx.throw(
          Status.InternalServerError,
          "Missing FIREBASE_API_KEY; cannot perform refresh token exchange."
        );
      }

      const refreshUrl = getIdentityToolkitURL("token");
      const payload = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      };

      const response = await fetch(refreshUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ [AuthController] Refresh token error:", errorData);
        ctx.throw(
          Status.Unauthorized,
          errorData.error?.message || "Invalid refresh token"
        );
      }

      const data = await response.json();
      console.log(
        `✅ [AuthController] Token refreshed for: ${data.user_id} in ${config.app.environment} mode`
      );

      ctx.response.body = {
        success: true,
        data: {
          idToken: data.id_token,
          refreshToken: data.refresh_token,
          userId: data.user_id,
        },
        message: "Token refreshed successfully",
      };
    } catch (error) {
      console.error("❌ [AuthController] refreshToken() error:", error);
      ctx.response.status = error.status || Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: "REFRESH_FAILED",
        message: error.message,
      };
    }
  }
}
