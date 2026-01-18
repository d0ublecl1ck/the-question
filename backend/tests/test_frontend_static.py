import os
import importlib
from pathlib import Path

from fastapi.testclient import TestClient


def test_frontend_static_serving(tmp_path, monkeypatch):
    index = tmp_path / "index.html"
    asset = tmp_path / "assets" / "logo.txt"
    asset.parent.mkdir(parents=True, exist_ok=True)
    index.write_text("<html><body>ok</body></html>", encoding="utf-8")
    asset.write_text("logo", encoding="utf-8")

    monkeypatch.setenv("FRONTEND_DIST", str(tmp_path))

    import app.main as main

    importlib.reload(main)

    client = TestClient(main.app)

    response = client.get("/")
    assert response.status_code == 200
    assert "ok" in response.text

    asset_response = client.get("/assets/logo.txt")
    assert asset_response.status_code == 200
    assert asset_response.text == "logo"

    fallback_response = client.get("/unknown/path")
    assert fallback_response.status_code == 200
    assert "ok" in fallback_response.text

