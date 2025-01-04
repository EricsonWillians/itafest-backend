// src/types/event.types.ts
export interface Event {
    id?: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    businessId: string;
    imageUrl?: string;
    category: string;
    createdAt: Date;
    updatedAt: Date;
  }