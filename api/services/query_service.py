from __future__ import annotations

from repositories.mcp_server_repository import McpServerRepository
from schemas.query import QueryItem, QueryParams


class QueryService:
    def __init__(self, repository: McpServerRepository) -> None:
        self._repository = repository

    def query(self, params: QueryParams) -> list[QueryItem]:
        records = self._repository.query(params)

        return [
            QueryItem(
                mcp_name=record.mcp_name,
                raw_config=record.raw_config,
                install_count=record.install_count,
            )
            for record in records
        ]
