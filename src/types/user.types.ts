// src/types/user.types.ts

import { UserRole } from "./role.types.ts";

/**
 * Minimal shape of Firebase Authentication custom claims
 * used in your app to store roles, business references, etc.
 */
export interface CustomClaims {
  role?: UserRole | string;
  businessId?: string;
  // Add any other custom claim fields here
  [key: string]: unknown;
}
-
/**
 * ProviderInfo: When a user signs up or logs in with Google, Facebook, 
 * LinkedIn (via custom provider or OIDC), Apple, etc.
 * 
 * Examples of common provider IDs:
 * - 'google.com'
 * - 'facebook.com'
 * - 'password' (for email/password)
 * - 'phone' (for phone auth)
 * - 'apple.com'
 * - 'linkedin.com' (if you have a custom OIDC or SAML provider setup)
 */
export interface ProviderInfo {
  providerId: string; // e.g. 'google.com'
  uid?: string;       // Provider-specific user ID
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
}

/**
 * Main User interface. This can represent the "full" user object
 * that merges data from Firebase Auth + your Firestore `users` collection.
 */
export interface User {
  id: string;                    // Typically the Firebase UID
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;

  // Role-based access
  role: UserRole;                // The user's primary role
  roles?: UserRole[];            // If you allow multiple roles

  // Verification & Status
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  disabled?: boolean;            // Whether the user is disabled in Firebase
  businessId?: string;           // If the user owns a business
  customClaims?: CustomClaims;   // Additional claims

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;

  // Third-party auth providers
  providerData?: ProviderInfo[]; // e.g. If user logs in via Google, Facebook, etc.

  // Extended profile details
  bio?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;  // For LinkedIn profiles
    whatsapp?: string;  // If you store a separate WhatsApp contact
  };

  // Additional optional marketing or notification preferences
  marketingOptIn?: boolean;    // Whether user wants promotional emails, etc.
  pushNotifications?: boolean; // If user allows push notifications in mobile apps

  // Extended privacy or preference settings
  isProfilePublic?: boolean;   // If profile is publicly visible
  languagePreference?: string; // e.g. 'en', 'pt-BR', etc.
  timezone?: string;           // e.g. 'America/Sao_Paulo'
  
  // Expand with other fields that fit your app's domain
}

/**
 * DTO for creating a new user in your system.
 * Often, user creation might happen through client-side Firebase Auth,
 * but if you want a custom admin flow, use this interface.
 */
export interface CreateUserDTO {
  email: string;
  password?: string;        // If using password-based signup
  displayName?: string;
  phoneNumber?: string;
  role?: UserRole;
  businessId?: string;
  photoURL?: string;

  // Additional fields as needed
  bio?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  marketingOptIn?: boolean;
  pushNotifications?: boolean;
  isProfilePublic?: boolean;
  languagePreference?: string;
  timezone?: string;
}

/**
 * DTO for updating an existing user. 
 * Make all fields optional so the user can update only those they want.
 */
export interface UpdateUserDTO extends Partial<Omit<User, "id" | "createdAt" | "updatedAt">> {
  // No 'id' here, because ID is typically not updated
  // No 'createdAt' / 'updatedAt', because those are system-managed
}

/**
 * Interface to represent pagination or search queries for listing users
 */
export interface UserQueryParams {
  role?: UserRole;
  email?: string;
  businessId?: string;
  isEmailVerified?: boolean;

  // For pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: "createdAt" | "email" | "displayName";
  sortOrder?: "asc" | "desc";
}

/**
 * Interface for user search results, optionally including total count 
 * (useful for pagination).
 */
export interface UserSearchResults {
  users: User[];
  total: number;
}

/**
 * Interface for user login or sign-in info 
 * (if you're implementing your own custom auth endpoint).
 */
export interface SignInDTO {
  email: string;
  password: string;
}

/**
 * Interface for user custom claims update (Firebase Admin).
 * For example, an admin might set or revoke a role for a user.
 */
export interface UpdateUserClaimsDTO {
  uid: string; // The user's Firebase UID
  customClaims: CustomClaims;
}
