from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.chat import ChatCreate, ChatSummary, ContactOut, MessageIn, MessageOut

DEFAULT_CONTACTS = [
    ContactOut(id='ava', display_name='Ava Thompson', phone='+1 555 0101', about='Landing soon'),
    ContactOut(id='design-team', display_name='Design Team', phone='+1 555 0102', about='Group chat'),
    ContactOut(id='dad', display_name='Dad', phone='+1 555 0103', about='Call me anytime'),
    ContactOut(id='maya', display_name='Maya', phone='+1 555 0104', about='Available'),
]


class ChatService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db.messages.create_index([('chat_id', 1), ('created_at', -1)])
        await self._db.chats.create_index([('participant_ids', 1), ('last_message_at', -1)])
        await self._db.chats.create_index([('owner_id', 1), ('contact_id', 1)], unique=True)
        await self._db.contacts.create_index('id', unique=True)

    async def list_contacts(self) -> list[ContactOut]:
        contacts: list[ContactOut] = []
        cursor = self._db.contacts.find({}).sort('display_name', 1).limit(500)
        async for contact in cursor:
            contacts.append(ContactOut(**{key: contact[key] for key in ('id', 'display_name', 'phone', 'about')}))

        if contacts:
            return contacts

        await self._db.contacts.insert_many([contact.model_dump() for contact in DEFAULT_CONTACTS])
        return DEFAULT_CONTACTS

    async def create_chat(self, user_id: str, payload: ChatCreate) -> ChatSummary:
        now = datetime.now(UTC)
        chat_id = f'{user_id}:{payload.contact_id}'
        await self._db.chats.update_one(
            {'_id': chat_id},
            {
                '$setOnInsert': {
                    '_id': chat_id,
                    'owner_id': user_id,
                    'contact_id': payload.contact_id,
                    'participant_ids': [user_id, payload.contact_id],
                    'title': payload.title,
                    'last_message': 'Chat created',
                    'last_message_at': now,
                    'unread_counts': {user_id: 0},
                }
            },
            upsert=True,
        )
        return ChatSummary(id=chat_id, title=payload.title, last_message='Chat created', last_message_at=now, unread_count=0)

    async def list_chats(self, user_id: str, limit: int = 50) -> list[ChatSummary]:
        cursor = (
            self._db.chats.find({'participant_ids': user_id})
            .sort('last_message_at', -1)
            .limit(limit)
        )
        items: list[ChatSummary] = []
        async for chat in cursor:
            items.append(
                ChatSummary(
                    id=str(chat['_id']),
                    title=chat['title'],
                    last_message=chat.get('last_message', ''),
                    last_message_at=chat.get('last_message_at', datetime.now(UTC)),
                    unread_count=chat.get('unread_counts', {}).get(user_id, 0),
                )
            )
        return items

    async def list_messages(self, chat_id: str, user_id: str, limit: int = 100) -> list[MessageOut]:
        chat = await self._db.chats.find_one({'_id': chat_id, 'participant_ids': user_id}, {'_id': 1})
        if not chat:
            return []

        cursor = (
            self._db.messages.find({'chat_id': chat_id})
            .sort('created_at', -1)
            .limit(limit)
        )
        items: list[MessageOut] = []
        async for message in cursor:
            items.append(self._to_message_out(message))
        return list(reversed(items))

    async def create_message(self, payload: MessageIn) -> MessageOut:
        now = datetime.now(UTC)
        message_id = str(uuid4())
        doc: dict[str, Any] = {
            '_id': message_id,
            'chat_id': payload.chat_id,
            'sender_id': payload.sender_id,
            'text': payload.text,
            'created_at': now,
        }
        await self._db.messages.insert_one(doc)
        await self._db.chats.update_one(
            {'_id': payload.chat_id},
            {'$set': {'last_message': payload.text, 'last_message_at': now}},
            upsert=False,
        )
        return self._to_message_out(doc)

    @staticmethod
    def _to_message_out(doc: dict[str, Any]) -> MessageOut:
        return MessageOut(
            id=str(doc['_id']),
            chat_id=doc['chat_id'],
            sender_id=doc['sender_id'],
            text=doc['text'],
            created_at=doc['created_at'],
        )
