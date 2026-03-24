from __future__ import annotations

from fastapi import Request

from services.ingest_service import IngestService
from services.query_service import QueryService


def get_ingest_service(request: Request) -> IngestService:
    return request.app.state.ingest_service


def get_query_service(request: Request) -> QueryService:
    return request.app.state.query_service
