import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AppButton from "@/components/Shared/AppButton";
import {
  downloadSampleExcel,
  bulkUpdateVariant,
} from "@/services/apiProductVariant";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useRef, useState } from "react";
import PageBreadcrumb from "src/components/PageBreadcrumb";

// Add props interface
interface VariantHeaderProps {
  refreshData?: () => void;
}

/**
 * The products header.
 */
const VariantHeader = ({ refreshData }: VariantHeaderProps) => {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      showSnackbar("Failed to download sample Excel file", "error");
    }
    handleMenuClose();
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
    handleMenuClose();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is Excel
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type)) {
      showSnackbar("Please upload an Excel file (.xls or .xlsx)", "error");
      return;
    }

    setIsUploading(true);
    try {
      await bulkUpdateVariant(file);
      showSnackbar("Variant updated successfully", "success");

      // Refresh data after successful upload
      if (refreshData) {
        setTimeout(() => {
          refreshData(); // Call with a slight delay to ensure server has processed the data
        }, 500);
      }
    } catch (error) {
      showSnackbar("Failed to update Variant", "error");
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        <div>
          <PageBreadcrumb className="mb-2" />
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xls,.xlsx"
            style={{ display: "none" }}
          />

          <AppButton
            label={
              <>
                <span className="w-full">Bulk Update</span>
              </>
            }
            variant="outlined"
            size={isMobile ? "small" : "medium"}
            onClick={handleMenuClick}
            loading={isUploading}
            disabled={isUploading}
          />

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem onClick={handleFileUploadClick}>
              <ListItemIcon>
                <FuseSvgIcon size={20}>
                  heroicons-outline:arrow-up-on-square
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText>Upload Excel File</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDownloadSample}>
              <ListItemIcon>
                <FuseSvgIcon size={20}>
                  heroicons-outline:arrow-down-tray
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText>Download Sample Excel</ListItemText>
            </MenuItem>
          </Menu>

          {/* <AppButton
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
          /> */}
        </motion.div>
      </div>
    </div>
  );
};

export default VariantHeader;
