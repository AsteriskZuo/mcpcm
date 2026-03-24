from __future__ import annotations


def test_ingest_then_query_flow(client) -> None:
    first = client.post(
        "/v1/ingest/mcp-servers",
        json={
            "mcp_name": "alpha",
            "raw_config": "{\"x\":1}",
            "agents": "cursor",
            "event": "install",
        },
    )
    assert first.status_code == 200
    assert first.json()["install_count"] == 1

    second = client.post(
        "/v1/ingest/mcp-servers",
        json={
            "mcp_name": "beta",
            "raw_config": "{\"y\":1}",
            "agents": "cursor",
            "event": "install",
        },
    )
    assert second.status_code == 200

    third = client.post(
        "/v1/ingest/mcp-servers",
        json={
            "mcp_name": "alpha",
            "raw_config": "{\"x\":2}",
            "agents": "cursor",
            "event": "install",
        },
    )
    assert third.status_code == 200
    assert third.json()["install_count"] == 2

    query_all = client.get("/v1/query/mcp-servers")
    assert query_all.status_code == 200
    assert len(query_all.json()) == 2

    query_filtered = client.get("/v1/query/mcp-servers", params={"mcp_name": "alpha"})
    assert query_filtered.status_code == 200
    items = query_filtered.json()
    assert len(items) == 1
    assert items[0]["mcp_name"] == "alpha"
    assert items[0]["raw_config"] == "{\"x\":2}"
    assert items[0]["install_count"] == 2
