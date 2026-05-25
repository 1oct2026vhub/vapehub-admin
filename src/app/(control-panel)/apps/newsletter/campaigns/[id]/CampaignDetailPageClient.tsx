"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  getPromotionalCampaignById,
  requeuePromotionalCampaignChunks,
} from "@/services/apiMailSubscriptionSettings";
import { formatDate } from "@/utils/actions";

const POLL_INTERVAL_MS = 5000;
const STALL_HINT_MS = 60_000;

type CampaignDetailPageClientProps = {
  campaignId: string;
};

type CampaignDetail = {
  campaignId?: number | string;
  campaignKey?: string;
  subject?: string;
  status?: string;
  deliveryMode?: string;
  audienceType?: string;
  audienceMeta?: {
    groupId?: string | number | null;
    frequency?: string | null;
    sendToAll?: boolean;
    selectedEmailsCount?: number;
  };
  groupName?: string | null;
  totalRecipients?: number;
  sentCount?: number;
  failedCount?: number;
  chunksTotal?: number;
  chunksDone?: number;
  chunkBreakdown?: {
    pending?: number;
    processing?: number;
    done?: number;
    failed?: number;
  };
  progress?: {
    percent?: number;
    isFinal?: boolean;
    isInFlight?: boolean;
  };
  errorSummary?: Array<{ count?: number; message?: string }>;
  failedEmailsSample?: string[];
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
};

type RequeueMode = "cron_recovered" | "all_pending";

function toCampaignDetail(value: unknown): CampaignDetail | null {
  if (!value || typeof value !== "object") return null;
  return value as CampaignDetail;
}

function formatLabel(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function showRequeueButton(data: CampaignDetail): boolean {
  if (data.deliveryMode !== "async_sqs") return false;
  if (data.progress?.isFinal) return false;
  if (!data.progress?.isInFlight) return false;
  if ((data.chunkBreakdown?.pending ?? 0) <= 0) return false;
  if ((data.chunksDone ?? 0) >= (data.chunksTotal ?? 0)) return false;
  return true;
}

function canRequeueStrict(data: CampaignDetail): boolean {
  return showRequeueButton(data) && (data.chunkBreakdown?.processing ?? 0) === 0;
}

/** Failed/partial_failed terminal campaigns may still have pending chunks (e.g. SQS enqueue failed). */
function showRequeueFailedRecovery(data: CampaignDetail): boolean {
  if (data.deliveryMode !== "async_sqs") return false;
  if (!data.progress?.isFinal) return false;
  const status = String(data.status || "").toLowerCase();
  if (!["failed", "partial_failed"].includes(status)) return false;
  if ((data.chunkBreakdown?.pending ?? 0) <= 0) return false;
  if ((data.chunksDone ?? 0) >= (data.chunksTotal ?? 0)) return false;
  return (data.chunkBreakdown?.processing ?? 0) === 0;
}

function getStatusChipColor(status?: string): "success" | "error" | "warning" | "default" {
  switch (String(status || "").toLowerCase()) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "partial_failed":
      return "warning";
    default:
      return "warning";
  }
}

export default function CampaignDetailPageClient({ campaignId }: CampaignDetailPageClientProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [requeueDialogOpen, setRequeueDialogOpen] = useState(false);
  const [requeueMode, setRequeueMode] = useState<RequeueMode>("cron_recovered");
  const [requeueing, setRequeueing] = useState(false);
  const [showStallHint, setShowStallHint] = useState(false);

  const lastPercentRef = useRef<number | null>(null);
  const lastPercentChangeAtRef = useRef<number>(Date.now());

  const updateStallHint = useCallback((detail: CampaignDetail) => {
    const percent = detail.progress?.percent ?? 0;
    const pending = detail.chunkBreakdown?.pending ?? 0;
    const isInFlight = detail.progress?.isInFlight && !detail.progress?.isFinal;

    if (!isInFlight || pending <= 0) {
      setShowStallHint(false);
      lastPercentRef.current = percent;
      lastPercentChangeAtRef.current = Date.now();
      return;
    }

    if (lastPercentRef.current !== percent) {
      lastPercentRef.current = percent;
      lastPercentChangeAtRef.current = Date.now();
      setShowStallHint(false);
      return;
    }

    const elapsed = Date.now() - lastPercentChangeAtRef.current;
    setShowStallHint(elapsed >= STALL_HINT_MS);
  }, []);

  const fetchCampaign = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getPromotionalCampaignById(campaignId);
        if (res.success) {
          const detail = toCampaignDetail(res.data);
          setCampaign(detail);
          if (detail) updateStallHint(detail);
        } else {
          setCampaign(null);
          if (!silent) {
            showSnackbar(res.message ?? "Failed to load campaign details.", "error");
          }
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load campaign details.";
        if (!silent) {
          showSnackbar(msg, "error");
        }
        setCampaign(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [campaignId, showSnackbar, updateStallHint],
  );

  useEffect(() => {
    void fetchCampaign(false);
  }, [fetchCampaign]);

  useEffect(() => {
    const shouldPoll =
      campaign?.progress?.isInFlight === true && campaign?.progress?.isFinal !== true;

    if (!shouldPoll) return;

    const intervalId = window.setInterval(() => {
      void fetchCampaign(true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    campaign?.progress?.isInFlight,
    campaign?.progress?.isFinal,
    fetchCampaign,
  ]);

  const openRequeueDialog = (mode: RequeueMode) => {
    setRequeueMode(mode);
    setRequeueDialogOpen(true);
  };

  const handleRequeueConfirm = async () => {
    setRequeueing(true);
    try {
      const res = await requeuePromotionalCampaignChunks(campaignId, {
        scope: requeueMode,
      });

      if (!res.success) {
        showSnackbar(res.message ?? "Re-queue failed.", "error");
        return;
      }

      const { matched, enqueued } = res.data;

      if (matched === 0) {
        showSnackbar(
          requeueMode === "cron_recovered"
            ? "No cron-recovered pending chunks. Nothing to re-queue."
            : "No pending chunks matched. Nothing to re-queue.",
          "info",
        );
      } else {
        showSnackbar(
          `Re-queued ${enqueued} chunk(s). Processing will resume when the email worker is running.`,
          "success",
        );
      }

      setRequeueDialogOpen(false);
      await fetchCampaign(true);
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((e as { response: { data: { message: string } } }).response.data.message)
          : e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Re-queue failed.";
      showSnackbar(msg, "error");
    } finally {
      setRequeueing(false);
    }
  };

  const requeueInFlightVisible = campaign ? showRequeueButton(campaign) : false;
  const requeueFailedVisible = campaign ? showRequeueFailedRecovery(campaign) : false;
  const requeueVisible = requeueInFlightVisible || requeueFailedVisible;
  const requeueEnabled = campaign
    ? requeueFailedVisible || canRequeueStrict(campaign)
    : false;
  const progressPercent = campaign?.progress?.percent ?? 0;
  const isAsyncCampaign = campaign?.deliveryMode === "async_sqs";
  const pendingChunks = campaign?.chunkBreakdown?.pending ?? 0;
  const hasErrorSummary = (campaign?.errorSummary?.length ?? 0) > 0;

  return (
    <Box className="p-6">
      <PageBreadcrumb />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Campaign detail
        </Typography>
        <Button variant="outlined" onClick={() => router.push("/apps/newsletter/campaigns")}>
          Back to history
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : !campaign ? (
        <Typography color="text.secondary">No campaign detail found.</Typography>
      ) : (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between">
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {campaign.subject || "Untitled campaign"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Campaign ID: {campaign.campaignId ?? "-"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Campaign Key: {campaign.campaignKey || "-"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={formatLabel(campaign.status)}
                    color={getStatusChipColor(campaign.status)}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${progressPercent}%`}
                  />
                </Stack>
              </Stack>

              {isAsyncCampaign && campaign.progress?.isInFlight && !campaign.progress?.isFinal && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Send progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progressPercent}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progressPercent} />
                </Box>
              )}
            </CardContent>
          </Card>

          {showStallHint && requeueInFlightVisible && (
            <Alert severity="info">
              Chunks may have been reset by recovery; re-queue to retry sending.
            </Alert>
          )}

          {requeueFailedVisible && (
            <Alert severity="warning">
              This campaign ended as {formatLabel(campaign.status).toLowerCase()} with{" "}
              {pendingChunks} pending chunk{pendingChunks === 1 ? "" : "s"} left in the database.
              {hasErrorSummary
                ? " See errors below. Re-queue pending chunks to retry sending if the email worker and SQS are available."
                : " Re-queue pending chunks to retry sending if the email worker and SQS are available."}
            </Alert>
          )}

          {hasErrorSummary && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                  Errors
                </Typography>
                <Stack spacing={1}>
                  {campaign.errorSummary!.map((item, index) => (
                    <Typography key={index} variant="body2">
                      <strong>{item.count ?? 0}×</strong> {item.message || "Unknown error"}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Delivery
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Mode:</strong> {formatLabel(campaign.deliveryMode)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Audience:</strong> {formatLabel(campaign.audienceType)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Recipients:</strong> {campaign.totalRecipients ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Sent:</strong> {campaign.sentCount ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Failed:</strong> {campaign.failedCount ?? 0}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Chunks
                    </Typography>
                    {requeueVisible && (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!requeueEnabled || requeueing}
                        onClick={() =>
                          openRequeueDialog(
                            requeueFailedVisible ? "all_pending" : "cron_recovered",
                          )
                        }
                      >
                        {requeueFailedVisible
                          ? "Re-queue pending chunks"
                          : "Re-queue recovered chunks"}
                      </Button>
                    )}
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Total:</strong> {campaign.chunksTotal ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Done:</strong> {campaign.chunksDone ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pending:</strong> {campaign.chunkBreakdown?.pending ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Processing:</strong> {campaign.chunkBreakdown?.processing ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Completed chunks:</strong> {campaign.chunkBreakdown?.done ?? 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Failed:</strong> {campaign.chunkBreakdown?.failed ?? 0}
                    </Typography>
                    {requeueInFlightVisible &&
                      !requeueEnabled &&
                      (campaign.chunkBreakdown?.processing ?? 0) > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Re-queue is available when no chunks are actively processing.
                      </Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Audience metadata
              </Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 1, md: 3 }}
                divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />}
              >
                <Typography variant="body2">
                  <strong>Send to all:</strong> {campaign.audienceMeta?.sendToAll ? "Yes" : "No"}
                </Typography>
                <Typography variant="body2">
                  <strong>Selected emails:</strong> {campaign.audienceMeta?.selectedEmailsCount ?? 0}
                </Typography>
                <Typography variant="body2">
                  <strong>Group ID:</strong> {campaign.audienceMeta?.groupId ?? "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Group name:</strong> {campaign.groupName?.trim() ? campaign.groupName : "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Frequency:</strong> {campaign.audienceMeta?.frequency ?? "N/A"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Timeline
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Created:</strong> {campaign.createdAt ? formatDate(campaign.createdAt) : "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Started:</strong> {campaign.startedAt ? formatDate(campaign.startedAt) : "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Finished:</strong> {campaign.finishedAt ? formatDate(campaign.finishedAt) : "N/A"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <Dialog
        open={requeueDialogOpen}
        onClose={() => !requeueing && setRequeueDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {requeueMode === "all_pending"
            ? "Re-queue pending chunks?"
            : "Re-queue recovered chunks?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {requeueMode === "all_pending"
              ? "This will send all pending chunks for this campaign back to the email queue. Continue?"
              : "This will send pending chunks that were auto-recovered by the system back to the email queue. Continue?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRequeueDialogOpen(false)} disabled={requeueing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleRequeueConfirm()}
            disabled={requeueing}
            startIcon={requeueing ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {requeueing ? "Re-queuing…" : "Re-queue"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
