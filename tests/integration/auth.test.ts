// tests/integration/auth.test.ts

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.210.0/assert/mod.ts";
import * as colors from "https://deno.land/std@0.210.0/fmt/colors.ts";

// Test configuration
const CONFIG = {
  baseUrl: "http://localhost:8000/api/v1",
  projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "itafest-dev-61e78",
  isEmulated: Deno.env.get("DENO_ENV") === "development",
  environment: Deno.env.get("DENO_ENV") || "production"
};

// Generate unique test user data
function generateTestUser() {
  const uniqueId = crypto.randomUUID().split('-')[0];
  return {
    userId: crypto.randomUUID(),
    email: `test.${uniqueId}@example.com`,
    name: `Test User ${uniqueId}`,
    picture: `https://example.com/photos/${uniqueId}.jpg`
  };
}

// Logger setup
const logger = {
  debug: true,
  info: (msg: string) => console.log(colors.blue(`ℹ ${msg}`)),
  success: (msg: string) => console.log(colors.green(`✓ ${msg}`)),
  error: (msg: string) => console.log(colors.red(`✗ ${msg}`)),
  warn: (msg: string) => console.log(colors.yellow(`⚠ ${msg}`)),
  debug_log: (title: string, data: unknown) => {
    console.log(colors.dim("\nDEBUG: " + title));
    console.log(colors.dim("─".repeat(50)));
    console.log(colors.dim(JSON.stringify(data, null, 2)));
    console.log(colors.dim("─".repeat(50)));
  }
};

// Helper to encode base64
function base64Encode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Helper to create a Firebase test token
function createTestToken(testUser: ReturnType<typeof generateTestUser>) {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "RS256",
    kid: "test-key-id",
    typ: "JWT"
  };

  const payload = {
    iss: `https://securetoken.google.com/${CONFIG.projectId}`,
    aud: CONFIG.projectId,
    auth_time: now,
    user_id: testUser.userId,
    sub: testUser.userId,
    iat: now,
    exp: now + 3600,
    email: testUser.email,
    email_verified: true,
    name: testUser.name,
    picture: testUser.picture,
    firebase: {
      identities: {
        "google.com": [testUser.userId],
        email: [testUser.email]
      },
      sign_in_provider: "google.com"
    }
  };

  const encodedHeader = base64Encode(JSON.stringify(header));
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const testSignature = base64Encode("test-signature");

  return `${encodedHeader}.${encodedPayload}.${testSignature}`;
}

// Response handler
async function handleResponse(response: Response, context: string): Promise<any> {
  try {
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
    
    logger.debug_log(`${context} Response`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: data
    });
    
    return data;
  } finally {
    if (!response.bodyUsed) {
      await response.body?.cancel();
    }
  }
}

// Main test suite
Deno.test("Firebase Authentication Integration Suite", async (t) => {
  const testUser = generateTestUser();
  const context = {
    idToken: "",
    firebaseToken: "",
    userData: null as any
  };

  console.log("\n" + colors.bold("🔐 Firebase Authentication Test Suite"));
  console.log(colors.dim("═".repeat(50) + "\n"));
  logger.info(`Running in ${CONFIG.environment} environment`);
  logger.info(`Firebase Emulation: ${CONFIG.isEmulated ? "Enabled" : "Disabled"}`);

  // Environment Check
  await t.step({
    name: "Environment Check",
    fn: async () => {
      const response = await fetch(CONFIG.baseUrl);
      await response.body?.cancel();
      assertExists(response);
      logger.success("Backend server is accessible");
    }
  });

  if (CONFIG.isEmulated) {
    logger.info(`Testing with user: ${testUser.email}`);

    // Create test token
    await t.step({
      name: "Token Creation",
      fn: () => {
        context.idToken = createTestToken(testUser);
        logger.debug_log("Test Token Created", {
          type: "Test Token",
          user: testUser.email,
          preview: context.idToken.substring(0, 50) + "..."
        });
        logger.success("Test token created");
      }
    });

    // Test Google SSO
    await t.step({
      name: "Google SSO Integration",
      fn: async () => {
        logger.info("Testing SSO endpoint...");

        const response = await fetch(`${CONFIG.baseUrl}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Test-Mode": "true"
          },
          body: JSON.stringify({ idToken: context.idToken })
        });

        const data = await handleResponse(response, "Google SSO");
        assertEquals(response.status, 200, "SSO endpoint should return 200");
        assertExists(data.data?.firebaseToken, "Should receive Firebase token");
        
        context.firebaseToken = data.data.firebaseToken;
        context.userData = data.data.user;
        
        assertEquals(context.userData.uid, testUser.userId, "User ID should match");
        assertEquals(context.userData.email, testUser.email, "Email should match");
        logger.success("Google SSO integration successful");
      }
    });

    // Test token verification
    await t.step({
      name: "Token Verification",
      fn: async () => {
        logger.info("Verifying authentication token...");

        const response = await fetch(`${CONFIG.baseUrl}/auth/verify`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${context.firebaseToken}`,
            "Content-Type": "application/json",
            "X-Test-Mode": "true"
          }
        });

        const data = await handleResponse(response, "Token Verification");
        assertEquals(response.status, 200, "Token verification should succeed");
        assertEquals(data.data.user.uid, testUser.userId, "User ID should match");
        assertEquals(data.data.user.email, testUser.email, "Email should match");
        logger.success("Token verification successful");
      }
    });
  } else {
    logger.warn("Skipping auth tests in production environment");
  }
});