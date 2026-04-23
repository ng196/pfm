import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getDashboardSnapshot } from "./db/repositories";
import { bootstrapApp } from "./services/bootstrapService";
import { syncConnector } from "./services/ingestionService";
import { formatCompactDate, formatCurrency } from "./utils/amount";
import { ensureSmsPermissions } from "./services/smsPermissions";
import { startNativeSmsListener, stopNativeSmsListener } from "./connectors/sms/nativeSmsBridge";

const tabs = [
  { key: "home", label: "Home" },
  { key: "connectors", label: "Connectors" },
  { key: "transactions", label: "Transactions" },
  { key: "reviews", label: "Reviews" },
  { key: "plans", label: "Budgets" },
];

function Card({ title, subtitle, children, tone = "default" }) {
  return (
    <View style={[styles.card, tone === "hero" ? styles.heroCard : null]}>
      {title ? <Text style={[styles.cardTitle, tone === "hero" ? styles.heroTitle : null]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.cardSubtitle, tone === "hero" ? styles.heroSubtitle : null]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function PillButton({ label, onPress, variant = "primary", disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        variant === "secondary" ? styles.buttonSecondary : styles.buttonPrimary,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={[styles.buttonText, variant === "secondary" ? styles.buttonSecondaryText : styles.buttonPrimaryText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function HomeTab({ snapshot }) {
  const insights = snapshot.insights || {};

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card title="AA-Compatible Offline Wallet" subtitle="Every connector writes into the same canonical finance contract." tone="hero">
        <Text style={styles.heroAmount}>{formatCurrency(insights?.totals?.lifetimeNet || 0)}</Text>
        <Text style={styles.heroCaption}>Lifetime net cashflow</Text>
      </Card>

      <View style={styles.metricGrid}>
        <Metric label="Accounts" value={String(snapshot.accounts.length)} />
        <Metric label="Transactions" value={String(snapshot.insights?.metadata?.txnCount || 0)} />
        <Metric label="30D Credit" value={formatCurrency(insights?.last30Days?.credit || 0)} />
        <Metric label="30D Debit" value={formatCurrency(insights?.last30Days?.debit || 0)} />
      </View>

      <Card title="Top merchants" subtitle="Inferred from normalized transactions">
        {(snapshot.insights?.topMerchants || []).length === 0 ? (
          <Text style={styles.mutedText}>No merchant insights yet.</Text>
        ) : (
          snapshot.insights.topMerchants.map((merchant) => (
            <View key={merchant.merchant} style={styles.row}>
              <Text style={styles.rowTitle}>{merchant.merchant}</Text>
              <Text style={styles.rowValue}>{formatCurrency(merchant.spend)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Latest sessions" subtitle="Connector runs stay source-agnostic after ingestion">
        {snapshot.sessions.length === 0 ? (
          <Text style={styles.mutedText}>No sessions yet.</Text>
        ) : (
          snapshot.sessions.map((session, index) => (
            <View key={`${session.connector_key}_${session.created_at}_${index}`} style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>{session.connector_key}</Text>
                <Text style={styles.rowMeta}>{formatCompactDate(session.created_at)}</Text>
              </View>
              <Text style={styles.rowBadge}>{session.status}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function ConnectorsTab({ onSync, busy, isListening, onStartLive, onStopLive }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card title="Connector layer" subtitle="SMS is a fallback adapter. AA remains the canonical architecture.">
        <Text style={styles.mutedText}>
          Run connectors below. Each one produces the same consent, session, financial record, account, transaction,
          and insights pipeline.
        </Text>
        <View style={styles.buttonStack}>
          <PillButton label="Sync AA Mock Connector" onPress={() => onSync("aa_mock_connector")} disabled={busy} />
          <PillButton
            label="Import SMS History (Android Native)"
            onPress={() => onSync("sms_connector", { mode: "native", limit: 250 })}
            disabled={busy}
          />
          <PillButton label="Scan Demo SMS Connector" onPress={() => onSync("sms_connector", { mode: "demo" })} variant="secondary" disabled={busy} />
          <PillButton
            label={isListening ? "Live SMS Listener Active" : "Start Live SMS Listener"}
            onPress={onStartLive}
            variant="secondary"
            disabled={busy}
          />
          {isListening ? <PillButton label="Stop Live SMS Listener" onPress={onStopLive} variant="secondary" disabled={busy} /> : null}
          <PillButton label="AA Real Connector Placeholder" onPress={() => onSync("aa_real_connector")} variant="secondary" disabled={busy} />
        </View>
      </Card>

      <Card title="Native SMS note" subtitle="Expo app scaffolded with a bridge seam">
        <Text style={styles.mutedText}>
          The app is ready for a native Android SMS module, but currently falls back to demo SMS if that bridge is not linked.
        </Text>
      </Card>
    </ScrollView>
  );
}

function TransactionsTab({ snapshot }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card title="Normalized transactions" subtitle="Mixed-source ledger after connector ingestion">
        {snapshot.transactions.length === 0 ? (
          <Text style={styles.mutedText}>No transactions yet.</Text>
        ) : (
          snapshot.transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionRow}>
              <View style={styles.transactionBody}>
                <Text style={styles.rowTitle}>{transaction.merchant_name || transaction.narration || "Transaction"}</Text>
                <Text style={styles.rowMeta}>
                  {transaction.source_type} · {transaction.connector_key} · {formatCompactDate(transaction.txn_timestamp)}
                </Text>
              </View>
              <Text style={[styles.amountText, transaction.txn_type === "CREDIT" ? styles.credit : styles.debit]}>
                {transaction.txn_type === "CREDIT" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function ReviewsTab({ snapshot }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card title="Parser review queue" subtitle="Low-confidence SMS stays reviewable instead of polluting the ledger">
        {snapshot.reviews.length === 0 ? (
          <Text style={styles.mutedText}>No review items right now.</Text>
        ) : (
          snapshot.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <Text style={styles.rowTitle}>{review.reason || "Review required"}</Text>
              <Text style={styles.rowMeta}>{review.sender || "Unknown sender"}</Text>
              <Text style={styles.reviewText}>{review.raw_payload?.body || "No message body stored."}</Text>
              <Text style={styles.rowBadge}>{review.status}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

function PlansTab({ snapshot }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Card title="Budgets" subtitle="Local plan objects stay independent from source connector choice">
        {snapshot.budgets.map((budget) => (
          <View key={budget.id} style={styles.row}>
            <Text style={styles.rowTitle}>{budget.category_name}</Text>
            <Text style={styles.rowValue}>{formatCurrency(budget.monthly_limit)}</Text>
          </View>
        ))}
      </Card>

      <Card title="Goals" subtitle="Persisted locally alongside accounts and insights">
        {snapshot.goals.map((goal) => (
          <View key={goal.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{goal.name}</Text>
              <Text style={styles.rowMeta}>
                {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
              </Text>
            </View>
            <Text style={styles.rowBadge}>
              {Math.round((Number(goal.current_amount || 0) / Number(goal.target_amount || 1)) * 100)}%
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

export default function MobileApp() {
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState(null);
  const [snapshot, setSnapshot] = useState({
    profile: null,
    accounts: [],
    transactions: [],
    insights: null,
    reviews: [],
    budgets: [],
    goals: [],
    sessions: [],
  });
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

  const refresh = async () => {
    const nextSnapshot = await getDashboardSnapshot();
    setSnapshot(nextSnapshot);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const bootProfile = await bootstrapApp();
        if (!mounted) return;
        setProfile(bootProfile);
        await refresh();
      } catch (error) {
        if (!mounted) return;
        setMessage(error.message || "Unable to bootstrap app.");
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    };

    run();
    return () => {
      mounted = false;
      stopNativeSmsListener();
    };
  }, []);

  const handleSync = async (connectorKey, options = {}) => {
    if (!profile) return;
    setBusy(true);
    setMessage("");

    try {
      const permissionCheck =
        connectorKey === "sms_connector" && (options.mode === "native" || options.mode === "single")
          ? await ensureSmsPermissions()
          : { granted: true };

      if (!permissionCheck.granted) {
        setMessage(permissionCheck.reason || "SMS permission denied.");
        return;
      }

      const result = await syncConnector(profile, connectorKey, options);
      if (result?.supported === false) {
        setMessage(result.message);
      } else {
        const statsText = result?.stats
          ? `Synced ${connectorKey}: ${JSON.stringify(result.stats)}`
          : `Synced ${connectorKey}`;
        setMessage(statsText);
      }
      await refresh();
      if (connectorKey !== "aa_real_connector") {
        setActiveTab("home");
      }
    } catch (error) {
      setMessage(error.message || `Failed to run ${connectorKey}.`);
    } finally {
      setBusy(false);
    }
  };

  const handleStartLiveSms = async () => {
    if (!profile || isListening) return;
    setBusy(true);
    setMessage("");

    try {
      const permission = await ensureSmsPermissions();
      if (!permission.granted) {
        setMessage(permission.reason || "SMS permission denied.");
        return;
      }

      startNativeSmsListener(async (incomingMessage) => {
        try {
          await syncConnector(profile, "sms_connector", {
            mode: "single",
            message: incomingMessage,
          });
          await refresh();
          setMessage(`Stored incoming SMS from ${incomingMessage.sender}`);
        } catch (error) {
          setMessage(error.message || "Failed to store incoming SMS.");
        }
      });

      setIsListening(true);
      setMessage("Live SMS listener started.");
    } catch (error) {
      setMessage(error.message || "Unable to start live SMS listener.");
    } finally {
      setBusy(false);
    }
  };

  const handleStopLiveSms = () => {
    stopNativeSmsListener();
    setIsListening(false);
    setMessage("Live SMS listener stopped.");
  };

  const renderActiveTab = () => {
    if (activeTab === "connectors") {
      return (
        <ConnectorsTab
          onSync={handleSync}
          busy={busy}
          isListening={isListening}
          onStartLive={handleStartLiveSms}
          onStopLive={handleStopLiveSms}
        />
      );
    }
    if (activeTab === "transactions") return <TransactionsTab snapshot={snapshot} />;
    if (activeTab === "reviews") return <ReviewsTab snapshot={snapshot} />;
    if (activeTab === "plans") return <PlansTab snapshot={snapshot} />;
    return <HomeTab snapshot={snapshot} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>FlowWallet Mobile</Text>
            <Text style={styles.headerTitle}>AA-compatible offline architecture</Text>
            <Text style={styles.headerSubtitle}>
              {snapshot.profile?.full_name || "Local profile"} · {snapshot.accounts.length} accounts · {snapshot.transactions.length} transactions
            </Text>
          </View>
          {busy || booting ? <ActivityIndicator color="#0f766e" /> : null}
        </View>

        {message ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{message}</Text>
          </View>
        ) : null}

        {booting ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.mutedText}>Preparing local database and profile...</Text>
          </View>
        ) : (
          <View style={styles.content}>{renderActiveTab()}</View>
        )}

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={styles.tabButton}>
              <Text style={[styles.tabText, activeTab === tab.key ? styles.tabTextActive : null]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6fbfa",
  },
  root: {
    flex: 1,
    backgroundColor: "#f6fbfa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  headerSubtitle: {
    color: "#475569",
    fontSize: 13,
    marginTop: 4,
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#e6fffb",
    borderColor: "#99f6e4",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    color: "#134e4a",
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dbe7e3",
  },
  heroCard: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800",
  },
  cardSubtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#f8fafc",
  },
  heroSubtitle: {
    color: "#cbd5e1",
  },
  heroAmount: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
  },
  heroCaption: {
    color: "#cbd5e1",
    marginTop: 4,
    fontSize: 13,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbe7e3",
  },
  metricLabel: {
    color: "#64748b",
    fontSize: 12,
  },
  metricValue: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf4f2",
  },
  rowTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },
  rowMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
  },
  rowValue: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },
  rowBadge: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "700",
  },
  buttonStack: {
    gap: 10,
    marginTop: 6,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: "#0f766e",
  },
  buttonSecondary: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  buttonPrimaryText: {
    color: "#ffffff",
  },
  buttonSecondaryText: {
    color: "#115e59",
  },
  buttonText: {
    fontWeight: "800",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderTopWidth: 1,
    borderTopColor: "#edf4f2",
    paddingVertical: 12,
    gap: 12,
  },
  transactionBody: {
    flex: 1,
  },
  amountText: {
    fontWeight: "800",
    fontSize: 14,
  },
  credit: {
    color: "#15803d",
  },
  debit: {
    color: "#be123c",
  },
  reviewCard: {
    borderTopWidth: 1,
    borderTopColor: "#edf4f2",
    paddingVertical: 12,
  },
  reviewText: {
    color: "#334155",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  mutedText: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#dbe7e3",
    backgroundColor: "#ffffff",
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tabText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#0f766e",
  },
});
