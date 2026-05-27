import time
from typing import Any, Optional


class MemoryCache:
    """Simple in-memory TTL cache to avoid repeated API calls."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            value, expires_at = self._store[key]
            if time.time() < expires_at:
                return value
            del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._store[key] = (value, time.time() + ttl_seconds)

    def clear(self):
        self._store.clear()


# Global cache instance — 5 min default TTL
cache = MemoryCache()
