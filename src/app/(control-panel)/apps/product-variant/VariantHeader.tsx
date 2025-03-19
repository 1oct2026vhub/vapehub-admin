import { Box, Button, Typography } from "@mui/material";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AppButton from "@/components/Shared/AppButton";
import { downloadSampleExcel } from "@/services/apiProductVariant";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState } from "react";

/**
 * The products header.
 */
const VariantHeader = () => {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { showSnackbar } = useSnackbar();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadSample = async () => {
    try {
      await downloadSampleExcel();
      showSnackbar("Sample Excel file downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading sample:", error);
      showSnackbar("Failed to download sample file", "error");
    }
    handleMenuClose();
  };

  return (
    // <Box className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-8 px-24 md:px-32">
    //     <Typography
    //         component="h1"
    //         className="text-3xl md:text-4xl font-semibold tracking-tight leading-7 md:leading-snug"
    //     >
    //         Product Variants
    //     </Typography>

    //     <Box className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 items-center justify-end space-x-8">
    //         <AppButton
    //             label={
    //                 <>
    //                     <FuseSvgIcon size={20}>heroicons-outline:arrow-down-tray</FuseSvgIcon>
    //                     <span className="w-full">Download</span>
    //                 </>
    //             }
    //             onClick={handleDownloadSample}
    //             variant="outlined"
    //             size={isMobile ? 'small' : 'medium'}
    //         />

    //         <AppButton
    //             label={
    //                 <>
    //                     <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
    //                     <span className="">Create</span>
    //                 </>
    //             }
    //             type="submit"
    //             // color="secondary"
    //             // fullWidth
    //             className=""
    //             variant="contained"
    //             component={NavLinkAdapter}
    //             to="/apps/product-brand/create-brand"
    //             size={isMobile ? 'small' : 'medium'}
    //         />
    //     </Box>
    // </Box>

    <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        <div>
          {/* <PageBreadcrumb className="mb-2" /> */}
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            Product Variant
          </Typography>
        </div>
      </motion.span>

      <div className="flex flex-1 items-center justify-end space-x-2">
        <motion.div
          className="flex grow-0 gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
        >
          <AppButton
            label={
              <>
                {/* <FuseSvgIcon size={20}>heroicons-outline:arrow-down-tray</FuseSvgIcon> */}
                <span className="w-full">Download</span>
              </>
            }
            onClick={handleDownloadSample}
            variant="outlined"
            size={isMobile ? "small" : "medium"}
          />

          <AppButton
            label={
              <>
                <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
                <span className="">Add</span>
              </>
            }
            type="submit"
            // color="secondary"
            // fullWidth
            className=""
            variant="contained"
            component={NavLinkAdapter}
            // to="/apps/product-brand/create-brand"
            size={isMobile ? "small" : "medium"}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default VariantHeader;
