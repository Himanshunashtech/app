from datetime import datetime

from pydantic import BaseModel, Field


class StatusCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class StatusOut(BaseModel):
    id: str
    user_id: str
    text: str
    created_at: datetime


class CallCreate(BaseModel):
    peer_name: str = Field(min_length=1, max_length=120)


class CallOut(BaseModel):
    id: str
    user_id: str
    peer_name: str
    direction: str
    created_at: datetime


class UserProfileIn(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    about: str = Field(min_length=1, max_length=240)
    phone: str = Field(min_length=3, max_length=40)
    notifications_enabled: bool = True
    read_receipts_enabled: bool = True


class UserProfileOut(UserProfileIn):
    user_id: str
