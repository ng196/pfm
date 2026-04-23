import { ingestCanonicalEnvelope } from "../db/repositories";
import { runAaMockConnector, runAaRealConnector } from "../connectors/aaMockConnector";
import { runSmsConnector } from "../connectors/smsConnector";

export async function syncConnector(profile, connectorKey, options = {}) {
  if (connectorKey === "aa_mock_connector") {
    const envelope = await runAaMockConnector(profile);
    await ingestCanonicalEnvelope(envelope);
    return { connectorKey, stats: { parsedTransactions: envelope.transactions.length } };
  }

  if (connectorKey === "sms_connector") {
    const envelope = await runSmsConnector(profile, options);
    await ingestCanonicalEnvelope(envelope);
    return { connectorKey, stats: envelope.stats };
  }

  if (connectorKey === "aa_real_connector") {
    return runAaRealConnector();
  }

  throw new Error(`Unsupported connector: ${connectorKey}`);
}
