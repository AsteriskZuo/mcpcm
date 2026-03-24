from __future__ import annotations

from pathlib import Path

from db.database import Database
from repositories.mcp_server_repository import McpServerRepository
from schemas.ingest import IngestRequest
from schemas.query import QueryParams
from services.ingest_service import IngestService
from services.query_service import QueryService


def _build_services(db_path: Path) -> tuple[Database, IngestService, QueryService]:
    database = Database(f"sqlite:///{db_path}")
    database.connect()
    database.init_schema()
    repository = McpServerRepository(database)
    return database, IngestService(repository), QueryService(repository)


def test_query_service_filter_returns_minimal_items(tmp_path: Path) -> None:
    _, ingest_service, query_service = _build_services(tmp_path / "query-service.db")

    ingest_service.ingest(
        IngestRequest.model_validate(
            {
                "mcp_name": "alpha-server",
                "raw_config": "{}",
                "agents": "cursor",
                "event": "install",
            }
        )
    )
    ingest_service.ingest(
        IngestRequest.model_validate(
            {
                "mcp_name": "beta-server",
                "raw_config": "{}",
                "agents": "cursor",
                "event": "install",
            }
        )
    )
    ingest_service.ingest(
        IngestRequest.model_validate(
            {
                "mcp_name": "alpha-server",
                "raw_config": "{\"v\":2}",
                "agents": "cursor",
                "event": "install",
            }
        )
    )

    filtered = query_service.query(QueryParams.model_validate({"mcp_name": "alpha"}))
    assert len(filtered) == 1
    assert filtered[0].mcp_name == "alpha-server"
    assert filtered[0].install_count == 2


def test_query_service_ordering_is_stable(tmp_path: Path) -> None:
    _, ingest_service, query_service = _build_services(tmp_path / "query-order.db")

    ingest_service.ingest(
        IngestRequest.model_validate(
            {
                "mcp_name": "b-server",
                "raw_config": "{}",
                "agents": "cursor",
                "event": "install",
            }
        )
    )
    ingest_service.ingest(
        IngestRequest.model_validate(
            {
                "mcp_name": "a-server",
                "raw_config": "{}",
                "agents": "cursor",
                "event": "install",
            }
        )
    )

    response_one = query_service.query(QueryParams.model_validate({}))
    response_two = query_service.query(QueryParams.model_validate({}))

    names_one = [item.mcp_name for item in response_one]
    names_two = [item.mcp_name for item in response_two]

    assert names_one == ["a-server", "b-server"]
    assert names_one == names_two
