import { Context, Status } from "oak";
import { TagService, TagError } from "@/services/tag.service.ts";
import type {
  Tag,
  CreateTagDTO,
  UpdateTagDTO,
  TagStatus,
  TagVisibility,
  TagSearchParams,
  TagMergeOperation,
  BulkTagOperation,
  TagRelationship,
  TagLocalization,
  TagExportFormat
} from "@/types/tag.types.ts";
import type { CategoryType } from "@/types/category.types.ts";

export class TagController {
  private tagService: TagService;

  constructor() {
    this.tagService = new TagService();
  }

  /**
   * Maps TagError codes to HTTP status codes
   */
  private getStatusFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      'INVALID_DATA': Status.BadRequest,
      'INVALID_NAME': Status.BadRequest,
      'INVALID_ID': Status.BadRequest,
      'VALIDATION_ERROR': Status.BadRequest,
      'NOT_FOUND': Status.NotFound,
      'TAG_IN_USE': Status.Conflict,
      'INVALID_MERGE': Status.BadRequest,
      'MERGE_FAILED': Status.InternalServerError,
      'RELATIONSHIP_CREATE_FAILED': Status.InternalServerError,
      'SUGGESTIONS_FAILED': Status.InternalServerError,
      'LOCALIZATION_FAILED': Status.InternalServerError,
      'ANALYTICS_FAILED': Status.InternalServerError,
      'EXPORT_FAILED': Status.InternalServerError,
      'IMPORT_FAILED': Status.InternalServerError,
      'BULK_UPDATE_FAILED': Status.InternalServerError,
      'SEARCH_FAILED': Status.InternalServerError,
      'CREATE_FAILED': Status.InternalServerError,
      'UPDATE_FAILED': Status.InternalServerError,
      'DELETE_FAILED': Status.InternalServerError,
      'FETCH_FAILED': Status.InternalServerError,
      'INIT_FAILED': Status.ServiceUnavailable
    };
    return statusMap[code] || Status.InternalServerError;
  }

  /**
   * Error handler for consistent error responses
   */
  private handleError(ctx: Context, error: unknown) {
    console.error('❌ Operation failed:', error);

    if (error instanceof TagError) {
      const status = this.getStatusFromErrorCode(error.code);
      ctx.response.status = status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
        validationErrors: error.code === 'VALIDATION_ERROR' ? (error as any).validationErrors : undefined
      };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Create a new tag
   * @route POST /api/v1/tags
   */
  async createTag(ctx: Context) {
    try {
      const body = await ctx.request.body().value as CreateTagDTO;
      console.log(`📝 Creating tag: ${body.name}`);
      
      const tag = await this.tagService.createTag(body);
      
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: tag,
        message: 'Tag created successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Search tags with filters
   * @route GET /api/v1/tags
   */
  async searchTags(ctx: Context) {
    try {
      const {
        query,
        status,
        visibility,
        categories,
        isCustom,
        isFeatured,
        minUseCount,
        language,
        sortBy,
        sortOrder,
        limit = "10",
        offset = "0"
      } = ctx.request.url.searchParams;

      console.log(`🔍 Searching tags with query: ${query}`);

      const params: TagSearchParams = {
        query: query?.toString(),
        status: status as TagStatus,
        visibility: visibility as TagVisibility,
        categories: categories ? categories.toString().split(',') as CategoryType[] : undefined,
        isCustom: isCustom ? isCustom === 'true' : undefined,
        isFeatured: isFeatured ? isFeatured === 'true' : undefined,
        minUseCount: minUseCount ? parseInt(minUseCount.toString()) : undefined,
        language: language?.toString(),
        sortBy: sortBy as keyof Tag,
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: parseInt(limit.toString()),
        offset: parseInt(offset.toString())
      };

      const tags = await this.tagService.searchTags(params);
      
      ctx.response.body = {
        success: true,
        data: tags
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get tag by ID
   * @route GET /api/v1/tags/:id
   */
  async getTagById(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🔍 Fetching tag: ${id}`);
      
      const tag = await this.tagService.getTagById(id);
      
      if (!tag) {
        throw new TagError('Tag not found', 'NOT_FOUND');
      }
      
      ctx.response.body = {
        success: true,
        data: tag
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Update tag
   * @route PUT /api/v1/tags/:id
   */
  async updateTag(ctx: Context) {
    try {
      const { id } = ctx.params;
      const body = await ctx.request.body().value as UpdateTagDTO;
      
      console.log(`📝 Updating tag: ${id}`);
      await this.tagService.updateTag(id, body);
      
      const updatedTag = await this.tagService.getTagById(id);
      
      ctx.response.body = {
        success: true,
        data: updatedTag,
        message: 'Tag updated successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Delete tag
   * @route DELETE /api/v1/tags/:id
   */
  async deleteTag(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🗑️ Deleting tag: ${id}`);
      
      await this.tagService.deleteTag(id);
      
      ctx.response.status = Status.OK;
      ctx.response.body = {
        success: true,
        message: 'Tag deleted successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get tag statistics
   * @route GET /api/v1/tags/:id/stats
   */
  async getTagStats(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`📊 Fetching stats for tag: ${id}`);
      
      const stats = await this.tagService.getTagStats(id);
      
      ctx.response.body = {
        success: true,
        data: stats
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Merge tags
   * @route POST /api/v1/tags/merge
   */
  async mergeTags(ctx: Context) {
    try {
      const operation = await ctx.request.body().value as TagMergeOperation;
      console.log(`🔄 Merging tags: ${operation.sourceTagId} into ${operation.targetTagId}`);
      
      await this.tagService.mergeTag(operation);
      
      ctx.response.body = {
        success: true,
        message: 'Tags merged successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Bulk update tags
   * @route PATCH /api/v1/tags/bulk
   */
  async bulkUpdateTags(ctx: Context) {
    try {
      const operation = await ctx.request.body().value as BulkTagOperation;
      console.log(`🔄 Bulk updating ${operation.tags.length} tags with operation: ${operation.operation}`);
      
      await this.tagService.bulkUpdateTags(operation);
      
      ctx.response.body = {
        success: true,
        message: 'Bulk update completed successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get tag suggestions
   * @route GET /api/v1/tags/suggestions
   */
  async getTagSuggestions(ctx: Context) {
    try {
      const { 
        categoryType,
        existingTags,
        limit = "10"
      } = ctx.request.url.searchParams;

      if (!categoryType) {
        throw new TagError('Category type is required', 'INVALID_DATA');
      }

      const tagArray = existingTags ? existingTags.toString().split(',') : [];
      
      console.log(`💡 Getting tag suggestions for category: ${categoryType}`);
      const suggestions = await this.tagService.getTagSuggestions(
        categoryType as CategoryType,
        tagArray,
        parseInt(limit.toString())
      );
      
      ctx.response.body = {
        success: true,
        data: suggestions
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Create tag relationship
   * @route POST /api/v1/tags/relationships
   */
  async createTagRelationship(ctx: Context) {
    try {
      const relationship = await ctx.request.body().value as Omit<TagRelationship, 'createdAt' | 'updatedAt'>;
      console.log(`🔗 Creating relationship between tags: ${relationship.sourceTagId} and ${relationship.targetTagId}`);
      
      const result = await this.tagService.createTagRelationship(relationship);
      
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: result,
        message: 'Tag relationship created successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Add tag localization
   * @route POST /api/v1/tags/:id/localizations
   */
  async addTagLocalization(ctx: Context) {
    try {
      const { id } = ctx.params;
      const localization = await ctx.request.body().value as Omit<TagLocalization, 'createdAt' | 'updatedAt'>;
      console.log(`🌐 Adding localization for tag: ${id}`);
      
      const result = await this.tagService.addTagLocalization({
        ...localization,
        tagId: id
      });
      
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: result,
        message: 'Tag localization added successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Export tags
   * @route GET /api/v1/tags/export
   */
  async exportTags(ctx: Context) {
    try {
      console.log('📤 Exporting tags');
      const exportData = await this.tagService.exportTags();
      
      ctx.response.body = {
        success: true,
        data: exportData
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Import tags
   * @route POST /api/v1/tags/import
   */
  async importTags(ctx: Context) {
    try {
      const importData = await ctx.request.body().value as TagExportFormat;
      console.log('📥 Importing tags');
      
      await this.tagService.importTags(importData);
      
      ctx.response.body = {
        success: true,
        message: 'Tags imported successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }
}

export default new TagController();