from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from core.config import clear_settings_cache
from main import create_app


@pytest.fixture
def app(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_path = tmp_path / "mcpcm-test.db"
    monkeypatch.setenv("MCPPCM_DATABASE_URL", f"sqlite:///{db_path}")
    monkeypatch.setenv("MCPPCM_MAX_INGEST_PAYLOAD_BYTES", "1024")
    clear_settings_cache()
    application = create_app()
    yield application
    clear_settings_cache()


@pytest.fixture
def client(app):
    with TestClient(app) as test_client:
        yield test_client
