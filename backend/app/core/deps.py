from fastapi import Header, HTTPException, status

from app.core.security import verify_token


async def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')

    token = authorization.replace('Bearer ', '', 1)
    payload = verify_token(token)
    return str(payload['sub'])
