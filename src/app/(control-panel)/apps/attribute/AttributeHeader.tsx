import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PageBreadcrumb from "src/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import {
  downloadSampleExcel,
  bulkUpdateAttribute,
} from "@/services/apiAttribute";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useRef } from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Define the bulk update response interface
interface BulkUpdateResult {
  slug: string;
  name: string;
  status: "Created" | "Updated" | "Unchanged" | "Error";
  id?: number;
  message?: string;
}

interface BulkUpdateResponse {
  success: boolean;
  message: string;
  data: {
    summary?: {
      total: number;
      created: number;
      updated: number;
      unchanged: number;
      errors: number;
      skipped: number;
    };
    results: BulkUpdateResult[];
  };
}

// Add props interface
interface AttributeHeaderProps {
  refreshData?: () => void;
}

/**
 * The products header.
 */
function AttributeHeader({ refreshData }: AttributeHeaderProps) {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUpdateResponse | null>(
    null
  );
  const [openResultDialog, setOpenResultDialog] = useState(false);

  const { showSnackbar } = useSnackbar();

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleResultDialogClose = () => {
    setOpenResultDialog(false);
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
      const response = await bulkUpdateAttribute(file);

      // Handle the response
      if (response && response.data && response.data.results) {
        setUploadResult(response as BulkUpdateResponse);
        setOpenResultDialog(true);

        // Show success message
        const results = response.data.results;
        const created = results.filter((r) => r.status === "Created").length;
        const updated = results.filter((r) => r.status === "Updated").length;
        const errors = results.filter((r) => r.status === "Error").length;

        const successMessage = `Upload completed: ${created} created, ${updated} updated, ${errors} errors`;
        showSnackbar(successMessage, "success");
      } else {
        // Handle case where response is missing expected structure
        showSnackbar("Invalid response format received from server", "error");
        console.error("Invalid response format:", response);
      }

      // Refresh data after successful upload
      if (refreshData) {
        setTimeout(() => {
          refreshData(); // Call with a slight delay to ensure server has processed the data
        }, 500);
      }
    } catch (error) {
      console.error("Bulk update error:", error);
      showSnackbar("Failed to update attribute", "error");
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper function to get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Created":
        return "success";
      case "Updated":
        return "info";
      case "Unchanged":
        return "default";
      case "Error":
        return "error";
      default:
        return "default";
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
            Attributes
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
                <span className="w-full">Bulk Upload</span>
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
            <MenuItem onClick={handleFileUploadClick} disabled={isUploading}>
              <ListItemIcon>
                <FuseSvgIcon size={20}>
                  heroicons-outline:arrow-up-on-square
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText>Upload Excel File</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDownloadSample} disabled={isUploading}>
              <ListItemIcon>
                <FuseSvgIcon size={20}>
                  heroicons-outline:arrow-down-tray
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText>Download Sample Excel</ListItemText>
            </MenuItem>
          </Menu>
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
            to="/apps/attribute/create-attribute"
            size={isMobile ? "small" : "medium"}
          />
        </motion.div>
      </div>

      {/* Results Dialog */}
      <Dialog
        open={openResultDialog}
        onClose={handleResultDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" component="div">
            Bulk Update Results
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleResultDialogClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {uploadResult && uploadResult.data && uploadResult.data.results ? (
            <Box sx={{ maxWidth: "100%" }}>
              {/* Summary Section */}
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Summary
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  {uploadResult.data.summary ? (
                    <>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="h6">
                          {uploadResult.data.summary.total}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {uploadResult.data.summary.created}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Updated
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {uploadResult.data.summary.updated}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Unchanged
                        </Typography>
                        <Typography variant="h6">
                          {uploadResult.data.summary.unchanged}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Errors
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {uploadResult.data.summary.errors}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="h6">
                          {uploadResult.data.results.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {
                            uploadResult.data.results.filter(
                              (r) => r.status === "Created"
                            ).length
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Updated
                        </Typography>
                        <Typography variant="h6" color="info.main">
                          {
                            uploadResult.data.results.filter(
                              (r) => r.status === "Updated"
                            ).length
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Unchanged
                        </Typography>
                        <Typography variant="h6">
                          {
                            uploadResult.data.results.filter(
                              (r) => r.status === "Unchanged"
                            ).length
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Errors
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {
                            uploadResult.data.results.filter(
                              (r) => r.status === "Error"
                            ).length
                          }
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>

              {/* Results Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="bulk update results table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      {/* <TableCell>Slug</TableCell> */}
                      <TableCell>Status</TableCell>
                      {uploadResult.data.results.some(
                        (result) => result.status === "Error"
                      ) && <TableCell>Message</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadResult.data.results &&
                      uploadResult.data.results.map((result, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {result.name}
                          </TableCell>
                          {/* <TableCell>{result.slug}</TableCell> */}
                          <TableCell>
                            <Chip
                              label={result.status}
                              color={getStatusColor(result.status) as any}
                              size="small"
                            />
                          </TableCell>
                          {uploadResult.data.results.some(
                            (result) => result.status === "Error"
                          ) && (
                            <TableCell>
                              {result.status === "Error" && result.message ? (
                                <Typography variant="body2" color="error">
                                  {result.message}
                                </Typography>
                              ) : (
                                result.id && `ID: ${result.id}`
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box p={2} textAlign="center">
              <Typography variant="body1">
                No data available or invalid response format.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <AppButton
            label="OK"
            variant="contained"
            onClick={handleResultDialogClose}
          />
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AttributeHeader;
