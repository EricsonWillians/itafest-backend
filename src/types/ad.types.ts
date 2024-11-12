// src/types/ad.types.ts

/**
 * Represents an advertisement created by a business for promotional purposes within the app.
 * This interface includes essential fields like impressions and budget, tailored for a local app in Itajubá.
 */
export interface Ad {
    /**
     * Unique identifier for the advertisement.
     */
    id?: string;
  
    /**
     * Title of the advertisement.
     */
    title: string;
  
    /**
     * Description or promotional message of the advertisement.
     */
    description: string;
  
    /**
     * Identifier of the business that owns the advertisement.
     */
    businessId: string;
  
    /**
     * URL of the image associated with the advertisement.
     */
    imageUrl?: string;
  
    /**
     * Start date when the advertisement becomes active.
     */
    startDate: Date;
  
    /**
     * End date when the advertisement expires.
     */
    endDate: Date;
  
    /**
     * Current status of the advertisement.
     */
    status: 'active' | 'inactive' | 'scheduled' | 'expired';
  
    /**
     * Type of advertisement for display purposes.
     */
    type: 'banner' | 'featured';
  
    /**
     * Number of times the advertisement has been displayed.
     */
    impressions: number;
  
    /**
     * Budget allocated for the advertisement campaign.
     */
    budget: number;
  
    /**
     * Indicates if the advertisement is part of a paid promotion.
     */
    isPaid: boolean;
  
    /**
     * Timestamp when the advertisement was created.
     */
    createdAt: Date;
  
    /**
     * Timestamp when the advertisement was last updated.
     */
    updatedAt: Date;
  }
  
  /**
   * Data Transfer Object for creating a new advertisement.
   */
  export interface CreateAdDTO
    extends Omit<Ad, 'id' | 'status' | 'impressions' | 'createdAt' | 'updatedAt'> {
    /**
     * Initial status of the advertisement.
     * @default 'scheduled'
     */
    status?: 'scheduled' | 'active';
  }
  
  /**
   * Data Transfer Object for updating an existing advertisement.
   */
  export interface UpdateAdDTO
    extends Partial<
      Omit<Ad, 'id' | 'businessId' | 'impressions' | 'createdAt' | 'updatedAt'>
    > {}
  