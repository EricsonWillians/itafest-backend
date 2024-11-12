// src/config/firebase.config.ts
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: Deno.env.get("FIREBASE_API_KEY") || "",
  authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN") || "",
  projectId: Deno.env.get("FIREBASE_PROJECT_ID") || "",
  storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET") || "",
  messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID") || "",
  appId: Deno.env.get("FIREBASE_APP_ID") || ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to emulators in development
if (Deno.env.get("DENO_ENV") === "development") {
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
  connectStorageEmulator(storage, "localhost", 9199);
  
  console.log("🔧 Using Firebase Emulators");
}

export { auth, db, storage };