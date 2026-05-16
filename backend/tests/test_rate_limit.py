from fastapi import HTTPException

from app.core.rate_limit import InMemoryRateLimiter


def test_rate_limit_enforced() -> None:
    limiter = InMemoryRateLimiter(max_requests=2, period_seconds=60)
    limiter.check('user:1')
    limiter.check('user:1')

    try:
        limiter.check('user:1')
        assert False, 'expected HTTPException'
    except HTTPException as exc:
        assert exc.status_code == 429
