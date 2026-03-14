import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import { generateFIData } from './mockDataGenerator.js';

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// In-memory store for simulation consistency
const userSessionStore = {};

// Initialize OpenAI client for chatbot
const openai = new OpenAI({
  apiKey: process.env.ZAI_API_KEY || "86f90fe16ae34556b84f61f69bfc772c.bDA0Er5ScuCqbpEq",
  baseURL: 'https://api.z.ai/api/coding/paas/v4'
});

// ---------------------------------------------------------
// ACCOUNT AGGREGATOR ENDPOINTS
// ---------------------------------------------------------

// 1. CONSENT FLOW
app.post('/consents', (req, res) => {
    const consentId = uuidv4();
    
    const requestedFiTypes = req.body.fiTypes || [
        "DEPOSIT", "MUTUAL_FUNDS", "EQUITIES", "INSURANCE_POLICIES", 
        "TERM_DEPOSIT", "NPS", "GSTR1_3B", "BONDS", "ETF"
    ];

    userSessionStore[consentId] = { fiTypes: requestedFiTypes };

    console.log(`✅ Consent Created: ${consentId} for types: ${requestedFiTypes.join(', ')}`);

    res.json({
        "id": consentId,
        "status": "APPROVED",
        "consentHandle": uuidv4(),
        "createdAt": new Date().toISOString()
    });
});

// 2. DATA SESSION FLOW
app.post('/data/fetch', (req, res) => {
    const { consentId } = req.body;
    if (!consentId) return res.status(400).json({ error: "Consent ID missing" });

    const sessionId = uuidv4();
    
    userSessionStore[sessionId] = userSessionStore[consentId] || { fiTypes: ["DEPOSIT"] };
    userSessionStore[sessionId].status = "READY";

    console.log(`📦 Data Session Created: ${sessionId}`);

    res.json({
        "sessionId": sessionId,
        "status": "COMPLETED"
    });
});

// 3. DATA FETCH (MAIN ENDPOINT)
app.get('/data/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = userSessionStore[sessionId];

    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }

    console.log(`📥 Generating data for Session: ${sessionId}`);
    
    const userContext = {
        name: "Rahul Sharma",
        pan: "ABCPA1234K",
        mobile: "9876543210",
        email: "rahul@example.com"
    };

    const fiDataArray = session.fiTypes.map(fiType => {
        return generateFIData(fiType, userContext);
    });

    res.json({
        "sessionId": sessionId,
        "fiData": fiDataArray
    });
});

// ---------------------------------------------------------
// CHATBOT ENDPOINTS
// ---------------------------------------------------------

// Chat endpoint for text-based conversations
app.post('/chat', async (req, res) => {
    try {
        const { messages, temperature = 0.75, maxTokens = 2048 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        const stream = await openai.chat.completions.create({
            model: "glm-4.7",
            messages: messages,
            stream: false,
            temperature: temperature,
            max_tokens: maxTokens
        });

        console.log(`💬 Chat request processed`);

        res.json({
            message: stream.choices[0].message.content,
            usage: stream.usage
        });
    } catch (err) {
        console.error('Chat error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Streaming chat endpoint
app.post('/chat/stream', async (req, res) => {
    try {
        const { messages, temperature = 0.75, maxTokens = 2048 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required" });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = await openai.chat.completions.create({
            model: "glm-4.7",
            messages: messages,
            stream: true,
            temperature: temperature,
            max_tokens: maxTokens
        });

        console.log(`💬 Streaming chat request started`);

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (err) {
        console.error('Streaming chat error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------
app.get('/health', (_req, res) => {
    res.json({ 
        status: 'ok', 
        services: ['account-aggregator', 'chatbot'],
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Unified Backend Server running on http://localhost:${PORT}`);
    console.log(`📊 Account Aggregator API ready`);
    console.log(`💬 Chatbot API ready`);
});
