'use client';

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import { Paper, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField'; 
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { 
  bulkUpdateProductVariants, 
  BulkUpdateProductVariantsPayload 
} from '@/services/apiProduct';

const bulkUpdateSchema = z.object({
    price: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Price value must be a number" })
             .min(0, "Price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating price, both type and value are required",
        path: ["root"]
    }),
    depositPrice: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Deposit price value must be a number" })
             .min(0, "Deposit price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Deposit price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating deposit price, both type and value are required",
        path: ["root"]
    }),
    purchasePrice: z.object({
        type: z.enum(['set', 'increase', 'decrease']).optional(),
        value: z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            z.number({ invalid_type_error: "Purchase price value must be a number" })
             .min(0, "Purchase price value cannot be negative")
             .refine((val) => {
                if (val === undefined) return true;
                const str = val.toString();
                return !str.includes('.') || str.split('.')[1].length <= 2;
             }, { message: "Purchase price value can have at most 2 decimal places" })
             .optional()
        ),
        is_percentage: z.boolean().optional(),
    }).optional().refine(data => !data || (data.type && data.value !== undefined) || (!data.type && data.value === undefined), {
        message: "If updating purchase price, both type and value are required",
        path: ["root"]
    }),
    stock: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Stock must be a whole number" }).int().min(0).optional()
    ),
    lowStockThreshold: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Low stock threshold must be a whole number" }).int().min(0).optional()
    ),
    stockStatus: z.enum(['In Stock', 'Out of Stock', 'Back Order']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    weight: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Weight must be a number" }).min(0).optional()
    ),
    length: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Length must be a number" }).min(0).optional()
    ),
    width: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Width must be a number" }).min(0).optional()
    ),
    height: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({ invalid_type_error: "Height must be a number" }).min(0).optional()
    ),
}).refine(data => Object.values(data).some(val => val !== undefined && val !== null && (typeof val !== 'object' || Object.values(val).some(v => v !== undefined))), {
    message: "At least one field must be provided for bulk update",
    path: ["root"] 
});

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#d1d5db", borderRadius: "8px" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#2E9970" },
    height: "40px", padding: "0", backgroundColor: "white",
  },
  "& .MuiInputLabel-root": { color: "#2E9970" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2E9970" },
  "& .MuiOutlinedInput-input": { padding: "12px 16px", backgroundColor: "white" },
  width: "100%",
}));

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="text-sm text-green-700 mb-1 font-bold text-base block">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

interface BulkUpdateViewProps {
  // Props from parent can be added here if needed, but not form props
}

const BulkUpdateView: React.FC<BulkUpdateViewProps> = ({ /* No form props needed */ }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
    defaultValues: {
        price: { type: undefined, value: undefined, is_percentage: undefined },
        depositPrice: { type: undefined, value: undefined, is_percentage: undefined },
        purchasePrice: { type: undefined, value: undefined, is_percentage: undefined },
        stock: undefined,
        lowStockThreshold: undefined,
        stockStatus: undefined,
        status: undefined,
        weight: undefined,
        length: undefined,
        width: undefined,
        height: undefined,
    },
    mode: 'onChange', 
  });

  const onSubmit: SubmitHandler<BulkUpdateFormData> = async (data) => {
    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar("Product ID not found.", "error");
      return;
    }

    if (!isDirty) {
        showSnackbar("No changes detected to apply.", "info");
        return;
    }

    setIsSubmitting(true);
    try {
      const updates: BulkUpdateProductVariantsPayload['updates'] = {};

      if (data.price?.type && data.price.value !== undefined) {
          updates.price = { type: data.price.type, value: data.price.value, is_percentage: data.price.is_percentage };
      }
      if (data.depositPrice?.type && data.depositPrice.value !== undefined) {
          updates.discount_price = { type: data.depositPrice.type, value: data.depositPrice.value, is_percentage: data.depositPrice.is_percentage };
      }
      if (data.purchasePrice?.type && data.purchasePrice.value !== undefined) {
          updates.purchase_price = { type: data.purchasePrice.type, value: data.purchasePrice.value, is_percentage: data.purchasePrice.is_percentage };
      }
      if (data.stock !== undefined && data.stock !== null) updates.stock = data.stock;
      if (data.lowStockThreshold !== undefined && data.lowStockThreshold !== null) updates.low_stock_threshold = data.lowStockThreshold;
      if (data.weight !== undefined && data.weight !== null) updates.weight = data.weight;
      if (data.length !== undefined && data.length !== null) updates.length = data.length;
      if (data.width !== undefined && data.width !== null) updates.width = data.width;
      if (data.height !== undefined && data.height !== null) updates.height = data.height;
      if (data.status !== undefined) updates.status = data.status;

      if (data.stockStatus !== undefined) {
        switch (data.stockStatus) {
          case 'In Stock': updates.stock_status = 'in_stock'; break;
          case 'Out of Stock': updates.stock_status = 'out_of_stock'; break;
          case 'Back Order': updates.stock_status = 'back_order'; break;
        }
      }

      const payload: BulkUpdateProductVariantsPayload = { updates };

      if (Object.keys(updates).length === 0) {
          showSnackbar("No update fields provided with valid values.", "warning");
          setIsSubmitting(false);
          return;
      }

      const response = await bulkUpdateProductVariants(Number(productId), payload);

      showSnackbar(response.message || "Variants updated successfully", "success");
      reset();

    } catch (error: any) {
      console.error("Bulk update failed:", error);
      showSnackbar(error?.response?.data?.message || error.message || "Bulk update failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={3} className="p-4 bg-white mb-6">
      <h2 className="text-lg font-bold mb-4">Bulk Update Variant Details</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4"> 
              <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Price</label>
                <div className="col-span-6">
                  <Controller
                    name="price.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Type</InputLabel>
                        <Select
                          {...field}
                          label="Type"
                          value={field.value || ""}
                          onChange={(e) => {
                            const newType = e.target.value || undefined;
                            field.onChange(newType);
                            if (newType === 'set' || newType === undefined) {
                              setValue('price.is_percentage', false);
                            } else if (newType === 'increase' || newType === 'decrease') {
                              setValue('price.is_percentage', true);
                            }
                          }}
                          className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          sx={{ height: '40px' }}
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                <div className="col-span-6">
                  <Controller
                    name="price.value"
                    control={control}
                    render={({ field }) => (
                      <StyledTextField
                        {...field}
                        type="number"
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        fullWidth
                        placeholder="Value"
                        label="Value"
                        InputLabelProps={{ shrink: true }}
                        error={!!(errors.price as any)?.value || !!errors.price?.root}
                        inputProps={{ step: "0.01" }}
                        sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                      />
                    )}
                  />
                </div>
                {((errors.price?.type as FieldError)?.message || (errors.price as any)?.value?.message || errors.price?.root?.message) && (
                    <div className="col-span-12 mt-1 mx-auto">
                        <p className="text-xs text-red-500">
                            {(errors.price?.type as FieldError)?.message ||
                             (errors.price as any)?.value?.message || 
                             errors.price?.root?.message}
                        </p>
                    </div>
                )}
                <div className="col-span-12 mt-1">
                  <Controller
                    name="price.is_percentage"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={!watch('price.type') || (watch('price.type') === 'set')}
                            sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                          />
                        }
                        label="Percentage"
                        labelPlacement="end"
                      />
                    )}
                  />
                </div>
              
              </div>

              <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Deposit Price</label>
                <div className="col-span-6">
                  <Controller
                    name="depositPrice.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Type</InputLabel>
                        <Select
                          {...field}
                          label="Type"
                          value={field.value || ""}
                          onChange={(e) => {
                            const newType = e.target.value || undefined;
                            field.onChange(newType);
                            if (newType === 'set' || newType === undefined) {
                              setValue('depositPrice.is_percentage', false);
                            } else if (newType === 'increase' || newType === 'decrease') {
                              setValue('depositPrice.is_percentage', true);
                            }
                          }}
                          className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          sx={{ height: '40px' }}
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                <div className="col-span-6">
                  <Controller
                    name="depositPrice.value"
                    control={control}
                    render={({ field }) => (
                      <StyledTextField 
                        {...field}
                        type="number"
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        fullWidth
                        placeholder="Value"
                        label="Value"
                        InputLabelProps={{ shrink: true }}
                        error={!!(errors.depositPrice as any)?.value || !!errors.depositPrice?.root}
                        inputProps={{ step: "0.01" }}
                        sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                      />
                    )}
                  />
                </div>
                {((errors.depositPrice?.type as FieldError)?.message || (errors.depositPrice as any)?.value?.message || errors.depositPrice?.root?.message) && (
                  <div className="col-span-12 mt-1 mx-auto">
                     <p className="text-xs text-red-500">
                      {(errors.depositPrice?.type as FieldError)?.message ||
                       (errors.depositPrice as any)?.value?.message || 
                       errors.depositPrice?.root?.message}
                     </p>
                  </div>
                )}
                <div className="col-span-12 mt-1">
                  <Controller
                    name="depositPrice.is_percentage"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={!!field.value} 
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={!watch('depositPrice.type') || (watch('depositPrice.type') === 'set')}
                            sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                          />
                        }
                        label="Percentage"
                        labelPlacement="end"
                      />
                    )}
                  />
                </div>                
              </div>
              <div className="grid grid-cols-12 gap-x-2 gap-y-1 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 font-bold text-base">Purchase Price</label>
                <div className="col-span-6">
                  <Controller
                    name="purchasePrice.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Type</InputLabel>
                        <Select
                          {...field}
                          label="Type"
                          value={field.value || ""}
                          onChange={(e) => {
                            const newType = e.target.value || undefined;
                            field.onChange(newType);
                            if (newType === 'set' || newType === undefined) {
                              setValue('purchasePrice.is_percentage', false);
                            } else if (newType === 'increase' || newType === 'decrease') {
                              setValue('purchasePrice.is_percentage', true);
                            }
                          }}
                          className="w-full bg-white rounded-lg border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          sx={{ height: '40px' }}
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                <div className="col-span-6">
                  <Controller
                    name="purchasePrice.value"
                    control={control}
                    render={({ field }) => (
                      <StyledTextField
                        {...field}
                        type="number"
                        value={field.value === undefined || field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                        fullWidth
                        placeholder="Value"
                        label="Value"
                        InputLabelProps={{ shrink: true }}
                        error={!!(errors.purchasePrice as any)?.value || !!errors.purchasePrice?.root}
                        inputProps={{ step: "0.01" }}
                        sx={{ "& .MuiOutlinedInput-root": { height: '40px' } }}
                      />
                    )}
                  />
                </div>
                {((errors.purchasePrice?.type as FieldError)?.message || (errors.purchasePrice as any)?.value?.message || errors.purchasePrice?.root?.message) && (
                  <div className="col-span-12 mt-1">
                      <p className="text-xs text-red-500">
                          {(errors.purchasePrice?.type as FieldError)?.message ||
                           (errors.purchasePrice as any)?.value?.message || 
                           errors.purchasePrice?.root?.message}
                      </p>
                  </div>
                )}
                <div className="col-span-12 mt-1">
                  <Controller
                    name="purchasePrice.is_percentage"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={!watch('purchasePrice.type') || (watch('purchasePrice.type') === 'set')}
                            sx={{ '&.Mui-checked': { color: '#2E9970' } }}
                          />
                        }
                        label="Percentage"
                        labelPlacement="end"
                      />
                    )}
                  />
                </div>
                
              </div>
            </div>

            <div className="space-y-4"> 
              <FormTextField
                name="stock"
                control={control}
                label="Stock"
                type="number"
                placeholder=""
                helperText={errors.stock?.message as string ?? undefined}
              />
              <Controller
                name="stockStatus"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth variant="outlined" error={!!error}>
                    <InputLabel>Stock Status</InputLabel>
                    <Select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      label="Stock Status"
                      sx={{ height: '40px', backgroundColor: 'white', borderRadius: '8px' }}
                    >
                      <MenuItem value="In Stock">In Stock</MenuItem>
                      <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                      <MenuItem value="Back Order">Back Order</MenuItem>
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
              <FormTextField
                name="lowStockThreshold"
                control={control}
                label="Low Stock Threshold"
                type="number"
                placeholder=""
                helperText={errors.lowStockThreshold?.message as string ?? undefined}
              />
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth variant="outlined" error={!!error}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      label="Status"
                      sx={{ height: '40px', backgroundColor: 'white', borderRadius: '8px' }}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                    {error && <FormHelperText>{error.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </div>

            <div className="space-y-4"> 
              <div className="mb-2">
                <h3 className="font-semibold">Dimensions & Weight</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormTextField 
                  name="weight"
                  control={control}
                  label="Weight"
                  type="number"
                  placeholder=""
                  helperText={errors.weight?.message as string ?? undefined}
                />
                
                <FormTextField 
                  name="length"
                  control={control}
                  label="Length"
                  type="number"
                  placeholder=""
                  helperText={errors.length?.message as string ?? undefined}
                />
                
                <FormTextField 
                  name="width"
                  control={control}
                  label="Width"
                  type="number"
                  placeholder=""
                  helperText={errors.width?.message as string ?? undefined}
                />
                
                <FormTextField 
                  name="height"
                  control={control}
                  label="Height"
                  type="number"
                  placeholder=""
                  helperText={errors.height?.message as string ?? undefined}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-right">
          <AppButton 
            label="Apply Bulk Update"
            type="submit" 
            disabled={!isDirty || !isValid || isSubmitting} 
            loading={isSubmitting}
          />
        </div>
      </form>
    </Paper>
  );
};

export default BulkUpdateView; 
