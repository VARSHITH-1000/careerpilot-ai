import time
import json
import sqlite3
import hashlib
import functools
import logging
from typing import Any, Callable, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import requests

logger = logging.getLogger(__name__)

# Cache configuration
CACHE_DB = "rag_cache.db"

class CacheManager:
    def __init__(self, db_path: str = CACHE_DB):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS cache (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    expiry INTEGER
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_expiry ON cache(expiry)")

    def _get_key(self, identifier: str, data: Any) -> str:
        content = f"{identifier}:{json.dumps(data, sort_keys=True)}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get(self, identifier: str, data: Any) -> Optional[Any]:
        key = self._get_key(identifier, data)
        now = int(time.time())
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    "SELECT value FROM cache WHERE key = ? AND (expiry IS NULL OR expiry > ?)",
                    (key, now)
                )
                row = cursor.fetchone()
                if row:
                    return json.loads(row[0])
        except Exception as e:
            logger.error(f"Cache get error: {e}")
        return None

    def set(self, identifier: str, data: Any, value: Any, ttl: int = 3600 * 24):
        key = self._get_key(identifier, data)
        expiry = int(time.time()) + ttl if ttl else None
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO cache (key, value, expiry) VALUES (?, ?, ?)",
                    (key, json.dumps(value), expiry)
                )
        except Exception as e:
            logger.error(f"Cache set error: {e}")

cache = CacheManager()

def cached_api_call(identifier: str, ttl: int = 3600 * 24):
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Use args/kwargs as cache key
            cache_data = {"args": args, "kwargs": kwargs}
            cached_val = cache.get(identifier, cache_data)
            if cached_val is not None:
                logger.info(f"Cache hit for {identifier}")
                return cached_val
            
            result = func(*args, **kwargs)
            if result:
                cache.set(identifier, cache_data, result, ttl)
            return result
        return wrapper
    return decorator

# Model Fallback Registry
MODEL_PRIORITY = [
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192"
]

class Throttler:
    def __init__(self, requests_per_second: float = 1.0):
        self.delay = 1.0 / requests_per_second
        self.last_call = 0

    def wait(self):
        now = time.time()
        elapsed = now - self.last_call
        if elapsed < self.delay:
            time.sleep(self.delay - elapsed)
        self.last_call = time.time()

# Semantic Scholar throttler (limit to 1 req/sec for free tier safety)
ss_throttler = Throttler(requests_per_second=1.0)

def _log_retry(retry_state):
    logger.warning(
        f"Retrying {retry_state.fn.__name__} (attempt {retry_state.attempt_number}) "
        f"after {retry_state.next_action.sleep}s due to: {retry_state.outcome.exception()}"
    )

def retry_with_backoff(exceptions=(Exception,), attempts=3):
    return retry(
        stop=stop_after_attempt(attempts),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(exceptions),
        before_sleep=_log_retry,
        reraise=True
    )
