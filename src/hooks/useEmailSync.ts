import * as Linking from "expo-linking";
import {
    Href,
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useRef, useState } from "react";
import {
    EmailSyncLog,
    EmailSyncResult,
    emailSyncService,
} from "../api/emailSyncService";

WebBrowser.maybeCompleteAuthSession();

const EMAIL_SYNC_REDIRECT_PATH = "/alerts";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;

type EmailSyncSearchParams = {
  email_sync?: string | string[];
  reason?: string | string[];
};

const getSingleParam = (value?: string | string[]) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

const getErrorMessage = (error: any, fallbackMessage: string) => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

const parseEmailSyncRedirect = (url: string) => {
  const parsed = Linking.parse(url);
  const emailSync = getSingleParam(
    parsed.queryParams?.email_sync as string | string[] | undefined,
  );
  const reason = getSingleParam(
    parsed.queryParams?.reason as string | string[] | undefined,
  );

  return {
    emailSync,
    reason,
  };
};

export function useEmailSync() {
  const router = useRouter();
  const params = useLocalSearchParams<EmailSyncSearchParams>();
  const lastHandledRedirectRef = useRef<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<EmailSyncLog[]>([]);
  const [total, setTotal] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusRefreshing, setStatusRefreshing] = useState(false);
  const [syncResult, setSyncResult] = useState<EmailSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearOAuthParams = useCallback(() => {
    router.replace(EMAIL_SYNC_REDIRECT_PATH as Href);
  }, [router]);

  const fetchStatus = useCallback(
    async (
      page: number = DEFAULT_PAGE,
      limit: number = DEFAULT_LIMIT,
      silent: boolean = false,
    ) => {
      try {
        if (!silent) {
          setStatusLoading(true);
        } else {
          setStatusRefreshing(true);
        }

        const response = await emailSyncService.getStatus(page, limit);

        if (response.success && response.data) {
          setConnected(response.data.connected);
          setLogs(response.data.logs || []);
          setTotal(response.data.total || 0);
          setError(null);
          return;
        }

        setError(response.message || "Failed to fetch Gmail sync status");
      } catch (fetchError: any) {
        setError(
          getErrorMessage(fetchError, "Failed to fetch Gmail sync status"),
        );
      } finally {
        setStatusLoading(false);
        setStatusRefreshing(false);
      }
    },
    [],
  );

  const handleOAuthRedirect = useCallback(
    async (
      emailSync?: string,
      reason?: string,
      shouldClearParams: boolean = false,
    ) => {
      if (!emailSync) {
        return;
      }

      if (emailSync === "success") {
        setError(null);
        await fetchStatus(DEFAULT_PAGE, DEFAULT_LIMIT, true);
      } else if (emailSync === "error") {
        setError(`Gmail connection failed: ${reason || "unknown error"}`);
      }

      if (shouldClearParams) {
        clearOAuthParams();
      }
    },
    [clearOAuthParams, fetchStatus],
  );

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus]),
  );

  useFocusEffect(
    useCallback(() => {
      const emailSync = getSingleParam(params.email_sync);
      const reason = getSingleParam(params.reason);
      const redirectKey = `${emailSync || ""}:${reason || ""}`;

      if (!emailSync || lastHandledRedirectRef.current === redirectKey) {
        return;
      }

      lastHandledRedirectRef.current = redirectKey;
      handleOAuthRedirect(emailSync, reason, true);
    }, [handleOAuthRedirect, params.email_sync, params.reason]),
  );

  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);

      const response = await emailSyncService.getAuthUrl();

      if (!response.success || !response.data?.auth_url) {
        setError(response.message || "Failed to start Gmail connection");
        return;
      }

      const redirectUrl = Linking.createURL(EMAIL_SYNC_REDIRECT_PATH);
      const authSessionResult = await WebBrowser.openAuthSessionAsync(
        response.data.auth_url,
        redirectUrl,
      );

      if (authSessionResult.type === "success" && authSessionResult.url) {
        const redirectState = parseEmailSyncRedirect(authSessionResult.url);
        await handleOAuthRedirect(
          redirectState.emailSync,
          redirectState.reason,
        );
      }
    } catch (connectError: any) {
      setError(getErrorMessage(connectError, "Failed to connect Gmail"));
    } finally {
      setConnecting(false);
    }
  }, [handleOAuthRedirect]);

  const sync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);

      const response = await emailSyncService.sync();

      if (response.success && response.data) {
        setSyncResult(response.data);
        await fetchStatus(DEFAULT_PAGE, DEFAULT_LIMIT, true);
        return;
      }

      setError(response.message || "Failed to sync Gmail emails");
    } catch (syncError: any) {
      setError(getErrorMessage(syncError, "Failed to sync Gmail emails"));
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  const disconnect = useCallback(async () => {
    try {
      setError(null);

      const response = await emailSyncService.disconnect();

      if (!response.success) {
        setError(response.message || "Failed to disconnect Gmail");
        return;
      }

      setConnected(false);
      setLogs([]);
      setTotal(0);
      setSyncResult(null);
    } catch (disconnectError: any) {
      setError(getErrorMessage(disconnectError, "Failed to disconnect Gmail"));
    }
  }, []);

  return {
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
  };
}

export default useEmailSync;
