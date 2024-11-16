import { db } from "@/utils/firebase-admin.ts";
import type { 
  Business, 
  CreateBusinessDTO, 
  UpdateBusinessDTO,
  TagReference 
} from "@/types/business.types.ts";
import type { 
  Category, 
  CategoryType 
} from "@/types/category.types.ts";
import type { Tag } from "@/types/tag.types.ts";
import { TagStatus } from "@/types/tag.types.ts";

export class BusinessError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export class BusinessService {
  private readonly collectionName = 'businesses';
  private readonly categoryCollectionName = 'categories';
  private readonly tagCollectionName = 'tags';

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

  private getCategoryCollection() {
    return db.collection(this.categoryCollectionName);
  }

  private getTagCollection() {
    return db.collection(this.tagCollectionName);
  }

  private async validateCategory(categoryId: string, type: CategoryType): Promise<void> {
    const categoryDoc = await this.getCategoryCollection().doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      throw new BusinessError('Invalid category ID', 'INVALID_CATEGORY');
    }

    const categoryData = categoryDoc.data() as Category;
    if (!categoryData.isActive) {
      throw new BusinessError('Category is not active', 'INACTIVE_CATEGORY');
    }

    if (categoryData.type !== type) {
      throw new BusinessError('Category type mismatch', 'CATEGORY_TYPE_MISMATCH');
    }
  }

  private async validateTags(tagIds: string[]): Promise<void> {
    if (!tagIds.length) return;

    const tagRefs = tagIds.map(id => this.getTagCollection().doc(id));
    const tagDocs = await db.getAll(...tagRefs);

    const invalidTags = tagDocs.filter(doc => !doc.exists);
    if (invalidTags.length > 0) {
      throw new BusinessError(
        `Invalid tag IDs: ${invalidTags.map(doc => doc.id).join(', ')}`,
        'INVALID_TAGS'
      );
    }

    // Check for inactive or deprecated tags
    const inactiveTags = tagDocs
      .filter(doc => doc.exists)
      .filter(doc => {
        const data = doc.data() as Tag;
        return data.status !== TagStatus.ACTIVE;
      });

    if (inactiveTags.length > 0) {
      throw new BusinessError(
        `Inactive or deprecated tags: ${inactiveTags.map(doc => doc.id).join(', ')}`,
        'INACTIVE_TAGS'
      );
    }
  }

  private async validateBusinessData(data: CreateBusinessDTO | UpdateBusinessDTO): Promise<void> {
    if (!data) {
      throw new BusinessError('Business data is required', 'INVALID_DATA');
    }

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      throw new BusinessError('Business name is required', 'INVALID_NAME');
    }

    if ('email' in data && data.email && !data.email.includes('@')) {
      throw new BusinessError('Invalid email format', 'INVALID_EMAIL');
    }

    // Validate categories if provided
    if ('categories' in data && data.categories) {
      await Promise.all(
        data.categories.map(cat => this.validateCategory(cat.id, cat.type))
      );
    }

    // Validate tags if provided
    if ('tags' in data && data.tags) {
      await this.validateTags(data.tags.map(tag => tag.id));
    }
  }

  async createBusiness(data: CreateBusinessDTO): Promise<Business> {
    try {
      console.log("📝 Preparing business data:", data);
      await this.validateBusinessData(data);
      
      const now = new Date();
      const businessData = {
        ...data,
        subscriptionStatus: 'free' as const,
        createdAt: now,
        updatedAt: now
      };
  
      console.log("🔄 Getting Firestore collection reference...");
      const businessesRef = this.getCollection();
      
      // Start a transaction to update business, categories, and tags
      const result = await db.runTransaction(async (transaction) => {
        // First, perform all reads
        const categoryDocs = await Promise.all(
          data.categories.map(category => 
            transaction.get(this.getCategoryCollection().doc(category.id))
          )
        );
  
        const tagDocs = await Promise.all(
          data.tags.map(tag => 
            transaction.get(this.getTagCollection().doc(tag.id))
          )
        );
  
        // Create the business document reference
        const docRef = businessesRef.doc();
  
        // Now perform all writes
        transaction.set(docRef, businessData);
  
        // Update category business counts
        categoryDocs.forEach((categoryDoc, index) => {
          if (categoryDoc.exists) {
            transaction.update(categoryDoc.ref, {
              businessCount: (categoryDoc.data()?.businessCount || 0) + 1,
              updatedAt: now
            });
          }
        });
  
        // Update tag usage counts
        tagDocs.forEach((tagDoc, index) => {
          if (tagDoc.exists) {
            transaction.update(tagDoc.ref, {
              useCount: (tagDoc.data()?.useCount || 0) + 1,
              lastUsed: now,
              updatedAt: now
            });
          }
        });
  
        return {
          id: docRef.id,
          ...businessData
        };
      });
  
      console.log("✅ Business created successfully with ID:", result.id);
      return result;
  
    } catch (error) {
      console.error("❌ Error in createBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('Failed to create business', 'CREATE_FAILED');
    }
  }

  async getBusinesses(
    page = 1,
    pageSize = 10,
    filters?: {
      categoryId?: string;
      categoryType?: CategoryType;
      tags?: string[];
      search?: string;
      sort?: keyof Business;
      subscriptionStatus?: 'free' | 'premium';
    }
  ): Promise<{ businesses: Business[]; total: number; hasMore: boolean }> {
    try {
      console.log("🔄 Getting businesses with filters:", { page, pageSize, filters });
      
      if (page < 1 || pageSize < 1) {
        throw new BusinessError('Invalid pagination parameters', 'INVALID_PAGINATION');
      }

      let query = this.getCollection();

      // Apply filters
      if (filters?.categoryId) {
        query = query.where('categories', 'array-contains', { id: filters.categoryId });
      }

      if (filters?.categoryType) {
        query = query.where('categories', 'array-contains-any', 
          filters.categoryId ? [{ id: filters.categoryId, type: filters.categoryType }] : 
          [{ type: filters.categoryType }]
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', 
          filters.tags.map(tagId => ({ id: tagId }))
        );
      }

      if (filters?.subscriptionStatus) {
        query = query.where('subscriptionStatus', '==', filters.subscriptionStatus);
      }

      if (filters?.sort) {
        query = query.orderBy(filters.sort);
      }

      const startAt = (page - 1) * pageSize;
      
      // Get total count
      const totalSnapshot = await query.count().get();
      const total = totalSnapshot.data().count;

      if (total === 0) {
        return { businesses: [], total: 0, hasMore: false };
      }

      // Apply pagination
      query = query.offset(startAt).limit(pageSize + 1);

      const snapshot = await query.get();
      console.log(`✅ Found ${snapshot.docs.length} businesses`);

      // Fetch category and tag details for each business
      const businesses = await Promise.all(
        snapshot.docs.slice(0, pageSize).map(async (doc) => {
          const data = doc.data();
          
          // Fetch category details
          const categoryDetails = await Promise.all(
            data.categories.map(async (cat: { id: string }) => {
              const categoryDoc = await this.getCategoryCollection()
                .doc(cat.id)
                .get();
              return categoryDoc.exists ? categoryDoc.data() : undefined;
            })
          );

          // Fetch tag details
          const tagDetails = await Promise.all(
            data.tags.map(async (tag: { id: string }) => {
              const tagDoc = await this.getTagCollection()
                .doc(tag.id)
                .get();
              return tagDoc.exists ? tagDoc.data() : undefined;
            })
          );

          return {
            id: doc.id,
            ...data,
            categories: data.categories.map((cat: { id: string }, index: number) => ({
              ...cat,
              details: categoryDetails[index]
            })),
            tags: data.tags.map((tag: { id: string }, index: number) => ({
              ...tag,
              details: tagDetails[index]
            }))
          };
        })
      ) as Business[];

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
      throw new BusinessError('Failed to fetch businesses', 'FETCH_FAILED');
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

      const data = docSnap.data();
      
      // Fetch category details
      const categoryDetails = await Promise.all(
        data.categories.map(async (cat: { id: string }) => {
          const categoryDoc = await this.getCategoryCollection()
            .doc(cat.id)
            .get();
          return categoryDoc.exists ? categoryDoc.data() : undefined;
        })
      );

      // Fetch tag details
      const tagDetails = await Promise.all(
        data.tags.map(async (tag: { id: string }) => {
          const tagDoc = await this.getTagCollection()
            .doc(tag.id)
            .get();
          return tagDoc.exists ? tagDoc.data() : undefined;
        })
      );

      return {
        id: docSnap.id,
        ...data,
        categories: data.categories.map((cat: { id: string }, index: number) => ({
          ...cat,
          details: categoryDetails[index]
        })),
        tags: data.tags.map((tag: { id: string }, index: number) => ({
          ...tag,
          details: tagDetails[index]
        }))
      } as Business;
    } catch (error) {
      console.error("❌ Error in getBusinessById:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('Failed to fetch business', 'FETCH_FAILED');
    }
  }

  async updateBusiness(id: string, data: UpdateBusinessDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      await this.validateBusinessData(data);

      console.log(`🔄 Updating business with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      
      // Start a transaction to handle category and tag updates
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw new BusinessError('Business not found', 'NOT_FOUND');
        }

        const currentData = doc.data();
        const now = new Date();

        // Handle category updates
        if (data.categories) {
          const removedCategories = (currentData.categories || [])
            .filter((oldCat: { id: string }) => 
              !data.categories.some(newCat => newCat.id === oldCat.id));

          const addedCategories = data.categories
            .filter(newCat => 
              !(currentData.categories || []).some((oldCat: { id: string }) => oldCat.id === newCat.id));

          // Update removed categories
          for (const category of removedCategories) {
            const categoryRef = this.getCategoryCollection().doc(category.id);
            const categoryDoc = await transaction.get(categoryRef);
            if (categoryDoc.exists) {
              transaction.update(categoryRef, {
                businessCount: Math.max((categoryDoc.data()?.businessCount || 1) - 1, 0),
                updatedAt: now
              });
            }
          }

          // Update added categories
          for (const category of addedCategories) {
            const categoryRef = this.getCategoryCollection().doc(category.id);
            const categoryDoc = await transaction.get(categoryRef);
            if (categoryDoc.exists) {
              transaction.update(categoryRef, {
                businessCount: (categoryDoc.data()?.businessCount || 0) + 1,
                updatedAt: now
              });
            }
          }
        }

        // Handle tag updates
        if (data.tags) {
          const removedTags = (currentData.tags || [])
            .filter((oldTag: { id: string }) => 
              !data.tags.some(newTag => newTag.id === oldTag.id));

          const addedTags = data.tags
            .filter(newTag => 
              !(currentData.tags || []).some((oldTag: { id: string }) => oldTag.id === newTag.id));

          // Update removed tags
          for (const tag of removedTags) {
            const tagRef = this.getTagCollection().doc(tag.id);
            const tagDoc = await transaction.get(tagRef);
            if (tagDoc.exists) {
              transaction.update(tagRef, {
                useCount: Math.max((tagDoc.data()?.useCount || 1) - 1, 0),
                updatedAt: now
              });
            }
          }

          // Update added tags
          for (const tag of addedTags) {
            const tagRef = this.getTagCollection().doc(tag.id);
            const tagDoc = await transaction.get(tagRef);
            if (tagDoc.exists) {
              transaction.update(tagRef, {
                useCount: (tagDoc.data()?.useCount || 0) + 1,
                lastUsed: now,
                updatedAt: now
              });
            }
          }
        }

        // Update the business document
        transaction.update(docRef, {
          ...data,
          updatedAt: now
        });
      });
      
      console.log("✅ Business updated successfully");
    } catch (error) {
      console.error("❌ Error in updateBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('Failed to update business', 'UPDATE_FAILED');
    }
  }

  async deleteBusiness(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new BusinessError('Invalid business ID', 'INVALID_ID');
      }

      console.log(`🔄 Deleting business with ID: ${id}`);
      const docRef = this.getCollection().doc(id);
      
      // Start a transaction to handle category and tag updates
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw new BusinessError('Business not found', 'NOT_FOUND');
        }

        const data = doc.data();
        const now = new Date();

        // Update category counts
        for (const category of (data.categories || [])) {
          const categoryRef = this.getCategoryCollection().doc(category.id);
          const categoryDoc = await transaction.get(categoryRef);
          if (categoryDoc.exists) {
            transaction.update(categoryRef, {
              businessCount: Math.max((categoryDoc.data()?.businessCount || 1) - 1, 0),
              updatedAt: now
            });
          }
        }

        // Update tag counts
        for (const tag of (data.tags || [])) {
          const tagRef = this.getTagCollection().doc(tag.id);
          const tagDoc = await transaction.get(tagRef);
          if (tagDoc.exists) {
            transaction.update(tagRef, {
              useCount: Math.max((tagDoc.data()?.useCount || 1) - 1, 0),
              updatedAt: now
            });
          }
        }

        // Delete the business document
        transaction.delete(docRef);
      });

      console.log("✅ Business deleted successfully");
    } catch (error) {
      console.error("❌ Error in deleteBusiness:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('Failed to delete business', 'DELETE_FAILED');
    }
  }

  async searchBusinesses(
    searchTerm: string,
    filters?: {
      categoryType?: CategoryType;
      tags?: string[];
      limit?: number;
    }
  ): Promise<Business[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new BusinessError('Search term is required', 'INVALID_SEARCH');
      }

      const limit = filters?.limit || 10;
      if (limit < 1) {
        throw new BusinessError('Invalid limit parameter', 'INVALID_LIMIT');
      }

      let query = this.getCollection()
        .where('name', '>=', searchTerm)
        .where('name', '<=', searchTerm + '\uf8ff');

      if (filters?.categoryType) {
        query = query.where('categories', 'array-contains', { type: filters.categoryType });
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.where('tags', 'array-contains-any', 
          filters.tags.map(tagId => ({ id: tagId }))
        );
      }

      query = query.limit(limit);
      const snapshot = await query.get();
      
      // Fetch category and tag details for search results
      const businesses = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Fetch category details
          const categoryDetails = await Promise.all(
            data.categories.map(async (cat: { id: string }) => {
              const categoryDoc = await this.getCategoryCollection()
                .doc(cat.id)
                .get();
              return categoryDoc.exists ? categoryDoc.data() : undefined;
            })
          );

          // Fetch tag details
          const tagDetails = await Promise.all(
            data.tags.map(async (tag: { id: string }) => {
              const tagDoc = await this.getTagCollection()
                .doc(tag.id)
                .get();
              return tagDoc.exists ? tagDoc.data() : undefined;
            })
          );

          return {
            id: doc.id,
            ...data,
            categories: data.categories.map((cat: { id: string }, index: number) => ({
              ...cat,
              details: categoryDetails[index]
            })),
            tags: data.tags.map((tag: { id: string }, index: number) => ({
              ...tag,
              details: tagDetails[index]
            }))
          };
        })
      ) as Business[];

      return businesses;
    } catch (error) {
      console.error("❌ Error in searchBusinesses:", error);
      if (error instanceof BusinessError) {
        throw error;
      }
      throw new BusinessError('Failed to search businesses', 'SEARCH_FAILED');
    }
  }

  async getBusinessesByTags(
    tags: string[],
    page = 1,
    pageSize = 10
  ): Promise<{ businesses: Business[]; total: number; hasMore: boolean }> {
    return this.getBusinesses(page, pageSize, { tags });
  }
}

export default new BusinessService();