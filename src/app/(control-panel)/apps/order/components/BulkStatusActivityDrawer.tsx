"use client";

import {
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import AppButton from "@/components/Shared/AppButton";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import BulkStatusJobDetailPanel from "./BulkStatusJobDetailPanel";
import {
  BulkJobState,
  formatBulkJobLabel,
  formatJobStatus,
  getJobDisplayStatus,
  getJobProgressPercent,
  isJobActive,
  shortJobId,
  statusChipColor,
} from "./bulkStatusJobUtils";
import { isTerminalBulkStatusJob } from "@/services/apiOrder";

dayjs.extend(relativeTime);

interface BulkStatusActivityDrawerProps {
  open: boolean;
  onClose: () => void;
  jobs: BulkJobState[];
  selectedJob: BulkJobState | null;
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  onDismissJob: (jobId: string) => void;
}

const BulkStatusActivityDrawer = ({
  open,
  onClose,
  jobs,
  selectedJob,
  selectedJobId,
  onSelectJob,
  onDismissJob,
}: BulkStatusActivityDrawerProps) => {
  const activeCount = jobs.filter(isJobActive).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
      <Box
        sx={{
          width: { xs: "100vw", sm: 720 },
          maxWidth: "100vw",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" fontWeight="medium">
              Bulk Updates
            </Typography>
            {activeCount > 0 && (
              <Badge badgeContent={activeCount} color="primary" />
            )}
          </Box>
          <IconButton aria-label="Close" onClick={onClose} size="small">
            <FuseSvgIcon>heroicons-outline:x-mark</FuseSvgIcon>
          </IconButton>
        </Box>

        {jobs.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No bulk status updates yet. Select orders and use Update Status to
              start a batch.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
            <Box
              sx={{
                width: 280,
                flexShrink: 0,
                borderRight: "1px solid",
                borderColor: "divider",
                overflow: "auto",
                display: { xs: selectedJobId ? "none" : "block", sm: "block" },
              }}
            >
              <List disablePadding>
                {jobs.map((job) => (
                  <JobListItem
                    key={job.meta.jobId}
                    job={job}
                    selected={job.meta.jobId === selectedJobId}
                    onSelect={() => onSelectJob(job.meta.jobId)}
                  />
                ))}
              </List>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
              }}
            >
              {selectedJob ? (
                <>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      display: { xs: "flex", sm: "none" },
                      alignItems: "center",
                      gap: 1,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => onSelectJob(null)}
                      aria-label="Back to job list"
                    >
                      <FuseSvgIcon>heroicons-outline:arrow-left</FuseSvgIcon>
                    </IconButton>
                    <Typography variant="subtitle2" noWrap>
                      {formatBulkJobLabel(selectedJob)}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, flex: 1 }}>
                    <BulkStatusJobDetailPanel
                      job={selectedJob}
                      ordersFetchEnabled={open}
                    />
                  </Box>

                  <Divider />
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    {isJobTerminal(selectedJob) && (
                      <AppButton
                        label="Remove from list"
                        variant="outlined"
                        onClick={() => onDismissJob(selectedJob.meta.jobId)}
                      />
                    )}
                    <AppButton
                      label={isJobActive(selectedJob) ? "Run in background" : "Close"}
                      variant="contained"
                      onClick={onClose}
                    />
                  </Box>
                </>
              ) : (
                <Box sx={{ p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Select a batch to view details.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

function isJobTerminal(job: BulkJobState) {
  return (
    job.isFinished ||
    !!job.pollError ||
    (job.pollData !== null && isTerminalBulkStatusJob(job.pollData.status))
  );
}

function JobListItem({
  job,
  selected,
  onSelect,
}: {
  job: BulkJobState;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayStatus = getJobDisplayStatus(job);
  const progress = getJobProgressPercent(job);
  const active = isJobActive(job);

  return (
    <ListItemButton selected={selected} onClick={onSelect} alignItems="flex-start">
      <ListItemText
        primary={
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {formatBulkJobLabel(job)}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
              #{shortJobId(job.meta.jobId)}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Chip
              size="small"
              label={formatJobStatus(displayStatus)}
              color={statusChipColor(displayStatus)}
              sx={{ alignSelf: "flex-start" }}
            />
            {active ? (
              <LinearProgress
                variant="determinate"
                value={Math.min(100, Math.max(0, progress))}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {dayjs(job.meta.startedAt).fromNow()}
              </Typography>
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
}

export default BulkStatusActivityDrawer;
