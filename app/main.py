from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models import Event, Promotion
from app.routers import event_router, promotion_router

app = FastAPI(title="Itafest API")

# Database configuration
MONGODB_URL = "mongodb://localhost:27017/itafest"
client = AsyncIOMotorClient(MONGODB_URL)
database = client.get_database()

# Initialize Beanie with models
@app.on_event("startup")
async def init():
    await init_beanie(database, document_models=[Event, Promotion])

# Include routers
app.include_router(event_router, prefix="/events", tags=["events"])
app.include_router(promotion_router, prefix="/promotions", tags=["promotions"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Itafest API"}
