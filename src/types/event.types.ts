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
  
  // src/services/event.service.ts
  import { db } from "@/config/firebase.config.ts";
  import { Event } from "@/types/event.types.ts";
  import { 
    collection, 
    addDoc, 
    getDocs,
    query, 
    where,
    orderBy,
    limit 
  } from "firebase/firestore";
  
  export class EventService {
    private collection = collection(db, 'events');
  
    async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
      const now = new Date();
      const event = {
        ...eventData,
        createdAt: now,
        updatedAt: now
      };
  
      const docRef = await addDoc(this.collection, event);
      return {
        id: docRef.id,
        ...event
      };
    }
  
    async getEvents(page: number = 1, itemsPerPage: number = 10): Promise<Event[]> {
      const eventsQuery = query(
        this.collection,
        orderBy('date', 'asc'),
        limit(itemsPerPage)
      );
      
      const snapshot = await getDocs(eventsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
    }
  }
  
  // src/api/controllers/event.controller.ts
  import { Context } from "oak";
  import { EventService } from "@/services/event.service.ts";
  
  export class EventController {
    private eventService: EventService;
  
    constructor() {
      this.eventService = new EventService();
    }
  
    async createEvent(ctx: Context) {
      try {
        const body = await ctx.request.body().value;
        const event = await this.eventService.createEvent(body);
        ctx.response.status = 201;
        ctx.response.body = { success: true, data: event };
      } catch (error) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: error.message };
      }
    }
  
    async getEvents(ctx: Context) {
      try {
        const { page = 1, limit = 10 } = ctx.request.query;
        const events = await this.eventService.getEvents(Number(page), Number(limit));
        ctx.response.body = { success: true, data: events };
      } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = { success: false, message: error.message };
      }
    }
  }
  
  // src/api/routes/event.routes.ts
  import { Router } from "oak";
  import { EventController } from "@/api/controllers/event.controller.ts";
  import { authMiddleware } from "@/api/middlewares/auth.middleware.ts";
  
  const router = new Router();
  const eventController = new EventController();
  
  router
    .get("/events", eventController.getEvents.bind(eventController))
    .post("/events", authMiddleware, eventController.createEvent.bind(eventController));
  
  export { router as eventRouter };