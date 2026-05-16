from fastapi import HTTPException

from app.core.security import create_token, verify_token


def test_token_roundtrip() -> None:
    token = create_token('user-123', ttl_seconds=30)
    payload = verify_token(token)
    assert payload['sub'] == 'user-123'


def test_invalid_token_rejected() -> None:
    bad = 'aaa.bbb'
    try:
        verify_token(bad)
        assert False, 'expected HTTPException'
    except HTTPException as exc:
        assert exc.status_code == 401
