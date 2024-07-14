from typing import List, Optional
from pydantic import PydanticObjectId
from app.models.business import Business, BusinessCreate, BusinessUpdate, BusinessOut, BusinessCategory, BusinessStatus

async def create_business(business_in: BusinessCreate) -> BusinessOut:
    business = Business(**business_in.dict())
    await business.insert()
    return BusinessOut(**business.dict())

async def get_business(business_id: PydanticObjectId) -> Optional[BusinessOut]:
    business = await Business.get(business_id)
    if business:
        return BusinessOut(**business.dict())
    return None

async def update_business(business_id: PydanticObjectId, business_in: BusinessUpdate) -> Optional[BusinessOut]:
    business = await Business.get(business_id)
    if not business:
        return None
    await business.update({"$set": business_in.dict(exclude_unset=True)})
    await business.save()
    return BusinessOut(**business.dict())

async def delete_business(business_id: PydanticObjectId) -> bool:
    business = await Business.get(business_id)
    if not business:
        return False
    await business.delete()
    return True

async def list_businesses(skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find_all().skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]

async def list_businesses_by_category(category: BusinessCategory, skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find(Business.categories == category).skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]

async def list_active_businesses(skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find(Business.status == BusinessStatus.ACTIVE).skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]
from typing import List, Optional
from pydantic import PydanticObjectId
from app.models.business import Business, BusinessCreate, BusinessUpdate, BusinessOut

async def create_business(business_in: BusinessCreate) -> BusinessOut:
    business = Business(**business_in.dict())
    await business.insert()
    return BusinessOut(**business.dict())

async def get_business(business_id: PydanticObjectId) -> Optional[BusinessOut]:
    business = await Business.get(business_id)
    if business:
        return BusinessOut(**business.dict())
    return None

async def update_business(business_id: PydanticObjectId, business_in: BusinessUpdate) -> Optional[BusinessOut]:
    business = await Business.get(business_id)
    if not business:
        return None
    await business.update({"$set": business_in.dict(exclude_unset=True)})
    await business.save()
    return BusinessOut(**business.dict())

async def delete_business(business_id: PydanticObjectId) -> bool:
    business = await Business.get(business_id)
    if not business:
        return False
    await business.delete()
    return True

async def list_businesses(skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find_all().skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]

async def list_businesses_by_category(category: BusinessCategory, skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find(Business.categories == category).skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]

async def list_active_businesses(skip: int = 0, limit: int = 10) -> List[BusinessOut]:
    businesses = await Business.find(Business.status == BusinessStatus.ACTIVE).skip(skip).limit(limit).to_list()
    return [BusinessOut(**business.dict()) for business in businesses]
