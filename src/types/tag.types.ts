import { Business } from '@/types/business.types.ts';
import { Category, CategoryType } from '@/types/category.types.ts';

// Main tag interface
export interface Tag {
    id: string;
    name: string;
    slug: string;
    description?: string;
    // Optional icon for visual representation
    icon?: string;
    // Track usage metrics
    useCount: number;
    // Associated category types where this tag is commonly used
    relevantCategories: CategoryType[];
    // Metadata for tag management
    metadata: {
        isCustom: boolean; // Whether this is a system tag or user-created
        isFeatured: boolean; // Whether this tag should be featured in searches/filters
        synonyms: string[]; // Alternative names for search enhancement
        language: string; // ISO language code for internationalization
        seoKeywords?: string[]; // SEO optimization
    };
    // Status and visibility
    status: TagStatus;
    visibility: TagVisibility;
    // Display properties
    displayOrder?: number;
    color?: string; // Hex color code for UI representation
    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
}

// Tag status enum
export enum TagStatus {
    ACTIVE = 'active',
    DEPRECATED = 'deprecated',
    PENDING_REVIEW = 'pending_review',
    MERGED = 'merged',
    HIDDEN = 'hidden'
}

// Tag visibility enum
export enum TagVisibility {
    PUBLIC = 'public',
    PRIVATE = 'private',
    RESTRICTED = 'restricted'
}

// Interface for creating a new tag
export interface CreateTagDTO {
    name: string;
    description?: string;
    icon?: string;
    relevantCategories?: CategoryType[];
    metadata?: {
        isCustom?: boolean;
        isFeatured?: boolean;
        synonyms?: string[];
        language?: string;
        seoKeywords?: string[];
    };
    visibility?: TagVisibility;
    color?: string;
}

// Interface for updating an existing tag
export interface UpdateTagDTO extends Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'useCount'>> {}

// Interface for tag with populated relationships
export interface TagWithRelations extends Tag {
    businesses?: Business[];
    categories?: Category[];
    similarTags?: Tag[];
}

// Interface for tag statistics
export interface TagStats {
    tagId: string;
    totalUses: number;
    activeBusinesses: number;
    categoryBreakdown: Array<{
        categoryType: CategoryType;
        count: number;
    }>;
    popularCombinations: Array<{
        tagId: string;
        coOccurrences: number;
    }>;
    trendsData: {
        dailyUses: number;
        weeklyGrowth: number;
        monthlyGrowth: number;
    };
    lastUpdated: Date;
}

// Interface for tag search parameters
export interface TagSearchParams {
    query?: string;
    status?: TagStatus;
    visibility?: TagVisibility;
    categories?: CategoryType[];
    isCustom?: boolean;
    isFeatured?: boolean;
    minUseCount?: number;
    language?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'useCount' | 'createdAt' | 'lastUsed' | 'displayOrder';
    sortOrder?: 'asc' | 'desc';
}

// Interface for tag validation errors
export interface TagValidationError {
    field: keyof Tag;
    message: string;
    code: string;
}

// Interface for tag merging operations
export interface TagMergeOperation {
    sourceTagId: string;
    targetTagId: string;
    maintainRedirect: boolean;
    updateRelatedBusinesses: boolean;
}

// Interface for tag suggestions
export interface TagSuggestion {
    tag: Tag;
    relevanceScore: number;
    reason: TagSuggestionReason;
}

// Enum for tag suggestion reasons
export enum TagSuggestionReason {
    CATEGORY_BASED = 'category_based',
    SIMILAR_BUSINESSES = 'similar_businesses',
    POPULAR_COMBINATION = 'popular_combination',
    TRENDING = 'trending',
    USER_BEHAVIOR = 'user_behavior'
}

// Interface for bulk tag operations
export interface BulkTagOperation {
    tags: string[];
    operation: 'activate' | 'deprecate' | 'hide' | 'delete' | 'updateVisibility' | 'updateStatus';
    data?: {
        status?: TagStatus;
        visibility?: TagVisibility;
    };
}

// Interface for tag relationships
export interface TagRelationship {
    sourceTagId: string;
    targetTagId: string;
    relationType: TagRelationType;
    strength: number; // 0-1 score indicating relationship strength
    createdAt: Date;
    updatedAt: Date;
}

// Enum for tag relationship types
export enum TagRelationType {
    SIMILAR = 'similar',
    PARENT_CHILD = 'parent_child',
    SYNONYM = 'synonym',
    RELATED = 'related',
    OPPOSITE = 'opposite'
}

// Interface for tag analytics
export interface TagAnalytics {
    tagId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    metrics: {
        views: number;
        clicks: number;
        applications: number;
        removals: number;
        searchOccurrences: number;
    };
    categoryDistribution: Record<CategoryType, number>;
    timestamp: Date;
}

// Interface for tag localization
export interface TagLocalization {
    tagId: string;
    language: string;
    name: string;
    description?: string;
    synonyms?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Type for tag validation rules
export type TagValidationRule = {
    rule: 'length' | 'format' | 'uniqueness' | 'required' | 'custom';
    field: keyof Tag;
    params?: Record<string, any>;
    message: string;
    validator: (value: any) => boolean | Promise<boolean>;
};

// Interface for tag export/import operations
export interface TagExportFormat {
    tags: Tag[];
    relationships: TagRelationship[];
    localizations: TagLocalization[];
    version: string;
    exportDate: Date;
    metadata: {
        totalTags: number;
        totalRelationships: number;
        totalLocalizations: number;
    };
}