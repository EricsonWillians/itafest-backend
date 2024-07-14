from typing import List, Optional
from beanie import PydanticObjectId
from app.models.promotion import Promotion, PromotionCreate, PromotionUpdate, PromotionOut, PromotionCategory, PromotionStatus

async def create_promotion(promotion_in: PromotionCreate) -> PromotionOut:
    promotion = Promotion(**promotion_in.dict())
    await promotion.insert()
    return PromotionOut(**promotion.dict())

async def get_promotion(promotion_id: PydanticObjectId) -> Optional[PromotionOut]:
    promotion = await Promotion.get(promotion_id)
    if promotion:
        return PromotionOut(**promotion.dict())
    return None

async def update_promotion(promotion_id: PydanticObjectId, promotion_in: PromotionUpdate) -> Optional[PromotionOut]:
    promotion = await Promotion.get(promotion_id)
    if not promotion:
        return None
    await promotion.update({"$set": promotion_in.dict(exclude_unset=True)})
    await promotion.save()
    return PromotionOut(**promotion.dict())

async def delete_promotion(promotion_id: PydanticObjectId) -> bool:
    promotion = await Promotion.get(promotion_id)
    if not promotion:
        return False
    await promotion.delete()
    return True

async def list_promotions(skip: int = 0, limit: int = 10) -> List[PromotionOut]:
    promotions = await Promotion.find_all().skip(skip).limit(limit).to_list()
    return [PromotionOut(**promotion.dict()) for promotion in promotions]

async def list_promotions_by_category(category: PromotionCategory, skip: int = 0, limit: int = 10) -> List[PromotionOut]:
    promotions = await Promotion.find(Promotion.categories == category).skip(skip).limit(limit).to_list()
    return [PromotionOut(**promotion.dict()) for promotion in promotions]

async def list_active_promotions(skip: int = 0, limit: int = 10) -> List[PromotionOut]:
    promotions = await Promotion.find(Promotion.status == PromotionStatus.ACTIVE).skip(skip).limit(limit).to_list()
    return [PromotionOut(**promotion.dict()) for promotion in promotions]
