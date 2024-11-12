// src/config/env.config.ts
import { load } from "dotenv";

const env = await load();

// Helper function to format private key
function formatPrivateKey(key: string): string {
  // If the key already contains newlines, return it as is
  if (key.includes('\n')) {
    return key;
  }

  // Remove "BEGIN PRIVATE KEY", "END PRIVATE KEY" and newlines if present
  const privateKeyContent = key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '');

  // Add back the header, footer, and proper newlines
  return `-----BEGIN PRIVATE KEY-----\n${privateKeyContent}\n-----END PRIVATE KEY-----`;
}

export const config = {
  app: {
    port: Number(env.PORT) || 8000,
    environment: env.DENO_ENV || "development",
    skipAuth: env.SKIP_AUTH === "true" || false
  },
  firebase: {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID,
    measurementId: env.FIREBASE_MEASUREMENT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: formatPrivateKey(env.FIREBASE_PRIVATE_KEY || '')
  }
};

// Log configuration (excluding sensitive data)
console.log("📝 Environment Configuration loaded:", {
  environment: config.app.environment,
  port: config.app.port,
  projectId: config.firebase.projectId,
  skipAuth: config.app.skipAuth
});