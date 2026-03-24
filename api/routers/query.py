from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError

from core.errors import AppError
from dependencies import get_query_service
from schemas.query import QueryItem, QueryParams
from services.query_service import QueryService

router = APIRouter(tags=["query"])


async def parse_query_params(request: Request) -> QueryParams:
    raw_params = dict(request.query_params)
    try:
        return QueryParams.model_validate(raw_params)
    except ValidationError as exc:
        raise AppError(
            status_code=400,
            code="invalid_query",
            message="Invalid query parameters",
            details=exc.errors(),
        ) from exc


@router.get("/mcp-servers", response_model=list[QueryItem])
async def query_mcp_servers(
    params: QueryParams = Depends(parse_query_params),
    service: QueryService = Depends(get_query_service),
) -> list[QueryItem]:
    return service.query(params)
