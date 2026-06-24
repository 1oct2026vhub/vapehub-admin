"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mutate } from "swr";
import {
  BulkStatusActiveOrderItem,
  BulkStatusJobClientMeta,
  BulkStatusJobData,
  BULK_STATUS_POLL_INTERVAL_MS,
  bulkJobIdKey,
  getBulkStatusActiveOrders,
  getBulkStatusJob,
  getStoredBulkStatusJobs,
  isTerminalBulkStatusJob,
  listBulkStatusJobs,
  OrderStatus,
  removeStoredBulkStatusJob,
  upsertStoredBulkStatusJob,
} from "@/services/apiOrder";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getAuthToken } from "@/utils/auth";
import BulkStatusActivityDrawer from "@/app/(control-panel)/apps/order/components/BulkStatusActivityDrawer";
import {
  BulkJobState,
  formatBulkJobLabel,
  isJobActive,
} from "@/app/(control-panel)/apps/order/components/bulkStatusJobUtils";

interface BulkStatusJobContextType {
  jobs: BulkJobState[];
  activeJobCount: number;
  activeBulkByOrderId: Map<number, BulkStatusActiveOrderItem>;
  selectedJobId: string | null;
  drawerOpen: boolean;
  startJob: (
    jobId: number | string,
    targetStatus: string,
    orderIds: number[],
    jobKey?: string
  ) => void;
  openDrawer: (jobId?: string) => void;
  closeDrawer: () => void;
  selectJob: (jobId: string | null) => void;
  dismissJob: (jobId: string) => void;
  registerCompleteListener: (listener: () => void) => () => void;
  refreshActiveBulkOrders: () => Promise<void>;
  formatJobLabel: (job: BulkJobState) => string;
}

const BulkStatusJobContext = createContext<BulkStatusJobContextType | undefined>(
  undefined
);

const createJobState = (meta: BulkStatusJobClientMeta): BulkJobState => ({
  meta,
  pollData: null,
  pollError: null,
  isFinished: false,
});

const isJobTerminal = (job: BulkJobState) =>
  job.isFinished ||
  !!job.pollError ||
  (job.pollData !== null &&
    (isTerminalBulkStatusJob(job.pollData.status) ||
      job.pollData.progress_percent >= 100));

const applyActiveBulkItems = (
  items: BulkStatusActiveOrderItem[]
): Map<number, BulkStatusActiveOrderItem> => {
  const map = new Map<number, BulkStatusActiveOrderItem>();
  items.forEach((item) => map.set(item.order_id, item));
  return map;
};

const activeBulkMapsEqual = (
  a: Map<number, BulkStatusActiveOrderItem>,
  b: Map<number, BulkStatusActiveOrderItem>
) => {
  if (a.size !== b.size) return false;
  for (const [orderId, item] of a) {
    const other = b.get(orderId);
    if (
      !other ||
      other.job_id !== item.job_id ||
      other.item_status !== item.item_status ||
      other.target_status !== item.target_status
    ) {
      return false;
    }
  }
  return true;
};

export function BulkStatusJobProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useSnackbar();
  const [jobs, setJobs] = useState<Record<string, BulkJobState>>({});
  const [activeBulkByOrderId, setActiveBulkByOrderId] = useState<
    Map<number, BulkStatusActiveOrderItem>
  >(new Map());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncInFlightRef = useRef(false);
  const detailFetchInFlightRef = useRef<Set<string>>(new Set());
  const finishedNotifiedRef = useRef<Set<string>>(new Set());
  const completeListenersRef = useRef(new Set<() => void>());
  const jobsRef = useRef(jobs);
  const drawerOpenRef = useRef(drawerOpen);
  jobsRef.current = jobs;
  drawerOpenRef.current = drawerOpen;

  const jobsList = useMemo(() => {
    return Object.values(jobs).sort(
      (a, b) =>
        new Date(b.meta.startedAt).getTime() -
        new Date(a.meta.startedAt).getTime()
    );
  }, [jobs]);

  const activeJobCount = useMemo(
    () => jobsList.filter(isJobActive).length,
    [jobsList]
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const notifyCompleteListeners = useCallback(() => {
    completeListenersRef.current.forEach((listener) => listener());
  }, []);

  const persistJobMeta = useCallback((meta: BulkStatusJobClientMeta) => {
    upsertStoredBulkStatusJob(meta);
  }, []);

  const refreshActiveBulkOrdersOnly = useCallback(async () => {
    if (!getAuthToken()) return;

    try {
      const response = await getBulkStatusActiveOrders();
      if (response?.success && response.data) {
        const next = applyActiveBulkItems(response.data.items);
        setActiveBulkByOrderId((prev) =>
          activeBulkMapsEqual(prev, next) ? prev : next
        );
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const handleJobFinished = useCallback(
    async (jobData: BulkStatusJobData, meta: BulkStatusJobClientMeta) => {
      const label = meta.targetStatus
        ? formatBulkJobLabel({
            meta,
            pollData: jobData,
            pollError: null,
            isFinished: true,
          })
        : `Job #${meta.jobId}`;

      if (jobData.status === "completed") {
        showSnackbar(
          `${label}: ${jobData.successful} order(s) updated.`,
          "success"
        );
      } else if (jobData.status === "partial_failed") {
        showSnackbar(
          `${label}: ${jobData.successful} updated, ${jobData.failed} failed.`,
          "warning"
        );
      } else if (jobData.status === "cancelled") {
        showSnackbar(`${label}: bulk update cancelled.`, "warning");
      } else {
        showSnackbar(`${label}: bulk update failed.`, "error");
      }

      await mutate(
        (key) => Array.isArray(key) && key[0] === "orderList",
        undefined,
        { revalidate: true }
      );

      await refreshActiveBulkOrdersOnly();
      notifyCompleteListeners();
    },
    [notifyCompleteListeners, refreshActiveBulkOrdersOnly, showSnackbar]
  );

  const mergeServerJob = useCallback(
    (jobData: BulkStatusJobData, existing?: BulkJobState): BulkJobState => {
      const id = bulkJobIdKey(jobData.job_id);
      const meta: BulkStatusJobClientMeta = {
        jobId: id,
        jobKey: jobData.job_key ?? existing?.meta.jobKey,
        targetStatus: jobData.target_status || existing?.meta.targetStatus || "",
        orderIds: existing?.meta.orderIds ?? [],
        startedAt:
          jobData.created_at ||
          existing?.meta.startedAt ||
          new Date().toISOString(),
      };

      const isFinished =
        isTerminalBulkStatusJob(jobData.status) ||
        jobData.progress_percent >= 100;

      return {
        meta,
        pollData: jobData,
        pollError: existing?.pollError ?? null,
        isFinished: isFinished || (existing?.isFinished ?? false),
        needsDetailFetch: false,
      };
    },
    []
  );

  const maybeNotifyJobFinished = useCallback(
    async (jobId: string, jobData: BulkStatusJobData, meta: BulkStatusJobClientMeta) => {
      const isFinished =
        isTerminalBulkStatusJob(jobData.status) ||
        jobData.progress_percent >= 100;

      if (isFinished && !finishedNotifiedRef.current.has(jobId)) {
        finishedNotifiedRef.current.add(jobId);
        await handleJobFinished(jobData, meta);
      }
    },
    [handleJobFinished]
  );

  const fetchJobDetail = useCallback(
    async (jobId: string) => {
      if (detailFetchInFlightRef.current.has(jobId)) return;

      const current = jobsRef.current[jobId];
      if (!current) return;

      const hasTerminalData =
        current.pollData &&
        isTerminalBulkStatusJob(current.pollData.status) &&
        !current.needsDetailFetch;

      if (hasTerminalData) return;

      detailFetchInFlightRef.current.add(jobId);

      try {
        const response = await getBulkStatusJob(jobId);
        if (!response?.success || !response.data) return;

        const jobData = response.data;
        const merged = mergeServerJob(jobData, current);
        setJobs((prev) => ({ ...prev, [jobId]: merged }));
        upsertStoredBulkStatusJob(merged.meta);
        await maybeNotifyJobFinished(jobId, jobData, merged.meta);
      } catch (error: unknown) {
        const err = error as { message?: string; status?: number };
        const message =
          err?.status === 404
            ? "Bulk update job not found. It may have expired."
            : err?.message || "Failed to check job status. Please try again.";

        setJobs((prev) => {
          const existing = prev[jobId];
          if (!existing) return prev;
          return {
            ...prev,
            [jobId]: {
              ...existing,
              pollError: message,
              isFinished: true,
              needsDetailFetch: false,
            },
          };
        });

        if (err?.status === 404) {
          removeStoredBulkStatusJob(jobId);
        }
      } finally {
        detailFetchInFlightRef.current.delete(jobId);
      }
    },
    [maybeNotifyJobFinished, mergeServerJob]
  );

  const handleJobDroppedWhileClosed = useCallback(
    async (job: BulkJobState) => {
      const jobId = job.meta.jobId;
      if (finishedNotifiedRef.current.has(jobId)) return;

      finishedNotifiedRef.current.add(jobId);

      setJobs((prev) => {
        const existing = prev[jobId];
        if (!existing) return prev;
        return {
          ...prev,
          [jobId]: {
            ...existing,
            isFinished: true,
            needsDetailFetch: true,
          },
        };
      });

      const label = job.meta.targetStatus
        ? formatBulkJobLabel({ ...job, isFinished: true })
        : `Job #${jobId}`;

      showSnackbar(`${label}: bulk update finished.`, "info");

      await mutate(
        (key) => Array.isArray(key) && key[0] === "orderList",
        undefined,
        { revalidate: true }
      );
      await refreshActiveBulkOrdersOnly();
      notifyCompleteListeners();
    },
    [notifyCompleteListeners, refreshActiveBulkOrdersOnly, showSnackbar]
  );

  const applyOptimisticActiveOrders = useCallback(
    (
      jobId: number | string,
      targetStatus: string,
      orderIds: number[]
    ) => {
      if (orderIds.length === 0) return;

      const numericJobId = Number(jobId);
      setActiveBulkByOrderId((prev) => {
        const next = new Map(prev);
        orderIds.forEach((orderId) => {
          next.set(orderId, {
            order_id: orderId,
            job_id: numericJobId,
            item_status: "queued",
            target_status: targetStatus as OrderStatus,
          });
        });
        return activeBulkMapsEqual(prev, next) ? prev : next;
      });
    },
    []
  );

  const refreshBulkJobState = useCallback(async () => {
    if (!getAuthToken()) return;
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;

    try {
      const localActiveJobs = Object.values(jobsRef.current).filter(
        (job) => !isJobTerminal(job)
      );

      if (localActiveJobs.length === 0) {
        return;
      }

      const [listResponse, activeOrdersResponse] = await Promise.all([
        listBulkStatusJobs({ status: "active", limit: 50 }),
        getBulkStatusActiveOrders(),
      ]);

      if (activeOrdersResponse?.success && activeOrdersResponse.data) {
        const next = applyActiveBulkItems(activeOrdersResponse.data.items);
        setActiveBulkByOrderId((prev) =>
          activeBulkMapsEqual(prev, next) ? prev : next
        );
      }

      if (!listResponse?.success || !listResponse.data?.jobs) {
        return;
      }

      const serverJobs = listResponse.data.jobs;
      const serverActiveIds = new Set(
        serverJobs.map((job) => bulkJobIdKey(job.job_id))
      );

      setJobs((prev) => {
        const next = { ...prev };

        serverJobs.forEach((jobData) => {
          const id = bulkJobIdKey(jobData.job_id);
          const merged = mergeServerJob(jobData, next[id]);
          next[id] = merged;
          upsertStoredBulkStatusJob(merged.meta);
        });

        return next;
      });

      for (const jobData of serverJobs) {
        const id = bulkJobIdKey(jobData.job_id);
        const existing = jobsRef.current[id];
        const meta = existing?.meta ?? {
          jobId: id,
          targetStatus: jobData.target_status,
          orderIds: [],
          startedAt: jobData.created_at,
        };
        await maybeNotifyJobFinished(id, jobData, meta);
      }

      const droppedJobs = localActiveJobs.filter(
        (job) => !serverActiveIds.has(job.meta.jobId)
      );

      for (const job of droppedJobs) {
        if (drawerOpenRef.current) {
          await fetchJobDetail(job.meta.jobId);
        } else {
          await handleJobDroppedWhileClosed(job);
        }
      }
    } finally {
      syncInFlightRef.current = false;
    }
  }, [
    fetchJobDetail,
    handleJobDroppedWhileClosed,
    maybeNotifyJobFinished,
    mergeServerJob,
  ]);

  const reconcileJobsFromServer = useCallback(async () => {
    if (!getAuthToken()) return;

    const stored = getStoredBulkStatusJobs();

    try {
      const listResponse = await listBulkStatusJobs({
        limit: 50,
      });
      const serverJobs = listResponse?.success ? listResponse.data.jobs : [];
      const serverIds = new Set(
        serverJobs.map((job) => bulkJobIdKey(job.job_id))
      );

      setJobs(() => {
        const next: Record<string, BulkJobState> = {};

        serverJobs.forEach((jobData) => {
          const id = bulkJobIdKey(jobData.job_id);
          const storedMeta = stored.find((s) => bulkJobIdKey(s.jobId) === id);
          const base = storedMeta
            ? createJobState({ ...storedMeta, jobId: id })
            : undefined;
          const merged = mergeServerJob(jobData, base);
          next[id] = merged;
          upsertStoredBulkStatusJob(merged.meta);
        });

        stored.forEach((meta) => {
          const id = bulkJobIdKey(meta.jobId);
          if (serverIds.has(id)) return;

          next[id] = {
            meta: { ...meta, jobId: id },
            pollData: null,
            pollError: null,
            isFinished: true,
            needsDetailFetch: true,
          };
        });

        return next;
      });
    } catch {
      if (stored.length === 0) return;

      // Show cached jobs in history only — never as active (avoids polling loops).
      setJobs((prev) => {
        const next = { ...prev };
        stored.forEach((meta) => {
          const id = bulkJobIdKey(meta.jobId);
          if (next[id]) return;
          next[id] = {
            meta: { ...meta, jobId: id },
            pollData: null,
            pollError: null,
            isFinished: true,
            needsDetailFetch: true,
          };
        });
        return next;
      });
    }
  }, [mergeServerJob]);

  useEffect(() => {
    void refreshActiveBulkOrdersOnly();
    void reconcileJobsFromServer();
  }, [reconcileJobsFromServer, refreshActiveBulkOrdersOnly]);

  useEffect(() => {
    if (activeJobCount === 0) {
      stopPolling();
      return;
    }

    void refreshBulkJobState();
    pollingRef.current = setInterval(() => {
      void refreshBulkJobState();
    }, BULK_STATUS_POLL_INTERVAL_MS);

    return () => {
      stopPolling();
    };
  }, [activeJobCount, refreshBulkJobState, stopPolling]);

  useEffect(() => {
    if (!drawerOpen || !selectedJobId) return;
    void fetchJobDetail(selectedJobId);
  }, [drawerOpen, fetchJobDetail, selectedJobId]);

  const startJob = useCallback(
    (
      jobId: number | string,
      targetStatus: string,
      orderIds: number[],
      jobKey?: string
    ) => {
      const id = bulkJobIdKey(jobId);
      const meta: BulkStatusJobClientMeta = {
        jobId: id,
        jobKey,
        targetStatus,
        orderIds,
        startedAt: new Date().toISOString(),
      };

      persistJobMeta(meta);
      finishedNotifiedRef.current.delete(id);
      applyOptimisticActiveOrders(jobId, targetStatus, orderIds);

      setJobs((prev) => ({
        ...prev,
        [id]: createJobState(meta),
      }));
      setSelectedJobId(id);
      setDrawerOpen(true);
    },
    [applyOptimisticActiveOrders, persistJobMeta]
  );

  const openDrawer = useCallback(
    (jobId?: string) => {
      void reconcileJobsFromServer();

      if (jobId) {
        setSelectedJobId(jobId);
      } else if (!selectedJobId && jobsList.length > 0) {
        const firstActive = jobsList.find(isJobActive);
        setSelectedJobId(firstActive?.meta.jobId ?? jobsList[0].meta.jobId);
      }
      setDrawerOpen(true);
    },
    [jobsList, reconcileJobsFromServer, selectedJobId]
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const registerCompleteListener = useCallback((listener: () => void) => {
    completeListenersRef.current.add(listener);
    return () => {
      completeListenersRef.current.delete(listener);
    };
  }, []);

  const selectedJob = selectedJobId ? jobs[selectedJobId] ?? null : null;

  const dismissJob = useCallback((jobId: string) => {
    removeStoredBulkStatusJob(jobId);
    finishedNotifiedRef.current.delete(jobId);

    setJobs((prev) => {
      const next = { ...prev };
      delete next[jobId];

      setSelectedJobId((current) => {
        if (current !== jobId) return current;
        const remaining = Object.values(next);
        return remaining[0]?.meta.jobId ?? null;
      });

      return next;
    });
  }, []);

  const selectJob = useCallback((jobId: string | null) => {
    setSelectedJobId(jobId);
  }, []);

  return (
    <BulkStatusJobContext.Provider
      value={{
        jobs: jobsList,
        activeJobCount,
        activeBulkByOrderId,
        selectedJobId,
        drawerOpen,
        startJob,
        openDrawer,
        closeDrawer,
        selectJob,
        dismissJob,
        registerCompleteListener,
        refreshActiveBulkOrders: refreshActiveBulkOrdersOnly,
        formatJobLabel: formatBulkJobLabel,
      }}
    >
      {children}
      <BulkStatusActivityDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        jobs={jobsList}
        selectedJob={selectedJob}
        selectedJobId={selectedJobId}
        onSelectJob={selectJob}
        onDismissJob={dismissJob}
      />
    </BulkStatusJobContext.Provider>
  );
}

export function useBulkStatusJob() {
  const context = useContext(BulkStatusJobContext);
  if (!context) {
    throw new Error("useBulkStatusJob must be used within BulkStatusJobProvider");
  }
  return context;
}
