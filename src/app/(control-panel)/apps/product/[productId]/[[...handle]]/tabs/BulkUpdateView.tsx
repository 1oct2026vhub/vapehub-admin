'use client';

import React from 'react';
import { Controller, SubmitHandler, Control, UseFormHandleSubmit, UseFormWatch, UseFormSetValue, FieldErrors, FormState } from 'react-hook-form';
import { Paper, FormControlLabel, Checkbox, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material'; // Assuming MUI imports are needed
import AppButton from '@/components/Shared/AppButton';
import FormTextField from '@/components/Shared/FormTextField'; 
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { FieldError } from 'react-hook-form'; // Import FieldError

// Assume BulkUpdateFormData is defined elsewhere or define it here if needed
// For now, using a generic type
type BulkUpdateFormData = Record<string, any>; 

// Define styled TextField if needed, or import from parent/shared component
const StyledTextField = styled(TextField)(({ theme }) => ({
  // ... styles from VariantManager ...
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: "#d1d5db", borderRadius: "8px" },
    "&:hover fieldset": { borderColor: "#9ca3af" },
    "&.Mui-focused fieldset": { borderColor: "#2E9970" },
    height: "auto", padding: "0", backgroundColor: "white",
  },
  "& .MuiInputLabel-root": { color: "#2E9970" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2E9970" },
  "& .MuiOutlinedInput-input": { padding: "12px 16px", backgroundColor: "white" },
  width: "100%",
}));

// Define FormField wrapper or import
const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <label className="text-sm text-green-700 mb-1 font-medium block">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);


interface BulkUpdateViewProps {
  control: Control<BulkUpdateFormData>;
  handleSubmit: UseFormHandleSubmit<BulkUpdateFormData>;
  onSubmit: SubmitHandler<BulkUpdateFormData>;
  watch: UseFormWatch<BulkUpdateFormData>;
  setValue: UseFormSetValue<BulkUpdateFormData>;
  errors: FieldErrors<BulkUpdateFormData>;
  formState: FormState<BulkUpdateFormData>; // Includes isDirty, isValid
  isSubmitting: boolean;
}

const BulkUpdateView: React.FC<BulkUpdateViewProps> = ({
  control,
  handleSubmit,
  onSubmit,
  watch,
  setValue,
  errors,
  formState,
  isSubmitting,
}) => {
  const { isDirty, isValid } = formState;

  return (
    <Paper elevation={3} className="p-4 bg-white mb-6">
      <h2 className="text-lg font-bold mb-4">Bulk Update Variant Details</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 space-y-6">
          {/* --- EDIT: Add 2-column grid for Prices and Stock/Status --- */}
          <div className="grid grid-cols-2 gap-6"> 
            {/* Column 1: Price Updates */} 
            <div className="space-y-4"> 
              {/* Price Field Group */} 
              <div className="grid grid-cols-12 gap-x-2 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">Price Update</label>
                {/* Type Select */}
                <div className="col-span-4">
                  <Controller
                    name="price.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined" size="small">
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
                          className="w-full bg-white"
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                {/* Value Input */}
                <div className="col-span-4">
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
                        inputProps={{ step: "0.01", className: "h-10 box-border" }}
                      />
                    )}
                  />
                </div>
                {/* Percentage Checkbox */}
                <div className="col-span-4 flex items-center pb-1">
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
                {/* Error Message Area */} 
                {((errors.price?.type as FieldError)?.message || (errors.price as any)?.value?.message || errors.price?.root?.message) && (
                    <div className="col-span-12 mt-1">
                        <p className="text-xs text-red-500">
                            {(errors.price?.type as FieldError)?.message ||
                             (errors.price as any)?.value?.message || 
                             errors.price?.root?.message}
                        </p>
                    </div>
                )}
              </div>

              {/* Deposit Price Field Group */} 
              <div className="grid grid-cols-12 gap-x-2 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">Deposit Price Update</label>
                {/* Type Select */}
                <div className="col-span-4">
                  <Controller
                    name="depositPrice.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined" size="small">
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
                          className="w-full bg-white"
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                {/* Value Input */}
                <div className="col-span-4">
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
                        inputProps={{ step: "0.01", className: "h-10 box-border" }}
                      />
                    )}
                  />
                </div>
                {/* Percentage Checkbox */} 
                <div className="col-span-4 flex items-center pb-1"> 
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
                {/* Error Message Area */} 
                {((errors.depositPrice?.type as FieldError)?.message || (errors.depositPrice as any)?.value?.message || errors.depositPrice?.root?.message) && (
                  <div className="col-span-12 mt-1">
                     <p className="text-xs text-red-500">
                      {(errors.depositPrice?.type as FieldError)?.message ||
                       (errors.depositPrice as any)?.value?.message || 
                       errors.depositPrice?.root?.message}
                     </p>
                  </div>
                )}
              </div>

              {/* Purchase Price Field Group */} 
              <div className="grid grid-cols-12 gap-x-2 items-center border p-3 pt-5 rounded-md relative">
                <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-gray-500">Purchase Price Update</label>
                {/* Type Select */}
                <div className="col-span-4">
                  <Controller
                    name="purchasePrice.type"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth variant="outlined" size="small">
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
                          className="w-full bg-white"
                        >
                          <MenuItem value="set">Set to</MenuItem>
                          <MenuItem value="increase">Increase by</MenuItem>
                          <MenuItem value="decrease">Decrease by</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  />
                </div>
                {/* Value Input */}
                <div className="col-span-4">
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
                        inputProps={{ step: "0.01", className: "h-10 box-border" }}
                      />
                    )}
                  />
                </div>
                {/* Percentage Checkbox */}
                <div className="col-span-4 flex items-center pb-1">
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
                {/* Error Message Area */} 
                {((errors.purchasePrice?.type as FieldError)?.message || (errors.purchasePrice as any)?.value?.message || errors.purchasePrice?.root?.message) && (
                  <div className="col-span-12 mt-1">
                      <p className="text-xs text-red-500">
                          {(errors.purchasePrice?.type as FieldError)?.message ||
                           (errors.purchasePrice as any)?.value?.message || 
                           errors.purchasePrice?.root?.message}
                      </p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Stock/Status Fields */} 
            <div className="space-y-4"> {/* Use space-y for vertical stacking within column 2 */}
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
                  <FormField 
                    label="Stock Status"
                    error={error?.message}
                  >
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none h-10"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Back Order">Back Order</option>
                    </select>
                  </FormField>
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
                  <FormField 
                    label="Status"
                    error={error?.message}
                  >
                    <select
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white appearance-none h-10"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FormField>
                )}
              />
            </div>
          </div>
          {/* Dimensions & Weight Heading */}
          <div className="mt-4 mb-2"> {/* Removed col-span-3 */} 
            <h3 className="font-semibold">Dimensions & Weight</h3>
          </div>

          {/* Dimensions grouped together */}
          {/* --- EDIT: Use grid for dimensions --- */} 
          <div className="grid grid-cols-4 gap-4"> {/* Removed col-span-3 */} 
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
        
        {/* Submit Button */} 
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
