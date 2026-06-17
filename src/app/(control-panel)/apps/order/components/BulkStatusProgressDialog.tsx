"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import {
  BulkStatusJobData,
  BulkStatusJobStatus,
  BULK_STATUS_POLL_INTERVAL_MS,
  clearStoredBulkStatusJobId,
  getBulkStatusJob,
  isTerminalBulkStatusJob,
  storeBulkStatusJobId,
} from "@/services/apiOrder";

const MAX_ERRORS_SHOWN = 50;

interface BulkStatusProgressDialogProps {
  open: boolean;
  jobId: string | null;
  targetStatus?: string;
  onClose: () => void;
  onComplete: (job: BulkStatusJobData) => void;
}

const statusChipColor = (
  status: BulkStatusJobStatus
): "default" | "info" | "success" | "warning" | "error" => {
  switch (status) {
    case "completed":
      return "success";
    case "partial_failed":
      return "warning";
    case "failed":
      return "error";
    case "processing":
      return "info";
    default:
      return "default";
  }
};

const formatJobStatus = (status: BulkStatusJobStatus) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const BulkStatusProgressDialog = ({
  open,
  jobId,
  targetStatus,
  onClose,
  onComplete,
}: BulkStatusProgressDialogProps) => {
  const [job, setJob] = useState<BulkStatusJobData | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isJobFinished, setIsJobFinished] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open || !jobId) {
      stopPolling();
      return;
    }

    let cancelled = false;
    completedRef.current = false;
    pollInFlightRef.current = false;
    setIsJobFinished(false);
    setJob(null);
    setPollError(null);
    storeBulkStatusJobId(jobId);

    const pollOnce = async () => {
      if (cancelled || completedRef.current || pollInFlightRef.current) {
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
          onCompleteRef.current(response.data);
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
  }, [open, jobId, stopPolling]);

  const isProcessing =
    open &&
    !!jobId &&
    !pollError &&
    !isJobFinished &&
    (!job || !isTerminalBulkStatusJob(job.status));
  const errors = (job?.errors ?? []).slice(0, MAX_ERRORS_SHOWN);
  const hiddenErrorCount = Math.max(0, (job?.errors?.length ?? 0) - MAX_ERRORS_SHOWN);

  const handleClose = () => {
    if (isProcessing) return;
    stopPolling();
    onClose();
  };

  const handleDismiss = () => {
    stopPolling();
    clearStoredBulkStatusJobId();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
        Bulk Status Update Progress
        <IconButton
          aria-label="Close"
          onClick={handleDismiss}
          size="small"
          edge="end"
        >
          <FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {targetStatus === "packed" && (
            <Alert severity="info">
              Queued — ShipStation orders created without labels in bulk.
            </Alert>
          )}

          {isProcessing && (
            <Alert severity="info">
              May take several minutes (~2 sec/order).
            </Alert>
          )}

          {pollError && <Alert severity="error">{pollError}</Alert>}

          {job && (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  size="small"
                  label={formatJobStatus(job.status)}
                  color={statusChipColor(job.status)}
                />
              </Box>

              <Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {job.progress_percent ?? 0}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, job.progress_percent ?? 0))}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: 1,
                }}
              >
                <Stat label="Successful" value={job.successful} />
                <Stat label="Failed" value={job.failed} />
                <Stat label="Skipped" value={job.skipped} />
                <Stat label="Pending" value={job.pending} />
              </Box>

              {isTerminalBulkStatusJob(job.status) && (
                <Alert
                  severity={
                    job.status === "completed"
                      ? "success"
                      : job.status === "partial_failed"
                        ? "warning"
                        : "error"
                  }
                >
                  {job.status === "completed" &&
                    `All ${job.successful} order(s) updated successfully.`}
                  {job.status === "partial_failed" &&
                    `Completed with ${job.failed} failure(s) out of ${(job.successful ?? 0) + (job.failed ?? 0) + (job.skipped ?? 0)} processed.`}
                  {job.status === "failed" && "Bulk update failed."}
                </Alert>
              )}

              {errors.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    maxHeight: 240,
                    overflow: "auto",
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight="medium">
                      Failed Orders ({job.errors?.length ?? errors.length})
                    </Typography>
                  </Box>
                  <List dense disablePadding>
                    {errors.map((err) => (
                      <ListItem key={`${err.order_id}-${err.order_unique_id}`} divider>
                        <ListItemText
                          primary={err.order_unique_id || `Order #${err.order_id}`}
                          secondary={err.error}
                          primaryTypographyProps={{ fontWeight: 500, variant: "body2" }}
                          secondaryTypographyProps={{ variant: "caption" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  {hiddenErrorCount > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", p: 1.5 }}
                    >
                      +{hiddenErrorCount} more error(s) not shown
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}

          {!job && !pollError && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Starting bulk update job…
              </Typography>
              <LinearProgress />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <AppButton
          label={isProcessing ? "Processing…" : "Close"}
          variant="outlined"
          onClick={handleClose}
          disabled={isProcessing}
        />
      </DialogActions>
    </Dialog>
  );
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ textAlign: "center", p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
      <Typography variant="h6" fontWeight="medium">
        {value ?? 0}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default BulkStatusProgressDialog;
