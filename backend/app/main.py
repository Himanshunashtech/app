from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from socketio import ASGIApp

from app.api.chat_routes import router as chat_router
from app.api.social_routes import router as social_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.middleware import RequestContextMiddleware
from app.core.security import create_token
from app.db.mongo import close_mongo, get_db
from app.realtime.socket_server import sio
from app.services.chat_service import ChatService
from app.services.social_service import SocialService

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    chat_service = ChatService(get_db())
    social_service = SocialService(get_db())
    await chat_service.ensure_indexes()
    await social_service.ensure_indexes()
    yield
    await close_mongo()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(RequestContextMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(chat_router, prefix=settings.api_prefix)
app.include_router(social_router, prefix=settings.api_prefix)


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}


class AuthRequest(BaseModel):
    user_id: str


@app.post('/auth/dev-token')
async def auth_dev_token(payload: AuthRequest) -> dict[str, str]:
    return {'access_token': create_token(payload.user_id)}


socket_app = ASGIApp(sio, other_asgi_app=app, socketio_path=settings.socketio_path)
