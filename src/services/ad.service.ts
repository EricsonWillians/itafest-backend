// src/services/ad.service.ts

import { db } from "@/utils/firebase-admin.ts";
import type { Ad, CreateAdDTO, UpdateAdDTO } from "@/types/ad.types.ts";

export class AdError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AdError";
  }
}

export class AdService {
  private collectionName = "ads";

  constructor() {
    console.log(`🔥 Initializing AdService with collection: ${this.collectionName}`);
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      const collections = await db.listCollections();
      const collectionExists = collections.some((col) => col.id === this.collectionName);

      if (!collectionExists) {
        console.log(`📝 Collection '${this.collectionName}' doesn't exist, will be created on first write`);
      } else {
        console.log(`✅ Collection '${this.collectionName}' exists`);
      }
    } catch (error) {
      console.error(`❌ Error checking collection existence: ${error}`);
      throw new AdError("Failed to initialize ad service", "INIT_FAILED");
    }
  }

  private getCollection() {
    return db.collection(this.collectionName);
  }

  private validateAdData(data: CreateAdDTO | UpdateAdDTO): void {
    if (!data) {
      throw new AdError("Ad data is required", "INVALID_DATA");
    }

    if ("title" in data && (!data.title || data.title.trim().length === 0)) {
      throw new AdError("Ad title is required", "INVALID_TITLE");
    }

    if ("startDate" in data && !(data.startDate instanceof Date)) {
      throw new AdError("Invalid start date", "INVALID_START_DATE");
    }

    if ("endDate" in data && !(data.endDate instanceof Date)) {
      throw new AdError("Invalid end date", "INVALID_END_DATE");
    }

    if ("budget" in data && (typeof data.budget !== "number" || data.budget < 0)) {
      throw new AdError("Invalid budget value", "INVALID_BUDGET");
    }
  }

  async createAd(data: CreateAdDTO): Promise<Ad> {
    try {
      console.log("📝 Preparing ad data:", data);
      this.validateAdData(data);

      const now = new Date();
      const adData: Ad = {
        ...data,
        impressions: 0,
        createdAt: now,
        updatedAt: now,
      };

      console.log("🔄 Getting Firestore collection reference...");
      const adsRef = this.getCollection();

      console.log("🔄 Attempting to add document to Firestore...");
      const docRef = await adsRef.add(adData);
      console.log("✅ Document written with ID:", docRef.id);

      // Verify the document was actually created
      const newDoc = await docRef.get();
      if (!newDoc.exists) {
        throw new AdError("Failed to create ad", "CREATE_FAILED");
      }

      return {
        id: docRef.id,
        ...adData,
      };
    } catch (error) {
      console.error("❌ Error in createAd:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to create ad", "CREATE_FAILED");
    }
  }

  async getAds(
    page = 1,
    pageSize = 10,
    filters?: { type?: string; status?: string; search?: string; sort?: keyof Ad }
  ): Promise<{ ads: Ad[]; total: number; hasMore: boolean }> {
    try {
      console.log("🔄 Getting ads with filters:", { page, pageSize, filters });

      // Validate pagination parameters
      if (page < 1 || pageSize < 1) {
        throw new AdError("Invalid pagination parameters", "INVALID_PAGINATION");
      }

      let query = this.getCollection();

      if (filters?.type) {
        query = query.where("type", "==", filters.type);
      }

      if (filters?.status) {
        query = query.where("status", "==", filters.status);
      }

      if (filters?.sort) {
        query = query.orderBy(filters.sort);
      }

      // Calculate the start position for pagination
      const startAt = (page - 1) * pageSize;

      // Get total count for pagination
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      if (total === 0) {
        return { ads: [], total: 0, hasMore: false };
      }

      // Apply pagination
      query = query.offset(startAt).limit(pageSize + 1);

      const snapshot = await query.get();
      console.log(`✅ Found ${snapshot.docs.length} ads`);

      const ads = snapshot.docs
        .slice(0, pageSize)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Ad[];

      return {
        ads,
        total,
        hasMore: snapshot.docs.length > pageSize,
      };
    } catch (error) {
      console.error("❌ Error in getAds:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to fetch ads", "FETCH_FAILED");
    }
  }

  async getAdById(id: string): Promise<Ad | null> {
    try {
      if (!id || id.trim().length === 0) {
        throw new AdError("Invalid ad ID", "INVALID_ID");
      }

      console.log(`🔄 Getting ad with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log("❌ Ad not found");
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Ad;
    } catch (error) {
      console.error("❌ Error in getAdById:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to fetch ad", "FETCH_FAILED");
    }
  }

  async updateAd(id: string, data: UpdateAdDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new AdError("Invalid ad ID", "INVALID_ID");
      }

      this.validateAdData(data);

      console.log(`🔄 Updating ad with ID: ${id}`);
      const docRef = this.getCollection().doc(id);

      // Check if document exists before updating
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new AdError("Ad not found", "NOT_FOUND");
      }

      await docRef.update({
        ...data,
        updatedAt: new Date(),
      });

      console.log("✅ Ad updated successfully");
    } catch (error) {
      console.error("❌ Error in updateAd:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to update ad", "UPDATE_FAILED");
    }
  }

  async deleteAd(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new AdError("Invalid ad ID", "INVALID_ID");
      }

      console.log(`🔄 Deleting ad with ID: ${id}`);
      const docRef = this.getCollection().doc(id);

      // Check if document exists before deleting
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new AdError("Ad not found", "NOT_FOUND");
      }

      await docRef.delete();
      console.log("✅ Ad deleted successfully");
    } catch (error) {
      console.error("❌ Error in deleteAd:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to delete ad", "DELETE_FAILED");
    }
  }

  async adExists(id: string): Promise<boolean> {
    try {
      if (!id || id.trim().length === 0) {
        throw new AdError("Invalid ad ID", "INVALID_ID");
      }

      const doc = await this.getCollection().doc(id).get();
      return doc.exists;
    } catch (error) {
      console.error("❌ Error checking ad existence:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to check ad existence", "CHECK_FAILED");
    }
  }

  async incrementImpressions(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new AdError("Invalid ad ID", "INVALID_ID");
      }

      console.log(`🔄 Incrementing impressions for ad ID: ${id}`);
      const docRef = this.getCollection().doc(id);

      // Check if document exists before updating
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new AdError("Ad not found", "NOT_FOUND");
      }

      await docRef.update({
        impressions: (doc.data().impressions || 0) + 1,
        updatedAt: new Date(),
      });

      console.log("✅ Impressions incremented successfully");
    } catch (error) {
      console.error("❌ Error in incrementImpressions:", error);
      if (error instanceof AdError) {
        throw error;
      }
      throw new AdError("Failed to increment impressions", "INCREMENT_FAILED");
    }
  }
}

export default new AdService();
