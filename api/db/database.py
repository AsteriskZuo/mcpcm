from __future__ import annotations

import sqlite3
from pathlib import Path


class Database:
    def __init__(self, database_url: str) -> None:
        self._database_url = database_url
        self._connection: sqlite3.Connection | None = None

    def connect(self) -> None:
        sqlite_path = _sqlite_path_from_url(self._database_url)
        if sqlite_path != ":memory:":
            Path(sqlite_path).parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(sqlite_path, check_same_thread=False)
        self._connection.row_factory = sqlite3.Row
        self._connection.execute("PRAGMA foreign_keys = ON;")

    @property
    def connection(self) -> sqlite3.Connection:
        if self._connection is None:
            raise RuntimeError("Database connection has not been initialized")
        return self._connection

    def init_schema(self) -> None:
        self._migrate_legacy_schema_if_needed()
        self.connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS mcp_servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mcp_name TEXT NOT NULL UNIQUE,
                raw_config TEXT NOT NULL,
                agents TEXT NOT NULL,
                event TEXT NOT NULL,
                is_global INTEGER NOT NULL DEFAULT 0,
                install_count INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_mcp_servers_mcp_name ON mcp_servers (mcp_name);
            """
        )
        self.connection.commit()

    def close(self) -> None:
        if self._connection is not None:
            self._connection.close()
            self._connection = None

    def _migrate_legacy_schema_if_needed(self) -> None:
        table_exists = self.connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name = 'mcp_servers'
            """
        ).fetchone()
        if table_exists is None:
            return

        columns = self.connection.execute("PRAGMA table_info(mcp_servers)").fetchall()
        column_names = {column["name"] for column in columns}
        if "fingerprint" in column_names:
            self.connection.executescript(
                """
                DROP TABLE IF EXISTS mcp_servers;
                DROP INDEX IF EXISTS idx_mcp_servers_agent;
                DROP INDEX IF EXISTS idx_mcp_servers_server_name;
                DROP INDEX IF EXISTS idx_mcp_servers_updated_at;
                """
            )
            self.connection.commit()


def _sqlite_path_from_url(database_url: str) -> str:
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        raise ValueError("Only sqlite:/// URLs are currently supported")
    path = database_url[len(prefix) :]
    if path == ":memory:":
        return path
    return str(Path(path).resolve())
