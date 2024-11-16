import { Context, Status } from "oak";
import { BusinessService, BusinessError } from "@/services/business.service.ts";
import type { 
  CreateBusinessDTO, 
  UpdateBusinessDTO, 
  Business,
  TagReference
} from "@/types/business.types.ts";
import type { CategoryType } from "@/types/category.types.ts";
import type { TagStatus } from "@/types/tag.types.ts";

export class BusinessController {
  private businessService: BusinessService;

  constructor() {
    this.businessService = new BusinessService();
  }

  /**
   * Maps BusinessError codes to HTTP status codes
   */
  private getStatusFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      'INVALID_DATA': Status.BadRequest,
      'INVALID_NAME': Status.BadRequest,
      'INVALID_EMAIL': Status.BadRequest,
      'INVALID_ID': Status.BadRequest,
      'INVALID_PAGINATION': Status.BadRequest,
      'INVALID_SEARCH': Status.BadRequest,
      'INVALID_LIMIT': Status.BadRequest,
      'INVALID_CATEGORY': Status.BadRequest,
      'INACTIVE_CATEGORY': Status.BadRequest,
      'CATEGORY_TYPE_MISMATCH': Status.BadRequest,
      'INVALID_TAGS': Status.BadRequest,
      'INACTIVE_TAGS': Status.BadRequest,
      'NOT_FOUND': Status.NotFound,
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

    if (error instanceof BusinessError) {
      const status = this.getStatusFromErrorCode(error.code);
      ctx.response.status = status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message
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
   * Create a new business
   * @route POST /api/v1/businesses
   */
  async createBusiness(ctx: Context) {
    try {
      const body = await ctx.request.body().value as CreateBusinessDTO;
      console.log(`📝 Creating business: ${body.name} with ${body.categories?.length || 0} categories and ${body.tags?.length || 0} tags`);
      
      const business = await this.businessService.createBusiness(body);
      
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: business,
        message: 'Business created successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get all businesses with pagination and filters
   * @route GET /api/v1/businesses
   */
  async getBusinesses(ctx: Context) {
    try {
      const {
        page = "1",
        limit = "10",
        categoryId,
        categoryType,
        tags,
        search,
        sort = "name",
        subscriptionStatus
      } = ctx.request.url.searchParams;

      const tagArray = tags ? tags.toString().split(',') : undefined;

      console.log(`📋 Fetching businesses - Page: ${page}, Limit: ${limit}, Category: ${categoryId}, Tags: ${tagArray?.join(', ')}`);
      
      const result = await this.businessService.getBusinesses(
        parseInt(page),
        parseInt(limit),
        {
          categoryId: categoryId as string | undefined,
          categoryType: categoryType as CategoryType | undefined,
          tags: tagArray,
          search: search as string | undefined,
          sort: sort as keyof Business,
          subscriptionStatus: subscriptionStatus as 'free' | 'premium' | undefined
        }
      );
      
      ctx.response.body = {
        success: true,
        data: result.businesses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / parseInt(limit)),
          totalItems: result.total,
          hasMore: result.hasMore,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get businesses by tags
   * @route GET /api/v1/businesses/tags/:tags
   */
  async getBusinessesByTags(ctx: Context) {
    try {
      const { tags } = ctx.params;
      const { 
        page = "1", 
        limit = "10" 
      } = ctx.request.url.searchParams;

      const tagArray = tags.split(',');
      console.log(`📋 Fetching businesses for tags: ${tagArray.join(', ')}`);
      
      const result = await this.businessService.getBusinessesByTags(
        tagArray,
        parseInt(page),
        parseInt(limit)
      );
      
      ctx.response.body = {
        success: true,
        data: result.businesses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / parseInt(limit)),
          totalItems: result.total,
          hasMore: result.hasMore,
          itemsPerPage: parseInt(limit)
        }
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get a business by ID
   * @route GET /api/v1/businesses/:id
   */
  async getBusinessById(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🔍 Fetching business: ${id}`);
      
      const business = await this.businessService.getBusinessById(id);
      
      if (!business) {
        throw new BusinessError('Business not found', 'NOT_FOUND');
      }
      
      ctx.response.body = {
        success: true,
        data: business
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Update a business
   * @route PUT /api/v1/businesses/:id
   */
  async updateBusiness(ctx: Context) {
    try {
      const { id } = ctx.params;
      const body = await ctx.request.body().value as UpdateBusinessDTO;
      
      console.log(`📝 Updating business: ${id}, Categories: ${body.categories?.length || 0}, Tags: ${body.tags?.length || 0}`);
      await this.businessService.updateBusiness(id, body);
      
      const updatedBusiness = await this.businessService.getBusinessById(id);
      
      ctx.response.body = {
        success: true,
        data: updatedBusiness,
        message: 'Business updated successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Search businesses with category and tag filters
   * @route GET /api/v1/businesses/search
   */
  async searchBusinesses(ctx: Context) {
    try {
      const { 
        q: searchTerm, 
        limit = "10",
        categoryType,
        tags 
      } = ctx.request.url.searchParams;
      
      if (!searchTerm) {
        throw new BusinessError('Search term is required', 'INVALID_SEARCH');
      }

      const tagArray = tags ? tags.toString().split(',') : undefined;
      
      console.log(`🔍 Searching businesses with term: ${searchTerm}, Category Type: ${categoryType}, Tags: ${tagArray?.join(', ')}`);
      const businesses = await this.businessService.searchBusinesses(
        searchTerm.toString(),
        {
          categoryType: categoryType as CategoryType | undefined,
          tags: tagArray,
          limit: parseInt(limit.toString())
        }
      );
      
      ctx.response.body = {
        success: true,
        data: businesses
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Delete a business
   * @route DELETE /api/v1/businesses/:id
   */
  async deleteBusiness(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🗑️ Deleting business: ${id}`);
      
      await this.businessService.deleteBusiness(id);
      
      ctx.response.status = Status.OK;
      ctx.response.body = {
        success: true,
        message: 'Business deleted successfully'
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Check if business exists
   * @route HEAD /api/v1/businesses/:id
   */
  async businessExists(ctx: Context) {
    try {
      const { id } = ctx.params;
      const exists = await this.businessService.businessExists(id);
      
      ctx.response.status = exists ? Status.OK : Status.NotFound;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }
}

export default new BusinessController();