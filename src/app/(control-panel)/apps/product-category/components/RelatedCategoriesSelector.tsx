"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import { listProductCategory } from "@/services/apiProductCategory";
import { useSnackbar } from "@/contexts/SnackbarContext";

type CategoryOption = {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string;
  alt_text?: string;
};

export default function RelatedCategoriesSelector({
  currentCategoryId,
  selectedIds,
  onSelectedIdsChange,
  maxCount = 3,
  label = "Related Categories",
}: {
  currentCategoryId?: number | null;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  maxCount?: number;
  label?: string;
}) {
  const { showSnackbar } = useSnackbar();
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const res = await listProductCategory({
          limit: 1000,
          deleted: false,
        });
        setOptions(res?.data?.categories ?? []);
      } catch (e) {
        console.error("Failed to load categories:", e);
        showSnackbar("Failed to load categories", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [showSnackbar]);

  const sanitizedSelectedIds = useMemo(() => {
    const unique = Array.from(new Set(selectedIds));
    return unique
      .filter((id) => (currentCategoryId ? id !== currentCategoryId : true))
      .slice(0, maxCount);
  }, [selectedIds, currentCategoryId, maxCount]);

  const selectedOptions = useMemo(() => {
    return sanitizedSelectedIds.map((id) => {
      return (
        options.find((o) => o.id === id) ?? {
          id,
          name: `Category #${id}`,
          slug: "",
        }
      );
    });
  }, [options, sanitizedSelectedIds]);

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Select up to {maxCount} related categories.
      </Typography>

      <Autocomplete
        multiple
        loading={loading}
        options={options.filter(
          (o) => (currentCategoryId ? o.id !== currentCategoryId : true)
        )}
        disableCloseOnSelect
        filterSelectedOptions
        limitTags={maxCount}
        value={selectedOptions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        onChange={(_, newValue) => {
          const ids = newValue.map((v) => v.id);
          const unique = Array.from(new Set(ids));
          const cleaned = unique
            .filter((id) => (currentCategoryId ? id !== currentCategoryId : true))
            .slice(0, maxCount);
          onSelectedIdsChange(cleaned);
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getTagProps({ index })}
              key={option.id}
              label={option.name}
            />
          ))
        }
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {option.logo_url ? (
                <Avatar
                  src={option.logo_url}
                  alt={option.alt_text || option.name}
                  sx={{ width: 24, height: 24 }}
                />
              ) : (
                <Avatar sx={{ width: 24, height: 24 }}>
                  {option.name?.[0]?.toUpperCase?.() ?? "C"}
                </Avatar>
              )}
              <Box>
                <Typography variant="body2">{option.name}</Typography>
              </Box>
            </Box>
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Search and select categories"
            helperText={`Max ${maxCount}. Clear selection to remove all.`}
          />
        )}
      />
    </Box>
  );
}

