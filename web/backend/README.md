# Unified Backend Server

This server combines the Account Aggregator API and Chatbot services into a single Express application.

## Features

- **Account Aggregator API**: Mock financial data aggregation with support for 21+ FI types
- **Chatbot API**: AI-powered chat using GLM-4.7 model with both standard and streaming responses

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5000
ZAI_API_KEY=your_api_key_here
```

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Account Aggregator

#### 1. Create Consent
```
POST /consents
Body: { "fiTypes": ["DEPOSIT", "MUTUAL_FUNDS", ...] }
Response: { "id": "consent-id", "status": "APPROVED", ... }
```

#### 2. Create Data Session
```
POST /data/fetch
Body: { "consentId": "consent-id" }
Response: { "sessionId": "session-id", "status": "COMPLETED" }
```

#### 3. Fetch Financial Data
```
GET /data/:sessionId
Response: { "sessionId": "...", "fiData": [...] }
```

### Chatbot

#### 1. Standard Chat
```
POST /chat
Body: {
  "messages": [
    { "role": "system", "content": "You are a helpful assistant" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.75,
  "maxTokens": 2048
}
Response: { "message": "...", "usage": {...} }
```

#### 2. Streaming Chat
```
POST /chat/stream
Body: { "messages": [...], "temperature": 0.75, "maxTokens": 2048 }
Response: Server-Sent Events stream
```

### Health Check
```
GET /health
Response: { "status": "ok", "services": [...], "timestamp": "..." }
```

## Supported FI Types

- DEPOSIT
- TERM_DEPOSIT
- RECURRING_DEPOSIT
- MUTUAL_FUNDS
- EQUITIES
- ETF
- INSURANCE_POLICIES
- NPS
- GSTR1_3B
- BONDS
- DEBENTURES
- AIF
- INVIT
- REIT
- GOVT_SECURITIES
- CIS
- IDR

## Migration Notes

This unified server replaces:
- `web/backend/aa_server/server.js`
- `web/backend/bot/chat.js`
- `web/backend/bot/voice.js`

The voice functionality from the bot has been omitted as it requires CLI interaction. If needed, it can be run as a separate CLI tool.
