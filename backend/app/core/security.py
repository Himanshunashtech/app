import base64
import hashlib
import hmac
import json
import time
from typing import Any

from fastapi import HTTPException, status

from app.core.config import get_settings


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip('=')


def _b64_decode(data: str) -> bytes:
    pad = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(f'{data}{pad}')


def create_token(user_id: str, ttl_seconds: int = 3600) -> str:
    payload = {'sub': user_id, 'exp': int(time.time()) + ttl_seconds}
    raw_payload = json.dumps(payload, separators=(',', ':'), sort_keys=True).encode()
    payload_b64 = _b64_encode(raw_payload)
    secret = get_settings().auth_secret.encode()
    signature = hmac.new(secret, payload_b64.encode(), hashlib.sha256).digest()
    return f'{payload_b64}.{_b64_encode(signature)}'


def verify_token(token: str) -> dict[str, Any]:
    try:
        payload_b64, signature_b64 = token.split('.', maxsplit=1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token format') from exc

    secret = get_settings().auth_secret.encode()
    expected_sig = _b64_encode(hmac.new(secret, payload_b64.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(expected_sig, signature_b64):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token signature')

    payload = json.loads(_b64_decode(payload_b64))
    if payload['exp'] < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired')
    return payload
