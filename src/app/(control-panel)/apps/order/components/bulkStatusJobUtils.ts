import {
  BulkStatusActiveOrderItem,
  BulkStatusJobClientMeta,
  BulkStatusJobData,
  BulkStatusJobStatus,
  isTerminalBulkStatusJob,
} from "@/services/apiOrder";
import { formatStatusText } from "@/utils/actions";
import dayjs from "dayjs";

export interface BulkJobState {
  meta: BulkStatusJobClientMeta;
  pollData: BulkStatusJobData | null;
  pollError: string | null;
  isFinished: boolean;
  /** Set when job left active list without a detail fetch — resolved when drawer opens */
  needsDetailFetch?: boolean;
}

export const statusChipColor = (
  status: BulkStatusJobStatus
): "default" | "info" | "success" | "warning" | "error" => {
  switch (status) {
    case "completed":
      return "success";
    case "partial_failed":
      return "warning";
    case "failed":
    case "cancelled":
      return "error";
    case "processing":
      return "info";
    default:
      return "default";
  }
};

export const itemStatusChipColor = (
  status: string
): "default" | "info" | "success" | "warning" | "error" => {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "processing":
      return "info";
    case "skipped":
      return "warning";
    default:
      return "default";
  }
};

export const formatItemStatus = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Orders in an active bulk job cannot be selected for another batch. */
export const isOrderBulkSelectionLocked = (
  item: BulkStatusActiveOrderItem | undefined
) =>
  item?.item_status === "queued" || item?.item_status === "processing";

export const formatJobStatus = (status: BulkStatusJobStatus) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const shortJobId = (jobId: string) => jobId;

export const formatBulkJobLabel = (job: BulkJobState) => {
  const target =
    job.meta.targetStatus
      ? formatStatusText(job.meta.targetStatus)
      : job.pollData?.target_status
        ? formatStatusText(job.pollData.target_status)
        : "Bulk update";
  const count =
    job.meta.orderIds.length ||
    job.pollData?.order_count ||
    job.pollData?.total ||
    0;
  const time = dayjs(job.meta.startedAt).format("h:mm A");
  return `${target} · ${count} order${count === 1 ? "" : "s"} · ${time}`;
};

export const isJobActive = (job: BulkJobState) =>
  !job.isFinished &&
  !job.pollError &&
  (!job.pollData || !isTerminalBulkStatusJob(job.pollData.status));

export const getJobDisplayStatus = (job: BulkJobState): BulkStatusJobStatus => {
  if (job.pollError) return "failed";
  if (job.pollData?.status) return job.pollData.status;
  return "queued";
};

export const getJobProgressPercent = (job: BulkJobState) =>
  job.pollData?.progress_percent ?? 0;

export const getJobProgressKey = (job: BulkJobState) => {
  if (!job.pollData) return "pending";
  const { successful, failed, skipped, pending, progress_percent, status } =
    job.pollData;
  return `${status}-${successful}-${failed}-${skipped}-${pending}-${progress_percent}`;
};
