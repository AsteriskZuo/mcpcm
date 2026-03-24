from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _read_int(name: str, default: int, minimum: int = 0) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"Environment variable {name} must be an integer") from exc
    if value < minimum:
        raise ValueError(f"Environment variable {name} must be >= {minimum}")
    return value


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    database_url: str
    max_ingest_payload_bytes: int


@lru_cache
def get_settings() -> Settings:
    host = os.getenv("MCPPCM_HOST", "127.0.0.1")
    port = _read_int("MCPPCM_PORT", 8000, minimum=1)
    database_url = os.getenv("MCPPCM_DATABASE_URL", "sqlite:///./data/mcpcm.db")
    max_ingest_payload_bytes = _read_int("MCPPCM_MAX_INGEST_PAYLOAD_BYTES", 65536, minimum=1024)
    return Settings(
        host=host,
        port=port,
        database_url=database_url,
        max_ingest_payload_bytes=max_ingest_payload_bytes,
    )


def clear_settings_cache() -> None:
    get_settings.cache_clear()
