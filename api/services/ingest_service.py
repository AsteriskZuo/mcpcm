from __future__ import annotations

from repositories.mcp_server_repository import McpServerRepository
from schemas.ingest import IngestRequest, IngestResponse


class IngestService:
    def __init__(self, repository: McpServerRepository) -> None:
        self._repository = repository

    def ingest(self, payload: IngestRequest) -> IngestResponse:
        stored = self._repository.upsert_install(
            mcp_name=payload.mcp_name,
            raw_config=payload.raw_config,
            agents=payload.agents,
            event=payload.event,
            is_global=payload.global_,
        )
        return IngestResponse(
            mcp_name=stored.mcp_name,
            raw_config=stored.raw_config,
            install_count=stored.install_count,
            event=stored.event,
            global_=stored.is_global,
        )
