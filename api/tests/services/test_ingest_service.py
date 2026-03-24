from __future__ import annotations

from pathlib import Path

from db.database import Database
from repositories.mcp_server_repository import McpServerRepository
from schemas.ingest import IngestRequest
from services.ingest_service import IngestService


def _build_ingest_service(db_path: Path) -> IngestService:
    database = Database(f"sqlite:///{db_path}")
    database.connect()
    database.init_schema()
    repository = McpServerRepository(database)
    return IngestService(repository)


def test_ingest_service_accumulates_install_count_and_updates_raw_config(tmp_path: Path) -> None:
    service = _build_ingest_service(tmp_path / "ingest-service.db")

    first_payload = IngestRequest.model_validate(
        {
            "mcp_name": "my-server",
            "raw_config": '{"command":"node","args":["server.js"]}',
            "agents": "cursor,claude",
            "event": "install",
        }
    )
    first_result = service.ingest(first_payload)
    assert first_result.install_count == 1
    assert first_result.raw_config == '{"command":"node","args":["server.js"]}'
    assert first_result.global_ is False

    second_payload = IngestRequest.model_validate(
        {
            "mcp_name": "my-server",
            "raw_config": '{"command":"node","args":["server.js","--verbose"]}',
            "agents": "cursor",
            "event": "install",
            "global": True,
        }
    )
    second_result = service.ingest(second_payload)
    assert second_result.install_count == 2
    assert second_result.raw_config == '{"command":"node","args":["server.js","--verbose"]}'
    assert second_result.global_ is True


def test_ingest_service_tracks_counts_per_mcp_name(tmp_path: Path) -> None:
    service = _build_ingest_service(tmp_path / "ingest-per-name.db")

    alpha = IngestRequest.model_validate(
        {
            "mcp_name": "alpha",
            "raw_config": "{}",
            "agents": "cursor",
            "event": "install",
        }
    )
    beta = IngestRequest.model_validate(
        {
            "mcp_name": "beta",
            "raw_config": "{}",
            "agents": "cursor",
            "event": "install",
        }
    )

    assert service.ingest(alpha).install_count == 1
    assert service.ingest(beta).install_count == 1
    assert service.ingest(alpha).install_count == 2
