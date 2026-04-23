import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import {
	DEFAULT_FI_TYPES,
	DEMO_USER_PROFILES,
	ensureSeededDemoUser,
	getUserDashboardContext,
	listUsers
} from './data/demoDataService.js';
import { generateFIData } from './mockDataGenerator.js';

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MAX_DEPOSIT_ACCOUNTS = 3;
const MAX_CREDIT_CARD_ACCOUNTS = 4;
const DEFAULT_AI_MODEL = process.env.ZAI_MODEL || 'glm-4.5-air';
const ZAI_CHAT_COMPLETIONS_URLS = [
	`${process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4'}/chat/completions`,
	'https://api.z.ai/api/paas/v4/chat/completions'
];

app.use(
	cors({
		origin: '*',
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'TXN'],
		exposedHeaders: ['Content-Type'],
		credentials: false,
		maxAge: 86400
	})
);
app.use(express.json());

const memoryUsers = DEMO_USER_PROFILES.map((profile, idx) => ({
	id: `demo-${idx + 1}`,
	full_name: profile.name,
	pan: profile.pan,
	mobile: profile.mobile,
	email: profile.email,
	fi_types: profile.fiTypes || DEFAULT_FI_TYPES,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString()
}));
const memoryContexts = new Map();

function getZaiApiKey() {
	return (process.env.ZAI_API_KEY || process.env['z.ai_api_key'] || process.env.Z_AI_API_KEY || '').trim();
}

async function callZaiChatCompletions({ messages, model, temperature, maxTokens }) {
	const apiKey = getZaiApiKey();
	if (!apiKey) {
		const err = new Error('Missing z.ai API key in backend env');
		err.statusCode = 500;
		throw err;
	}

	let lastError = null;
	for (const endpoint of ZAI_CHAT_COMPLETIONS_URLS) {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: model || DEFAULT_AI_MODEL,
				messages,
				temperature: Number.isFinite(Number(temperature)) ? Number(temperature) : 0.7,
				max_tokens: Number.isFinite(Number(maxTokens)) ? Number(maxTokens) : 1024,
				stream: false
			})
		});

		if (response.ok) {
			return response.json();
		}

		let details = await response.text();
		try {
			details = await response.json();
		} catch (_err) {
			// Keep text details if JSON parsing fails.
		}

		lastError = {
			statusCode: response.status,
			details,
			endpoint
		};

		// Retry on endpoint-not-found using next base path; otherwise surface immediately.
		if (response.status !== 404) {
			break;
		}
	}

	const err = new Error('z.ai request failed');
	err.statusCode = lastError?.statusCode || 502;
	err.details = lastError || null;
	throw err;
}

function toBoolHeader(value) {
	if (typeof value !== 'string') {
		return false;
	}
	return value.toLowerCase() === 'true';
}

async function findUserByIdentifier({ uid, mobile, email }) {
	if (uid) {
		const context = await getUserDashboardContext(uid);
		if (context?.user) {
			return context.user;
		}
		return null;
	}

	if (!mobile && !email) {
		return null;
	}

	const users = await listUsers();
	return users.find((u) => (mobile && u.mobile === mobile) || (email && u.email === email)) || null;
}

function computeFallbackInsights(transactions, accounts) {
	const totals = transactions.reduce(
		(acc, txn) => {
			const amount = Number(txn.amount || 0);
			if (txn.txn_type === 'CREDIT') {
				acc.totalCredit += amount;
			} else {
				acc.totalDebit += amount;
			}
			return acc;
		},
		{ totalCredit: 0, totalDebit: 0 }
	);

	const merchantSpend = {};
	for (const txn of transactions) {
		if (txn.txn_type !== 'DEBIT' || !txn.merchant_name) {
			continue;
		}
		merchantSpend[txn.merchant_name] = (merchantSpend[txn.merchant_name] || 0) + Number(txn.amount || 0);
	}

	const topMerchants = Object.entries(merchantSpend)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([merchant, spend]) => ({ merchant, spend: Number(spend.toFixed(2)) }));

	const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
	const recent = transactions.filter((txn) => new Date(txn.txn_timestamp).getTime() >= cutoff);
	const credit = recent
		.filter((txn) => txn.txn_type === 'CREDIT')
		.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
	const debit = recent
		.filter((txn) => txn.txn_type === 'DEBIT')
		.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

	return {
		totals: {
			lifetimeCredit: Number(totals.totalCredit.toFixed(2)),
			lifetimeDebit: Number(totals.totalDebit.toFixed(2)),
			lifetimeNet: Number((totals.totalCredit - totals.totalDebit).toFixed(2))
		},
		last30Days: {
			credit: Number(credit.toFixed(2)),
			debit: Number(debit.toFixed(2)),
			net: Number((credit - debit).toFixed(2))
		},
		topMerchants,
		metadata: {
			txnCount: transactions.length,
			accountCount: accounts.length
		}
	};
}

function buildFallbackDashboardContext(user) {
	if (memoryContexts.has(user.id)) {
		return memoryContexts.get(user.id);
	}

	const fiTypes = Array.isArray(user.fi_types) && user.fi_types.length > 0 ? user.fi_types : DEFAULT_FI_TYPES;
	const generated = fiTypes.map((fiType) => ({
		fiType,
		payload: generateFIData(fiType, {
			name: user.full_name,
			pan: user.pan,
			mobile: user.mobile,
			email: user.email
		})
	}));

	const accounts = [];

	const txns = [];
	let depositCount = 0;
	let creditCardCount = 0;

	for (const entry of generated) {
		const summary = entry.payload?.summary || {};

		if (entry.fiType === 'DEPOSIT' && depositCount < MAX_DEPOSIT_ACCOUNTS) {
			accounts.push({
				id: randomUUID(),
				fi_type: 'DEPOSIT',
				account_name: summary.bankName || 'Bank Account',
				account_subtype: summary.type || 'SAVINGS',
				masked_identifier: summary.maskedAccountNumber || null,
				current_balance: Number(summary.currentBalance || 0),
				currency: summary.currency || 'INR',
				status: summary.status || 'ACTIVE'
			});
			depositCount += 1;
		}

		if (entry.fiType === 'CREDIT_CARD' && creditCardCount < MAX_CREDIT_CARD_ACCOUNTS) {
			accounts.push({
				id: randomUUID(),
				fi_type: 'CREDIT_CARD',
				account_name: summary.cardName || 'Credit Card',
				account_subtype: 'CREDIT_CARD',
				masked_identifier: summary.maskedCardNumber || null,
				current_balance: Number(summary.availableCredit || 0),
				credit_limit: Number(summary.creditLimit || 0),
				outstanding_amount: Number(summary.outstandingAmount || 0),
				currency: summary.currency || 'INR',
				status: summary.status || 'ACTIVE'
			});
			creditCardCount += 1;
		}

		for (const tx of entry.payload?.transactions?.transaction || []) {
			txns.push({
				id: randomUUID(),
				txn_ref: tx.reference || tx.txnId,
				txn_type: tx.type || 'DEBIT',
				mode: tx.mode || null,
				amount: Number(tx.amount || 0),
				running_balance: tx.currentBalance !== undefined ? Number(tx.currentBalance || 0) : null,
				txn_timestamp: tx.transactionTimestamp || new Date().toISOString(),
				value_date: tx.valueDate || null,
				narration: tx.narration || null,
				merchant_name: tx.merchant_name || null
			});
		}
	}

	txns.sort((a, b) => new Date(b.txn_timestamp) - new Date(a.txn_timestamp));
	const insights = computeFallbackInsights(txns, accounts);
	const context = {
		user,
		accounts,
		inferred: {
			insights,
			computed_at: new Date().toISOString()
		},
		recentTransactions: txns
	};

	memoryContexts.set(user.id, context);
	return context;
}

async function resolveDashboardContext({ uid, mobile, email, name, pan, fiTypes }) {
	try {
		let user = await findUserByIdentifier({ uid, mobile, email });

		if (!user) {
			const seeded = await ensureSeededDemoUser({
				forceRegenerate: false,
				fiTypes: Array.isArray(fiTypes) && fiTypes.length > 0 ? fiTypes : DEFAULT_FI_TYPES,
				userContext: {
					name,
					pan,
					mobile,
					email
				}
			});
			user = seeded.user;
		}

		const dashboard = await getUserDashboardContext(user.id);
		return { user, dashboard };
	} catch (_err) {
		let user = memoryUsers.find((u) => (uid && u.id === uid) || (mobile && u.mobile === mobile) || (email && u.email === email));
		if (!user) {
			user = {
				id: `demo-${randomUUID()}`,
				full_name: name || 'Demo User',
				pan: pan || null,
				mobile: mobile || null,
				email: email || null,
				fi_types: Array.isArray(fiTypes) && fiTypes.length > 0 ? fiTypes : DEFAULT_FI_TYPES,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			};
			memoryUsers.push(user);
		}

		return { user, dashboard: buildFallbackDashboardContext(user) };
	}
}

app.get('/health', (_req, res) => {
	res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

app.get('/api/health', async (_req, res) => {
	if (!getZaiApiKey()) {
		res.json({ ok: true, online: false, error: 'Missing z.ai API key in backend env' });
		return;
	}

	try {
		const data = await callZaiChatCompletions({
			messages: [{ role: 'user', content: 'ping' }],
			temperature: 0,
			maxTokens: 8
		});
		res.json({ ok: true, online: true, model: data.model || DEFAULT_AI_MODEL });
	} catch (err) {
		res.json({ ok: true, online: false, error: err.message || 'Upstream health check failed' });
	}
});

app.post('/api/chat', async (req, res) => {
	try {
		const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
		const messages = Array.isArray(req.body?.messages) ? req.body.messages : null;
		const systemPrompt = typeof req.body?.systemPrompt === 'string' ? req.body.systemPrompt.trim() : '';

		let outboundMessages = [];
		if (messages && messages.length > 0) {
			outboundMessages = messages;
		} else {
			if (!message) {
				res.status(400).json({ ok: false, error: 'Provide either non-empty messages[] or message' });
				return;
			}

			if (systemPrompt) {
				outboundMessages.push({ role: 'system', content: systemPrompt });
			}
			outboundMessages.push({ role: 'user', content: message });
		}

		const data = await callZaiChatCompletions({
			messages: outboundMessages,
			model: req.body?.model,
			temperature: req.body?.temperature,
			maxTokens: req.body?.max_tokens
		});

		const choice = data?.choices?.[0] || {};
		const content = choice?.message?.content || '';

		res.json({
			ok: true,
			response: content,
			choices: data?.choices || [],
			model: data?.model || DEFAULT_AI_MODEL,
			timestamp: new Date().toISOString()
		});
	} catch (err) {
		const statusCode = Number(err.statusCode) || 502;
		res.status(statusCode).json({
			ok: false,
			error: err.message || 'AI request failed',
			upstreamDetails: err.details || null
		});
	}
});

app.get('/users', async (_req, res, next) => {
	try {
		const users = await listUsers();
		res.json({ users });
	} catch (err) {
		res.json({ users: memoryUsers });
	}
});

app.post('/users/demo/seed-many', async (req, res, next) => {
	try {
		const forceRegenerate = Boolean(req.body?.forceRegenerate);
		const results = [];

		for (const profile of DEMO_USER_PROFILES) {
			const seeded = await ensureSeededDemoUser({
				forceRegenerate,
				fiTypes: profile.fiTypes || DEFAULT_FI_TYPES,
				userContext: profile
			});
			results.push({
				userId: seeded.user.id,
				fullName: seeded.user.full_name,
				mobile: seeded.user.mobile,
				email: seeded.user.email,
				seeded: seeded.seeded,
				recordCount: seeded.recordCount || 0
			});
		}

		res.json({ count: results.length, users: results });
	} catch (err) {
		const forceRegenerate = Boolean(req.body?.forceRegenerate);
		if (forceRegenerate) {
			memoryContexts.clear();
		}

		for (const user of memoryUsers) {
			buildFallbackDashboardContext(user);
		}

		res.json({
			count: memoryUsers.length,
			users: memoryUsers.map((u) => ({
				userId: u.id,
				fullName: u.full_name,
				mobile: u.mobile,
				email: u.email,
				seeded: true
			}))
		});
	}
});

app.get('/users/:userId/dashboard-context', async (req, res, next) => {
	try {
		const context = await getUserDashboardContext(req.params.userId);
		if (!context) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		res.json(context);
	} catch (err) {
		const user = memoryUsers.find((u) => u.id === req.params.userId);
		if (!user) {
			res.status(404).json({ error: 'User not found' });
			return;
		}

		res.json(buildFallbackDashboardContext(user));
	}
});

app.post('/api/data', async (req, res, next) => {
	try {
		const uid = req.body?.uid || req.body?.userId || null;
		const mobile = req.body?.mobile || req.body?.phone || null;
		const email = req.body?.email || null;
		const name = req.body?.name || null;
		const pan = req.body?.pan || null;
		const fiTypes = req.body?.fiTypes || null;
		const wantTransactions = toBoolHeader(req.header('TXN'));

		if (!uid && !mobile && !email) {
			res.status(400).json({ error: 'Provide one identifier: uid, mobile, or email' });
			return;
		}

		const { user, dashboard } = await resolveDashboardContext({
			uid,
			mobile,
			email,
			name,
			pan,
			fiTypes
		});

		if (!dashboard) {
			res.status(404).json({ error: 'No data found for user' });
			return;
		}

		const inferred = dashboard.inferred?.insights || null;

		if (wantTransactions) {
			res.json({
				user,
				accounts: dashboard.accounts,
				transactions: dashboard.recentTransactions,
				inferred
			});
			return;
		}

		res.json({
			user,
			accounts: dashboard.accounts,
			inferred
		});
	} catch (err) {
		next(err);
	}
});

app.use((err, _req, res, _next) => {
	console.error('Backend error:', err);
	res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
	console.log(`Backend listening on http://localhost:${PORT}`);
});