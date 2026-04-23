import { parseAmount } from "../../utils/amount";

function normalizeBody(body) {
  return String(body || "").replace(/\s+/g, " ").trim();
}

function extractAmount(body) {
  const match = normalizeBody(body).match(/(?:INR|Rs\.?|Rs)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  return match ? parseAmount(match[1]) : null;
}

function extractBalance(body) {
  const match = normalizeBody(body).match(
    /(?:Avl Bal|Avail(?:able)? Bal(?:ance)?|Bal(?:ance)?|A\/c balance)\s*(?:INR|Rs\.?|Rs)?\s*([0-9,]+(?:\.\d{1,2})?)/i
  );
  return match ? parseAmount(match[1]) : null;
}

function extractMaskedIdentifier(body) {
  const match = normalizeBody(body).match(/(?:A\/c|account|Card)\s*([Xx*]{2,}\d{2,4})/i);
  return match ? match[1].toUpperCase() : "UNKNOWN";
}

function extractReference(body) {
  const match = normalizeBody(body).match(/(?:UPI Ref|Ref no|Ref|txn id)\s*[:.]?\s*([A-Za-z0-9-]+)/i);
  return match ? match[1] : null;
}

function extractMerchant(body) {
  const normalized = normalizeBody(body);
  const merchantPatterns = [
    /(?:to|at|for)\s+([A-Z0-9 .&-]{2,40}?)(?:\.|,| UPI| Ref| Bal| on \d{2}-\d{2}-\d{2}|$)/i,
    /by\s+([A-Z0-9 .&-]{2,40}?)(?:\.|,| Avl| Bal|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function inferTxnType(body) {
  const normalized = normalizeBody(body).toLowerCase();
  if (normalized.includes("credited") || normalized.includes("salary")) {
    return "CREDIT";
  }
  if (normalized.includes("debited") || normalized.includes("spent") || normalized.includes("transfer to")) {
    return "DEBIT";
  }
  return null;
}

function inferMode(body) {
  const normalized = normalizeBody(body).toUpperCase();
  if (normalized.includes("UPI")) return "UPI";
  if (normalized.includes("NEFT")) return "NEFT";
  if (normalized.includes("CARD")) return "CARD";
  return "BANK";
}

export function parseBankSms(message, parserId, institution) {
  const body = normalizeBody(message.body);
  const amount = extractAmount(body);
  const txnType = inferTxnType(body);
  const balance = extractBalance(body);
  const maskedIdentifier = extractMaskedIdentifier(body);
  const reference = extractReference(body);
  const merchantName = extractMerchant(body);
  const mode = inferMode(body);

  let confidence = 0;
  if (amount !== null) confidence += 0.35;
  if (txnType) confidence += 0.25;
  if (maskedIdentifier && maskedIdentifier !== "UNKNOWN") confidence += 0.2;
  if (merchantName) confidence += 0.1;
  if (balance !== null) confidence += 0.1;

  const success = confidence >= 0.7;

  return {
    parserId,
    institution,
    success,
    confidence: Number(confidence.toFixed(2)),
    fiType: body.toLowerCase().includes("card") ? "CREDIT_CARD" : "DEPOSIT",
    accountName: body.toLowerCase().includes("card") ? `${institution} Card` : `${institution} Account`,
    accountSubtype: body.toLowerCase().includes("card") ? "CARD" : "SAVINGS",
    maskedIdentifier,
    currentBalance: balance,
    txnType,
    amount,
    mode,
    txnRef: reference,
    merchantName,
    narration: body,
    txnTimestamp: message.receivedAt,
    rawPayload: message,
  };
}
