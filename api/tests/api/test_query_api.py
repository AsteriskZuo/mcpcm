from __future__ import annotations


def _seed(client) -> None:
    payloads = [
        {
            "mcp_name": "query-server-alpha",
            "raw_config": "{\"a\":1}",
            "agents": "cursor",
            "event": "install",
        },
        {
            "mcp_name": "query-server-beta",
            "raw_config": "{\"b\":1}",
            "agents": "cursor",
            "event": "install",
        },
        {
            "mcp_name": "query-server-alpha",
            "raw_config": "{\"a\":2}",
            "agents": "cursor",
            "event": "install",
        },
    ]
    for payload in payloads:
        response = client.post("/v1/ingest/mcp-servers", json=payload)
        assert response.status_code == 200


def test_query_api_default_behavior(client) -> None:
    _seed(client)

    response = client.get("/v1/query/mcp-servers")
    body = response.json()

    assert response.status_code == 200
    assert isinstance(body, list)
    assert len(body) == 2


def test_query_api_invalid_query_returns_400(client) -> None:
    response = client.get("/v1/query/mcp-servers", params={"mcp_name": "  "})

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_query"


def test_query_api_returns_minimal_item_shape(client) -> None:
    _seed(client)

    response = client.get("/v1/query/mcp-servers", params={"mcp_name": "alpha"})
    items = response.json()

    assert response.status_code == 200
    assert len(items) == 1
    assert set(items[0].keys()) == {"mcp_name", "raw_config", "install_count"}
    assert items[0]["mcp_name"] == "query-server-alpha"
    assert items[0]["install_count"] == 2

    response = client.get("/v1/query/mcp-servers", params={"mcp_name": "query-server"})
    items = response.json()
    assert response.status_code == 200
    assert len(items) == 2
    print(items) # 打印不出来呢？
