from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from core.config import get_settings
from core.errors import AppError
from db.database import Database
from repositories.mcp_server_repository import McpServerRepository
from routers import health, ingest, query
from services.ingest_service import IngestService
from services.query_service import QueryService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    database = Database(settings.database_url)
    database.connect()
    database.init_schema()

    repository = McpServerRepository(database)
    app.state.settings = settings
    app.state.database = database
    app.state.ingest_service = IngestService(repository)
    app.state.query_service = QueryService(repository)

    try:
        yield
    finally:
        database.close()


def create_app() -> FastAPI:
    app = FastAPI(title="mcpcm-server", version="0.1.0", lifespan=lifespan)

    @app.exception_handler(AppError)
    async def handle_app_error(_: Any, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_payload())

    @app.exception_handler(Exception)
    async def handle_unexpected_error(_: Any, exc: Exception) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={
                "code": "internal_error",
                "message": "An unexpected internal error occurred",
            },
        )

    app.include_router(health.router)
    app.include_router(ingest.router, prefix="/v1/ingest")
    app.include_router(query.router, prefix="/v1/query")
    return app


app = create_app()
