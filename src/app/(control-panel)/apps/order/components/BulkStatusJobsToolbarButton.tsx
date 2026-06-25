"use client";

import { Badge, Box } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import { useBulkStatusJob } from "@/contexts/BulkStatusJobContext";

const BulkStatusJobsToolbarButton = () => {
  const { activeJobCount, openDrawer } = useBulkStatusJob();

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
