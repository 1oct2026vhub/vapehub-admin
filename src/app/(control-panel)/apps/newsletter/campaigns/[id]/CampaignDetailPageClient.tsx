"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getPromotionalCampaignById } from "@/services/apiMailSubscriptionSettings";

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
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
};

function toCampaignDetail(value: unknown): CampaignDetail | null {
  if (!value || typeof value !== "object") return null;
  return value as CampaignDetail;
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatLabel(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function CampaignDetailPageClient({ campaignId }: CampaignDetailPageClientProps) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getPromotionalCampaignById(campaignId);
        if (res.success) {
          setCampaign(toCampaignDetail(res.data));
        } else {
          setCampaign(null);
          showSnackbar(res.message ?? "Failed to load campaign details.", "error");
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: unknown }).message)
            : "Failed to load campaign details.";
        showSnackbar(msg, "error");
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId, showSnackbar]);

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
                    color={
                      String(campaign.status || "").toLowerCase() === "completed"
                        ? "success"
                        : String(campaign.status || "").toLowerCase() === "failed"
                          ? "error"
                          : "warning"
                    }
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${campaign.progress?.percent ?? 0}%`}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>

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
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Chunks
                  </Typography>
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
                      <strong>Failed:</strong> {campaign.chunkBreakdown?.failed ?? 0}
                    </Typography>
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
                  <strong>Group ID:</strong> {campaign.audienceMeta?.groupId ?? "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Frequency:</strong> {campaign.audienceMeta?.frequency ?? "-"}
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
                  <strong>Created:</strong> {formatDateTime(campaign.createdAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Started:</strong> {formatDateTime(campaign.startedAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Finished:</strong> {formatDateTime(campaign.finishedAt)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
