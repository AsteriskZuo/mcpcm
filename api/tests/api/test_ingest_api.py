from __future__ import annotations


def _valid_payload() -> dict[str, object]:
    return {
        "mcp_name": "my-server",
        "raw_config": '{"mcpServers":{"my-server":{}}}',
        "agents": "cursor,claude",
        "event": "install",
    }


def test_ingest_api_success_and_install_count_increment(client) -> None:
    payload = _valid_payload()

    first = client.post("/v1/ingest/mcp-servers", json=payload)
    assert first.status_code == 200
    assert first.json()["install_count"] == 1
    assert first.json()["global"] is False

    second = client.post("/v1/ingest/mcp-servers", json=payload)
    assert second.status_code == 200
    assert second.json()["install_count"] == 2


def test_ingest_api_validation_error_returns_422(client) -> None:
    payload = _valid_payload()
    payload["event"] = "update"

    response = client.post("/v1/ingest/mcp-servers", json=payload)
    body = response.json()

    assert response.status_code == 422
    assert body["code"] == "validation_error"
    assert "details" in body


def test_ingest_api_rejects_malformed_json(client) -> None:
    response = client.post(
        "/v1/ingest/mcp-servers",
        data='{"mcp_name":',
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 400
    assert response.json()["code"] == "invalid_json"


def test_ingest_api_rejects_non_json_content_type(client) -> None:
    response = client.post(
        "/v1/ingest/mcp-servers", data="hello", headers={"content-type": "text/plain"}
    )

    assert response.status_code == 400
    assert response.json()["code"] == "unsupported_content_type"


def test_ingest_api_payload_too_large(client) -> None:
    large_payload = {
        "mcp_name": "big-server",
        "raw_config": "x" * 3000,
        "agents": "cursor",
        "event": "install",
    }

    response = client.post("/v1/ingest/mcp-servers", json=large_payload)

    assert response.status_code == 413
    assert response.json()["code"] == "payload_too_large"
