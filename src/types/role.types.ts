// src/types/role.types.ts

/**
 * Enum listing the possible roles a user can have.
 * Feel free to add or remove roles based on your needs.
 */
export enum UserRole {
    ADMIN = "admin",
    BUSINESS_OWNER = "business_owner",
    MODERATOR = "moderator",
    USER = "user",
    // Add additional roles as needed
  }
  
  /**
   * If you store roles in an array or want more complexity 
   * (e.g., multi-tenant roles, granular permissions), 
   * you might define a more advanced Permission or 
   * Role interface here.
   */
  