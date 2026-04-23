import { createCanonicalEnvelope } from "../domain/canonical";
import { readSmsSource } from "./sms/nativeSmsBridge";
import { getParserForMessage } from "./sms/parserRegistry";
import { createId, stableHash } from "../utils/id";

function buildAccountKey(parsed) {
  return `${parsed.fiType}:${parsed.institution}:${parsed.maskedIdentifier || "UNKNOWN"}`;
}

export async function runSmsConnector(profile, options = {}) {
  const messages = await readSmsSource(options);
  const artifacts = [];
  const normalizedRecords = [];
  const normalizedAccountsByKey = new Map();
  const normalizedTransactions = [];
  const reviewItems = [];
  const fiTypes = new Set();

  for (const message of messages) {
    const parser = getParserForMessage(message);
    const rawPayload = {
      sender: message.sender,
      body: message.body,
      receivedAt: message.receivedAt,
    };

    if (!parser) {
      artifacts.push({
        sourceRef: message.id,
        sender: message.sender,
        occurredAt: message.receivedAt,
        hash: stableHash(`${message.id}:${message.body}`),
        rawPayload,
        parseStatus: "NO_PARSER",
      });
      continue;
    }

    const parsed = parser.parse(message);
    const sourceHash = stableHash(`${message.id}:${message.body}`);
    const sourceArtifactId = `artifact_sms_${sourceHash}`;
    const parseStatus = parsed.success ? "NORMALIZED" : "REVIEW_REQUIRED";

    artifacts.push({
      id: sourceArtifactId,
      sourceRef: message.id,
      sender: message.sender,
      occurredAt: message.receivedAt,
      hash: sourceHash,
      rawPayload,
      parserId: parsed.parserId,
      confidence: parsed.confidence,
      parseStatus,
    });

    if (!parsed.amount || !parsed.txnType) {
      reviewItems.push({
        id: createId("review"),
        sourceArtifactId,
        status: "OPEN",
        reason: "Unable to confidently extract transaction amount and type from SMS.",
        suggestedPayload: parsed,
      });
      continue;
    }

    fiTypes.add(parsed.fiType);
    const accountKey = buildAccountKey(parsed);

    if (!normalizedAccountsByKey.has(accountKey)) {
      normalizedAccountsByKey.set(accountKey, {
        accountKey,
        fiType: parsed.fiType,
        accountName: parsed.accountName,
        accountSubtype: parsed.accountSubtype,
        maskedIdentifier: parsed.maskedIdentifier,
        currentBalance: parsed.currentBalance,
        sourceInstitution: parsed.institution,
        metadata: {
          source: "SMS",
          parserId: parsed.parserId,
        },
      });
    }

    const recordPayload = {
      summary: {
        bankName: parsed.institution,
        type: parsed.accountSubtype,
        maskedAccountNumber: parsed.maskedIdentifier,
        currentBalance: parsed.currentBalance,
        currency: "INR",
        status: "ACTIVE",
      },
      transactions: {
        transaction: [
          {
            txnId: parsed.txnRef || message.id,
            type: parsed.txnType,
            amount: parsed.amount,
            narration: parsed.narration,
            merchant_name: parsed.merchantName,
            mode: parsed.mode,
            currentBalance: parsed.currentBalance,
            transactionTimestamp: parsed.txnTimestamp,
          },
        ],
      },
      source: {
        sender: message.sender,
        parserId: parsed.parserId,
        confidence: parsed.confidence,
      },
    };

    normalizedRecords.push({
      fiType: parsed.fiType,
      sourceArtifactId,
      payload: recordPayload,
    });

    const transaction = {
      sourceArtifactId,
      accountKey,
      dedupeKey: stableHash(
        `${message.sender}:${parsed.maskedIdentifier}:${parsed.txnType}:${parsed.amount}:${parsed.txnTimestamp}:${parsed.txnRef || message.id}`
      ),
      txnRef: parsed.txnRef || message.id,
      txnType: parsed.txnType,
      mode: parsed.mode,
      amount: parsed.amount,
      runningBalance: parsed.currentBalance,
      txnTimestamp: parsed.txnTimestamp,
      narration: parsed.narration,
      merchantName: parsed.merchantName,
      parserId: parsed.parserId,
      confidence: parsed.confidence,
      rawPayload,
    };

    if (parsed.success) {
      normalizedTransactions.push(transaction);
      continue;
    }

    reviewItems.push({
      id: createId("review"),
      sourceArtifactId,
      status: "OPEN",
      reason: "Parser confidence was below the auto-post threshold.",
      suggestedPayload: transaction,
    });
  }

  const envelope = createCanonicalEnvelope({
    profile,
    connectorKey: "sms_connector",
    connectorLabel: options.mode === "native" ? "SMS Connector (Native)" : "SMS Connector (Demo)",
    fiTypes: Array.from(fiTypes.size ? fiTypes : ["DEPOSIT"]),
    sourceType: "SMS",
    artifacts,
    normalizedRecords,
    normalizedAccounts: Array.from(normalizedAccountsByKey.values()),
    normalizedTransactions,
  });

  return {
    ...envelope,
    reviewItems,
    stats: {
      scannedMessages: messages.length,
      parsedTransactions: normalizedTransactions.length,
      reviewCount: reviewItems.length,
    },
  };
}
