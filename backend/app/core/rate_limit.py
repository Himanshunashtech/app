import time
from collections import defaultdict, deque

from fastapi import HTTPException, status


class InMemoryRateLimiter:
    def __init__(self, max_requests: int, period_seconds: int):
        self._max_requests = max_requests
        self._period_seconds = period_seconds
        self._events: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.time()
        window = self._events[key]

        while window and now - window[0] > self._period_seconds:
            window.popleft()

        if len(window) >= self._max_requests:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail='Rate limit exceeded')

        window.append(now)
