/**
 * AI Service - FinWise AI integration for React components
 * Connects to backend AI endpoints at localhost:5000
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";
const AI_CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;
const HEALTH_ENDPOINT = `${API_BASE_URL}/api/health`;

let sessionId = "finwise-" + Date.now();

/**
 * Check if the AI proxy is online
 */
export async function checkAIHealth() {
    try {
        const res = await fetch(HEALTH_ENDPOINT, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
            const data = await res.json();
            return data.online !== false;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Send a message to the AI with financial context and action capability
 */
export async function sendAIMessage(message, { data, systemOverride } = {}) {
    const user = data?.user || {};
    const accounts = data?.accounts || [];
    const transactions = data?.transactions || [];
    const insights = data?.insights || {};

    const income = Number(insights?.last30Days?.credit || 0);
    const expense = Number(insights?.last30Days?.debit || 0);
    const netWorth = accounts.reduce((sum, a) => {
        if (a.fi_type === "CREDIT_CARD") return sum - Number(a.outstanding_amount || 0);
        return sum + Number(a.current_balance || 0);
    }, 0);

    const systemPrompt = systemOverride || `You are FinWise, an intelligent financial assistant that can PERFORM ACTIONS.

Current user: ${user.full_name || "User"}
Financial snapshot:
- Net Worth: ₹${Math.round(netWorth).toLocaleString("en-IN")}
- Monthly Income: ₹${Math.round(income).toLocaleString("en-IN")}
- Monthly Expenses: ₹${Math.round(expense).toLocaleString("en-IN")}
- Monthly Savings: ₹${Math.round(income - expense).toLocaleString("en-IN")}
- Accounts: ${accounts.length}
- Recent Transactions: ${transactions.slice(0, 5).map(t => `${t.merchant_name || t.narration}: ₹${t.amount} (${t.txn_type})`).join(", ")}

When the user asks you to DO something (add transaction, create goal, set budget, etc.), you MUST respond with a special action key on its own line.

Action format:
$$FINWISE_ACTION$$:{"action": "add_transaction", "data": {"type": "expense", "amount": 500, "category": "food", "description": "Lunch", "date": "2026-03-14"}}

Available actions:
- add_transaction: {type, amount, category, description, date, paymentMethod}
- create_goal: {name, icon, targetAmount, currentSavings, targetMonths, priority}
- set_budget: {category, amount, period}

You can include MULTIPLE action blocks. Always explain what you're doing naturally.
Use INR (₹) for all amounts. Be concise and helpful.`;

    const response = await fetch(AI_CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message,
            sessionId,
            systemPrompt,
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        let detail = "";
        try {
            const errBody = await response.json();
            detail = errBody?.error || errBody?.upstreamDetails?.details?.error?.message || JSON.stringify(errBody);
        } catch {
            // Ignore parse errors and fall back to status-only message.
        }
        throw new Error(`AI API Error: ${response.status}${detail ? ` - ${detail}` : ""}`);
    }

    const result = await response.json();
    const content = result.response || result.choices?.[0]?.message?.content || "No response";

    // Parse and execute action blocks
    const actions = parseActions(content);
    for (const action of actions) {
        executeAction(action);
    }

    let cleanedMessage = cleanResponse(content);
    if (!cleanedMessage && actions.length > 0) {
        cleanedMessage = "Action executed successfully.";
    }

    return { message: cleanedMessage || "No response received.", actions, raw: content };
}

/**
 * Executes an action block by persisting to localStorage
 */
function executeAction(actionObj) {
    const { action, data } = actionObj;
    try {
        if (action === "add_transaction") {
            const transactions = JSON.parse(localStorage.getItem("fw_transactions") || "[]");
            transactions.push({
                id: "txn_" + Date.now(),
                txn_type: data.type === "expense" ? "DEBIT" : "CREDIT",
                amount: Number(data.amount) || 0,
                merchant_name: data.category || "other",
                narration: data.description || "",
                txn_timestamp: data.date || new Date().toISOString(),
            });
            localStorage.setItem("fw_transactions", JSON.stringify(transactions));
        } else if (action === "create_goal") {
            const goals = JSON.parse(localStorage.getItem("fw_goals") || "[]");
            goals.push({
                id: "goal_" + Date.now(),
                name: data.name || "New Goal",
                target: Number(data.targetAmount) || 0,
                saved: Number(data.currentSavings) || 0,
                months: Number(data.targetMonths) || 12,
                priority: data.priority || "medium",
                emoji: data.icon === "budget" ? "📉" : "🎯",
            });
            localStorage.setItem("fw_goals", JSON.stringify(goals));
        } else if (action === "set_budget") {
            const budget = JSON.parse(localStorage.getItem("fw_budget") || "{}");
            budget[data.category || "general"] = {
                amount: Number(data.amount) || 0,
                period: data.period || "monthly",
            };
            localStorage.setItem("fw_budget", JSON.stringify(budget));
        }
        // Dispatch event so React components can re-render
        window.dispatchEvent(new Event("fw-data-changed"));
    } catch (err) {
        console.error("Action execution failed:", err);
    }
}

/**
 * Parse special action keys from AI response
 */
function parseActions(content) {
    const actions = [];
    // Match $$FINWISE_ACTION$$:{...}
    const regex = /\$\$FINWISE_ACTION\$\$:({[^\n]*})/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        try {
            actions.push(JSON.parse(match[1].trim()));
        } catch (e) {
            console.warn("Failed to parse action JSON:", match[1]);
        }
    }
    return actions;
}

/**
 * Remove action blocks from display text
 */
function cleanResponse(content) {
    return content.replace(/\$\$FINWISE_ACTION\$\$:({[^\n]*})/g, "").trim();
}

/**
 * Reset the AI session
 */
export function resetSession() {
    sessionId = "finwise-" + Date.now();
}
