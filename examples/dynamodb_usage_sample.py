"""Utility script to print a user's chat usage summary from DynamoDB.

If DynamoDB credentials or the table aren't available, the script will fall back to a
self-contained example payload so that developers can see the expected structure.
"""
from __future__ import annotations

import argparse
import json
from decimal import Decimal
from typing import Any, Dict, Tuple

try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError
except Exception:  # pragma: no cover - boto3 might be missing locally
    boto3 = None  # type: ignore[assignment]
    BotoCoreError = ClientError = NoCredentialsError = Exception  # type: ignore[misc]

USAGE_SK = "USAGE#SUMMARY"


def _decimal_to_float(value: Any) -> Any:
    """Recursively convert ``Decimal`` values returned by DynamoDB to ``float``."""

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, dict):
        return {k: _decimal_to_float(v) for k, v in value.items()}

    if isinstance(value, list):
        return [_decimal_to_float(v) for v in value]

    return value


def fetch_usage(table_name: str, user_id: str) -> Tuple[str, Dict[str, Any]]:
    """Try to fetch the usage document from DynamoDB.

    Returns a tuple of ``("source", payload)``. ``source`` is one of
    ``"dynamodb"`` or ``"sample"`` to indicate where the data came from.
    """

    if not boto3:
        return "sample", sample_payload(user_id)

    try:
        table = boto3.resource("dynamodb").Table(table_name)
        response = table.get_item(Key={"PK": user_id, "SK": USAGE_SK})
        item = response.get("Item")
        if not item:
            return "sample", sample_payload(user_id)

        normalized = _decimal_to_float(item)
        normalized.setdefault("NormalChatTotal", 0.0)
        normalized.setdefault("BotTotals", {})
        normalized.setdefault("TotalPrice", 0.0)
        return "dynamodb", normalized
    except (NoCredentialsError, ClientError, BotoCoreError) as exc:
        return "sample", sample_payload(user_id, error=str(exc))


def sample_payload(user_id: str, error: str | None = None) -> Dict[str, Any]:
    """Generate a deterministic example payload for documentation/demo purposes."""

    return {
        "PK": user_id,
        "SK": USAGE_SK,
        "TotalPrice": 12.34,
        "NormalChatTotal": 8.9,
        "BotTotals": {
            "bot-weather": 2.22,
            "bot-sentiment": 1.22,
        },
        "UpdatedAt": 1_725_000_000.0,
        "_example": True,
        "_note": "Returned sample data because DynamoDB access was unavailable"
        + (f": {error}" if error else ""),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Print chat usage summary for a user")
    parser.add_argument("user_id", help="Cognito user identifier or tenant user id")
    parser.add_argument(
        "--table-name",
        default="BedrockChatConversationTable",
        help="DynamoDB table name storing the conversation usage summary",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print the JSON output",
    )

    args = parser.parse_args()

    source, payload = fetch_usage(args.table_name, args.user_id)

    if args.pretty:
        print(json.dumps({"source": source, "usage": payload}, indent=2, sort_keys=True))
    else:
        print(json.dumps({"source": source, "usage": payload}))


if __name__ == "__main__":
    main()
