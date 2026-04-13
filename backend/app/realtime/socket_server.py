from collections import defaultdict

import socketio

from app.db.mongo import get_db
from app.models.chat import MessageIn
from app.services.chat_service import ChatService

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
user_rooms: dict[str, set[str]] = defaultdict(set)


@sio.event
async def connect(sid, environ, auth):
    user_id = auth.get('user_id') if auth else None
    if not user_id:
        return False
    await sio.enter_room(sid, f'user:{user_id}')
    user_rooms[user_id].add(sid)


@sio.event
async def disconnect(sid):
    for user_id, sids in user_rooms.items():
        if sid in sids:
            sids.remove(sid)
            break


@sio.event
async def join_chat(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        await sio.enter_room(sid, f'chat:{chat_id}')


@sio.event
async def send_message(sid, data):
    payload = MessageIn(**data)
    service = ChatService(get_db())
    message = await service.create_message(payload)
    await sio.emit('message_created', message.model_dump(mode='json'), room=f'chat:{payload.chat_id}')
