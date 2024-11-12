// src/services/business.service.ts
import { db } from "@/utils/firebase-admin.ts";
import type { Business, CreateBusinessDTO, UpdateBusinessDTO } from "@/types/business.types.ts";

export class BusinessError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class BusinessService {
  private collectionName = 'businesses';

  constructor() {
    console.log(`🔥 Initializing BusinessService with collection: ${this.collectionName}`);
    this.initializeCollection();
  }

  private async initializeCollection() {
    try {
      const collections = await db.listCollections();
      const collectionExists = collections.some(col => col.id === this.collectionName);
      
      if (!collectionExists) {
        console.log(`📝 Collection '${this.collectionName}' doesn't exist, will be created on first write`);
      } else {
        console.log(`✅ Collection '${this.collectionName}' exists`);
      }
    } catch (error) {
      console.error(`❌ Error checking collection existence: ${error}`);
      throw new BusinessError('Failed to initialize business service', 'INIT_FAILED');
    }
  }

  private getCollection() {
    return db.collection(this.collectionName);
  }

  private validateBusinessData(data: CreateBusinessDTO | UpdateBusinessDTO): void {
    if (!data) {
      throw new BusinessError('Business data is required', 'INVALID_DATA');
    }

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      throw new BusinessError('Business name is required', 'INVALID_NAME');
    }

    if ('email' in data && data.email && !data.email.includes('@')) {
      throw new BusinessError('Invalid email format', 'INVALID_EMAIL');
    }
  }

  async createBusiness(data: CreateBusinessDTO): Promise<Business> {
    try {
      console.log("📝 Preparing business data:", data);
      this.validateBusinessData(data);
      
      const now = new Date();
      const businessData = {
        ...data,
        subscriptionStatus: 'free' as const,
        createdAt: now,
        updatedAt: now
      };

      console.log("🔄 Getting Firestore collection reference...");
      const businessesRef = this.getCollection();
      
      console.log("🔄 Attempting to add document to Firestore...");
      const docRef = await businessesRef.add(businessData);
      console.log("✅ Document written with ID:", docRef.id);

      // Verify the document was actually created
      const newDoc = await docRef.get();
      if (!newDoc.exists) {
        throw new BusinessError('Failed to create business', 'CREATE_FAILED');
      }

      return {
        id: docRef.id,
        ...businessData
      };
    } catch (error) {
      console.error("❌ Error in createBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to create business', 
        'CREATE_FAILED'
      );
    }
  }

  async getBusinesses(
    page = 1,
    pageSize = 10,
    filters?: { category?: string; search?: string; sort?: keyof Business }
  ): Promise<{ businesses: Business[]; total: number; hasMore: boolean }> {
    try {
      console.log("🔄 Getting businesses with filters:", { page, pageSize, filters });
      
      // Validate pagination parameters
      if (page < 1 || pageSize < 1) {
        throw new BusinessError('Invalid pagination parameters', 'INVALID_PAGINATION');
      }

      let query = this.getCollection();

      if (filters?.category) {
        query = query.where('category', '==', filters.category);
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
        return { businesses: [], total: 0, hasMore: false };
      }

      // Apply pagination
      query = query.offset(startAt).limit(pageSize + 1);

      const snapshot = await query.get();
      console.log(`✅ Found ${snapshot.docs.length} businesses`);

      const businesses = snapshot.docs
        .slice(0, pageSize)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Business[];

      return {
        businesses,
        total,
        hasMore: snapshot.docs.length > pageSize
      };
    } catch (error) {
      console.error("❌ Error in getBusinesses:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to fetch businesses', 
        'FETCH_FAILED'
      );
    }
  }

  async getBusinessById(id: string): Promise<Business | null> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      console.log(`🔄 Getting business with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        console.log("❌ Business not found");
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Business;
    } catch (error) {
      console.error("❌ Error in getBusinessById:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to fetch business', 
        'FETCH_FAILED'
      );
    }
  }

  async updateBusiness(id: string, data: UpdateBusinessDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      this.validateBusinessData(data);

      console.log(`🔄 Updating business with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      
      // Check if document exists before updating
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new BusinessError('Business not found', 'NOT_FOUND');
      }
      
      await docRef.update({
        ...data,
        updatedAt: new Date()
      });
      
      console.log("✅ Business updated successfully");
    } catch (error) {
      console.error("❌ Error in updateBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to update business', 
        'UPDATE_FAILED'
      );
    }
  }

  async deleteBusiness(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      console.log(`🔄 Deleting business with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      
      // Check if document exists before deleting
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new BusinessError('Business not found', 'NOT_FOUND');
      }

      await docRef.delete();
      console.log("✅ Business deleted successfully");
    } catch (error) {
      console.error("❌ Error in deleteBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to delete business', 
        'DELETE_FAILED'
      );
    }
  }

  async businessExists(id: string): Promise<boolean> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      const doc = await this.getCollection().doc(id).get();
      return doc.exists;
    } catch (error) {
      console.error("❌ Error checking business existence:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to check business existence', 
        'CHECK_FAILED'
      );
    }
  }

  async searchBusinesses(searchTerm: string, limit = 10): Promise<Business[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new BusinessError('Search term is required', 'INVALID_SEARCH');
      }

      if (limit < 1) {
        throw new BusinessError('Invalid limit parameter', 'INVALID_LIMIT');
      }

      const query = this.getCollection()
        .where('name', '>=', searchTerm)
        .where('name', '<=', searchTerm + '\uf8ff')
        .limit(limit);

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Business[];
    } catch (error) {
      console.error("❌ Error in searchBusinesses:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError(
        'Failed to search businesses', 
        'SEARCH_FAILED'
      );
    }
  }
}

export default new BusinessService();