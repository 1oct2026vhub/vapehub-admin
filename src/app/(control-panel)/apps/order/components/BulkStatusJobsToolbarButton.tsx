"use client";

import { Badge, Box } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import { useBulkStatusJob } from "@/contexts/BulkStatusJobContext";

const BulkStatusJobsToolbarButton = () => {
  const { jobs, activeJobCount, openDrawer } = useBulkStatusJob();

  if (jobs.length === 0) return null;

  return (
    <Badge badgeContent={activeJobCount} color="primary" invisible={activeJobCount === 0}>
      <Box>
        <AppButton
          label="Bulk Updates"
          variant="outlined"
          onClick={() => openDrawer()}
        />
      </Box>
    </Badge>
  );
};

export default BulkStatusJobsToolbarButton;
