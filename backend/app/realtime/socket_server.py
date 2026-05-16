from collections import defaultdict

import socketio

from app.core.rate_limit import InMemoryRateLimiter
from app.core.security import verify_token
from app.db.mongo import get_db
from app.models.chat import MessageIn
from app.services.chat_service import ChatService

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
user_rooms: dict[str, set[str]] = defaultdict(set)
write_limiter = InMemoryRateLimiter(max_requests=80, period_seconds=60)


@sio.event
async def connect(sid, environ, auth):
    token = auth.get('token') if auth else None
    if not token:
        return False

    payload = verify_token(token)
    user_id = str(payload['sub'])
    await sio.save_session(sid, {'user_id': user_id})
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
    session = await sio.get_session(sid)
    user_id = session['user_id']
    write_limiter.check(f'user:{user_id}:socket_send')

    payload = MessageIn(chat_id=data['chat_id'], sender_id=user_id, text=data['text'])
    service = ChatService(get_db())
    message = await service.create_message(payload)
    await sio.emit('message_created', message.model_dump(mode='json'), room=f'chat:{payload.chat_id}')
