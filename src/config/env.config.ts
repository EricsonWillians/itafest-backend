import { load } from "dotenv";

// Define required environment variables
const REQUIRED_ENV_VARS = {
  app: ['PORT', 'DENO_ENV', 'SKIP_AUTH'],
  firebase: [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ]
} as const;

/**
 * Load environment variables with better error handling
 */
async function loadEnvConfig() {
  try {
    const env = await load();
    console.log("📝 Environment variables loaded successfully");
    return env;
  } catch (error) {
    console.error("❌ Failed to load environment variables:", error);
    throw new Error("Failed to load environment configuration");
  }
}

/**
 * Validate that an environment variable exists and has a value
 */
function assertEnv(env: Record<string, string>, key: string): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

/**
 * Format private key with improved handling of various formats
 */
function formatPrivateKey(key: string): string {
  try {
    // Remove any surrounding quotes
    key = key.replace(/^['"]|['"]$/g, '');
    
    // Check if it's already properly formatted
    if (key.includes("-----BEGIN PRIVATE KEY-----") && 
        key.includes("-----END PRIVATE KEY-----")) {
      return key;
    }

    // Handle escaped newlines
    const cleanKey = key
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, '\n')
      .trim();

    const formattedKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;

    // Validate the formatted key
    if (!formattedKey.match(/-----BEGIN PRIVATE KEY-----\n.+\n-----END PRIVATE KEY-----/s)) {
      throw new Error("Invalid private key format after processing");
    }

    return formattedKey;
  } catch (error) {
    console.error("❌ Failed to format private key:", error);
    throw new Error("Invalid private key format");
  }
}

/**
 * Validate all required environment variables
 */
function validateConfig(env: Record<string, string>) {
  const missing: string[] = [];

  Object.values(REQUIRED_ENV_VARS).flat().forEach(key => {
    if (!env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Load and process configuration
const env = await loadEnvConfig();
validateConfig(env);

const environment = env.DENO_ENV || "development";
const skipAuth = env.SKIP_AUTH === "true" || false;

// Production safety checks
if (environment === "production") {
  if (skipAuth) {
    throw new Error("SKIP_AUTH cannot be set to 'true' in production!");
  }
  
  if (!env.FIREBASE_PRIVATE_KEY?.includes("PRIVATE KEY")) {
    throw new Error("Invalid Firebase private key format in production!");
  }
}

// Build the configuration object
const rawConfig = {
  app: {
    port: Number(env.PORT) || 8000,
    environment,
    skipAuth,
  },
  firebase: {
    apiKey: assertEnv(env, "FIREBASE_API_KEY"),
    authDomain: assertEnv(env, "FIREBASE_AUTH_DOMAIN"),
    projectId: assertEnv(env, "FIREBASE_PROJECT_ID"),
    storageBucket: assertEnv(env, "FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: assertEnv(env, "FIREBASE_MESSAGING_SENDER_ID"),
    appId: assertEnv(env, "FIREBASE_APP_ID"),
    measurementId: assertEnv(env, "FIREBASE_MEASUREMENT_ID"),
    clientEmail: assertEnv(env, "FIREBASE_CLIENT_EMAIL"),
    privateKey: formatPrivateKey(assertEnv(env, "FIREBASE_PRIVATE_KEY")),
  },
};

// Environment-specific logging
if (environment === "development") {
  console.log("📝 Development Configuration:", {
    environment,
    port: rawConfig.app.port,
    projectId: rawConfig.firebase.projectId,
    skipAuth,
    clientEmail: rawConfig.firebase.clientEmail,
  });
} else {
  console.log(`🚀 Production Configuration:`, {
    environment,
    port: rawConfig.app.port,
    projectId: rawConfig.firebase.projectId,
    clientEmail: rawConfig.firebase.clientEmail,
    privateKeyValid: rawConfig.firebase.privateKey.includes("PRIVATE KEY"),
  });
}

// Type definitions
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

export interface Config {
  app: AppConfig;
  firebase: FirebaseConfig;
}

// Export the final configuration
export const config: Config = {
  app: rawConfig.app,
  firebase: rawConfig.firebase,
};

// Additional validation of the final config
Object.freeze(config);