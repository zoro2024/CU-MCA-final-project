import hashlib
import json
import redis
from .config import settings

_r = redis.Redis.from_url(settings.redis_url, decode_responses=True)

def cache_key(text: str) -> str:
    return "analysis:" + hashlib.sha256(text.encode()).hexdigest()

def get_cached(text: str):
    raw = _r.get(cache_key(text))
    return json.loads(raw) if raw else None

def set_cached(text: str, value: dict):
    _r.setex(cache_key(text), settings.cache_ttl_seconds, json.dumps(value))

def ping() -> bool:
    try:
        return bool(_r.ping())
    except Exception:
        return False
