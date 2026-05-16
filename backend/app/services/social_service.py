from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.social import CallOut, StatusOut, UserProfileIn, UserProfileOut


class SocialService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db.statuses.create_index([('user_id', 1), ('created_at', -1)])
        await self._db.calls.create_index([('user_id', 1), ('created_at', -1)])
        await self._db.user_profiles.create_index('user_id', unique=True)

    async def list_statuses(self, user_id: str, limit: int = 100) -> list[StatusOut]:
        cursor = self._db.statuses.find({'user_id': user_id}).sort('created_at', -1).limit(limit)
        output: list[StatusOut] = []
        async for item in cursor:
            output.append(
                StatusOut(id=str(item['_id']), user_id=item['user_id'], text=item['text'], created_at=item['created_at'])
            )
        return output

    async def create_status(self, user_id: str, text: str) -> StatusOut:
        now = datetime.now(UTC)
        doc: dict[str, Any] = {'_id': str(uuid4()), 'user_id': user_id, 'text': text, 'created_at': now}
        await self._db.statuses.insert_one(doc)
        return StatusOut(id=doc['_id'], user_id=user_id, text=text, created_at=now)

    async def list_calls(self, user_id: str, limit: int = 100) -> list[CallOut]:
        cursor = self._db.calls.find({'user_id': user_id}).sort('created_at', -1).limit(limit)
        output: list[CallOut] = []
        async for item in cursor:
            output.append(
                CallOut(
                    id=str(item['_id']),
                    user_id=item['user_id'],
                    peer_name=item['peer_name'],
                    direction=item['direction'],
                    created_at=item['created_at'],
                )
            )
        return output

    async def create_call(self, user_id: str, peer_name: str) -> CallOut:
        now = datetime.now(UTC)
        doc = {'_id': str(uuid4()), 'user_id': user_id, 'peer_name': peer_name, 'direction': 'outgoing', 'created_at': now}
        await self._db.calls.insert_one(doc)
        return CallOut(id=doc['_id'], user_id=user_id, peer_name=peer_name, direction='outgoing', created_at=now)

    async def get_profile(self, user_id: str) -> UserProfileOut:
        item = await self._db.user_profiles.find_one({'user_id': user_id})
        if not item:
            defaults = UserProfileOut(
                user_id=user_id,
                display_name='User',
                about='Available',
                phone='+1 555 0000',
                notifications_enabled=True,
                read_receipts_enabled=True,
            )
            await self._db.user_profiles.insert_one(defaults.model_dump())
            return defaults

        return UserProfileOut(**item)

    async def upsert_profile(self, user_id: str, payload: UserProfileIn) -> UserProfileOut:
        doc = payload.model_dump()
        doc['user_id'] = user_id
        await self._db.user_profiles.update_one({'user_id': user_id}, {'$set': doc}, upsert=True)
        return UserProfileOut(**doc)
