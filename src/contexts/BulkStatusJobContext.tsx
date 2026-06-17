"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { mutate } from "swr";
import BulkStatusProgressDialog from "@/app/(control-panel)/apps/order/components/BulkStatusProgressDialog";
import {
  BulkStatusJobData,
  BULK_STATUS_POLL_INTERVAL_MS,
  clearStoredBulkStatusJobId,
  getBulkStatusJob,
  getStoredBulkStatusJobId,
  isTerminalBulkStatusJob,
  storeBulkStatusJobId,
} from "@/services/apiOrder";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface BulkStatusJobContextType {
  startJob: (jobId: string, targetStatus?: string) => void;
  hideDialog: () => void;
  registerCompleteListener: (listener: () => void) => () => void;
}

const BulkStatusJobContext = createContext<BulkStatusJobContextType | undefined>(
  undefined
);

export function BulkStatusJobProvider({ children }: { children: ReactNode }) {
  const { showSnackbar } = useSnackbar();
  const [jobId, setJobId] = useState<string | null>(null);
  const [targetStatus, setTargetStatus] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [job, setJob] = useState<BulkStatusJobData | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isJobFinished, setIsJobFinished] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const completedRef = useRef(false);
  const completeListenersRef = useRef(new Set<() => void>());

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const notifyCompleteListeners = useCallback(() => {
    completeListenersRef.current.forEach((listener) => listener());
  }, []);

  const handleJobFinished = useCallback(
    async (jobData: BulkStatusJobData) => {
      if (jobData.status === "completed") {
        showSnackbar(
          `Successfully updated ${jobData.successful} order(s).`,
          "success"
        );
      } else if (jobData.status === "partial_failed") {
        showSnackbar(
          `Updated ${jobData.successful} order(s). ${jobData.failed} failed.`,
          "warning"
        );
      } else {
        showSnackbar("Bulk status update failed.", "error");
      }

      await mutate(
        (key) => Array.isArray(key) && key[0] === "orderList",
        undefined,
        { revalidate: true }
      );

      notifyCompleteListeners();

      setJobId(null);
      setDialogOpen(false);
      clearStoredBulkStatusJobId();
    },
    [notifyCompleteListeners, showSnackbar]
  );

  const startJob = useCallback((id: string, status?: string) => {
    completedRef.current = false;
    setJob(null);
    setPollError(null);
    setIsJobFinished(false);
    setJobId(id);
    setTargetStatus(status);
    setDialogOpen(true);
    storeBulkStatusJobId(id);
  }, []);

  const hideDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const registerCompleteListener = useCallback((listener: () => void) => {
    completeListenersRef.current.add(listener);
    return () => {
      completeListenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    const storedJobId = getStoredBulkStatusJobId();
    if (storedJobId) {
      startJob(storedJobId);
    }
  }, [startJob]);

  useEffect(() => {
    if (!jobId) {
      stopPolling();
      return;
    }

    let cancelled = false;
    completedRef.current = false;
    pollInFlightRef.current = false;

    const pollOnce = async () => {
      if (cancelled || completedRef.current || pollInFlightRef.current || !jobId) {
        return;
      }

      pollInFlightRef.current = true;

      try {
        const response = await getBulkStatusJob(jobId);

        if (cancelled || completedRef.current) {
          return;
        }

        if (!response?.success || !response.data) {
          throw new Error(response?.message || "Failed to fetch job status");
        }

        setJob(response.data);
        setPollError(null);

        const isFinished =
          isTerminalBulkStatusJob(response.data.status) ||
          response.data.progress_percent >= 100;

        if (isFinished && !completedRef.current) {
          completedRef.current = true;
          setIsJobFinished(true);
          stopPolling();
          clearStoredBulkStatusJobId();
          await handleJobFinished(response.data);
        }
      } catch (error: unknown) {
        if (cancelled || completedRef.current) {
          return;
        }

        const err = error as { message?: string; status?: number };
        const message =
          err?.status === 404
            ? "Bulk update job not found. It may have expired."
            : err?.message || "Failed to check job status. Please try again.";

        setPollError(message);
        completedRef.current = true;
        setIsJobFinished(true);
        stopPolling();
        clearStoredBulkStatusJobId();
        setJobId(null);
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void pollOnce();
    pollingRef.current = setInterval(() => {
      void pollOnce();
    }, BULK_STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      stopPolling();
      pollInFlightRef.current = false;
    };
  }, [jobId, handleJobFinished, stopPolling]);

  const isProcessing =
    !!jobId &&
    !pollError &&
    !isJobFinished &&
    (!job || !isTerminalBulkStatusJob(job.status));

  const handleDialogClose = useCallback(() => {
    if (isProcessing) {
      hideDialog();
      return;
    }
    stopPolling();
    setJobId(null);
    setJob(null);
    setPollError(null);
    clearStoredBulkStatusJobId();
    setDialogOpen(false);
  }, [hideDialog, isProcessing, stopPolling]);

  return (
    <BulkStatusJobContext.Provider
      value={{ startJob, hideDialog, registerCompleteListener }}
    >
      {children}
      <BulkStatusProgressDialog
        open={dialogOpen}
        job={job}
        pollError={pollError}
        targetStatus={targetStatus}
        isProcessing={isProcessing}
        onDismiss={hideDialog}
        onClose={handleDialogClose}
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
