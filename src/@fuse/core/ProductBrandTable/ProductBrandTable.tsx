"use client";

import { useMemo, useState, useEffect } from "react";
import { type MRT_ColumnDef } from "material-react-table";
import DataTable from "@/components/data-table/DataTable";
import FuseLoading from "@fuse/core/FuseLoading";
import {
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  InputAdornment,
  MenuItem,
  ListItemIcon,
  Select,
  Pagination,
  PaginationItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  listProductBrand,
  deleteBrand,
  restoreBrand,
} from "@/services/apiProductBrand";
import { useFetch } from "@/hooks/useFetch";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";
import FuseSvgIcon from "../FuseSvgIcon";
import { useSnackbar } from "@/contexts/SnackbarContext";

export type BrandType = {
  id: number;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  updatedAt: string;
  deletedAt: string | null;
};

const ProductBrandTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deleted, setDeleted] = useState<boolean | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandType | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { showSnackbar } = useSnackbar();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
    search: debouncedSearch,
      page,
      limit,
    ...(deleted !== null && { deleted }),
    }),
    [debouncedSearch, deleted, page, limit],
  );

  const { data, error, isLoading } = useFetch(
    ["productBrandList", queryParams],
    listProductBrand,
    queryParams,
  );

  // const brands: BrandType[] = data?.data?.brands || [];
  const totalRecords = data?.data?.total || 0;
  const totalPages = Math.ceil(totalRecords / limit);

  const handleDeleteClick = (brand: BrandType) => {
    setSelectedBrand(brand);
    setOpenDialog(true);
  };

  // const handleConfirmDelete = async () => {
  //   if (!selectedBrand) return;
  //   setOpenDialog(false);

  //   try {
  //     await (selectedBrand.deletedAt ? restoreBrand(selectedBrand.id) : deleteBrand(selectedBrand.id));
  //     showSnackbar(`Brand ${selectedBrand.deletedAt ? 'restored' : 'deleted'} successfully`, 'success');
  //     mutate(["productBrandList", queryParams]);
  //   } catch (error) {
  //     console.error("Action error:", error);
  //     showSnackbar(`Failed to ${selectedBrand.deletedAt ? 'restore' : 'delete'} brand`, 'error');
  //   }
  // };
  const [brands, setBrands] = useState<BrandType[]>([]); // Local state to store the brands

  useEffect(() => {
    if (data?.data?.brands) {
      setBrands(data.data.brands); // Set local state from API data
    }
  }, [data]);

  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;
    setOpenDialog(false);

    // Optimistically remove the row immediately
    const previousBrands = [...brands]; // Save the current state for rollback
    setBrands((prev) => prev.filter((brand) => brand.id !== selectedBrand.id));

    try {
      // Perform the API call
      const result = await (selectedBrand.deletedAt
        ? restoreBrand(selectedBrand.id)
        : deleteBrand(selectedBrand.id));

      if (result?.success) {
        // Show success snackbar
        showSnackbar(
          `Brand ${selectedBrand.deletedAt ? "restored" : "deleted"} successfully`,
          "success",
        );

        // Sync with the server data only if the API call is successful
      mutate(["productBrandList", queryParams]);
      } else {
        throw new Error(result?.message || "Unexpected server response");
      }
    } catch (error) {
      console.error("Action error:", error);

      // Restore the row in case of failure (rollback)
      setBrands(previousBrands);

      // Show error snackbar with server message or generic error
      showSnackbar(
        error?.message ||
          `Failed to ${selectedBrand.deletedAt ? "restore" : "delete"} brand`,
        "error",
      );
    }
  };

  const handleEdit = (brand: BrandType) => {
    router.push(
      `/apps/product-brand/brand-update/${brand.id}?brandData=${encodeURIComponent(
        JSON.stringify({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          description: brand.description,
          logo_url: brand.logo_url,
          updatedAt: brand.updatedAt,
          deletedAt: brand.deletedAt,
        }),
      )}`,
    );
  };

  const columns = useMemo<MRT_ColumnDef<BrandType>[]>(
    () => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Brand Name" },
    { accessorKey: "slug", header: "Slug" },
    { accessorKey: "description", header: "Description" },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        Cell: ({ row }) =>
          new Date(row.original.updatedAt).toLocaleDateString("en-GB"),
      },
      // { accessorKey: "updatedAt", header: "Last Updated" },
    {
      accessorKey: "logo_url",
      header: "Logo",
        Cell: ({ row }) => (
          <img
            src={row.original.logo_url}
            alt={row.original.name}
            width={50}
            height={50}
          />
        ),
      },
    ],
    [],
  );

  if (isLoading) return <FuseLoading />;
  if (error) return <p>Failed to load brands</p>;

  return (
    <Paper
      className="flex flex-col flex-auto shadow-1 overflow-hidden"
      elevation={0}
    >
      <div className="flex items-center justify-between p-3">
        <TextField
          label="Search"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "&.Mui-focused fieldset": {
                borderColor: "#2E9970", // Border color on focus (click)
                borderWidth: "2px", // Optional: increase border thickness on focus
              },
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: "#2E9970", // Label color on focus
            },
          }}
        />

        <div className="flex gap-2">
          <Select
            value={deleted === null ? "all" : deleted ? "deleted" : "active"}
            onChange={(e) =>
              setDeleted(
                e.target.value === "all" ? null : e.target.value === "deleted",
              )
            }
            size="small"
          >
            <MenuItem value="all">All Brands</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deleted">Deleted</MenuItem>
          </Select>
        </div>
      </div>

      <DataTable
        data={brands}
        columns={columns}
        // renderRowActionMenuItems={({ closeMenu, row }) => [
        //   <>
        //     <MenuItem
        //       key="view-details"
        //       onClick={() => {
        //         router.push(`/apps/product-brand/brand-detail/${row.original.id}`);
        //         closeMenu();
        //       }}
        //     >
        //       <ListItemIcon>
        //         <FuseSvgIcon>heroicons-outline:arrow-top-right-on-square</FuseSvgIcon>
        //       </ListItemIcon>
        //       View Details
        //     </MenuItem>
        //     {!row.original.deletedAt && (
        //     <MenuItem
        //       key="edit"
        //       onClick={() => { handleEdit(row.original); closeMenu(); }}
        //     >
        //       <ListItemIcon><FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon></ListItemIcon>
        //       Edit
        //     </MenuItem>
        //     )}
        //     <MenuItem
        //       key="delete"
        //       onClick={() => { handleDeleteClick(row.original); closeMenu(); }}
        //     >
        //       <ListItemIcon>
        //         <FuseSvgIcon>
        //           {row.original.deletedAt ? "heroicons-outline:arrow-path" : "heroicons-outline:trash"}
        //         </FuseSvgIcon>
        //       </ListItemIcon>
        //       {row.original.deletedAt ? 'Restore' : 'Delete'}
        //     </MenuItem>
        //   </>
        // ]}
        renderRowActionMenuItems={({ closeMenu, row }) => {
          const menuItems = [
            // View Details MenuItem
            !row.original.deletedAt && (
            <MenuItem
              key="view-details"
              onClick={() => {
                  router.push(
                    `/apps/product-brand/brand-detail/${row.original.id}`,
                  );
                closeMenu();
              }}
            >
              <ListItemIcon>
                  <FuseSvgIcon>
                    heroicons-outline:arrow-top-right-on-square
                  </FuseSvgIcon>
              </ListItemIcon>
              View Details
            </MenuItem>
            ),

            // Edit MenuItem (conditionally rendered)
            !row.original.deletedAt && (
            <MenuItem
              key="edit"
                onClick={() => {
                  handleEdit(row.original);
                  closeMenu();
                }}
            >
                <ListItemIcon>
                  <FuseSvgIcon>heroicons-outline:pencil-square</FuseSvgIcon>
                </ListItemIcon>
              Edit
            </MenuItem>
            ),

            // Delete/Restore MenuItem
            <MenuItem
              key="delete"
              onClick={() => {
                handleDeleteClick(row.original);
                closeMenu();
              }}
            >
              <ListItemIcon>
                <FuseSvgIcon>
                  {row.original.deletedAt
                    ? "heroicons-outline:arrow-path"
                    : "heroicons-outline:trash"}
                </FuseSvgIcon>
              </ListItemIcon>
              {row.original.deletedAt ? "Restore" : "Delete"}
            </MenuItem>,
          ];

          // Filter out `false` values from the array (to handle the conditional rendering of Edit button)
          return menuItems.filter(Boolean);
        }}
      />

      <div className="flex justify-center p-4">
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          shape="rounded"
          color="primary"
          renderItem={(item) => (
            <PaginationItem
              {...item}
              className="text-gray-600 hover:text-[#2E9970]"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "#2E9970",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#247C5C",
                  },
                },
              }}
            />
          )}
        />
      </div>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Confirm {selectedBrand?.deletedAt ? "Restore" : "Delete"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to{" "}
            {selectedBrand?.deletedAt ? "restore" : "delete"}{" "}
            <strong>{selectedBrand?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <AppButton
            label={selectedBrand?.deletedAt ? "Restore" : "Delete"}
            type="button"
            onClick={handleConfirmDelete}
          />
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ProductBrandTable;
