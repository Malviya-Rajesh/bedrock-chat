import boto3
import requests

# === CONFIGURATION ===
COGNITO_REGION = "us-east-1"  # change if needed
USER_POOL_ID = "us-east-1_HpHVOpRN1"  # your Cognito User Pool ID
CLIENT_ID = "6qnt1gk6jj2roa8lgggofbjdvo"  # your Cognito App Client ID
API_GATEWAY_URL = "https://0kai5pk2k5.execute-api.us-east-1.amazonaws.com/SeliraReturnAmmountStage/getBalance"
#API_GATEWAY_URL="https://0kai5pk2k5.execute-api.us-east-1.amazonaws.com/getBalance"
# === USER CREDENTIALS (use test user) ===
USERNAME = "98loharlalit@gmail.com"
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

# === STEP 2: Extract the JWT token ===
id_token = resp["AuthenticationResult"]["IdToken"]
print("✅ Successfully logged in.")
# print("ID Token:", id_token)  # optional, for debugging

# === STEP 3: Call the API Gateway endpoint ===
headers = {
    "Authorization": id_token
}

api_response = requests.get(API_GATEWAY_URL, headers=headers)

# === STEP 4: Print the API response ===
print("\n=== API Response ===")
print(api_response.status_code)
print(api_response.text)
