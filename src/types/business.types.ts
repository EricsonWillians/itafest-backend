// src/types/business.types.ts
export interface Business {
    id?: string;
    name: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    category: string;
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