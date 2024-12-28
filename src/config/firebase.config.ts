import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

async function initializeFirebase() {
  console.log("🔥 Initializing Firebase Admin SDK...");

  try {
    // First try reading from GOOGLE_APPLICATION_CREDENTIALS
    try {
      const app = initializeApp({
        credential: applicationDefault()
      });
      console.log("✅ Firebase Admin SDK initialized with application default credentials");
      return app;
    } catch (e) {
      console.log("⚠️ Could not initialize with default credentials, trying direct file read...");
    }

    // If that fails, try reading the file directly
    try {
      const serviceAccountPath = Deno.env.get("GOOGLE_APPLICATION_CREDENTIALS");
      if (!serviceAccountPath) {
        throw new Error("GOOGLE_APPLICATION_CREDENTIALS environment variable not set");
      }

      const serviceAccountJson = await Deno.readTextFile(serviceAccountPath);
      const serviceAccount = JSON.parse(serviceAccountJson);

      // Debug logging
      console.log("Service Account Debug:", {
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email,
        has_private_key: !!serviceAccount.private_key,
      });

      const app = initializeApp({
        credential: cert(serviceAccount)
      });

      console.log("✅ Firebase Admin SDK initialized with service account file");
      return app;
    } catch (e) {
      console.error("❌ Failed to initialize with service account file:", e);
      throw e;
    }
  } catch (error) {
    console.error("❌ All Firebase initialization attempts failed:", error);
    throw error;
  }
}

// Initialize services
const app = await initializeFirebase();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };