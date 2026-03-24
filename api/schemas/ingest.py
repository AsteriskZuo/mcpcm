from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class IngestRequest(BaseModel):
    mcp_name: str = Field(min_length=1)
    raw_config: str = Field(min_length=1)
    agents: str = Field(min_length=1)
    event: Literal["install"]
    global_: bool = Field(default=False, alias="global")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    @field_validator("mcp_name", "raw_config", "agents")
    @classmethod
    def validate_non_empty_strings(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("must not be empty")
        return stripped


class IngestResponse(BaseModel):
    mcp_name: str
    raw_config: str
    install_count: int
    event: str
    global_: bool = Field(alias="global")

    model_config = ConfigDict(populate_by_name=True)
