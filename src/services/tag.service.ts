import { db } from "@/utils/firebase-admin.ts";
import type {
  Tag,
  CreateTagDTO,
  UpdateTagDTO,
  TagStats,
  TagSearchParams,
  TagValidationError,
  TagMergeOperation,
  TagSuggestion,
  TagSuggestionReason,
  BulkTagOperation,
  TagRelationship,
  TagRelationType,
  TagAnalytics,
  TagLocalization,
  TagValidationRule,
  TagExportFormat
} from "@/types/tag.types.ts";
import { 
  TagStatus,
  TagVisibility
} from "@/types/tag.types.ts";
import type { CategoryType } from "@/types/category.types.ts";

export class TagError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TagError';
  }
}

export class TagService {
  private readonly collectionName = 'tags';
  private readonly relationshipsCollection = 'tag_relationships';
  private readonly localizationsCollection = 'tag_localizations';
  private readonly analyticsCollection = 'tag_analytics';

  constructor() {
    console.log(`🔥 Initializing TagService with collection: ${this.collectionName}`);
    this.initializeCollections();
  }

  private async initializeCollections() {
    try {
      const collections = await db.listCollections();
      const collectionsToCheck = [
        this.collectionName,
        this.relationshipsCollection,
        this.localizationsCollection,
        this.analyticsCollection
      ];

      collectionsToCheck.forEach(name => {
        const exists = collections.some(col => col.id === name);
        console.log(`${exists ? '✅' : '📝'} Collection '${name}' ${exists ? 'exists' : "doesn't exist, will be created on first write"}`);
      });
    } catch (error) {
      console.error(`❌ Error checking collections existence:`, error);
      throw new TagError('Failed to initialize tag service', 'INIT_FAILED');
    }
  }

  private getCollection(collection: string = this.collectionName) {
    return db.collection(collection);
  }

  private async validateTag(data: CreateTagDTO | UpdateTagDTO): Promise<void> {
    const errors: TagValidationError[] = [];
    
    // Define validation rules
    const rules: TagValidationRule[] = [
      {
        rule: 'required',
        field: 'name',
        message: 'Tag name is required',
        validator: (value) => !!value && value.trim().length > 0
      },
      {
        rule: 'length',
        field: 'name',
        params: { min: 2, max: 50 },
        message: 'Tag name must be between 2 and 50 characters',
        validator: (value) => value.length >= 2 && value.length <= 50
      },
      {
        rule: 'format',
        field: 'color',
        message: 'Invalid color format',
        validator: (value) => !value || /^#[0-9A-Fa-f]{6}$/.test(value)
      }
    ];

    // Run validations
    for (const rule of rules) {
      if (rule.field in data) {
        const isValid = await rule.validator(data[rule.field]);
        if (!isValid) {
          errors.push({
            field: rule.field,
            message: rule.message,
            code: `INVALID_${rule.field.toUpperCase()}`
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new TagError('Tag validation failed', 'VALIDATION_ERROR');
    }
  }

  async createTag(data: CreateTagDTO): Promise<Tag> {
    try {
      console.log("📝 Preparing tag data:", data);
      await this.validateTag(data);

      const now = new Date();
      const slug = data.name.toLowerCase().replace(/\s+/g, '-');

      const tagData = {
        ...data,
        slug,
        useCount: 0,
        status: TagStatus.ACTIVE,
        visibility: data.visibility || TagVisibility.PUBLIC,
        metadata: {
          isCustom: data.metadata?.isCustom ?? false,
          isFeatured: data.metadata?.isFeatured ?? false,
          synonyms: data.metadata?.synonyms ?? [],
          language: data.metadata?.language ?? 'en',
          seoKeywords: data.metadata?.seoKeywords ?? []
        },
        createdAt: now,
        updatedAt: now
      };

      const docRef = this.getCollection().doc();
      await docRef.set(tagData);

      return {
        id: docRef.id,
        ...tagData
      } as Tag;

    } catch (error) {
      console.error("❌ Error in createTag:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to create tag', 'CREATE_FAILED');
    }
  }

  async getTagById(id: string): Promise<Tag | null> {
    try {
      if (!id || id.trim().length === 0) {
        throw new TagError('Invalid tag ID', 'INVALID_ID');
      }

      const doc = await this.getCollection().doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Tag;

    } catch (error) {
      console.error("❌ Error in getTagById:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to fetch tag', 'FETCH_FAILED');
    }
  }

  async searchTags(params: TagSearchParams): Promise<Tag[]> {
    try {
      let query = this.getCollection();

      if (params.query) {
        const queryLower = params.query.toLowerCase();
        query = query.where('name', '>=', queryLower)
          .where('name', '<=', queryLower + '\uf8ff');
      }

      if (params.status) {
        query = query.where('status', '==', params.status);
      }

      if (params.visibility) {
        query = query.where('visibility', '==', params.visibility);
      }

      if (params.categories) {
        query = query.where('relevantCategories', 'array-contains-any', params.categories);
      }

      if (params.isCustom !== undefined) {
        query = query.where('metadata.isCustom', '==', params.isCustom);
      }

      if (params.isFeatured !== undefined) {
        query = query.where('metadata.isFeatured', '==', params.isFeatured);
      }

      if (params.minUseCount !== undefined) {
        query = query.where('useCount', '>=', params.minUseCount);
      }

      if (params.language) {
        query = query.where('metadata.language', '==', params.language);
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
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];

    } catch (error) {
      console.error("❌ Error in searchTags:", error);
      throw new TagError('Failed to search tags', 'SEARCH_FAILED');
    }
  }

  async updateTag(id: string, data: UpdateTagDTO): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new TagError('Invalid tag ID', 'INVALID_ID');
      }

      await this.validateTag(data);

      const docRef = this.getCollection().doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TagError('Tag not found', 'NOT_FOUND');
      }

      await docRef.update({
        ...data,
        updatedAt: new Date()
      });

    } catch (error) {
      console.error("❌ Error in updateTag:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to update tag', 'UPDATE_FAILED');
    }
  }

  async deleteTag(id: string): Promise<void> {
    try {
      if (!id || id.trim().length === 0) {
        throw new TagError('Invalid tag ID', 'INVALID_ID');
      }

      const docRef = this.getCollection().doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TagError('Tag not found', 'NOT_FOUND');
      }

      const tagData = doc.data();
      if (tagData.useCount > 0) {
        throw new TagError(
          'Cannot delete tag that is in use',
          'TAG_IN_USE'
        );
      }

      // Delete related data in a transaction
      await db.runTransaction(async (transaction) => {
        // Delete relationships
        const relationships = await this.getCollection(this.relationshipsCollection)
          .where('sourceTagId', '==', id)
          .get();
        relationships.forEach(rel => transaction.delete(rel.ref));

        // Delete localizations
        const localizations = await this.getCollection(this.localizationsCollection)
          .where('tagId', '==', id)
          .get();
        localizations.forEach(loc => transaction.delete(loc.ref));

        // Delete the tag itself
        transaction.delete(docRef);
      });

    } catch (error) {
      console.error("❌ Error in deleteTag:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to delete tag', 'DELETE_FAILED');
    }
  }

  async getTagStats(id: string): Promise<TagStats> {
    try {
      const tag = await this.getTagById(id);
      if (!tag) {
        throw new TagError('Tag not found', 'NOT_FOUND');
      }

      // Get businesses using this tag
      const businesses = await db.collection('businesses')
        .where('tags', 'array-contains', { id })
        .get();

      // Calculate category breakdown
      const categoryBreakdown = new Map<CategoryType, number>();
      businesses.docs.forEach(doc => {
        const businessData = doc.data();
        businessData.categories.forEach((cat: { type: CategoryType }) => {
          categoryBreakdown.set(cat.type, (categoryBreakdown.get(cat.type) || 0) + 1);
        });
      });

      // Get tag combinations
      const popularCombinations = await this.getPopularTagCombinations(id);

      // Get trend data
      const trendsData = await this.getTagTrends(id);

      return {
        tagId: id,
        totalUses: tag.useCount,
        activeBusinesses: businesses.size,
        categoryBreakdown: Array.from(categoryBreakdown.entries()).map(([type, count]) => ({
          categoryType: type,
          count
        })),
        popularCombinations,
        trendsData,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error("❌ Error in getTagStats:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to fetch tag statistics', 'STATS_FAILED');
    }
  }

  private async getPopularTagCombinations(tagId: string): Promise<Array<{ tagId: string; coOccurrences: number }>> {
    // Implementation of tag combination analysis
    return [];
  }

  private async getTagTrends(tagId: string): Promise<{ dailyUses: number; weeklyGrowth: number; monthlyGrowth: number }> {
    // Implementation of trend analysis
    return {
      dailyUses: 0,
      weeklyGrowth: 0,
      monthlyGrowth: 0
    };
  }

  async mergeTag(operation: TagMergeOperation): Promise<void> {
    try {
      const { sourceTagId, targetTagId, maintainRedirect, updateRelatedBusinesses } = operation;

      if (sourceTagId === targetTagId) {
        throw new TagError('Cannot merge tag with itself', 'INVALID_MERGE');
      }

      const [sourceTag, targetTag] = await Promise.all([
        this.getTagById(sourceTagId),
        this.getTagById(targetTagId)
      ]);

      if (!sourceTag || !targetTag) {
        throw new TagError('One or both tags not found', 'NOT_FOUND');
      }

      await db.runTransaction(async (transaction) => {
        // Update businesses using the source tag
        if (updateRelatedBusinesses) {
          const businesses = await db.collection('businesses')
            .where('tags', 'array-contains', { id: sourceTagId })
            .get();

          businesses.docs.forEach(doc => {
            transaction.update(doc.ref, {
              tags: doc.data().tags.map((tag: { id: string }) => 
                tag.id === sourceTagId ? { id: targetTagId } : tag
              )
            });
          });
        }

        // Update source tag status
        transaction.update(this.getCollection().doc(sourceTagId), {
          status: maintainRedirect ? TagStatus.MERGED : TagStatus.DEPRECATED,
          updatedAt: new Date()
        });

        // Update target tag use count
        transaction.update(this.getCollection().doc(targetTagId), {
          useCount: targetTag.useCount + sourceTag.useCount,
          updatedAt: new Date()
        });
      });

    } catch (error) {
      console.error("❌ Error in mergeTag:", error);
      if (error instanceof TagError) {
        throw error;
      }
      throw new TagError('Failed to merge tags', 'MERGE_FAILED');
    }
  }

  async bulkUpdateTags(operation: BulkTagOperation): Promise<void> {
    try {
      const batch = db.batch();
      const now = new Date();

      for (const tagId of operation.tags) {
        const docRef = this.getCollection().doc(tagId);
        switch (operation.operation) {
          case 'activate':
            batch.update(docRef, { 
              status: TagStatus.ACTIVE,
              updatedAt: now 
            });
            break;
          case 'deprecate':
            batch.update(docRef, { 
              status: TagStatus.DEPRECATED,
              updatedAt: now 
            });
            break;
          case 'hide':
            batch.update(docRef, { 
              visibility: TagVisibility.HIDDEN,
              updatedAt: now 
            });
            break;
          case 'updateVisibility':
            if (operation.data?.visibility) {
              batch.update(docRef, { 
                visibility: operation.data.visibility,
                updatedAt: now 
              });
            }
            break;
          case 'updateStatus':
            if (operation.data?.status) {
              batch.update(docRef, { 
                status: operation.data.status,
                updatedAt: now 
              });
            }
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();

    } catch (error) {
      console.error("❌ Error in bulkUpdateTags:", error);
      throw new TagError('Failed to perform bulk tag update', 'BULK_UPDATE_FAILED');
    }
  }

  async createTagRelationship(relationship: Omit<TagRelationship, 'createdAt' | 'updatedAt'>): Promise<TagRelationship> {
    try {
      const [sourceTag, targetTag] = await Promise.all([
        this.getTagById(relationship.sourceTagId),
        this.getTagById(relationship.targetTagId)
      ]);

      if (!sourceTag || !targetTag) {
        throw new TagError('One or both tags not found', 'NOT_FOUND');
      }

      const now = new Date();
      const relationshipData = {
        ...relationship,
        createdAt: now,
        updatedAt: now
      };

      const docRef = this.getCollection(this.relationshipsCollection).doc();
      await docRef.set(relationshipData);

      return {
        ...relationshipData,
        createdAt: now,
        updatedAt: now
      };

    } catch (error) {
      console.error("❌ Error in createTagRelationship:", error);
      throw new TagError('Failed to create tag relationship', 'RELATIONSHIP_CREATE_FAILED');
    }
  }

  async getTagSuggestions(
    categoryType: CategoryType,
    existingTags: string[] = [],
    limit = 10
  ): Promise<TagSuggestion[]> {
    try {
      const suggestions: TagSuggestion[] = [];

      // Get category-based suggestions
      const categoryBasedTags = await this.getCollection()
        .where('relevantCategories', 'array-contains', categoryType)
        .where('status', '==', TagStatus.ACTIVE)
        .where('visibility', '==', TagVisibility.PUBLIC)
        .orderBy('useCount', 'desc')
        .limit(limit * 2)
        .get();

      // Filter out existing tags
      categoryBasedTags.docs
        .filter(doc => !existingTags.includes(doc.id))
        .slice(0, limit)
        .forEach(doc => {
          suggestions.push({
            tag: { id: doc.id, ...doc.data() } as Tag,
            relevanceScore: doc.data().useCount / 100, // Normalize score
            reason: TagSuggestionReason.CATEGORY_BASED
          });
        });

      // Get trending tags
      const trendingTags = await this.getCollection()
        .where('status', '==', TagStatus.ACTIVE)
        .where('visibility', '==', TagVisibility.PUBLIC)
        .orderBy('lastUsed', 'desc')
        .limit(limit)
        .get();

      trendingTags.docs
        .filter(doc => !existingTags.includes(doc.id))
        .forEach(doc => {
          if (!suggestions.some(s => s.tag.id === doc.id)) {
            suggestions.push({
              tag: { id: doc.id, ...doc.data() } as Tag,
              relevanceScore: 0.5, // Medium relevance for trending tags
              reason: TagSuggestionReason.TRENDING
            });
          }
        });

      return suggestions.slice(0, limit);

    } catch (error) {
      console.error("❌ Error in getTagSuggestions:", error);
      throw new TagError('Failed to get tag suggestions', 'SUGGESTIONS_FAILED');
    }
  }

  async addTagLocalization(localization: Omit<TagLocalization, 'createdAt' | 'updatedAt'>): Promise<TagLocalization> {
    try {
      const tag = await this.getTagById(localization.tagId);
      if (!tag) {
        throw new TagError('Tag not found', 'NOT_FOUND');
      }

      const now = new Date();
      const localizationData = {
        ...localization,
        createdAt: now,
        updatedAt: now
      };

      const docRef = this.getCollection(this.localizationsCollection).doc();
      await docRef.set(localizationData);

      return {
        ...localizationData,
        createdAt: now,
        updatedAt: now
      };

    } catch (error) {
      console.error("❌ Error in addTagLocalization:", error);
      throw new TagError('Failed to add tag localization', 'LOCALIZATION_FAILED');
    }
  }

  async recordTagAnalytics(analytics: Omit<TagAnalytics, 'timestamp'>): Promise<void> {
    try {
      const now = new Date();
      const analyticsData = {
        ...analytics,
        timestamp: now
      };

      await this.getCollection(this.analyticsCollection).add(analyticsData);

    } catch (error) {
      console.error("❌ Error in recordTagAnalytics:", error);
      throw new TagError('Failed to record tag analytics', 'ANALYTICS_FAILED');
    }
  }

  async exportTags(): Promise<TagExportFormat> {
    try {
      const [
        tags,
        relationships,
        localizations
      ] = await Promise.all([
        this.getCollection().get(),
        this.getCollection(this.relationshipsCollection).get(),
        this.getCollection(this.localizationsCollection).get()
      ]);

      return {
        tags: tags.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tag[],
        relationships: relationships.docs.map(doc => doc.data()) as TagRelationship[],
        localizations: localizations.docs.map(doc => doc.data()) as TagLocalization[],
        version: '1.0',
        exportDate: new Date(),
        metadata: {
          totalTags: tags.size,
          totalRelationships: relationships.size,
          totalLocalizations: localizations.size
        }
      };

    } catch (error) {
      console.error("❌ Error in exportTags:", error);
      throw new TagError('Failed to export tags', 'EXPORT_FAILED');
    }
  }

  async importTags(data: TagExportFormat): Promise<void> {
    try {
      const batch = db.batch();
      const now = new Date();

      // Import tags
      data.tags.forEach(tag => {
        const docRef = this.getCollection().doc(tag.id);
        batch.set(docRef, {
          ...tag,
          importedAt: now,
          updatedAt: now
        });
      });

      // Import relationships
      data.relationships.forEach(relationship => {
        const docRef = this.getCollection(this.relationshipsCollection).doc();
        batch.set(docRef, {
          ...relationship,
          importedAt: now,
          updatedAt: now
        });
      });

      // Import localizations
      data.localizations.forEach(localization => {
        const docRef = this.getCollection(this.localizationsCollection).doc();
        batch.set(docRef, {
          ...localization,
          importedAt: now,
          updatedAt: now
        });
      });

      await batch.commit();

    } catch (error) {
      console.error("❌ Error in importTags:", error);
      throw new TagError('Failed to import tags', 'IMPORT_FAILED');
    }
  }
}

export default new TagService();