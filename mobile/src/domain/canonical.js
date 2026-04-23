import { createId, stableHash } from "../utils/id";

export const DEFAULT_FI_TYPES = ["DEPOSIT", "CREDIT_CARD"];

export function createCanonicalEnvelope({
  profile,
  connectorKey,
  connectorLabel,
  fiTypes = DEFAULT_FI_TYPES,
  sourceType,
  artifacts = [],
  normalizedAccounts = [],
  normalizedTransactions = [],
  normalizedRecords = [],
}) {
  const now = new Date().toISOString();
  const consentId = createId("consent");
  const sessionId = createId("session");

  const consent = {
    id: consentId,
    profileId: profile.id,
    fiTypes,
    status: "APPROVED",
    consentHandle: createId("handle"),
    connectorKey,
    createdAt: now,
  };

  const dataSession = {
    sessionId,
    consentId,
    profileId: profile.id,
    fiTypes,
    status: "READY",
    connectorKey,
    createdAt: now,
    connectorLabel,
  };

  const sourceArtifacts = artifacts.map((artifact) => ({
    id: artifact.id || createId("artifact"),
    profileId: profile.id,
    sessionId,
    sourceType,
    sourceRef: artifact.sourceRef,
    sender: artifact.sender || null,
    occurredAt: artifact.occurredAt || now,
    hash: artifact.hash || stableHash(JSON.stringify(artifact)),
    rawPayload: artifact.rawPayload,
    parserId: artifact.parserId || null,
    confidence: artifact.confidence ?? null,
    parseStatus: artifact.parseStatus || "RAW_CAPTURED",
    createdAt: artifact.createdAt || now,
  }));

  const financialRecords = normalizedRecords.map((record) => ({
    id: record.id || createId("record"),
    profileId: profile.id,
    sessionId,
    fiType: record.fiType,
    sourceArtifactId: record.sourceArtifactId || null,
    connectorKey,
    payload: record.payload,
    createdAt: record.createdAt || now,
  }));

  const accounts = normalizedAccounts.map((account) => ({
    id: account.id || createId("account"),
    profileId: profile.id,
    accountKey: account.accountKey,
    fiType: account.fiType,
    accountName: account.accountName,
    accountSubtype: account.accountSubtype || null,
    maskedIdentifier: account.maskedIdentifier || null,
    currentBalance: account.currentBalance ?? null,
    creditLimit: account.creditLimit ?? null,
    outstandingAmount: account.outstandingAmount ?? null,
    currency: account.currency || "INR",
    status: account.status || "ACTIVE",
    sourceInstitution: account.sourceInstitution || connectorLabel,
    metadata: account.metadata || {},
    createdAt: account.createdAt || now,
    updatedAt: now,
  }));

  const transactions = normalizedTransactions.map((transaction) => ({
    id: transaction.id || createId("txn"),
    profileId: profile.id,
    sessionId,
    financialRecordId: transaction.financialRecordId || null,
    sourceArtifactId: transaction.sourceArtifactId || null,
    connectorKey,
    dedupeKey: transaction.dedupeKey,
    txnRef: transaction.txnRef || null,
    txnType: transaction.txnType,
    mode: transaction.mode || null,
    amount: transaction.amount,
    runningBalance: transaction.runningBalance ?? null,
    txnTimestamp: transaction.txnTimestamp || now,
    valueDate: transaction.valueDate || null,
    narration: transaction.narration || null,
    merchantName: transaction.merchantName || null,
    sourceType,
    parserId: transaction.parserId || null,
    confidence: transaction.confidence ?? null,
    rawPayload: transaction.rawPayload || {},
    accountKey: transaction.accountKey,
    createdAt: transaction.createdAt || now,
  }));

  return {
    consent,
    dataSession,
    sourceArtifacts,
    financialRecords,
    accounts,
    transactions,
  };
}
