import importlib.util
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, ".")

if "app.utils.text_filter" not in sys.modules:
    text_filter_path = Path(__file__).resolve().parents[2] / "app" / "utils" / "text_filter.py"
    spec = importlib.util.spec_from_file_location("app.utils.text_filter", text_filter_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.modules["app.utils.text_filter"] = module

from fastapi.testclient import TestClient

from app.main import app


def test_admin_users_endpoint_returns_usage_summary(monkeypatch):
    async def fake_find_users_sorted_by_price(*args: Any, **kwargs: Any):
        class Dummy:
            id = "user-123"
            email = "user@example.com"
            total_price = 0.04
        return [Dummy()]

    def fake_get_user_usage(user_id: str):
        from app.repositories.models.conversation import UserUsageModel

        return UserUsageModel(
            total_price=0.04,
            normal_chat_total=0.0,
            bot_totals={},
            updated_at=123456789.0,
        )

    def fake_verify_token(_token: str):
        return {
            "sub": "admin",
            "cognito:username": "admin",
            "email": "admin@example.com",
            "cognito:groups": ["Admin"],
        }

    monkeypatch.setattr("app.usecases.user.get_user_usage", fake_get_user_usage)
    monkeypatch.setattr("app.routes.admin.get_user_usage", fake_get_user_usage)
    monkeypatch.setattr("app.routes.admin.find_users_sorted_by_price", fake_find_users_sorted_by_price)
    monkeypatch.setattr("app.auth.verify_token", fake_verify_token)
    monkeypatch.setattr("app.dependencies.verify_token", fake_verify_token)

    client = TestClient(app)
    response = client.get("/admin/users", headers={"Authorization": "Bearer test-token"})
    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["totalPrice"] == 0.04
    assert payload[0]["normalChatTotal"] == 0.0
    assert payload[0]["botTotals"] == {}
    assert payload[0]["updatedAt"] == 123456789.0


def test_admin_users_endpoint_returns_price_fields(monkeypatch):
    async def fake_find_users_sorted_by_price(*args: Any, **kwargs: Any):
        class Dummy:
            id = "user-456"
            email = "coins@example.com"
            total_price = 42.5

        return [Dummy()]

    def fake_get_user_usage(user_id: str):
        from app.repositories.models.conversation import UserUsageModel

        return UserUsageModel(
            total_price=42.5,
            normal_chat_total=12.0,
            bot_totals={"bot-main": 30.5},
            updated_at=987654321.0,
        )

    def fake_verify_token(_token: str):
        return {
            "sub": "admin",
            "cognito:username": "admin",
            "email": "admin@example.com",
            "cognito:groups": ["Admin"],
        }

    monkeypatch.setattr("app.usecases.user.get_user_usage", fake_get_user_usage)
    monkeypatch.setattr("app.routes.admin.get_user_usage", fake_get_user_usage)
    monkeypatch.setattr("app.routes.admin.find_users_sorted_by_price", fake_find_users_sorted_by_price)
    monkeypatch.setattr("app.auth.verify_token", fake_verify_token)
    monkeypatch.setattr("app.dependencies.verify_token", fake_verify_token)

    client = TestClient(app)
    response = client.get("/admin/users", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 200
    payload = response.json()
    assert payload[0]["totalPrice"] == 42.5
    assert payload[0]["normalChatTotal"] == 12.0
    assert payload[0]["botTotals"] == {"bot-main": 30.5}
    assert payload[0]["periodTotalPrice"] == 42.5
