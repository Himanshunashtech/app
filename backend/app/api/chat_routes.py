from fastapi import APIRouter, Depends, Query

from app.core.deps import get_current_user_id
from app.core.rate_limit import InMemoryRateLimiter
from app.db.mongo import get_db
from app.models.chat import MessageIn, MessageOut
from app.services.chat_service import ChatService

router = APIRouter(prefix='/chats', tags=['chats'])
write_limiter = InMemoryRateLimiter(max_requests=60, period_seconds=60)


def get_service() -> ChatService:
    return ChatService(get_db())


@router.get('')
async def list_chats(
    service: ChatService = Depends(get_service),
    user_id: str = Depends(get_current_user_id),
):
    return await service.list_chats(user_id=user_id)


@router.get('/{chat_id}/messages', response_model=list[MessageOut])
async def list_messages(
    chat_id: str,
    limit: int = Query(default=100, ge=1, le=500),
    service: ChatService = Depends(get_service),
    user_id: str = Depends(get_current_user_id),
):
    return await service.list_messages(chat_id=chat_id, limit=limit, user_id=user_id)


@router.post('/messages', response_model=MessageOut)
async def create_message(
    payload: MessageIn,
    service: ChatService = Depends(get_service),
    user_id: str = Depends(get_current_user_id),
):
    write_limiter.check(f'user:{user_id}:send')
    secured_payload = MessageIn(chat_id=payload.chat_id, sender_id=user_id, text=payload.text)
    return await service.create_message(secured_payload)
