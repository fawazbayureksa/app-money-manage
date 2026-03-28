import React from "react";
import { StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Divider,
    Text,
    useTheme,
} from "react-native-paper";
import { useEmailSync } from "../hooks/useEmailSync";

const statusColors = {
  imported: {
    backgroundColor: "#D8F3DC",
    textColor: "#1B5E20",
  },
  skipped: {
    backgroundColor: "#FFF3BF",
    textColor: "#8D6E00",
  },
  failed: {
    backgroundColor: "#FFE3E3",
    textColor: "#C92A2A",
  },
};

const formatAmount = (amount: number) => {
  if (amount <= 0) {
    return "Unknown amount";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) {
    return "Unknown date";
  }

  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function SyncStatusChip({ connected }: { connected: boolean }) {
  return (
    <Chip
      compact
      icon={connected ? "check-circle-outline" : "gmail"}
      style={[
        styles.connectionChip,
        connected ? styles.connectedChip : styles.disconnectedChip,
      ]}
      textStyle={
        connected ? styles.connectedChipText : styles.disconnectedChipText
      }
    >
      {connected ? "Connected" : "Not connected"}
    </Chip>
  );
}

function LogStatusBadge({
  status,
}: {
  status: "imported" | "skipped" | "failed";
}) {
  const colors = statusColors[status] || {
    backgroundColor: "#E9ECEF",
    textColor: "#343A40",
  };

  return (
    <View
      style={[
        styles.logStatusBadge,
        { backgroundColor: colors.backgroundColor },
      ]}
    >
      <Text
        variant="labelSmall"
        style={{ color: colors.textColor, textTransform: "capitalize" }}
      >
        {status}
      </Text>
    </View>
  );
}

export default function EmailSyncCard() {
  const theme = useTheme();
  const {
    connected,
    logs,
    total,
    connecting,
    syncing,
    statusLoading,
    statusRefreshing,
    syncResult,
    error,
    connect,
    sync,
    disconnect,
    fetchStatus,
  } = useEmailSync();

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text variant="titleLarge" style={styles.title}>
              Gmail Bank Sync
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Auto-import BCA, Permata, and SeaBank transaction emails from
              Gmail.
            </Text>
          </View>
          <SyncStatusChip connected={connected} />
        </View>

        {error && (
          <Text
            variant="bodyMedium"
            style={[styles.errorText, { color: theme.colors.error }]}
          >
            {error}
          </Text>
        )}

        <View style={styles.actionRow}>
          {!connected ? (
            <Button
              mode="contained"
              icon="gmail"
              onPress={connect}
              loading={connecting}
              disabled={connecting}
              style={styles.primaryAction}
            >
              {connecting ? "Opening Google..." : "Connect Gmail"}
            </Button>
          ) : (
            <>
              <Button
                mode="contained"
                icon="sync"
                onPress={sync}
                loading={syncing}
                disabled={syncing}
                style={styles.primaryAction}
              >
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button mode="outlined" icon="link-off" onPress={disconnect}>
                Disconnect
              </Button>
            </>
          )}
          <Button
            mode="text"
            icon="refresh"
            onPress={() => fetchStatus(1, 6, true)}
            disabled={statusRefreshing || statusLoading}
          >
            Refresh
          </Button>
        </View>

        {syncResult && (
          <View
            style={[
              styles.resultRow,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text variant="bodyMedium" style={styles.resultText}>
              Imported {syncResult.imported} • Skipped {syncResult.skipped} •
              Failed {syncResult.failed}
            </Text>
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.logsHeader}>
          <View>
            <Text variant="titleMedium">Recent Sync Logs</Text>
            <Text variant="bodySmall" style={styles.logsSubtitle}>
              {connected
                ? `${total} processed email${total === 1 ? "" : "s"} so far`
                : "Connect Gmail to start importing transaction emails"}
            </Text>
          </View>
          {(statusLoading || statusRefreshing) && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
        </View>

        {!statusLoading && logs.length === 0 && (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              {connected
                ? "No sync logs yet. Run your first sync to import matching bank emails."
                : "Gmail sync stays disconnected until you complete the Google authorization flow."}
            </Text>
          </View>
        )}

        {logs.map((log, index) => (
          <View key={log.id}>
            <View style={styles.logRow}>
              <View style={styles.logMain}>
                <Text variant="titleSmall" style={styles.logTitle}>
                  {log.bank_name || "Unknown bank"} • {formatAmount(log.amount)}
                </Text>
                <Text variant="bodySmall" style={styles.logMeta}>
                  {formatDate(log.email_date)} •{" "}
                  {log.from_email || "Unknown sender"}
                </Text>
                <Text variant="bodySmall" style={styles.logDescription}>
                  {log.error_message || log.subject || "No description"}
                </Text>
              </View>
              <LogStatusBadge status={log.status} />
            </View>
            {index < logs.length - 1 && <Divider style={styles.logDivider} />}
          </View>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.75,
    lineHeight: 20,
  },
  connectionChip: {
    marginTop: 2,
  },
  connectedChip: {
    backgroundColor: "#D8F5D0",
  },
  disconnectedChip: {
    backgroundColor: "#F1F3F5",
  },
  connectedChipText: {
    color: "#2B8A3E",
  },
  disconnectedChipText: {
    color: "#495057",
  },
  errorText: {
    marginTop: 12,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  primaryAction: {
    minWidth: 150,
  },
  resultRow: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  resultText: {
    fontWeight: "600",
  },
  divider: {
    marginVertical: 16,
  },
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  logsSubtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  emptyState: {
    borderRadius: 12,
    padding: 12,
  },
  emptyStateText: {
    lineHeight: 20,
    opacity: 0.8,
  },
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  logMain: {
    flex: 1,
  },
  logTitle: {
    fontWeight: "600",
  },
  logMeta: {
    marginTop: 4,
    opacity: 0.65,
  },
  logDescription: {
    marginTop: 6,
    lineHeight: 18,
    opacity: 0.8,
  },
  logStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logDivider: {
    marginVertical: 4,
  },
});
