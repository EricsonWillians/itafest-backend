// src/api/controllers/business.controller.ts

import { Context, Status } from "oak";
import { BusinessService } from "@/services/business.service.ts";
import type {
  CreateBusinessDTO,
  UpdateBusinessDTO,
  Business,
} from "@/types/business.types.ts";
import type { CategoryType } from "@/types/category.types.ts";

export class BusinessController {
  private businessService: BusinessService;

  constructor() {
    this.businessService = new BusinessService();
  }

  /**
   * Create a new business
   * @route POST /api/v1/businesses
   */
  async createBusiness(ctx: Context) {
    const body = (await ctx.request.body().value) as CreateBusinessDTO;
    console.log(
      `📝 Creating business: ${body.name} with ` +
        `${body.categories?.length || 0} categories and ` +
        `${body.tags?.length || 0} tags`
    );

    // Let errors throw up to global error middleware
    const business = await this.businessService.createBusiness(body);
    ctx.response.status = Status.Created;
    ctx.response.body = {
      success: true,
      data: business,
      message: "Business created successfully",
    };
  }

  /**
   * Get all businesses with pagination and filters
   * @route GET /api/v1/businesses
   */
  async getBusinesses(ctx: Context) {
    const {
      page = "1",
      limit = "10",
      categoryId,
      categoryType,
      tags,
      search,
      subscriptionStatus,
    } = ctx.request.url.searchParams;

    // 1) Validate & default the page/limit
    const currentPage = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;

    // 2) Validate the sort field
    const rawSort = ctx.request.url.searchParams.get("sort") ?? "name";
    const ALLOWED_SORT_FIELDS: Array<keyof Business> = [
      "name",
      "createdAt",
      "updatedAt",
    ];
    const sortField = ALLOWED_SORT_FIELDS.includes(rawSort as keyof Business)
      ? (rawSort as keyof Business)
      : "name";

    // 3) Parse optional tags
    const tagArray = tags ? tags.toString().split(",") : undefined;

    console.log(
      `📋 Fetching businesses - Page: ${currentPage}, ` +
        `Limit: ${pageLimit}, Category: ${categoryId}, ` +
        `Tags: ${tagArray?.join(", ")}, Sort: ${sortField}`
    );

    const result = await this.businessService.getBusinesses(currentPage, pageLimit, {
      categoryId: categoryId || undefined,
      categoryType: categoryType as CategoryType | undefined,
      tags: tagArray,
      search: search || undefined,
      sort: sortField,
      subscriptionStatus: subscriptionStatus as "free" | "premium" | undefined,
    });

    ctx.response.body = {
      success: true,
      data: result.businesses,
      pagination: {
        currentPage,
        totalPages: Math.ceil(result.total / pageLimit),
        totalItems: result.total,
        hasMore: result.hasMore,
        itemsPerPage: pageLimit,
      },
    };
  }

  /**
   * Get businesses by tags
   * @route GET /api/v1/businesses/tags/:tags
   */
  async getBusinessesByTags(ctx: Context) {
    const { tags } = ctx.params;
    const { page = "1", limit = "10" } = ctx.request.url.searchParams;

    const currentPage = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 10;

    const tagArray = tags.split(",");
    console.log(`📋 Fetching businesses for tags: ${tagArray.join(", ")}`);

    const result = await this.businessService.getBusinessesByTags(
      tagArray,
      currentPage,
      pageLimit
    );

    ctx.response.body = {
      success: true,
      data: result.businesses,
      pagination: {
        currentPage,
        totalPages: Math.ceil(result.total / pageLimit),
        totalItems: result.total,
        hasMore: result.hasMore,
        itemsPerPage: pageLimit,
      },
    };
  }

  /**
   * Get a business by ID
   * @route GET /api/v1/businesses/:id
   */
  async getBusinessById(ctx: Context) {
    const { id } = ctx.params;
    console.log(`🔍 Fetching business: ${id}`);

    const business = await this.businessService.getBusinessById(id);
    if (!business) {
      // Directly throw if not found; global error handler catches it
      throw new Error("Business not found");
      // Or: throw new BusinessError("Business not found", "NOT_FOUND");
    }

    ctx.response.body = {
      success: true,
      data: business,
    };
  }

  /**
   * Update a business
   * @route PUT /api/v1/businesses/:id
   */
  async updateBusiness(ctx: Context) {
    const { id } = ctx.params;
    const body = (await ctx.request.body().value) as UpdateBusinessDTO;

    console.log(
      `📝 Updating business: ${id}, ` +
        `Categories: ${body.categories?.length || 0}, ` +
        `Tags: ${body.tags?.length || 0}`
    );

    await this.businessService.updateBusiness(id, body);

    const updatedBusiness = await this.businessService.getBusinessById(id);
    ctx.response.body = {
      success: true,
      data: updatedBusiness,
      message: "Business updated successfully",
    };
  }

  /**
   * Search businesses with category and tag filters
   * @route GET /api/v1/businesses/search
   */
  async searchBusinesses(ctx: Context) {
    const { q: searchTerm, limit = "10", categoryType, tags } =
      ctx.request.url.searchParams;

    if (!searchTerm) {
      // Throw directly
      throw new Error("Search term is required");
      // Or: throw new BusinessError("Search term is required", "INVALID_SEARCH");
    }

    const pageLimit = parseInt(limit, 10) || 10;
    const tagArray = tags ? tags.toString().split(",") : undefined;

    console.log(
      `🔍 Searching businesses with term: ${searchTerm}, ` +
        `Category Type: ${categoryType}, Tags: ${tagArray?.join(", ")}`
    );

    const businesses = await this.businessService.searchBusinesses(
      searchTerm.toString(),
      {
        categoryType: categoryType as CategoryType | undefined,
        tags: tagArray,
        limit: pageLimit,
      }
    );

    ctx.response.body = {
      success: true,
      data: businesses,
    };
  }

  /**
   * Delete a business
   * @route DELETE /api/v1/businesses/:id
   */
  async deleteBusiness(ctx: Context) {
    const { id } = ctx.params;
    console.log(`🗑️ Deleting business: ${id}`);

    await this.businessService.deleteBusiness(id);

    ctx.response.status = Status.OK;
    ctx.response.body = {
      success: true,
      message: "Business deleted successfully",
    };
  }

  /**
   * Check if business exists
   * @route HEAD /api/v1/businesses/:id
   */
  async businessExists(ctx: Context) {
    const { id } = ctx.params;
    const exists = await this.businessService.businessExists(id);
    ctx.response.status = exists ? Status.OK : Status.NotFound;
  }
}

export default new BusinessController();
