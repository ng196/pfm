import { computeInsights } from "../domain/insights";
import { createId } from "../utils/id";
import { getDb } from "./client";

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export async function getProfile() {
  const db = await getDb();
  return db.getFirstAsync("SELECT * FROM profiles LIMIT 1");
}

export async function upsertProfile(profile) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO profiles (id, full_name, pan, mobile, email, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    profile.id,
    profile.full_name,
    profile.pan,
    profile.mobile,
    profile.email,
    profile.created_at,
    profile.updated_at
  );
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)`,
    key,
    String(value),
    new Date().toISOString()
  );
}

export async function getSetting(key) {
  const db = await getDb();
  const row = await db.getFirstAsync(`SELECT value FROM app_settings WHERE key = ?`, key);
  return row?.value || null;
}

export async function seedDefaults(profileId) {
  const db = await getDb();
  const categoryCount = await db.getFirstAsync(`SELECT COUNT(*) AS count FROM categories`);
  if (!Number(categoryCount?.count || 0)) {
    const categories = [
      ["Food", "utensils", "#f97316"],
      ["Transport", "car", "#0ea5e9"],
      ["Shopping", "bag", "#ec4899"],
      ["Bills", "receipt", "#6366f1"],
      ["Health", "heart", "#ef4444"],
    ];

    for (const [name, icon, color] of categories) {
      await db.runAsync(
        `INSERT INTO categories (id, profile_id, name, icon, color, budget_limit, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        createId("cat"),
        profileId,
        name,
        icon,
        color,
        null,
        new Date().toISOString()
      );
    }
  }

  const budgetCount = await db.getFirstAsync(`SELECT COUNT(*) AS count FROM budgets`);
  if (!Number(budgetCount?.count || 0)) {
    const budgets = [
      ["Food", 12000],
      ["Transport", 5000],
      ["Shopping", 7000],
    ];
    for (const [categoryName, monthlyLimit] of budgets) {
      await db.runAsync(
        `INSERT INTO budgets (id, profile_id, category_name, monthly_limit, spent_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        createId("budget"),
        profileId,
        categoryName,
        monthlyLimit,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      );
    }
  }

  const goalCount = await db.getFirstAsync(`SELECT COUNT(*) AS count FROM goals`);
  if (!Number(goalCount?.count || 0)) {
    const goals = [
      ["Emergency Fund", 150000, 45000],
      ["Vacation", 60000, 18500],
    ];
    for (const [name, targetAmount, currentAmount] of goals) {
      await db.runAsync(
        `INSERT INTO goals (id, profile_id, name, target_amount, current_amount, target_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        createId("goal"),
        profileId,
        name,
        targetAmount,
        currentAmount,
        null,
        new Date().toISOString(),
        new Date().toISOString()
      );
    }
  }
}

export async function ingestCanonicalEnvelope(envelope) {
  const db = await getDb();
  await db.execAsync("BEGIN");

  try {
    const { consent, dataSession, sourceArtifacts, financialRecords, accounts, transactions, reviewItems = [] } = envelope;

    await db.runAsync(
      `INSERT OR REPLACE INTO consents (id, profile_id, fi_types, status, consent_handle, connector_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      consent.id,
      consent.profileId,
      toJson(consent.fiTypes),
      consent.status,
      consent.consentHandle,
      consent.connectorKey,
      consent.createdAt
    );

    await db.runAsync(
      `INSERT OR REPLACE INTO data_sessions (session_id, consent_id, profile_id, fi_types, status, connector_key, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      dataSession.sessionId,
      dataSession.consentId,
      dataSession.profileId,
      toJson(dataSession.fiTypes),
      dataSession.status,
      dataSession.connectorKey,
      dataSession.createdAt
    );

    for (const artifact of sourceArtifacts) {
      await db.runAsync(
        `INSERT OR IGNORE INTO source_artifacts
         (id, profile_id, session_id, source_type, source_ref, sender, occurred_at, hash, raw_payload, parser_id, confidence, parse_status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        artifact.id,
        artifact.profileId,
        artifact.sessionId,
        artifact.sourceType,
        artifact.sourceRef,
        artifact.sender,
        artifact.occurredAt,
        artifact.hash,
        toJson(artifact.rawPayload),
        artifact.parserId,
        artifact.confidence,
        artifact.parseStatus,
        artifact.createdAt
      );
    }

    for (const record of financialRecords) {
      await db.runAsync(
        `INSERT OR REPLACE INTO financial_records
         (id, profile_id, session_id, fi_type, source_artifact_id, connector_key, payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        record.id,
        record.profileId,
        record.sessionId,
        record.fiType,
        record.sourceArtifactId,
        record.connectorKey,
        toJson(record.payload),
        record.createdAt
      );
    }

    for (const account of accounts) {
      await db.runAsync(
        `INSERT INTO accounts
         (id, profile_id, account_key, fi_type, account_name, account_subtype, masked_identifier, current_balance, credit_limit, outstanding_amount, currency, status, source_institution, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_key) DO UPDATE SET
           account_name = excluded.account_name,
           account_subtype = excluded.account_subtype,
           masked_identifier = excluded.masked_identifier,
           current_balance = COALESCE(excluded.current_balance, accounts.current_balance),
           credit_limit = COALESCE(excluded.credit_limit, accounts.credit_limit),
           outstanding_amount = COALESCE(excluded.outstanding_amount, accounts.outstanding_amount),
           currency = excluded.currency,
           status = excluded.status,
           source_institution = excluded.source_institution,
           metadata = excluded.metadata,
           updated_at = excluded.updated_at`,
        account.id,
        account.profileId,
        account.accountKey,
        account.fiType,
        account.accountName,
        account.accountSubtype,
        account.maskedIdentifier,
        account.currentBalance,
        account.creditLimit,
        account.outstandingAmount,
        account.currency,
        account.status,
        account.sourceInstitution,
        toJson(account.metadata),
        account.createdAt,
        account.updatedAt
      );
    }

    for (const transaction of transactions) {
      const linkedAccount = await db.getFirstAsync(
        `SELECT id FROM accounts WHERE account_key = ? LIMIT 1`,
        transaction.accountKey
      );

      await db.runAsync(
        `INSERT OR IGNORE INTO transactions
         (id, profile_id, account_id, session_id, financial_record_id, source_artifact_id, connector_key, dedupe_key, txn_ref, txn_type, mode, amount, running_balance, txn_timestamp, value_date, narration, merchant_name, source_type, parser_id, confidence, raw_payload, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.profileId,
        linkedAccount?.id || null,
        transaction.sessionId,
        transaction.financialRecordId,
        transaction.sourceArtifactId,
        transaction.connectorKey,
        transaction.dedupeKey,
        transaction.txnRef,
        transaction.txnType,
        transaction.mode,
        transaction.amount,
        transaction.runningBalance,
        transaction.txnTimestamp,
        transaction.valueDate,
        transaction.narration,
        transaction.merchantName,
        transaction.sourceType,
        transaction.parserId,
        transaction.confidence,
        toJson(transaction.rawPayload),
        transaction.createdAt
      );
    }

    for (const review of reviewItems) {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT OR REPLACE INTO parse_reviews
         (id, profile_id, source_artifact_id, session_id, status, reason, suggested_payload, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        review.id,
        consent.profileId,
        review.sourceArtifactId,
        dataSession.sessionId,
        review.status,
        review.reason,
        toJson(review.suggestedPayload),
        review.createdAt || now,
        now
      );
    }

    await db.runAsync(
      `UPDATE data_sessions SET status = ? WHERE session_id = ?`,
      "COMPLETED",
      dataSession.sessionId
    );

    await recomputeInsights(consent.profileId);
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}

export async function recomputeInsights(profileId) {
  const db = await getDb();
  const accounts = await db.getAllAsync(
    `SELECT account_name, fi_type, current_balance, outstanding_amount, currency
     FROM accounts
     WHERE profile_id = ?
     ORDER BY updated_at DESC`,
    profileId
  );
  const transactions = await db.getAllAsync(
    `SELECT amount, txn_type, txn_timestamp, merchant_name
     FROM transactions
     WHERE profile_id = ?
     ORDER BY txn_timestamp DESC`,
    profileId
  );

  const normalizedAccounts = accounts.map((account) => ({
    accountName: account.account_name,
    fiType: account.fi_type,
    currentBalance: account.current_balance,
    outstandingAmount: account.outstanding_amount,
    currency: account.currency,
  }));

  const normalizedTransactions = transactions.map((transaction) => ({
    amount: transaction.amount,
    txnType: transaction.txn_type,
    txnTimestamp: transaction.txn_timestamp,
    merchantName: transaction.merchant_name,
  }));

  const insights = computeInsights({
    accounts: normalizedAccounts,
    transactions: normalizedTransactions,
  });

  await db.runAsync(
    `INSERT OR REPLACE INTO user_inferred_insights (profile_id, inference_version, insights, computed_at)
     VALUES (?, ?, ?, ?)`,
    profileId,
    1,
    toJson(insights),
    new Date().toISOString()
  );
}

export async function getDashboardSnapshot() {
  const db = await getDb();
  const profile = await getProfile();
  const accounts = await db.getAllAsync(`SELECT * FROM accounts ORDER BY updated_at DESC LIMIT 8`);
  const transactions = await db.getAllAsync(
    `SELECT transactions.*, accounts.account_name
     FROM transactions
     LEFT JOIN accounts ON accounts.id = transactions.account_id
     ORDER BY txn_timestamp DESC
     LIMIT 30`
  );
  const insightsRow = await db.getFirstAsync(`SELECT insights, computed_at FROM user_inferred_insights LIMIT 1`);
  const reviews = await db.getAllAsync(
    `SELECT parse_reviews.*, source_artifacts.sender, source_artifacts.raw_payload
     FROM parse_reviews
     LEFT JOIN source_artifacts ON source_artifacts.id = parse_reviews.source_artifact_id
     ORDER BY parse_reviews.updated_at DESC`
  );
  const budgets = await db.getAllAsync(`SELECT * FROM budgets ORDER BY category_name ASC`);
  const goals = await db.getAllAsync(`SELECT * FROM goals ORDER BY created_at ASC`);
  const sessions = await db.getAllAsync(
    `SELECT connector_key, status, created_at
     FROM data_sessions
     ORDER BY created_at DESC
     LIMIT 10`
  );

  return {
    profile,
    accounts: accounts.map((account) => ({
      ...account,
      metadata: parseJson(account.metadata, {}),
    })),
    transactions: transactions.map((transaction) => ({
      ...transaction,
      raw_payload: parseJson(transaction.raw_payload, {}),
    })),
    insights: parseJson(insightsRow?.insights, null),
    reviews: reviews.map((review) => ({
      ...review,
      raw_payload: parseJson(review.raw_payload, {}),
      suggested_payload: parseJson(review.suggested_payload, {}),
    })),
    budgets,
    goals,
    sessions,
  };
}
