"use client";

import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  BulkStatusJobData,
  isTerminalBulkStatusJob,
} from "@/services/apiOrder";
import { formatStatusText } from "@/utils/actions";
import BulkStatusJobOrdersSection from "./BulkStatusJobOrdersSection";
import {
  BulkJobState,
  formatJobStatus,
  getJobDisplayStatus,
  getJobProgressPercent,
  isJobActive,
  shortJobId,
  statusChipColor,
} from "./bulkStatusJobUtils";

const MAX_ERRORS_SHOWN = 50;

interface BulkStatusJobDetailPanelProps {
  job: BulkJobState;
  ordersFetchEnabled?: boolean;
}

const BulkStatusJobDetailPanel = ({
  job,
  ordersFetchEnabled = true,
}: BulkStatusJobDetailPanelProps) => {
  const { meta, pollData, pollError } = job;
  const isProcessing = isJobActive(job);
  const displayStatus = getJobDisplayStatus(job);
  const progress = getJobProgressPercent(job);
  const targetStatus = meta.targetStatus || pollData?.target_status;
  const orderCount =
    meta.orderIds.length || pollData?.order_count || pollData?.total || 0;
  const errors = (pollData?.errors ?? []).slice(0, MAX_ERRORS_SHOWN);
  const hiddenErrorCount = Math.max(
    0,
    (pollData?.errors?.length ?? 0) - MAX_ERRORS_SHOWN
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Job:
        </Typography>
        <Typography variant="body2" fontWeight="medium" fontFamily="monospace">
          #{shortJobId(meta.jobId)}
        </Typography>
        {(meta.jobKey || pollData?.job_key) && (
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {meta.jobKey || pollData?.job_key}
          </Typography>
        )}
        {targetStatus && (
          <Chip
            size="small"
            label={`→ ${formatStatusText(targetStatus)}`}
            variant="outlined"
          />
        )}
      </Box>

      {isProcessing && (
        <Alert severity="info">
          Update running in the background. You can close this drawer and
          continue working.
        </Alert>
      )}

      {targetStatus === "packed" && (
        <Alert severity="info">
          Queued — ShipStation orders created without labels in bulk.
        </Alert>
      )}

      {isProcessing && (
        <Alert severity="info">May take several minutes (~2 sec/order).</Alert>
      )}

      {pollError && <Alert severity="error">{pollError}</Alert>}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          Status:
        </Typography>
        <Chip
          size="small"
          label={formatJobStatus(displayStatus)}
          color={statusChipColor(displayStatus)}
        />
        <Typography variant="caption" color="text.secondary">
          {orderCount} order{orderCount === 1 ? "" : "s"} in batch
        </Typography>
      </Box>

      {pollData ? (
        <>
          <ProgressSection pollData={pollData} progress={progress} />

          {isTerminalBulkStatusJob(pollData.status) && (
            <CompletionAlert pollData={pollData} />
          )}

          {errors.length > 0 && (
            <FailedOrdersList
              errors={errors}
              totalCount={pollData.errors?.length ?? errors.length}
              hiddenErrorCount={hiddenErrorCount}
            />
          )}
        </>
      ) : !pollError ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Starting bulk update job…
          </Typography>
          <LinearProgress />
        </Box>
      ) : null}

      <BulkStatusJobOrdersSection job={job} fetchEnabled={ordersFetchEnabled} />
    </Box>
  );
};

function ProgressSection({
  pollData,
  progress,
}: {
  pollData: BulkStatusJobData;
  progress: number;
}) {
  return (
    <>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, progress))}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
          gap: 1,
        }}
      >
        <Stat label="Successful" value={pollData.successful} />
        <Stat label="Failed" value={pollData.failed} />
        <Stat label="Skipped" value={pollData.skipped} />
        <Stat label="Pending" value={pollData.pending} />
      </Box>
    </>
  );
}

function CompletionAlert({ pollData }: { pollData: BulkStatusJobData }) {
  return (
    <Alert
      severity={
        pollData.status === "completed"
          ? "success"
          : pollData.status === "partial_failed"
            ? "warning"
            : "error"
      }
    >
      {pollData.status === "completed" &&
        `All ${pollData.successful} order(s) updated successfully.`}
      {pollData.status === "partial_failed" &&
        `Completed with ${pollData.failed} failure(s) out of ${(pollData.successful ?? 0) + (pollData.failed ?? 0) + (pollData.skipped ?? 0)} processed.`}
      {pollData.status === "failed" && "Bulk update failed."}
      {pollData.status === "cancelled" && "Bulk update was cancelled."}
    </Alert>
  );
}

function FailedOrdersList({
  errors,
  totalCount,
  hiddenErrorCount,
}: {
  errors: NonNullable<BulkStatusJobData["errors"]>;
  totalCount: number;
  hiddenErrorCount: number;
}) {
  return (
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
          Failed Orders ({totalCount})
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
  );
}

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

export default BulkStatusJobDetailPanel;
