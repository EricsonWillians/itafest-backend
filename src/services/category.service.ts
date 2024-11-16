import { db } from "@/utils/firebase-admin.ts";
import type {
  Category,
  CategoryType,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryTree,
  CategoryStats,
  CategorySearchParams,
  CategoryValidationError,
  CategoryTagAssociation
} from "@/types/category.types.ts";
import type { Tag } from "@/types/business.types.ts";

export class CategoryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CategoryError';
  }
}

export class CategoryService {
  private readonly collectionName = 'categories';
  private readonly tagCollectionName = 'tags';
  private readonly businessCollectionName = 'businesses';

  constructor() {
    console.log(`🔥 Initializing CategoryService with collection: ${this.collectionName}`);
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
      throw new CategoryError('Failed to initialize category service', 'INIT_FAILED');
    }
  }

  private getCollection() {
    return db.collection(this.collectionName);
  }

  private getTagCollection() {
    return db.collection(this.tagCollectionName);
  }

  private getBusinessCollection() {
    return db.collection(this.businessCollectionName);
  }

  private async validateTags(tagIds: string[]): Promise<void> {
    if (!tagIds.length) return;

    const tagRefs = tagIds.map(id => this.getTagCollection().doc(id));
    const tagDocs = await db.getAll(...tagRefs);

    const invalidTags = tagDocs.filter(doc => !doc.exists);
    if (invalidTags.length > 0) {
      throw new CategoryError(
        `Invalid tag IDs: ${invalidTags.map(doc => doc.id).join(', ')}`,
        'INVALID_TAGS'
      );
    }
  }

  private async validateCategory(data: CreateCategoryDTO | UpdateCategoryDTO): Promise<void> {
    const errors: CategoryValidationError[] = [];

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push({
        field: 'name',
        message: 'Category name is required',
        code: 'INVALID_NAME'
      });
    }

    if ('parentId' in data && data.parentId) {
      const parentDoc = await this.getCollection().doc(data.parentId).get();
      if (!parentDoc.exists) {
        errors.push({
          field: 'parentId',
          message: 'Parent category does not exist',
          code: 'INVALID_PARENT'
        });
      }
    }

    if ('recommendedTags' in data && data.recommendedTags) {
      try {
        await this.validateTags(data.recommendedTags);
      } catch (error) {
        errors.push({
          field: 'recommendedTags',
          message: error.message,
          code: 'INVALID_TAGS'
        });
      }
    }

    if (errors.length > 0) {
      throw new CategoryError('Category validation failed', 'VALIDATION_ERROR');
    }
  }

  async createCategory(data: CreateCategoryDTO): Promise<Category> {
    try {
      console.log("📝 Preparing category data:", data);
      await this.validateCategory(data);

      const now = new Date();
      const slug = data.name.toLowerCase().replace(/\s+/g, '-');
      
      const categoryData = {
        ...data,
        slug,
        isActive: true,
        businessCount: 0,
        subCategories: [],
        createdAt: now,
        updatedAt: now
      };

      const docRef = this.getCollection().doc();
      await docRef.set(categoryData);

      // If this is a subcategory, update the parent
      if (data.parentId) {
        await this.getCollection().doc(data.parentId).update({
          subCategories: db.FieldValue.arrayUnion(docRef.id),
          updatedAt: now
        });
      }

      return {
        id: docRef.id,
        ...categoryData
      } as Category;

    } catch (error) {
      console.error("❌ Error in createCategory:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to create category', 'CREATE_FAILED');
    }
  }

  async getCategoryById(id: string): Promise<Category | null> {
    try {
      if (!id || id.trim().length === 0) {
        throw new CategoryError('Invalid category ID', 'INVALID_ID');
      }

      const docRef = this.getCollection().doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      // Fetch recommended tags details
      const data = doc.data();
      const tagDetails = await Promise.all(
        (data.recommendedTags || []).map(async (tagId: string) => {
          const tagDoc = await this.getTagCollection().doc(tagId).get();
          return tagDoc.exists ? tagDoc.data() : undefined;
        })
      );

      return {
        id: doc.id,
        ...data,
        recommendedTags: tagDetails.filter(tag => tag !== undefined)
      } as Category;

    } catch (error) {
      console.error("❌ Error in getCategoryById:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to fetch category', 'FETCH_FAILED');
    }
  }

  async getCategories(params: CategorySearchParams = {}): Promise<Category[]> {
    try {
      let query = this.getCollection();

      if (params.query) {
        query = query.where('name', '>=', params.query)
          .where('name', '<=', params.query + '\uf8ff');
      }

      if (params.parentId !== undefined) {
        query = query.where('parentId', '==', params.parentId);
      }

      if (params.isActive !== undefined) {
        query = query.where('isActive', '==', params.isActive);
      }

      if (params.type) {
        query = query.where('type', '==', params.type);
      }

      if (params.sortBy) {
        query = query.orderBy(params.sortBy, params.sortOrder || 'asc');
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.offset(params.offset);
      }

      const snapshot = await query.get();
      
      // Fetch tag details for all categories
      const categories = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const tagDetails = await Promise.all(
            (data.recommendedTags || []).map(async (tagId: string) => {
              const tagDoc = await this.getTagCollection().doc(tagId).get();
              return tagDoc.exists ? tagDoc.data() : undefined;
            })
          );

          return {
            id: doc.id,
            ...data,
            recommendedTags: tagDetails.filter(tag => tag !== undefined)
          };
        })
      );

      return categories as Category[];

    } catch (error) {
      console.error("❌ Error in getCategories:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to fetch categories', 'FETCH_FAILED');
    }
  }

  async updateCategory(id: string, data: UpdateCategoryDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new CategoryError('Invalid category ID', 'INVALID_ID');
      }

      await this.validateCategory(data);

      const docRef = this.getCollection().doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new CategoryError('Category not found', 'NOT_FOUND');
      }

      const currentData = doc.data();
      const now = new Date();

      // Handle parent category changes
      if (data.parentId !== undefined && data.parentId !== currentData.parentId) {
        await db.runTransaction(async (transaction) => {
          // Remove from old parent
          if (currentData.parentId) {
            const oldParentRef = this.getCollection().doc(currentData.parentId);
            transaction.update(oldParentRef, {
              subCategories: db.FieldValue.arrayRemove(id),
              updatedAt: now
            });
          }

          // Add to new parent
          if (data.parentId) {
            const newParentRef = this.getCollection().doc(data.parentId);
            transaction.update(newParentRef, {
              subCategories: db.FieldValue.arrayUnion(id),
              updatedAt: now
            });
          }

          // Update the category itself
          transaction.update(docRef, {
            ...data,
            updatedAt: now
          });
        });
      } else {
        // Simple update without parent changes
        await docRef.update({
          ...data,
          updatedAt: now
        });
      }

    } catch (error) {
      console.error("❌ Error in updateCategory:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to update category', 'UPDATE_FAILED');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new CategoryError('Invalid category ID', 'INVALID_ID');
      }

      const docRef = this.getCollection().doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new CategoryError('Category not found', 'NOT_FOUND');
      }

      const data = doc.data();

      // Check if category has businesses
      if (data.businessCount > 0) {
        throw new CategoryError(
          'Cannot delete category with active businesses',
          'HAS_BUSINESSES'
        );
      }

      await db.runTransaction(async (transaction) => {
        // Remove from parent category if exists
        if (data.parentId) {
          const parentRef = this.getCollection().doc(data.parentId);
          transaction.update(parentRef, {
            subCategories: db.FieldValue.arrayRemove(id),
            updatedAt: new Date()
          });
        }

        // Delete the category
        transaction.delete(docRef);
      });

    } catch (error) {
      console.error("❌ Error in deleteCategory:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to delete category', 'DELETE_FAILED');
    }
  }

  async getCategoryTree(rootId?: string): Promise<CategoryTree[]> {
    try {
      const buildTree = async (parentId: string | null = null): Promise<CategoryTree[]> => {
        const categories = await this.getCollection()
          .where('parentId', '==', parentId)
          .orderBy('displayOrder')
          .get();

        return Promise.all(
          categories.docs.map(async (doc) => {
            const data = doc.data();
            const children = await buildTree(doc.id);
            
            // Fetch tag suggestions for this branch
            const tagDocs = await Promise.all(
              (data.recommendedTags || []).map(tagId => 
                this.getTagCollection().doc(tagId).get()
              )
            );
            const tagSuggestions = tagDocs
              .filter(doc => doc.exists)
              .map(doc => ({ id: doc.id, ...doc.data() }));

            return {
              id: doc.id,
              name: data.name,
              slug: data.slug,
              type: data.type,
              description: data.description,
              icon: data.icon,
              isActive: data.isActive,
              displayOrder: data.displayOrder,
              metadata: data.metadata,
              children: children.length > 0 ? children : undefined,
              tagSuggestions: tagSuggestions.length > 0 ? tagSuggestions : undefined
            };
          })
        );
      };

      return rootId ? 
        buildTree(rootId) :
        buildTree(null);

    } catch (error) {
      console.error("❌ Error in getCategoryTree:", error);
      throw new CategoryError('Failed to fetch category tree', 'TREE_FETCH_FAILED');
    }
  }

  async getCategoryStats(categoryId: string): Promise<CategoryStats> {
    try {
      const docRef = this.getCollection().doc(categoryId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new CategoryError('Category not found', 'NOT_FOUND');
      }

      const data = doc.data();
      const businesses = await this.getBusinessCollection()
        .where('categories', 'array-contains', { id: categoryId, type: data.type })
        .get();

      const tagCounts = new Map<string, number>();
      let totalRating = 0;
      let ratingCount = 0;
      let premiumCount = 0;

      businesses.docs.forEach(business => {
        const businessData = business.data();
        
        // Count tags
        businessData.tags?.forEach((tag: { id: string }) => {
          tagCounts.set(tag.id, (tagCounts.get(tag.id) || 0) + 1);
        });

        // Count premium businesses
        if (businessData.subscriptionStatus === 'premium') {
          premiumCount++;
        }

        // Calculate average rating if available
        if (businessData.rating) {
          totalRating += businessData.rating;
          ratingCount++;
        }
      });

      // Sort tags by usage
      const popularTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tagId, count]) => ({ tagId, count }));

      return {
        categoryId,
        totalBusinesses: businesses.size,
        activeBusinesses: businesses.size, // Assuming all businesses are active
        premiumBusinesses: premiumCount,
        averageRating: ratingCount > 0 ? totalRating / ratingCount : undefined,
        popularTags,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error("❌ Error in getCategoryStats:", error);
      if (error instanceof CategoryError) {
        throw error;
      }
      throw new CategoryError('Failed to fetch category statistics', 'STATS_FAILED');
    }
  }
}

export default new CategoryService();