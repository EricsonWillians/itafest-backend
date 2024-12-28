// src/config/env.config.ts
import { load } from "dotenv";

/**
 * Defines which environment variables our application expects.
 */
interface AppConfig {
  port: number;
  environment: string;
  skipAuth: boolean;
}

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * The master interface for our configuration object.
 */
interface Config {
  app: AppConfig;
  firebase: FirebaseConfig;
}

/**
 * Helper function to format the private key properly,
 * especially if it comes with escaped `\n`.
 */
function formatPrivateKey(key: string): string {
  if (key.includes("\n")) {
    return key; // Already has newlines, so we assume it's correct
  }
  
  // Remove any leading/trailing lines if present
  const privateKeyContent = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\\n/g, "\n")
    .replace(/\r?\n|\r/g, ""); // remove stray newlines or carriage returns

  return `-----BEGIN PRIVATE KEY-----\n${privateKeyContent}\n-----END PRIVATE KEY-----`;
}

// 1. Load Environment Variables
const env = await load();

// 2. Validate critical environment variables (fail fast if missing)
function assertEnv(key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

// 3. Build up our configuration
const rawConfig: Config = {
  app: {
    port: Number(env.PORT) || 8000,
    environment: env.DENO_ENV || "development",
    skipAuth: env.SKIP_AUTH === "true" || false,
  },
  firebase: {
    apiKey: assertEnv("FIREBASE_API_KEY"),
    authDomain: assertEnv("FIREBASE_AUTH_DOMAIN"),
    projectId: assertEnv("FIREBASE_PROJECT_ID"),
    storageBucket: assertEnv("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: assertEnv("FIREBASE_MESSAGING_SENDER_ID"),
    appId: assertEnv("FIREBASE_APP_ID"),
    measurementId: assertEnv("FIREBASE_MEASUREMENT_ID"),
    clientEmail: assertEnv("FIREBASE_CLIENT_EMAIL"),
    privateKey: formatPrivateKey(assertEnv("FIREBASE_PRIVATE_KEY")),
  },
};

// 4. Optional: Protect production from `skipAuth` misuse
if (
  rawConfig.app.environment === "production" &&
  rawConfig.app.skipAuth === true
) {
  throw new Error(`❌ 'SKIP_AUTH' cannot be set to "true" in production!`);
}

// 5. Provide a single exported `config` object
export const config: Config = rawConfig;

// 6. Log safe parts of the config (no secrets)
if (config.app.environment === "development") {
  console.log("📝 Environment Configuration (dev mode):", {
    environment: config.app.environment,
    port: config.app.port,
    projectId: config.firebase.projectId,
    skipAuth: config.app.skipAuth,
  });
} else {
  // In production, log less or log as structured JSON if desired
  console.log(
    `🚀 Running in ${config.app.environment} mode on port ${config.app.port}`
  );
}
