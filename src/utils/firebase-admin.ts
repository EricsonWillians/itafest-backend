// src/utils/firebase-admin.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { config } from "@/config/env.config.ts";

console.log("🔥 Initializing Firebase Admin SDK...");

let auth;
let db;
let storage;
let app;

try {
  // Initialize Firebase Admin if not already initialized
  const apps = getApps();
  app = apps.length === 0 
    ? initializeApp({
        credential: cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket
      })
    : apps[0];

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Set up emulators in development
  if (config.app.environment === "development") {
    console.log("🔧 Setting up Firebase Emulators...");
    try {
      const EMULATOR_HOST_AUTH = "localhost:9099";
      const EMULATOR_HOST_FIRESTORE = "localhost:8080";
      const EMULATOR_HOST_STORAGE = "localhost:9199";

      process.env.FIREBASE_AUTH_EMULATOR_HOST = EMULATOR_HOST_AUTH;
      process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST_FIRESTORE;
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = EMULATOR_HOST_STORAGE;
      
      console.log("✅ Successfully configured Firebase Emulators");
    } catch (error) {
      console.error("❌ Error configuring emulators:", error);
    }
  }

  console.log("✅ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("❌ Error initializing Firebase Admin SDK:", error);
  throw error;
}

export { app, auth, db, storage };