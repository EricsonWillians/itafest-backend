import { Business } from '@/types/business.types.ts';
import { Tag } from '@/types/tag.types.ts';

// Main category interface
export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    // Reference to child categories for hierarchical structure
    subCategories?: string[];
    // Keep track of how many businesses are in this category
    businessCount?: number;
    // Add recommended tags for this category
    recommendedTags?: string[];
    // Metadata for category management
    isActive: boolean;
    displayOrder: number;
    // Add type field from CategoryType enum
    type: CategoryType;
    // Add metadata for SEO and discovery
    metadata?: {
        seoDescription?: string;
        keywords?: string[];
        searchPriority?: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Interface for creating a new category
export interface CreateCategoryDTO {
    name: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    displayOrder?: number;
    type: CategoryType;
    recommendedTags?: string[];
    metadata?: {
        seoDescription?: string;
        keywords?: string[];
        searchPriority?: number;
    };
}

// Interface for updating an existing category
export interface UpdateCategoryDTO extends Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>> {}

// Interface for category with populated relationships
export interface CategoryWithRelations extends Category {
    parent?: Category;
    children?: Category[];
    businesses?: Business[];
    recommendedTags?: Tag[]; // Full tag objects instead of just IDs
}

// Type for category tree structure
export interface CategoryTree extends Omit<Category, 'parentId' | 'subCategories'> {
    children?: CategoryTree[];
    tagSuggestions?: Tag[]; // Suggested tags for this category branch
}

// Expanded enum for common category types
export enum CategoryType {
    RESTAURANT = 'restaurant',
    BAR = 'bar',
    CAFE = 'cafe',
    RETAIL = 'retail',
    SERVICE = 'service',
    ENTERTAINMENT = 'entertainment',
    EDUCATION = 'education',
    HEALTH = 'health',
    BEAUTY = 'beauty',
    FITNESS = 'fitness',
    NIGHTLIFE = 'nightlife',
    SHOPPING = 'shopping',
    CULTURAL = 'cultural',
    SPORTS = 'sports',
    TECHNOLOGY = 'technology',
    PROFESSIONAL = 'professional',
    AUTOMOTIVE = 'automotive',
    FINANCIAL = 'financial',
    OTHER = 'other'
}

// Interface for category statistics
export interface CategoryStats {
    categoryId: string;
    totalBusinesses: number;
    activeBusinesses: number;
    premiumBusinesses: number;
    averageRating?: number;
    popularTags: Array<{
        tagId: string;
        count: number;
    }>;
    lastUpdated: Date;
}

// Enhanced type for category search parameters
export interface CategorySearchParams {
    query?: string;
    parentId?: string;
    isActive?: boolean;
    type?: CategoryType;
    hasTags?: string[]; // Search for categories with specific tags
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'businessCount' | 'createdAt' | 'displayOrder' | 'searchPriority';
    sortOrder?: 'asc' | 'desc';
}

// Type for category validation errors
export interface CategoryValidationError {
    field: keyof Category;
    message: string;
    code: string;
}

// New interfaces for category-tag relationships
export interface CategoryTagAssociation {
    categoryId: string;
    tagId: string;
    relevanceScore: number; // 0-1 score indicating how relevant this tag is for the category
    autoSuggest: boolean; // Whether to automatically suggest this tag for new businesses
    createdAt: Date;
}

// Interface for category tag suggestions
export interface CategoryTagSuggestion {
    categoryId: string;
    suggestedTags: Array<{
        tagId: string;
        relevanceScore: number;
        usageCount: number;
    }>;
}

// Interface for bulk category operations
export interface BulkCategoryOperation {
    categories: string[];
    operation: 'activate' | 'deactivate' | 'delete' | 'updateOrder';
    data?: {
        displayOrder?: number;
        type?: CategoryType;
    };
}