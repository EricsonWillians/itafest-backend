import { Category, CategoryType } from '@/types/category.types.ts';

// Define Tag related types
export interface Tag {
    id: string;
    name: string;
    description?: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

// Define tag reference type for efficient storage
export interface TagReference {
    id: string;
    name: string;
    // Optional reference to the full tag object
    details?: Tag;
}

// Define category reference type for consistency
export interface CategoryReference {
    id: string;
    type: CategoryType;
    // Optional reference to the full category object
    details?: Category;
}

export interface Business {
    id?: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    
    // Multiple categories support
    categories: CategoryReference[];
    
    // Multiple tags support
    tags: TagReference[];
    
    subscriptionStatus: 'free' | 'premium';
    subscriptionExpiresAt?: Date;
    logo?: string;
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        website?: string;
    };
    operatingHours?: {
        [key: string]: {
            open: string;
            close: string;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateBusinessDTO extends Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'subscriptionStatus'> {
    ownerId: string;
}

export interface UpdateBusinessDTO extends Partial<Omit<Business, 'id' | 'createdAt' | 'updatedAt'>> {}

// Tag management DTOs
export interface CreateTagDTO {
    name: string;
    description?: string;
    slug?: string; // Optional as it can be auto-generated from name
}

export interface UpdateTagDTO extends Partial<CreateTagDTO> {}

// Bulk operations interfaces
export interface BulkTagOperations {
    add: string[]; // Array of tag IDs to add
    remove: string[]; // Array of tag IDs to remove
}

export interface BulkCategoryOperations {
    add: string[]; // Array of category IDs to add
    remove: string[]; // Array of category IDs to remove
}

// Search and filter interfaces
export interface BusinessSearchParams {
    categories?: string[]; // Category IDs
    tags?: string[]; // Tag IDs
    query?: string; // Text search
    location?: {
        latitude: number;
        longitude: number;
        radius: number; // in kilometers
    };
}

// Response interfaces for tag-related queries
export interface TagWithUsageCount extends Tag {
    useCount: number; // Number of businesses using this tag
}

export interface CategoryWithUsageCount extends Category {
    useCount: number; // Number of businesses in this category
}