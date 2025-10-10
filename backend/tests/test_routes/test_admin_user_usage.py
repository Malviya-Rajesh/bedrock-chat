import asyncio
import sys

sys.path.insert(0, ".")

from app.repositories.models.conversation import UserUsageModel
from app.repositories.models.usage_analysis import UsagePerUser
from app.routes.admin import get_users


def test_get_users_includes_token_and_price_details(monkeypatch):
    async def fake_find_users_sorted_by_price(limit: int, from_: str | None, to_: str | None):
        assert from_ == "2025090900"
        assert to_ == "2025091023"
        return [UsagePerUser(id="user-123", email="er.rajeshmalvi@gmail.com", total_price=0.04)]

    def fake_get_user_usage(user_id: str) -> UserUsageModel:
        assert user_id == "user-123"
        return UserUsageModel(
            total_price=0.04,
            normal_chat_total=0.00,
            bot_totals={},
            total_input_tokens=150,
            total_output_tokens=75,
            total_cache_read_input_tokens=10,
            total_cache_write_input_tokens=5,
            token_limit=500,
            updated_at=1_700_000_000.0,
        )

    monkeypatch.setattr(
        "app.routes.admin.find_users_sorted_by_price", fake_find_users_sorted_by_price
    )
    monkeypatch.setattr("app.routes.admin.get_user_usage", fake_get_user_usage)

    result = asyncio.run(get_users(limit=100, start="2025090900", end="2025091023", admin_check=None))

    assert len(result) == 1
    user = result[0]
    assert user.id == "user-123"
    assert user.email == "er.rajeshmalvi@gmail.com"
    assert user.total_price == 0.04
    assert user.total_tokens == 240
    assert user.token_limit == 500
    assert user.tokens_remaining == 260
    assert user.updated_at == 1_700_000_000.0
