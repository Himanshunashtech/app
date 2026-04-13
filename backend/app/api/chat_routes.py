from fastapi import APIRouter, Depends, Query

from app.db.mongo import get_db
from app.models.chat import MessageIn, MessageOut
from app.services.chat_service import ChatService

router = APIRouter(prefix='/chats', tags=['chats'])


def get_service() -> ChatService:
    return ChatService(get_db())


@router.get('')
async def list_chats(user_id: str = Query(...), service: ChatService = Depends(get_service)):
    return await service.list_chats(user_id=user_id)


@router.get('/{chat_id}/messages', response_model=list[MessageOut])
async def list_messages(chat_id: str, limit: int = Query(default=100, ge=1, le=500), service: ChatService = Depends(get_service)):
    return await service.list_messages(chat_id=chat_id, limit=limit)


@router.post('/messages', response_model=MessageOut)
async def create_message(payload: MessageIn, service: ChatService = Depends(get_service)):
    return await service.create_message(payload)
