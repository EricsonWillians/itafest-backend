import { Context, Status } from "oak";
import { CategoryService, CategoryError } from "@/services/category.service.ts";
import type {
  Category,
  CategoryType,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategorySearchParams,
  CategoryValidationError,
  CategoryStats
} from "@/types/category.types.ts";

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Maps CategoryError codes to HTTP status codes
   */
  private getStatusFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      'INVALID_DATA': Status.BadRequest,
      'INVALID_NAME': Status.BadRequest,
      'INVALID_ID': Status.BadRequest,
      'INVALID_PARENT': Status.BadRequest,
      'INVALID_TAGS': Status.BadRequest,
      'VALIDATION_ERROR': Status.BadRequest,
      'NOT_FOUND': Status.NotFound,
      'HAS_BUSINESSES': Status.Conflict,
      'CREATE_FAILED': Status.InternalServerError,
      'UPDATE_FAILED': Status.InternalServerError,
      'DELETE_FAILED': Status.InternalServerError,
      'FETCH_FAILED': Status.InternalServerError,
      'TREE_FETCH_FAILED': Status.InternalServerError,
      'STATS_FAILED': Status.InternalServerError,
      'INIT_FAILED': Status.ServiceUnavailable
    };
    return statusMap[code] || Status.InternalServerError;
  }

  /**
   * Error handler for consistent error responses
   */
  private handleError(ctx: Context, error: unknown) {
    console.error('❌ Operation failed:', error);

    if (error instanceof CategoryError) {
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
   * Create a new category
   * @route POST /api/v1/categories
   */
  async createCategory(ctx: Context) {
    try {
      const body = await ctx.request.body().value as CreateCategoryDTO;
      console.log(`📝 Creating category: ${body.name}`);
      
      const category = await this.categoryService.createCategory(body);
      
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: category,
        message: 'Category created successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get all categories with filtering options
   * @route GET /api/v1/categories
   */
  async getCategories(ctx: Context) {
    try {
      const {
        query,
        parentId,
        type,
        isActive,
        sortBy,
        sortOrder,
        limit,
        offset
      } = ctx.request.url.searchParams;

      console.log(`📋 Fetching categories with filters - Type: ${type}, Parent: ${parentId}`);
      
      const params: CategorySearchParams = {
        query: query?.toString(),
        parentId: parentId?.toString(),
        type: type as CategoryType,
        isActive: isActive ? isActive === 'true' : undefined,
        sortBy: sortBy as keyof Category,
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: limit ? parseInt(limit.toString()) : undefined,
        offset: offset ? parseInt(offset.toString()) : undefined
      };

      const categories = await this.categoryService.getCategories(params);
      
      ctx.response.body = {
        success: true,
        data: categories
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get category tree structure
   * @route GET /api/v1/categories/tree
   */
  async getCategoryTree(ctx: Context) {
    try {
      const { rootId } = ctx.request.url.searchParams;
      console.log(`🌳 Fetching category tree${rootId ? ` from root: ${rootId}` : ''}`);
      
      const tree = await this.categoryService.getCategoryTree(rootId?.toString());
      
      ctx.response.body = {
        success: true,
        data: tree
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get a category by ID
   * @route GET /api/v1/categories/:id
   */
  async getCategoryById(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🔍 Fetching category: ${id}`);
      
      const category = await this.categoryService.getCategoryById(id);
      
      if (!category) {
        throw new CategoryError('Category not found', 'NOT_FOUND');
      }
      
      ctx.response.body = {
        success: true,
        data: category
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Update a category
   * @route PUT /api/v1/categories/:id
   */
  async updateCategory(ctx: Context) {
    try {
      const { id } = ctx.params;
      const body = await ctx.request.body().value as UpdateCategoryDTO;
      
      console.log(`📝 Updating category: ${id}`);
      await this.categoryService.updateCategory(id, body);
      
      const updatedCategory = await this.categoryService.getCategoryById(id);
      
      ctx.response.body = {
        success: true,
        data: updatedCategory,
        message: 'Category updated successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Delete a category
   * @route DELETE /api/v1/categories/:id
   */
  async deleteCategory(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🗑️ Deleting category: ${id}`);
      
      await this.categoryService.deleteCategory(id);
      
      ctx.response.status = Status.OK;
      ctx.response.body = {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get category statistics
   * @route GET /api/v1/categories/:id/stats
   */
  async getCategoryStats(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`📊 Fetching stats for category: ${id}`);
      
      const stats = await this.categoryService.getCategoryStats(id);
      
      ctx.response.body = {
        success: true,
        data: stats
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Bulk update categories
   * @route PATCH /api/v1/categories/bulk
   */
  async bulkUpdateCategories(ctx: Context) {
    try {
      const { 
        categories,
        operation,
        data 
      } = await ctx.request.body().value as {
        categories: string[];
        operation: 'activate' | 'deactivate' | 'delete' | 'updateOrder';
        data?: {
          displayOrder?: number;
          type?: CategoryType;
        };
      };

      console.log(`🔄 Bulk updating categories: ${operation}`);
      
      for (const categoryId of categories) {
        switch (operation) {
          case 'activate':
            await this.categoryService.updateCategory(categoryId, { isActive: true });
            break;
          case 'deactivate':
            await this.categoryService.updateCategory(categoryId, { isActive: false });
            break;
          case 'delete':
            await this.categoryService.deleteCategory(categoryId);
            break;
          case 'updateOrder':
            if (data?.displayOrder !== undefined) {
              await this.categoryService.updateCategory(categoryId, { 
                displayOrder: data.displayOrder,
                type: data.type
              });
            }
            break;
        }
      }

      ctx.response.body = {
        success: true,
        message: `Bulk ${operation} completed successfully`
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Check if category exists
   * @route HEAD /api/v1/categories/:id
   */
  async categoryExists(ctx: Context) {
    try {
      const { id } = ctx.params;
      const category = await this.categoryService.getCategoryById(id);
      
      ctx.response.status = category ? Status.OK : Status.NotFound;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }
}

export default new CategoryController();