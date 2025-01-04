// src/services/event.service.ts

import { db } from "@/utils/firebase-admin.ts";
import type { Event, CreateEventDTO, UpdateEventDTO } from "@/types/event.types.ts";
import type { Business } from "@/types/business.types.ts";
import { BusinessError } from "@/services/business.service.ts";

// Optional: If you want category referencing in events
import type { Category, CategoryType } from "@/types/category.types.ts";

/**
 * Custom error class for Event-related operations.
 * Provides an error message and a code that helps distinguish
 * specific failure scenarios (e.g., "INVALID_ID", "NOT_FOUND").
 */
export class EventError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'EventError';
    this.code = code;
  }
}

/**
 * EventService provides CRUD operations for managing events, 
 * including validation against a valid business, optional category checks, 
 * and Firestore transaction-based updates.
 */
export class EventService {
  private readonly collectionName = "events";
  private readonly businessCollectionName = "businesses";
  // Optional: If you plan to associate categories with events
  private readonly categoryCollectionName = "categories";

  constructor() {
    console.log(`🔥 Initializing EventService with collection: ${this.collectionName}`);
    this.initializeCollection();
  }

  /**
   * Checks for the existence of the Events collection; creates it on first write if needed.
   */
  private async initializeCollection() {
    try {
      const collections = await db.listCollections();
      const collectionExists = collections.some(col => col.id === this.collectionName);

      if (!collectionExists) {
        console.log(`📝 Collection '${this.collectionName}' doesn't exist, will be created on first write.`);
      } else {
        console.log(`✅ Collection '${this.collectionName}' exists`);
      }
    } catch (error) {
      console.error(`❌ Error checking event collection existence: ${error}`);
      throw new EventError("Failed to initialize EventService", "INIT_FAILED");
    }
  }

  private getCollection() {
    return db.collection(this.collectionName);
  }

  private getBusinessCollection() {
    return db.collection(this.businessCollectionName);
  }

  // Optional: If you want to manage event categories
  private getCategoryCollection() {
    return db.collection(this.categoryCollectionName);
  }

  /**
   * Validates the associated business by checking if the given businessId exists.
   */
  private async validateBusiness(businessId: string): Promise<void> {
    const businessDoc = await this.getBusinessCollection().doc(businessId).get();
    if (!businessDoc.exists) {
      throw new EventError(`Business with ID '${businessId}' does not exist.`, "INVALID_BUSINESS");
    }
    const businessData = businessDoc.data() as Business;
    // Optionally check if the business is active, if you have such a flag
    // e.g., if (!businessData.isActive) throw new EventError("Business is not active", "INACTIVE_BUSINESS");
  }

  /**
   * Optional: Validate category (if your events must also be under specific category types).
   */
  private async validateCategory(categoryId: string, type: CategoryType): Promise<void> {
    const categoryDoc = await this.getCategoryCollection().doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new EventError("Invalid category ID", "INVALID_CATEGORY");
    }

    const categoryData = categoryDoc.data() as Category;
    if (!categoryData.isActive) {
      throw new EventError("Category is not active", "INACTIVE_CATEGORY");
    }

    if (categoryData.type !== type) {
      throw new EventError("Category type mismatch", "CATEGORY_TYPE_MISMATCH");
    }
  }

  /**
   * Common validation for event creation and update data.
   */
  private async validateEventData(data: CreateEventDTO | UpdateEventDTO): Promise<void> {
    if (!data) {
      throw new EventError("Event data is required", "INVALID_DATA");
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new EventError("Event title is required", "INVALID_TITLE");
    }

    if (!data.date) {
      throw new EventError("Event date is required", "INVALID_DATE");
    }

    // Validate that the business exists
    if ("businessId" in data && data.businessId) {
      await this.validateBusiness(data.businessId);
    }

    // If you have categories in events
    if ("categoryId" in data && data.categoryId && "categoryType" in data && data.categoryType) {
      await this.validateCategory(data.categoryId, data.categoryType);
    }
  }

  /**
   * Creates a new event, references the valid business, and updates category usage if applicable.
   */
  async createEvent(data: CreateEventDTO): Promise<Event> {
    try {
      console.log("📝 Preparing event data:", data);
      await this.validateEventData(data);

      const now = new Date();
      const eventData: Partial<Event> = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      const eventsRef = this.getCollection();

      const result = await db.runTransaction(async (transaction) => {
        // Validate the business inside the transaction too, to ensure consistency
        const businessDocRef = this.getBusinessCollection().doc(data.businessId);
        const businessSnap = await transaction.get(businessDocRef);
        if (!businessSnap.exists) {
          throw new EventError("Business not found", "INVALID_BUSINESS");
        }

        // Optionally handle category usage, if you have business logic around event categories
        let categoryDocRef = null;
        if (data.categoryId) {
          categoryDocRef = this.getCategoryCollection().doc(data.categoryId);
          const categorySnap = await transaction.get(categoryDocRef);
          if (!categorySnap.exists) {
            throw new EventError("Invalid category ID", "INVALID_CATEGORY");
          }
          // For example, increment an "eventCount" on the category
          transaction.update(categoryDocRef, {
            eventCount: (categorySnap.data()?.eventCount || 0) + 1,
            updatedAt: now,
          });
        }

        // Create the event document
        const docRef = eventsRef.doc();
        transaction.set(docRef, eventData);

        return {
          id: docRef.id,
          ...eventData,
        };
      });

      console.log("✅ Event created successfully with ID:", result.id);
      return result as Event;
    } catch (error) {
      console.error("❌ Error in createEvent:", error);
      // Decide if you want to throw a known error or a generic one
      throw error instanceof EventError
        ? error
        : new EventError("Failed to create event", "CREATE_FAILED");
    }
  }

  /**
   * Retrieves a list of events, with optional pagination. 
   * You might also add advanced filtering logic (by category, date range, etc.).
   */
  async getEvents(page = 1, pageSize = 10): Promise<{ events: Event[]; total: number; hasMore: boolean }> {
    try {
      console.log("🔄 Getting events:", { page, pageSize });
      if (page < 1 || pageSize < 1) {
        throw new EventError("Invalid pagination parameters", "INVALID_PAGINATION");
      }

      // Get total count
      let queryRef = this.getCollection();
      const totalSnapshot = await queryRef.count().get();
      const total = totalSnapshot.data().count || 0;

      if (total === 0) {
        return { events: [], total: 0, hasMore: false };
      }

      // Apply ordering and pagination
      const startAt = (page - 1) * pageSize;
      queryRef = queryRef.orderBy("date", "asc").offset(startAt).limit(pageSize + 1);

      const snapshot = await queryRef.get();
      console.log(`✅ Found ${snapshot.docs.length} events`);

      const events = snapshot.docs.slice(0, pageSize).map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Event;
      });

      return {
        events,
        total,
        hasMore: snapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error("❌ Error in getEvents:", error);
      throw error instanceof EventError
        ? error
        : new EventError("Failed to fetch events", "FETCH_FAILED");
    }
  }

  /**
   * Retrieves a single event by ID. 
   * Optionally fetch and attach business or category details if needed.
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      if (!id || id.trim().length === 0) {
        throw new EventError("Invalid event ID", "INVALID_ID");
      }

      console.log(`🔄 Getting event with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log("❌ Event not found");
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Event;
    } catch (error) {
      console.error("❌ Error in getEventById:", error);
      throw error instanceof EventError
        ? error
        : new EventError("Failed to fetch event", "FETCH_FAILED");
    }
  }

  /**
   * Updates event details. Includes transaction-based updates to categories (if used).
   */
  async updateEvent(id: string, data: UpdateEventDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new EventError("Invalid event ID", "INVALID_ID");
      }

      // Basic validation of new data
      await this.validateEventData(data);

      console.log(`🔄 Updating event with ID: ${id}`);
      const docRef = this.getCollection().doc(id);

      await db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(docRef);
        if (!eventDoc.exists) {
          throw new EventError("Event not found", "NOT_FOUND");
        }

        const currentData = eventDoc.data() as Event;
        const now = new Date();

        // If you manage categories for events
        if (data.categoryId) {
          // Handle old category vs. new category
          const oldCategoryId = currentData.categoryId;
          if (oldCategoryId && oldCategoryId !== data.categoryId) {
            // Decrement count from old category
            const oldCatRef = this.getCategoryCollection().doc(oldCategoryId);
            const oldCatDoc = await transaction.get(oldCatRef);
            if (oldCatDoc.exists) {
              transaction.update(oldCatRef, {
                eventCount: Math.max((oldCatDoc.data()?.eventCount || 1) - 1, 0),
                updatedAt: now,
              });
            }

            // Increment count in new category
            const newCatRef = this.getCategoryCollection().doc(data.categoryId);
            const newCatDoc = await transaction.get(newCatRef);
            if (newCatDoc.exists) {
              transaction.update(newCatRef, {
                eventCount: (newCatDoc.data()?.eventCount || 0) + 1,
                updatedAt: now,
              });
            }
          }
        }

        // Update the event document
        transaction.update(docRef, {
          ...data,
          updatedAt: now,
        });
      });

      console.log("✅ Event updated successfully");
    } catch (error) {
      console.error("❌ Error in updateEvent:", error);
      throw error instanceof EventError
        ? error
        : new EventError("Failed to update event", "UPDATE_FAILED");
    }
  }

  /**
   * Deletes an event and updates associated category usage counts (if relevant).
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new EventError("Invalid event ID", "INVALID_ID");
      }

      console.log(`🔄 Deleting event with ID: ${id}`);
      const docRef = this.getCollection().doc(id);

      await db.runTransaction(async (transaction) => {
        const eventDoc = await transaction.get(docRef);
        if (!eventDoc.exists) {
          throw new EventError("Event not found", "NOT_FOUND");
        }

        const data = eventDoc.data() as Event;
        const now = new Date();

        // If you manage categories for events
        if (data.categoryId) {
          const categoryRef = this.getCategoryCollection().doc(data.categoryId);
          const categoryDoc = await transaction.get(categoryRef);
          if (categoryDoc.exists) {
            transaction.update(categoryRef, {
              eventCount: Math.max((categoryDoc.data()?.eventCount || 1) - 1, 0),
              updatedAt: now,
            });
          }
        }

        // Finally, delete the event itself
        transaction.delete(docRef);
      });

      console.log("✅ Event deleted successfully");
    } catch (error) {
      console.error("❌ Error in deleteEvent:", error);
      throw error instanceof EventError
        ? error
        : new EventError("Failed to delete event", "DELETE_FAILED");
    }
  }

  /**
   * Searches events by title (and optionally by category, tags, date range, or other fields).
   */
  async searchEvents(
    searchTerm: string,
    filters?: { categoryId?: string; limit?: number }
  ): Promise<Event[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new EventError("Search term is required", "INVALID_SEARCH");
      }
      const limitVal = filters?.limit || 10;
      if (limitVal < 1) {
        throw new EventError("Invalid limit parameter", "INVALID_LIMIT");
      }

      let queryRef = this.getCollection()
        .where("title", ">=", searchTerm)
        .where("title", "<=", searchTerm + "\uf8ff")
        .limit(limitVal);

      if (filters?.categoryId) {
        queryRef = queryRef.where("categoryId", "==", filters.categoryId);
      }

      const snapshot = await queryRef.get();
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        } as Event;
      });

      return events;
    } catch (error) {
      console.error("❌ Error in searchEvents:", error);
      throw error instanceof EventError
        ? error
        : new EventError("Failed to search events", "SEARCH_FAILED");
    }
  }
}
