import requests
import json

# === YOUR KEYS (already filled) ===
PRODUCT_ID = "20ecdd8d-56ae-4911-9a4c-fd2a36a7ab6a"
CLIENT_ID = "c6d17d39-d722-4ac3-8872-a0d34080595c"
CLIENT_SECRET = "voauerXJAVY8JhAN8LoojseZBn88SGht"

url = "https://fiu-sandbox.setu.co/v2/consents/collection"

headers = {
    "x-product-instance-id": PRODUCT_ID,
    "x-client_id": CLIENT_ID,
    "x-client-secret": CLIENT_SECRET,
    "Content-Type": "application/json"
}

payload = {
    "vua": "9876543210",
    "consentDuration": {"unit": "MONTH", "value": "12"},
    "dataLife": {"unit": "MONTH", "value": "12"},          # ← THIS WAS MISSING
    "dataRange": {"from": "2025-03-01T00:00:00Z", "to": "2026-03-13T23:59:59Z"},
    "fetchType": "ONE_TIME",
    "consentTypes": ["PROFILE", "TRANSACTIONS"],           # removed invalid ACCOUNT
    "consentMode": "VIEW",
    "purpose": {"code": "101", "text": "Wealth or portfolio management"},
    "fiTypes": ["DEPOSIT"]                                 # bank accounts (add "CREDIT_CARD" later if needed)
}

print("🚀 Sending request to Setu Sandbox...")
response = requests.post(url, headers=headers, json=payload)

print("Status Code:", response.status_code)

if response.status_code == 200:
    data = response.json()
    print("\n✅ SUCCESS! Consent created.")
    print(json.dumps(data, indent=2))
    print("\n🔗 User will click this URL to approve:")
    print(data.get("url"))
else:
    print("\n❌ Still error?")
    print(json.dumps(response.json(), indent=2))


    