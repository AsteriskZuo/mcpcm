from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import ValidationError

from core.errors import AppError
from dependencies import get_ingest_service
from schemas.ingest import IngestRequest, IngestResponse
from services.ingest_service import IngestService

router = APIRouter(tags=["ingest"])


async def parse_ingest_payload(request: Request) -> IngestRequest:
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type:
        raise AppError(
            status_code=400,
            code="unsupported_content_type",
            message="Content-Type must be application/json",
        )

    body = await request.body()
    if not body:
        raise AppError(status_code=400, code="invalid_json", message="Request body is required")

    limit = request.app.state.settings.max_ingest_payload_bytes
    if len(body) > limit:
        raise AppError(
            status_code=413,
            code="payload_too_large",
            message=f"Payload exceeds limit of {limit} bytes",
            details={"maxBytes": limit, "actualBytes": len(body)},
        )

    try:
        return IngestRequest.model_validate_json(body)
    except ValidationError as exc:
        details = exc.errors()
        if any(error.get("type") == "json_invalid" for error in details):
            raise AppError(
                status_code=400,
                code="invalid_json",
                message="Malformed JSON payload",
                details=details,
            ) from exc
        raise AppError(
            status_code=422,
            code="validation_error",
            message="Validation failed",
            details=details,
        ) from exc


@router.post("/mcp-servers", response_model=IngestResponse)
async def ingest_mcp_servers(
    payload: IngestRequest = Depends(parse_ingest_payload),
    service: IngestService = Depends(get_ingest_service),
) -> IngestResponse:
    try:
        return service.ingest(payload)
    except ValueError as exc:
        raise AppError(
            status_code=422,
            code="validation_error",
            message=str(exc),
        ) from exc
