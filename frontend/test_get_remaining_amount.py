import boto3
import requests
import json

# === CONFIGURATION ===
COGNITO_REGION = "us-east-1"
USER_POOL_ID = "us-east-1_HpHVOpRN1"
CLIENT_ID = "6qnt1gk6jj2roa8lgggofbjdvo"
API_GATEWAY_URL = "https://3nwepy67gk.execute-api.us-east-1.amazonaws.com/GetBots"  # include /default if stage name exists

# === USER CREDENTIALS ===
USERNAME = "malviyamalviya27@gmail.com"
PASSWORD = "#52548Malviya"

# === STEP 1: Authenticate with Cognito ===
client = boto3.client("cognito-idp", region_name=COGNITO_REGION)

try:
    resp = client.initiate_auth(
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={
            "USERNAME": USERNAME,
            "PASSWORD": PASSWORD
        },
        ClientId=CLIENT_ID
    )
except client.exceptions.NotAuthorizedException:
    print("❌ Invalid username or password.")
    exit(1)
except client.exceptions.UserNotConfirmedException:
    print("❌ User not confirmed in Cognito.")
    exit(1)
except Exception as e:
    print(f"❌ Authentication failed: {e}")
    exit(1)

# === STEP 2: Extract the JWT token ===
id_token = resp["AuthenticationResult"]["IdToken"]
print("✅ Successfully logged in.")

# === STEP 3: Call the API Gateway endpoint ===
headers = {
    "Authorization": id_token,
    "Content-Type": "application/json"
}

try:
    # Use GET instead of POST
    api_response = requests.get(API_GATEWAY_URL, headers=headers)
    api_response.raise_for_status()
except requests.exceptions.HTTPError as errh:
    print("HTTP Error:", errh)
    print(api_response.text)
    exit(1)
except requests.exceptions.RequestException as err:
    print("Request Error:", err)
    exit(1)

# === STEP 4: Parse and display response ===
try:
    data = api_response.json()
    print("\n✅ API Response:\n")
    print(json.dumps(data, indent=2))
except json.JSONDecodeError:
    print("❌ Failed to parse API response as JSON:")
    print(api_response.text)