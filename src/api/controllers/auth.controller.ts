// src/api/controllers/auth.controller.ts
import { Context, Status } from "oak";
import { auth } from "@/utils/firebase-admin.ts";
import type { UserRecord } from "firebase-admin/auth";

export class AuthController {
  async register(ctx: Context) {
    try {
      const { email, password, name, phone } = await ctx.request.body().value;

      // Create user in Firebase
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone,
      });

      // Create custom token
      const token = await auth.createCustomToken(userRecord.uid);

      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: {
          user: {
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
          },
          token
        },
        message: "User registered successfully"
      };
    } catch (error) {
      console.error("❌ Registration error:", error);
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        success: false,
        error: "REGISTRATION_FAILED",
        message: error.message
      };
    }
  }

  async login(ctx: Context) {
    try {
      const { email, password } = await ctx.request.body().value;

      // Get user by email
      const user = await auth.getUserByEmail(email);
      
      // Create custom token
      const token = await auth.createCustomToken(user.uid);

      ctx.response.body = {
        success: true,
        data: {
          user: {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
          },
          token
        },
        message: "Login successful"
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "LOGIN_FAILED",
        message: "Invalid email or password"
      };
    }
  }

  async refreshToken(ctx: Context) {
    try {
      const { uid } = await ctx.request.body().value;
      const token = await auth.createCustomToken(uid);

      ctx.response.body = {
        success: true,
        data: { token },
        message: "Token refreshed successfully"
      };
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      ctx.response.status = Status.Unauthorized;
      ctx.response.body = {
        success: false,
        error: "REFRESH_FAILED",
        message: "Failed to refresh token"
      };
    }
  }
}