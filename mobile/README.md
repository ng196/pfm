# FlowWallet Mobile

Offline-first AA-compatible mobile app scaffold.

## What is implemented

- New Expo app in `mobile/`
- AA-shaped canonical domain model preserved locally
- Connector layer with:
  - `aa_mock_connector`
  - `sms_connector`
  - `aa_real_connector` placeholder
- Local SQLite schema for:
  - profile
  - consent
  - data session
  - source artifacts
  - financial records
  - accounts
  - transactions
  - inferred insights
  - parse reviews
  - budgets
  - goals
- Rule-based SMS parsing with a review queue for low-confidence messages
- Native UI to trigger syncs and inspect transactions, reviews, budgets, and goals

## Notes

- `web/` is untouched.
- SMS reading is architected as a connector. The current implementation includes:
  - demo SMS ingestion that works now
  - a native bridge seam for Android inbox access later
- The AA contract remains the canonical storage and analytics format. SMS maps into that contract instead of bypassing it.

## Run

```bash
cd mobile
npm install
npm run start
```

## Android SMS test (real inbox + incoming)

SMS reading uses a native module, so this part requires an Android development build (Expo Go is not enough).

```bash
cd mobile
npx expo prebuild --platform android
npx expo run:android
```

Then in the app:

1. Open `Connectors`
2. Tap `Import SMS History (Android Native)`
3. Tap `Start Live SMS Listener`

Parsed and raw data are stored in local SQLite tables through the same AA-shaped ingestion pipeline.
