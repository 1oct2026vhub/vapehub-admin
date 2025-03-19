// import Typography from '@mui/material/Typography';
// import { motion } from 'motion/react';
// import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
// import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
// import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
// import PageBreadcrumb from 'src/components/PageBreadcrumb';
// import AppButton from '@/components/Shared/AppButton';
// import { downloadSampleExcel } from '@/services/apiProductBrand';
// import { useSnackbar } from '@/contexts/SnackbarContext';
// import { useState } from 'react';

// /**
//  * The products header.
//  */
// function TermsHeader() {
//     const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
//     const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//     const { showSnackbar } = useSnackbar();

//     const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
//         setAnchorEl(event.currentTarget);
//     };

//     const handleMenuClose = () => {
//         setAnchorEl(null);
//     };

//     const handleDownloadSample = async () => {
//         try {
//             await downloadSampleExcel();
//             showSnackbar('Sample Excel file downloaded successfully', 'success');
//         } catch (error) {
//             showSnackbar('Failed to download sample Excel file', 'error');
//         }
//         handleMenuClose();
//     };

//     return (
//         <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
//             <motion.span
//                 initial={{ x: -20 }}
//                 animate={{ x: 0, transition: { delay: 0.2 } }}
//             >
//                 <div>
//                     {/* <PageBreadcrumb className="mb-2" /> */}
//                     <Typography className="text-4xl font-extrabold leading-none tracking-tight">Attribute Terms</Typography>
//                 </div>
//             </motion.span>

//             <div className="flex flex-1 items-center justify-end space-x-2">
//                 <motion.div
//                     className="flex grow-0 gap-2"
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
//                 >
//                     <AppButton
//                         label={
//                             <>
//                                 <FuseSvgIcon size={20}>heroicons-outline:arrow-down-tray</FuseSvgIcon>
//                                 <span className="w-full">Download</span>
//                             </>
//                         }
//                         onClick={handleDownloadSample}
//                         variant="outlined"
//                         size={isMobile ? 'small' : 'medium'}
//                     />

//                     <AppButton
//                         label={
//                             <>
//                                 <FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
//                                 <span className="">Create</span>
//                             </>
//                         }
//                         type="submit"
//                         // color="secondary"
//                         // fullWidth
//                         className=""
//                         variant="contained"
//                         component={NavLinkAdapter}
//                         to="/apps/attribute-terms/create-terms"
//                         size={isMobile ? 'small' : 'medium'}
//                     />
//                 </motion.div>
//             </div>
//         </div>
//     );
// }

// export default TermsHeader;

import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PageBreadcrumb from "src/components/PageBreadcrumb";
import AppButton from "@/components/Shared/AppButton";
import {
  downloadSampleExcel,
  bulkUpdateAttributeTerm,
} from "@/services/apiAttributeTerm";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useRef } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

/**
 * The products header.
 */
function TermHeader() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    event: React.ChangeEvent<HTMLInputElement>,
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

    try {
      await bulkUpdateAttributeTerm(file);
      showSnackbar("Attribute Terms updated successfully", "success");
    } catch (error) {
      showSnackbar("Failed to update attribute terms", "error");
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
          {/* <PageBreadcrumb className="mb-2" /> */}
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            Attribute Terms
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
                  heroicons-outline:cloud-upload
                </FuseSvgIcon>
              </ListItemIcon>
              <ListItemText>Upload Excel File</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDownloadSample}>
              <ListItemIcon>
                <FuseSvgIcon size={20}>
                  heroicons-outline:cloud-download
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
            // color="secondary"
            // fullWidth
            className=""
            variant="contained"
            component={NavLinkAdapter}
            to="/apps/attribute-terms/create-terms"
            size={isMobile ? "small" : "medium"}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default TermHeader;
