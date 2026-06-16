from fastapi import APIRouter

from app.config import settings
from app.schemas.push import VapidPublicKeyResponse

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-public-key", response_model=VapidPublicKeyResponse)
async def get_vapid_public_key() -> VapidPublicKeyResponse:
    return VapidPublicKeyResponse(publicKey=settings.vapid_public_key)
