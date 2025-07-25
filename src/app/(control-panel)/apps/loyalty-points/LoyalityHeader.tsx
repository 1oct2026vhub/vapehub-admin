"use client";

import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PageBreadcrumb from "src/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";

interface LoyaltyHeaderProps {
  queryParams?: Record<string, any>;
  refreshData?: () => void;
  showCreateButton?: boolean;
}

function LoyaltyHeader({ queryParams = {}, refreshData, showCreateButton = true }: LoyaltyHeaderProps) {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));

  return (
    <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        <div>
          <PageBreadcrumb className="mb-2" />
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            Loyalty Points Settings
          </Typography>
        </div>
      </motion.span>

      <div className="flex flex-1 items-center justify-end space-x-2">
        <motion.div
          className="flex grow-0 gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
        >
          {showCreateButton && (
            <AppButton
              label={
                <>
                  <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
                  <span className="">Create</span>
                </>
              }
              type="submit"
              className=""
              variant="contained"
              component={NavLinkAdapter}
                to="/apps/loyalty-points/loyalty-point-new"
              size={isMobile ? "small" : "medium"}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default LoyaltyHeader; 