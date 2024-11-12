// src/api/controllers/ad.controller.ts

import { Context, Status } from "oak";
import { AdService, AdError } from "@/services/ad.service.ts";
import type { CreateAdDTO, UpdateAdDTO, Ad } from "@/types/ad.types.ts";

export class AdController {
  private adService: AdService;

  constructor() {
    this.adService = new AdService();
  }

  /**
   * Maps AdError codes to HTTP status codes
   */
  private getStatusFromErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      'INVALID_DATA': Status.BadRequest,
      'INVALID_TITLE': Status.BadRequest,
      'INVALID_ID': Status.BadRequest,
      'INVALID_PAGINATION': Status.BadRequest,
      'INVALID_LIMIT': Status.BadRequest,
      'NOT_FOUND': Status.NotFound,
      'CREATE_FAILED': Status.InternalServerError,
      'UPDATE_FAILED': Status.InternalServerError,
      'DELETE_FAILED': Status.InternalServerError,
      'FETCH_FAILED': Status.InternalServerError,
      'INIT_FAILED': Status.ServiceUnavailable,
      'INCREMENT_FAILED': Status.InternalServerError,
      'CHECK_FAILED': Status.InternalServerError,
    };
    return statusMap[code] || Status.InternalServerError;
  }

  /**
   * Error handler for consistent error responses
   */
  private handleError(ctx: Context, error: unknown) {
    console.error('❌ Operation failed:', error);

    if (error instanceof AdError) {
      const status = this.getStatusFromErrorCode(error.code);
      ctx.response.status = status;
      ctx.response.body = {
        success: false,
        error: error.code,
        message: error.message,
      };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      };
    }
  }

  /**
 * Create a new advertisement
 * @route POST /api/v1/ads
 */
async createAd(ctx: Context) {
    try {
      const body = await ctx.request.body({ type: 'json' }).value as CreateAdDTO;
  
      // Parse date strings into Date objects
      if (body.startDate) {
        const startDate = new Date(body.startDate);
        if (isNaN(startDate.getTime())) {
          throw new AdError("Invalid start date format", "INVALID_START_DATE");
        }
        body.startDate = startDate;
      }
  
      if (body.endDate) {
        const endDate = new Date(body.endDate);
        if (isNaN(endDate.getTime())) {
          throw new AdError("Invalid end date format", "INVALID_END_DATE");
        }
        body.endDate = endDate;
      }
  
      console.log(`📝 Creating ad: ${body.title}`);
  
      const ad = await this.adService.createAd(body);
  
      ctx.response.status = Status.Created;
      ctx.response.body = {
        success: true,
        data: ad,
        message: 'Advertisement created successfully',
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get all advertisements with pagination and filters
   * @route GET /api/v1/ads
   */
  async getAds(ctx: Context) {
    try {
      const {
        page = "1",
        limit = "10",
        type,
        status,
        sort = "createdAt",
      } = Object.fromEntries(ctx.request.url.searchParams);

      console.log(`📋 Fetching ads - Page: ${page}, Limit: ${limit}`);

      const result = await this.adService.getAds(
        parseInt(page),
        parseInt(limit),
        {
          type: type as string | undefined,
          status: status as string | undefined,
          sort: sort as keyof Ad,
        },
      );

      ctx.response.body = {
        success: true,
        data: result.ads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(result.total / parseInt(limit)),
          totalItems: result.total,
          hasMore: result.hasMore,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Get an advertisement by ID
   * @route GET /api/v1/ads/:id
   */
  async getAdById(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🔍 Fetching ad: ${id}`);

      const ad = await this.adService.getAdById(id);

      if (!ad) {
        throw new AdError('Advertisement not found', 'NOT_FOUND');
      }

      ctx.response.body = {
        success: true,
        data: ad,
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Update an advertisement
   * @route PUT /api/v1/ads/:id
   */
  async updateAd(ctx: Context) {
    try {
      const { id } = ctx.params;
      const body = await ctx.request.body({ type: 'json' }).value as UpdateAdDTO;

      console.log(`📝 Updating ad: ${id}`);
      await this.adService.updateAd(id, body);

      const updatedAd = await this.adService.getAdById(id);

      ctx.response.body = {
        success: true,
        data: updatedAd,
        message: 'Advertisement updated successfully',
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Delete an advertisement
   * @route DELETE /api/v1/ads/:id
   */
  async deleteAd(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🗑️ Deleting ad: ${id}`);

      await this.adService.deleteAd(id);

      ctx.response.status = Status.OK;
      ctx.response.body = {
        success: true,
        message: 'Advertisement deleted successfully',
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Check if advertisement exists
   * @route HEAD /api/v1/ads/:id
   */
  async adExists(ctx: Context) {
    try {
      const { id } = ctx.params;
      const exists = await this.adService.adExists(id);

      ctx.response.status = exists ? Status.OK : Status.NotFound;
    } catch (error) {
      this.handleError(ctx, error);
    }
  }

  /**
   * Increment impressions for an advertisement
   * @route POST /api/v1/ads/:id/impressions
   */
  async incrementImpressions(ctx: Context) {
    try {
      const { id } = ctx.params;
      console.log(`🔄 Incrementing impressions for ad: ${id}`);

      await this.adService.incrementImpressions(id);

      ctx.response.status = Status.OK;
      ctx.response.body = {
        success: true,
        message: 'Impressions incremented successfully',
      };
    } catch (error) {
      this.handleError(ctx, error);
    }
  }
}

export default new AdController();
