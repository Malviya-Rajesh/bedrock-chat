import boto3
from decimal import Decimal
from collections import defaultdict
from datetime import datetime, timezone

# ---- CONFIG ----
TABLE_NAME = "BedrockChatStack-DatabaseConversationTableV3C1D85773-1OS6AQ92HAYGK"
REGION_NAME = "us-east-1"  # change if needed

# ---- SETUP ----
dynamodb = boto3.resource("dynamodb", region_name=REGION_NAME)
table = dynamodb.Table(TABLE_NAME)


def to_date_str(epoch_ms: float | int | None) -> str:
    """Convert epoch milliseconds to YYYY-MM-DD string."""
    if not epoch_ms:
        return "unknown"
    try:
        dt = datetime.fromtimestamp(float(epoch_ms) / 1000, tz=timezone.utc)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return "unknown"


def fetch_total_price_per_day():
    totals = defaultdict(lambda: defaultdict(Decimal))
    last_evaluated_key = None
    total_items = 0

    print(f"Scanning table: {TABLE_NAME} ...")

    while True:
        if last_evaluated_key:
            response = table.scan(ExclusiveStartKey=last_evaluated_key)
        else:
            response = table.scan()

        items = response.get("Items", [])
        total_items += len(items)

        for item in items:
            pk = item.get("PK")
            price = item.get("TotalPrice", Decimal("0"))
            create_time = item.get("CreateTime")

            if not pk or not isinstance(price, (Decimal, int, float)):
                continue

            date_str = to_date_str(create_time)
            totals[pk][date_str] += Decimal(str(price))

        last_evaluated_key = response.get("LastEvaluatedKey")
        if not last_evaluated_key:
            break

    print(f"Scanned {total_items} items total.\n")
    return totals


if __name__ == "__main__":
    totals = fetch_total_price_per_day()

    if not totals:
        print("⚠️ No TotalPrice data found.")
    else:
        print("=== Total Price per User per Day ===\n")
        for pk, date_totals in totals.items():
            print(f"User: {pk}")
            for date, total in sorted(date_totals.items()):
                print(f"  {date}: {float(total):.6f}")
            print()
