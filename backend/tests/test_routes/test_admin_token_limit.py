import sys

sys.path.insert(0, ".")

from app.repositories.models.conversation import UserUsageModel
from app.routes.admin import UpdateUserTokenLimitInput, set_user_token_limit


def dummy_get_user_by_id(*_: object, **__: object):  # noqa: ANN001
    return None


def dummy_update_user_token_limit(user_id: str, token_limit: int | None) -> UserUsageModel:
    assert user_id == "user-123"
    assert token_limit == 10
    return UserUsageModel(
        total_price=0,
        normal_chat_total=0,
        bot_totals={},
        total_input_tokens=0,
        total_output_tokens=0,
        total_cache_read_input_tokens=0,
        total_cache_write_input_tokens=0,
        token_limit=10,
        updated_at=0,
    )


def test_update_user_token_limit_when_user_missing(monkeypatch):
    monkeypatch.setattr("app.routes.admin.get_user_by_id", dummy_get_user_by_id)
    monkeypatch.setattr(
        "app.routes.admin.update_user_token_limit", dummy_update_user_token_limit
    )

    result = set_user_token_limit(
        user_id="user-123",
        token_limit_input=UpdateUserTokenLimitInput(token_limit=10),
        admin_check=None,
    )

    assert result.id == "user-123"
    assert result.email == "user-123"
    assert result.token_limit == 10
