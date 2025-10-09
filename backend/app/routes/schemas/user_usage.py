from app.routes.schemas.base import BaseSchema


class UserUsageSummaryOutput(BaseSchema):
    total_price: float
    normal_chat_total: float
    bot_totals: dict[str, float]
    updated_at: float | None = None
