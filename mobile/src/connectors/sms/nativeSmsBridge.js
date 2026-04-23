import { demoMessages } from "../../data/demoMessages";
import { Platform } from "react-native";
import { getSMSList, startSmsListener, stopSmsListener } from "react-native-sms-module";

function normalizeSmsData(entry) {
  return {
    id: String(entry.id || `${entry.timestamp}_${entry.sender || "unknown"}`),
    sender: String(entry.sender || "UNKNOWN"),
    body: String(entry.body || ""),
    receivedAt: new Date(Number(entry.timestamp || Date.now())).toISOString(),
  };
}

export async function readNativeSmsInbox(options = {}) {
  if (Platform.OS !== "android") {
    throw new Error("Native SMS inbox access is currently supported on Android only.");
  }

  const offset = Number(options.offset || 0);
  const limit = Number(options.limit || 200);
  const filters = options.filters || {};
  const messages = await getSMSList(offset, limit, filters);
  return (messages || []).map(normalizeSmsData);
}

export function startNativeSmsListener(onMessage) {
  if (Platform.OS !== "android") {
    throw new Error("Native SMS listener is currently supported on Android only.");
  }

  startSmsListener((message) => {
    onMessage(normalizeSmsData(message));
  });
}

export function stopNativeSmsListener() {
  if (Platform.OS !== "android") {
    return;
  }

  stopSmsListener();
}

export async function readSmsSource(options = {}) {
  const { mode = "demo" } = options;

  if (mode === "native") {
    return readNativeSmsInbox(options);
  }

  if (mode === "single" && options.message) {
    return [options.message];
  }

  return demoMessages;
}
