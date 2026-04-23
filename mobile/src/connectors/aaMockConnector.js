import { createCanonicalEnvelope, DEFAULT_FI_TYPES } from "../domain/canonical";
import { stableHash } from "../utils/id";

export async function runAaMockConnector(profile) {
  const accountKey = "DEPOSIT:mock:hdfc:xx4829";
  const sourceArtifactId = `artifact_mock_${stableHash("aa_mock_seed_1")}`;
  const payload = {
    summary: {
      bankName: "HDFC Bank",
      type: "SAVINGS",
      maskedAccountNumber: "XX4829",
      currentBalance: 118440.12,
      currency: "INR",
      status: "ACTIVE",
    },
    transactions: {
      transaction: [
        {
          txnId: "mock_salary_1",
          type: "CREDIT",
          amount: 85000,
          narration: "Salary credit from ACME LABS",
          merchant_name: "ACME LABS",
          mode: "NEFT",
          currentBalance: 118440.12,
          transactionTimestamp: "2026-03-15T04:10:00.000Z",
        },
        {
          txnId: "mock_food_1",
          type: "DEBIT",
          amount: 2450,
          narration: "UPI debit to SWIGGY",
          merchant_name: "SWIGGY",
          mode: "UPI",
          currentBalance: 18240.12,
          transactionTimestamp: "2026-03-16T08:22:00.000Z",
        },
      ],
    },
  };

  return createCanonicalEnvelope({
    profile,
    connectorKey: "aa_mock_connector",
    connectorLabel: "AA Mock Connector",
    fiTypes: DEFAULT_FI_TYPES,
    sourceType: "AA_MOCK",
    artifacts: [
      {
        id: sourceArtifactId,
        sourceRef: "aa_mock_seed_1",
        rawPayload: payload,
        parseStatus: "NORMALIZED",
      },
    ],
    normalizedRecords: [
      {
        fiType: "DEPOSIT",
        sourceArtifactId,
        payload,
      },
    ],
    normalizedAccounts: [
      {
        accountKey,
        fiType: "DEPOSIT",
        accountName: "HDFC Savings",
        accountSubtype: "SAVINGS",
        maskedIdentifier: "XX4829",
        currentBalance: 118440.12,
        sourceInstitution: "HDFC Bank",
        metadata: payload.summary,
      },
    ],
    normalizedTransactions: payload.transactions.transaction.map((transaction) => ({
      financialRecordId: null,
      sourceArtifactId,
      accountKey,
      dedupeKey: stableHash(`aa_mock:${transaction.txnId}:${transaction.amount}:${transaction.transactionTimestamp}`),
      txnRef: transaction.txnId,
      txnType: transaction.type,
      mode: transaction.mode,
      amount: transaction.amount,
      runningBalance: transaction.currentBalance,
      txnTimestamp: transaction.transactionTimestamp,
      narration: transaction.narration,
      merchantName: transaction.merchant_name,
      confidence: 1,
      rawPayload: transaction,
    })),
  });
}

export async function runAaRealConnector() {
  return {
    supported: false,
    message: "AA real connector is intentionally left as a drop-in placeholder for future official integration.",
  };
}
