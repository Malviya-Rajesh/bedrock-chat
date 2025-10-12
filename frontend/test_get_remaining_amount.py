import os
import requests
import json
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

# Resolve .env file next to this script so local runs pick up values without extra setup.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(SCRIPT_DIR, ".env")
DOTENV_LOCAL_PATH = os.path.join(SCRIPT_DIR, ".env.local")

# ----------------------------
# Load config from environment variables
# ----------------------------
if os.path.exists(DOTENV_LOCAL_PATH):
    load_dotenv(dotenv_path=DOTENV_LOCAL_PATH)
else:
    load_dotenv(dotenv_path=DOTENV_PATH)
CASHFREE_CLIENT_ID = os.getenv("CASHFREE_CLIENT_ID")
print("CASHFREE_CLIENT_ID:", CASHFREE_CLIENT_ID)
CASHFREE_CLIENT_SECRET = os.getenv("CASHFREE_CLIENT_SECRET")
print("CASHFREE_CLIENT_SECRET:", "****" if CASHFREE_CLIENT_SECRET else None)
API_VERSION = os.getenv("API_VERSION", "2022-09-01")  # default if not set
NOTIFY_URL = os.getenv("NOTIFY_URL")
BASE_URL = os.getenv("BASE_URL", "https://sandbox.cashfree.com/pg/links")  # default sandbox

# Customer details
CUSTOMER_EMAIL = "mrmalviyalalit@gmail.com"
CUSTOMER_NAME = "Lalit Malviya"
CUSTOMER_PHONE = "8949463461"

# Payment link info
AMOUNT = 12.00
LINK_ID = f"wallet_topup_{int(datetime.now().timestamp())}"  # unique ID
LINK_PURPOSE = "Payment for Wallet Top-Up"

# --- Proper ISO8601 expiry with timezone (30 days later) ---
expiry_time = (datetime.now(timezone.utc) + timedelta(days=30)).astimezone()
EXPIRY = expiry_time.strftime("%Y-%m-%dT%H:%M:%S%z")
EXPIRY = EXPIRY[:-2] + ":" + EXPIRY[-2:]  # convert +0530 → +05:30

# Webhook and return URL
RETURN_URL = "https://example.com/success"

# ----------------------------
# Request setup
# ----------------------------
headers = {
    "Content-Type": "application/json",
    "x-client-id": CASHFREE_CLIENT_ID,
    "x-client-secret": CASHFREE_CLIENT_SECRET,
    "x-api-version": API_VERSION
}

payload = {
    "customer_details": {
        "customer_email": CUSTOMER_EMAIL,
        "customer_name": CUSTOMER_NAME,
        "customer_phone": CUSTOMER_PHONE,
        "customer_id": "6408b458-b091-70c2-f3ac-9a11bdd8b03b"
    },
    "link_amount": AMOUNT,
    "link_currency": "INR",
    "link_id": LINK_ID,
    "link_purpose": LINK_PURPOSE,
    "link_expiry_time": EXPIRY,
    "link_auto_reminders": True,
    "link_partial_payments": False,
    "link_notify": {
        "send_email": True,
        "send_sms": False
    },
    "link_meta": {
        "notify_url": NOTIFY_URL,
        "return_url": RETURN_URL,
        "upi_intent": False
    },
    "link_notes": {
        "note_1": "Wallet Top-Up",
        "note_2": "Test transaction"
    }
}

# ----------------------------
# Send request
# ----------------------------
response = requests.post(BASE_URL, headers=headers, data=json.dumps(payload))

print("Status Code:", response.status_code)
print("Response:", response.text)

if response.status_code == 200:
    data = response.json()
    payment_link = data.get("link_url")
    if payment_link:
        print("\n✅ Payment link created successfully!")
        print("🔗 Link:", payment_link)
    else:
        print("⚠️ No payment link found in response.")
else:
    print("❌ Failed to create payment link.")
