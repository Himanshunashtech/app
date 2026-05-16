from fastapi import APIRouter, Depends

from app.core.deps import get_current_user_id
from app.core.rate_limit import InMemoryRateLimiter
from app.db.mongo import get_db
from app.models.social import CallCreate, CallOut, StatusCreate, StatusOut, UserProfileIn, UserProfileOut
from app.services.social_service import SocialService

router = APIRouter(prefix='/social', tags=['social'])
write_limiter = InMemoryRateLimiter(max_requests=40, period_seconds=60)


def get_service() -> SocialService:
    return SocialService(get_db())


@router.get('/statuses', response_model=list[StatusOut])
async def list_statuses(service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    return await service.list_statuses(user_id)


@router.post('/statuses', response_model=StatusOut)
async def create_status(payload: StatusCreate, service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    write_limiter.check(f'user:{user_id}:status')
    return await service.create_status(user_id=user_id, text=payload.text)


@router.get('/calls', response_model=list[CallOut])
async def list_calls(service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    return await service.list_calls(user_id)


@router.post('/calls', response_model=CallOut)
async def create_call(payload: CallCreate, service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    write_limiter.check(f'user:{user_id}:calls')
    return await service.create_call(user_id=user_id, peer_name=payload.peer_name)


@router.get('/profile', response_model=UserProfileOut)
async def get_profile(service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    return await service.get_profile(user_id)


@router.put('/profile', response_model=UserProfileOut)
async def update_profile(payload: UserProfileIn, service: SocialService = Depends(get_service), user_id: str = Depends(get_current_user_id)):
    write_limiter.check(f'user:{user_id}:profile')
    return await service.upsert_profile(user_id, payload)
