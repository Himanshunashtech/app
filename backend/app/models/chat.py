from datetime import datetime

from pydantic import BaseModel, Field


class ContactOut(BaseModel):
    id: str
    display_name: str
    phone: str
    about: str = 'Available'


class ChatCreate(BaseModel):
    contact_id: str = Field(min_length=1)
    title: str = Field(min_length=1, max_length=120)


class ChatSummary(BaseModel):
    id: str
    title: str
    last_message: str
    last_message_at: datetime
    unread_count: int = 0


class MessageIn(BaseModel):
    chat_id: str = Field(min_length=1)
    sender_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=4096)


class MessageOut(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    text: str
    created_at: datetime
