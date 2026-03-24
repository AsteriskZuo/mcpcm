from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from db.database import Database
from schemas.query import QueryParams


@dataclass(frozen=True)
class StoredMcpRecord:
    mcp_name: str
    raw_config: str
    agents: str
    event: str
    is_global: bool
    install_count: int


class McpServerRepository:
    def __init__(self, database: Database) -> None:
        self._database = database

    def upsert_install(
        self,
        *,
        mcp_name: str,
        raw_config: str,
        agents: str,
        event: str,
        is_global: bool,
    ) -> StoredMcpRecord:
        row = self._database.connection.execute(
            """
            SELECT mcp_name, raw_config, agents, event, is_global, install_count
            FROM mcp_servers
            WHERE mcp_name = ?
            """,
            (mcp_name,),
        ).fetchone()

        now = datetime.now(tz=UTC).isoformat()
        if row is None:
            install_count = 1
            self._database.connection.execute(
                """
                INSERT INTO mcp_servers (
                    mcp_name, raw_config, agents, event, is_global, install_count,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    mcp_name,
                    raw_config,
                    agents,
                    event,
                    1 if is_global else 0,
                    install_count,
                    now,
                    now,
                ),
            )
            self._database.connection.commit()
            return StoredMcpRecord(
                mcp_name=mcp_name,
                raw_config=raw_config,
                agents=agents,
                event=event,
                is_global=is_global,
                install_count=install_count,
            )

        install_count = int(row["install_count"]) + 1
        self._database.connection.execute(
            """
            UPDATE mcp_servers
            SET raw_config = ?,
                agents = ?,
                event = ?,
                is_global = ?,
                install_count = ?,
                updated_at = ?
            WHERE mcp_name = ?
            """,
            (
                raw_config,
                agents,
                event,
                1 if is_global else 0,
                install_count,
                now,
                mcp_name,
            ),
        )
        self._database.connection.commit()
        return StoredMcpRecord(
            mcp_name=mcp_name,
            raw_config=raw_config,
            agents=agents,
            event=event,
            is_global=is_global,
            install_count=install_count,
        )

    def query(self, params: QueryParams) -> list[StoredMcpRecord]:
        where_clauses: list[str] = []
        values: list[object] = []

        if params.mcp_name:
            where_clauses.append("LOWER(mcp_name) LIKE LOWER(?)")
            values.append(f"%{params.mcp_name}%")

        where_sql = ""
        if where_clauses:
            where_sql = "WHERE " + " AND ".join(where_clauses)

        rows = self._database.connection.execute(
            f"""
            SELECT
                mcp_name,
                raw_config,
                agents,
                event,
                is_global,
                install_count
            FROM mcp_servers
            {where_sql}
            ORDER BY mcp_name ASC
            """,
            values,
        ).fetchall()

        return [self._row_to_record(row) for row in rows]

    def _row_to_record(self, row: object) -> StoredMcpRecord:
        return StoredMcpRecord(
            mcp_name=row["mcp_name"],
            raw_config=row["raw_config"],
            agents=row["agents"],
            event=row["event"],
            is_global=bool(row["is_global"]),
            install_count=int(row["install_count"]),
        )
