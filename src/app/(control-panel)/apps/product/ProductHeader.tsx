// // import Button from '@mui/material/Button';
// // import Typography from '@mui/material/Typography';
// // import { motion } from 'motion/react';
// // import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
// // import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
// // import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
// // import PageBreadcrumb from 'src/components/PageBreadcrumb';
// // import AppButton from '@/components/Shared/AppButton';

// // /**
// //  * The products header.
// //  */
// // function ProductsHeader() {
// // 	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

// // 	return (
// // 		<div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8 px-12 ">
// // 			<motion.span
// // 				initial={{ x: -20 }}
// // 				animate={{ x: 0, transition: { delay: 0.2 } }}
// // 			>
// // 				<div>
// // 					<PageBreadcrumb className="mb-2" />
// // 					<Typography className="text-4xl font-extrabold leading-none tracking-tight">Products</Typography>
// // 				</div>
// // 			</motion.span>

// // 			<div className="flex flex-1 items-center justify-end space-x-2">
// // 				<motion.div
// // 					className="flex grow-0"
// // 					initial={{ opacity: 0, x: 20 }}
// // 					animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
// // 				>
// // 					{/* <Button
// // 						className=""
// // 						variant="contained"
// // 						color="secondary"
// // 						component={NavLinkAdapter}
// // 						to="/apps/product/new"
// // 						size={isMobile ? 'small' : 'medium'}
// // 					>
// // 						<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
// // 						<span className="mx-1 sm:mx-2">Add</span>
// // 					</Button> */}

// // 					<AppButton
// // 						label={
// // 							<>
// // 								<FuseSvgIcon size={20}>heroicons-outline:plus</FuseSvgIcon>
// // 								<span className="mx-1 sm:mx-2">Add</span>
// // 							</>
// // 						}
// // 						type="submit"
// // 						fullWidth
// // 						className=""
// // 						variant="contained"
// // 						component={NavLinkAdapter}
// // 						to="/apps/product/new"
// // 						size={isMobile ? 'small' : 'medium'}
// // 					/>
// // 				</motion.div>
// // 			</div>
// // 		</div>
// // 	);
// // }

// // export default ProductsHeader;

// // import { useState } from 'react';
// // import { useRouter } from 'next/navigation';
// // import {
// //   Button,
// //   Typography,
// //   Box,
// //   IconButton,
// //   Menu,
// //   MenuItem,
// //   ListItemIcon,
// // } from '@mui/material';
// // import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
// // import { downloadSampleExcel } from '@/services/apiProduct';
// // import { useSnackbar } from '@/contexts/SnackbarContext';

// // const ProductHeader = () => {
// //   const router = useRouter();
// //   const { showSnackbar } = useSnackbar();
// //   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

// //   const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
// //     setAnchorEl(event.currentTarget);
// //   };

// //   const handleMenuClose = () => {
// //     setAnchorEl(null);
// //   };

// //   const handleDownloadSample = async () => {
// //     try {
// //       await downloadSampleExcel();
// //       showSnackbar('Sample Excel file downloaded successfully', 'success');
// //     } catch (error) {
// //       showSnackbar('Failed to download sample Excel file', 'error');
// //     }
// //     handleMenuClose();
// //   };

// //   return (
// //     <Box className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-8 px-24 md:px-32">
// //       <Typography
// //         component="h1"
// //         className="text-3xl md:text-4xl font-semibold tracking-tight leading-7 md:leading-snug"
// //       >
// //         Products
// //       </Typography>

// //       <div className="flex flex-col w-full sm:w-auto sm:flex-row space-y-16 sm:space-y-0 flex-1 items-center justify-end space-x-8">
// //         <Button
// //           variant="contained"
// //           color="primary"
// //           onClick={() => router.push('/apps/product/new')}
// //           startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
// //         >
// //           Add Product
// //         </Button>

// //         <IconButton
// //           onClick={handleMenuClick}
// //           size="large"
// //         >
// //           <FuseSvgIcon>heroicons-outline:ellipsis-vertical</FuseSvgIcon>
// //         </IconButton>

// //         <Menu
// //           anchorEl={anchorEl}
// //           open={Boolean(anchorEl)}
// //           onClose={handleMenuClose}
// //         >
// //           <MenuItem onClick={handleDownloadSample}>
// //             <ListItemIcon>
// //               <FuseSvgIcon>heroicons-outline:arrow-down-tray</FuseSvgIcon>
// //             </ListItemIcon>
// //             Download Sample Excel
// //           </MenuItem>
// //         </Menu>
// //       </div>
// //     </Box>
// //   );
// // };

// // export default ProductHeader;

// import Typography from '@mui/material/Typography';
// import { motion } from 'motion/react';
// import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
// import NavLinkAdapter from '@fuse/core/NavLinkAdapter';
// import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
// import PageBreadcrumb from 'src/components/PageBreadcrumb';
// import AppButton from '@/components/Shared/AppButton';
// import { downloadSampleExcel } from '@/services/apiProduct';
// import { useRouter } from 'next/navigation';
// import { useSnackbar } from '@/contexts/SnackbarContext';
// import { useState } from 'react';

// /**
//  * The products header.
//  */
// function ProductHeader() {
//     const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

//     const router = useRouter();
//   const { showSnackbar } = useSnackbar();
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleDownloadSample = async () => {
//     try {
//       await downloadSampleExcel();
//       showSnackbar('Sample Excel file downloaded successfully', 'success');
//     } catch (error) {
//       showSnackbar('Failed to download sample Excel file', 'error');
//     }
//     handleMenuClose();
//   };

//     return (
//         <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
//             <motion.span
//                 initial={{ x: -20 }}
//                 animate={{ x: 0, transition: { delay: 0.2 } }}
//             >
//                 <div>
//                     {/* <PageBreadcrumb className="mb-2" /> */}
//                     <Typography className="text-4xl font-extrabold leading-none tracking-tight">Product</Typography>
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
//                                 <span className="">Add</span>
//                             </>
//                         }
//                         type="submit"
//                         // color="secondary"
//                         // fullWidth
//                         className=""
//                         variant="contained"
//                         component={NavLinkAdapter}
//                         to="/apps/product/new"
//                         size={isMobile ? 'small' : 'medium'}
//                     />
//                 </motion.div>
//             </div>
//         </div>
//     );
// }

// export default ProductHeader;

import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import NavLinkAdapter from "@fuse/core/NavLinkAdapter";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import AppButton from "@/components/Shared/AppButton";
import { downloadSampleExcel, bulkUpdateProducts } from "@/services/apiProduct";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useRef } from "react";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";

/**
 * The products header.
 */
function ProductHeader() {
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
      await bulkUpdateProducts(file);
      showSnackbar("Products updated successfully", "success");
    } catch (error) {
      showSnackbar("Failed to update products", "error");
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
            Products
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
            to="/apps/product/new"
            size={isMobile ? "small" : "medium"}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default ProductHeader;
