/**
* Firebase Admin SDK Initialization Module
* 
* This module handles the initialization of Firebase Admin SDK and exports authenticated service instances.
* It ensures only one Firebase instance is created by checking for existing apps before initialization.
* The module uses environment variables for configuration and service account credentials.
*
* @module firebase-admin
* @requires firebase-admin/app
* @requires firebase-admin/firestore
* @requires firebase-admin/auth
* @requires firebase-admin/storage
*/

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

// Firebase app instance
let app: App;

/**
* Validates the required environment variables for Firebase initialization
* @throws {Error} If required environment variables are missing
*/
function validateEnvironment(): void {
 const credentialsPath = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS");
 if (!credentialsPath) {
   throw new Error(
     "Missing GOOGLE_APPLICATION_CREDENTIALS environment variable. " +
     "Please set it to the path of your service account JSON file."
   );
 }
}

/**
* Reads and validates the Firebase service account configuration
* @returns {Promise<Object>} Parsed service account configuration
* @throws {Error} If the service account file cannot be read or parsed
*/
async function loadServiceAccount() {
 try {
   const credentialsPath = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS")!;
   const serviceAccountJson = await Deno.readTextFile(credentialsPath);
   const serviceAccount = JSON.parse(serviceAccountJson);

   // Validate required fields
   const requiredFields = ['project_id', 'private_key', 'client_email'];
   const missingFields = requiredFields.filter(field => !serviceAccount[field]);

   if (missingFields.length > 0) {
     throw new Error(`Service account missing required fields: ${missingFields.join(', ')}`);
   }

   return serviceAccount;
 } catch (error) {
   if (error instanceof Deno.errors.NotFound) {
     throw new Error("Service account file not found. Please check the path in GOOGLE_APPLICATION_CREDENTIALS");
   }
   throw error;
 }
}

/**
* Initializes the Firebase Admin SDK
* Checks for existing instances to prevent duplicate initialization
* @returns {Promise<void>}
* @throws {Error} If initialization fails
*/
async function initializeFirebaseAdmin(): Promise<void> {
 try {
   console.log("🔥 Initializing Firebase Admin SDK...");
   
   // Validate environment setup
   validateEnvironment();
   
   // Check for existing Firebase instances
   const apps = getApps();
   if (apps.length > 0) {
     console.log("♻️ Reusing existing Firebase Admin app");
     app = apps[0];
     return;
   }

   // Load and validate service account
   const serviceAccount = await loadServiceAccount();

   // Log initialization details (without sensitive data)
   console.log("🔧 Service Account Configuration:", {
     project_id: serviceAccount.project_id,
     client_email: serviceAccount.client_email,
     has_private_key: !!serviceAccount.private_key,
     environment: Deno.env.get("DENO_ENV") || "development"
   });

   // Initialize Firebase Admin SDK
   app = initializeApp({
     credential: cert(serviceAccount),
     projectId: serviceAccount.project_id,
     storageBucket: `${serviceAccount.project_id}.appspot.com`
   });

   console.log("✅ Firebase Admin SDK initialized successfully");
 } catch (error) {
   console.error("❌ Firebase Admin initialization failed:", error);
   throw new Error(`Firebase Admin initialization failed: ${error.message}`);
 }
}

// Initialize Firebase Admin SDK
await initializeFirebaseAdmin();

/**
* Firebase service instances
* These are initialized only after successful Firebase Admin SDK initialization
* @exports auth - Firebase Authentication instance
* @exports db - Firestore Database instance
* @exports storage - Cloud Storage instance
*/
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: Storage = getStorage(app);

/**
* Re-export Firebase app instance for advanced use cases
* @exports app - Firebase Admin App instance
*/
export { app };