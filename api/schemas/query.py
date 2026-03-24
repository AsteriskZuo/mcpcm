from __future__ import annotations

from pydantic import BaseModel, ConfigDict, field_validator


class QueryParams(BaseModel):
    mcp_name: str | None = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("mcp_name", mode="before")
    @classmethod
    def normalize_mcp_name(cls, value: object) -> object:
        if value is None:
            return None
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                raise ValueError("mcp_name must not be empty")
            return stripped
        return value


class QueryItem(BaseModel):
    mcp_name: str
    raw_config: str
    install_count: int
