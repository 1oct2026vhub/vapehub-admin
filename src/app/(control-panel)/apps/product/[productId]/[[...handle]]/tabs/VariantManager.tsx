"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  IconButton, 
  TextField, 
  Button, 
  Paper, 
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
  Box,
  Typography,
  Divider,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDropzone } from 'react-dropzone';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useSnackbar } from '@/contexts/SnackbarContext';
import AppButton from '@/components/Shared/AppButton';
import FuseLoading from '@fuse/core/FuseLoading';
// Import API services
import { getProduct, createProductVariants, uploadVariantImages, setVariantPrimaryImage, deleteVariantImage, deleteProductVariant, updateProductVariant, UpdateProductVariantRequest } from '@/services/apiProduct';
import { useProductForm } from '../ProductFormContext';
// --- Start Add: Import FormTextField ---
import FormTextField from '@/components/Shared/FormTextField'; 
// --- End Add ---
// --- Start Add: Import Switch --- 
import Switch from '@mui/material/Switch'; 
// --- Start Add: Import Checkbox --- 
import Checkbox from '@mui/material/Checkbox';
// --- End Add ---
import FormControlLabel from '@mui/material/FormControlLabel';
// --- End Add ---

// Add these imports for React Hook Form and Zod
import { useForm, Controller, useFormContext, SubmitHandler } from "react-hook-form"; // Add useFormContext and SubmitHandler
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSearchParams } from 'next/navigation';

// --- Add Dialog imports --- 
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

// Import the new view components
import ManualVariantView from './ManualVariantView';
import GenerateVariantsView from './GenerateVariantsView';
import BulkUpdateView from './BulkUpdateView';

// Create a styled version of TextField with the app's styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#d1d5db",
      borderRadius: "8px",
    },
    "&:hover fieldset": {
      borderColor: "#9ca3af",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2E9970",
    },
    height: "auto",
    padding: "0",
    backgroundColor: "white",
  },
  "& .MuiInputLabel-root": {
    color: "#2E9970",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2E9970",
  },
  "& .MuiOutlinedInput-input": {
    padding: "12px 16px",
    backgroundColor: "white",
  },
  width: "100%",
}));

// Types
interface VariantAttribute {
  attribute_id: number;
  term_id: number;
  term: {
    id: number;
    name: string;
  };
  attribute: {
    id: number;
    name: string;
  };
}

interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

// --- EDIT: Use simple nullable types consistent with schema --- 
interface Variant {
  id: string;
  slug: string;
  price: number | null; 
  stock: number | null; 
  status: 'Active' | 'Inactive';
  stockStatus?: 'In Stock' | 'Out of Stock' | 'Back Order'; // Add stockStatus using Form format
  depositPrice?: number | null; 
  purchasePrice?: number | null; 
  lowStockThreshold?: number | null; // Use correct casing
  weight?: number | null; 
  length?: number | null; 
  width?: number | null; 
  height?: number | null; 
  barcode?: string | null; 
  description?: string | null; 
  attributes: Record<string, string>;
  variantAttributes?: VariantAttribute[];
  images?: VariantImage[];
  pendingImages?: File[];
  errors?: Record<string, string>; 
}
// --- END EDIT --- 

// Add a type for variant attributes
interface VariantAttributeField {
  name: string;
  value: string;
}

// Form validation schema
// --- EDIT: Simplify schema to use simple nullable numeric types --- 
const variantSchema = z.object({
  slug: z.string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters") 
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"), 
  price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for price"),
      z.number()
        .positive("Price must be greater than zero")
        .max(9999999.99, "Price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Price can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Price is required"), // Enforce non-null
    ])
  ),
  stock: z.preprocess(
      (val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      },
      z.union([
        z.literal("NaN").refine(() => false, "Please enter a valid number for stock"),
        z.number()
          .int("Stock must be a whole number")
          .min(0, "Stock must be a non-negative number"),
        z.null().refine(() => false, "Stock is required"), // Enforce non-null
      ])
  ),
  status: z.enum(["active", "inactive"]).default("active"),
  stockStatus: z.enum(["In Stock", "Out of Stock", "Back Order"]).default("In Stock"), // Keep as is for UI logic
  depositPrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for deposit price"),
      z.number()
        .min(0, "Deposit price cannot be negative")
        .max(9999999.99, "Deposit price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Deposit price can have at most 2 decimal places" }
        ),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  purchasePrice: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for purchase price"),
      z.number()
        .min(0, "Purchase price cannot be negative")
        .max(9999999.99, "Purchase price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Purchase price can have at most 2 decimal places" }
        ),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  lowStockThreshold: z.preprocess( // Use correct casing
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for low stock threshold"),
      z.number()
        .int("Low stock threshold must be a whole number")
        .min(0, "Low stock threshold cannot be negative"),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  weight: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for weight"),
      z.number().min(0, "Weight cannot be negative"),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  length: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for length"),
      z.number().min(0, "Length cannot be negative"),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  width: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for width"),
      z.number().min(0, "Width cannot be negative"),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  height: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for height"),
      z.number().min(0, "Height cannot be negative"),
      z.null(), // Allow null
    ]).optional() // Make the whole field optional
  ),
  barcode: z.string()
    .refine(val => !val || (val.length >= 3 && val.length <= 50), { 
      message: "Barcode must be between 3 and 50 characters if provided",
    })
    .optional()
    .nullable(), // Allow null
  description: z.string()
    .max(1000, "Description cannot exceed 1000 characters") 
    .optional()
    .nullable(), // Allow null
});
// --- END EDIT --- 

type VariantFormData = z.infer<typeof variantSchema>;

// --- Add Schema for Bulk Update --- 
const bulkUpdateSchema = z.object({
  // Make all fields optional for bulk update
  price: z.object({
      type: z.enum(["set", "increase", "decrease"]).optional(),
      value: z.preprocess(
        (val) => {
          // Allow empty string/null/undefined to pass through, handle validation later
          if (val === "" || val === null || val === undefined) return undefined;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number"),
          z.number().positive("Value must be positive"), // Allow non-integer, validate decimals later if needed
          z.undefined() // Allow undefined if type is not set
        ])
      ),
      is_percentage: z.boolean().optional()
    }).optional()
    // Add refinement to ensure value is provided if type is set
    .refine(data => {
        if (data?.type && (data.value === undefined || data.value === null)) {
            return false; // Value is required if type is selected
        }
        return true;
    }, { message: "Value is required when update type is selected" }),
  stock: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? "NaN" : parsed;
  }, z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for stock"), 
      z.number()
        .int("Stock must be a whole number")
        .min(0, "Stock must be a non-negative number")
    ]).optional()
  ),
  status: z.enum(["active", "inactive"]).optional(),
  stockStatus: z.enum(["In Stock", "Out of Stock", "Back Order"]).optional(),
  depositPrice: z.object({
      type: z.enum(["set", "increase", "decrease"]).optional(),
      value: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return undefined;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number"),
          z.number().min(0, "Value cannot be negative"), // Allow 0 for set
          z.undefined()
        ])
      ),
      is_percentage: z.boolean().optional()
    }).optional()
    .refine(data => {
        if (data?.type && (data.value === undefined || data.value === null)) {
            return false;
        }
        return true;
    }, { message: "Value is required when update type is selected" }),
  purchasePrice: z.object({
      type: z.enum(["set", "increase", "decrease"]).optional(),
      value: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return undefined;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number"),
          z.number().min(0, "Value cannot be negative"), // Allow 0 for set
          z.undefined()
        ])
      ),
      is_percentage: z.boolean().optional()
    }).optional()
    .refine(data => {
        if (data?.type && (data.value === undefined || data.value === null)) {
            return false;
        }
        return true;
    }, { message: "Value is required when update type is selected" }),
  lowStockThreshold: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? "NaN" : parsed;
  }, z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for low stock threshold"), 
      z.number()
        .int("Low stock threshold must be a whole number")
        .min(0, "Low stock threshold cannot be negative")
    ]).optional()
  ),
  // --- EDIT: Update Weight schema --- 
  weight: z.object({
      type: z.enum(["set", "increase", "decrease"]).optional(),
      value: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return undefined;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number for weight"),
          z.number().min(0, "Weight cannot be negative"),
          z.undefined()
        ])
      ),
      is_percentage: z.boolean().optional()
    }).optional()
    .refine(data => {
        if (data?.type && (data.value === undefined || data.value === null)) {
            return false;
        }
        return true;
    }, { message: "Value is required when update type is selected for weight" }),
  // --- END EDIT --- 
  // --- EDIT: Update Length schema --- 
  length: z.object({
      type: z.enum(["set", "increase", "decrease"]).optional(),
      value: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return undefined;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number for length"),
          z.number().min(0, "Length cannot be negative"),
          z.undefined()
        ])
      ),
      is_percentage: z.boolean().optional()
    }).optional()
    .refine(data => {
        if (data?.type && (data.value === undefined || data.value === null)) {
            return false;
        }
        return true;
    }, { message: "Value is required when update type is selected for length" }),
  // --- END EDIT --- 
  width: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? "NaN" : parsed;
  }, z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for width"), 
      z.number().min(0, "Width cannot be negative")
    ]).optional()
  ),
  height: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const parsed = Number(val);
    return isNaN(parsed) ? "NaN" : parsed;
  }, z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for height"), 
      z.number().min(0, "Height cannot be negative")
    ]).optional()
  ),
  barcode: z.string()
    .refine(val => !val || (val.length >= 3 && val.length <= 50), { 
      message: "Barcode must be between 3 and 50 characters if provided",
    })
    .optional() 
    .nullable(), // Allow null to mean "no change"
  description: z.string()
    .max(1000, "Description cannot exceed 1000 characters") 
    .optional() 
    .nullable(), // Allow null to mean "no change"
});

type BulkUpdateFormData = z.infer<typeof bulkUpdateSchema>;
// --- End Schema --- 

// UI Components
const SectionHeading = ({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <h3 className="text-md font-bold mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </h3>
);

const RequiredLabel = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <p className="text-sm text-green-700 mb-2 font-medium">
    {children} <span className="text-red-500">*</span>
  </p>
);

const OptionalLabel = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <p className="text-sm text-green-700 mb-2 font-medium">{children}</p>
);

const ValidationMessage = ({ error }: { error?: string }) => {
  if (!error) return null;
  return <p className="text-xs text-red-500 mt-1">{error}</p>;
};

// Input field wrapper to maintain consistent style
const FormField = ({ 
  label, 
  required = false, 
  error, 
  children,
  helperText,
  type = "text",
  value,
  onChange,
  placeholder,
  name
}: { 
  label: string; 
  required?: boolean; 
  error?: string;
  helperText?: string;
  children?: React.ReactNode;
  type?: string;
  value?: any;
  onChange?: (e: any) => void;
  placeholder?: string;
  name?: string;
}) => {
  // If children are provided, render them inside the wrapper
  if (children) {
    return (
      <div className="mb-4">
        <label className="text-sm text-green-700 mb-2 font-medium block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1">{children}</div>
        <ValidationMessage error={error} />
      </div>
    );
  }

  // Otherwise, render the StyledTextField
  return (
    <div className="mb-4">
      <StyledTextField
        label={label}
        required={required}
        fullWidth
        variant="outlined"
        error={!!error}
        helperText={error || helperText}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        InputLabelProps={{
          shrink: true,
        }}
      />
    </div>
  );
};

// Form field specifically for variant attributes
const AttributeField = ({ 
  label, 
  value,
  onChange,
  onRemove,
}: { 
  label: string; 
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}) => {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex-1">
        <label className="text-sm text-green-700 mb-1 font-medium block">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
        />
      </div>
      <IconButton 
        size="small" 
        color="error" 
        onClick={onRemove}
        className="mt-6"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

// --- Start Add: Stock Status Mapping Helpers ---
const mapApiStockStatusToForm = (apiStatus?: string | null): 'In Stock' | 'Out of Stock' | 'Back Order' => {
  switch (apiStatus?.toLowerCase()) {
    case 'in_stock': return 'In Stock';
    case 'out_of_stock': return 'Out of Stock';
    case 'back_order': return 'Back Order';
    default: 
      console.warn(`[mapApiStockStatusToForm] Unknown API status: ${apiStatus}, defaulting to 'In Stock'.`);
      return 'In Stock'; // Explicit default return
  }
};

const mapFormStockStatusToApi = (formStatus?: 'In Stock' | 'Out of Stock' | 'Back Order' | null): 'in_stock' | 'out_of_stock' | 'back_order' | null => {
  switch (formStatus) {
    case 'In Stock': return 'in_stock';
    case 'Out of Stock': return 'out_of_stock';
    case 'Back Order': return 'back_order';
    default: return null; // Return null if mapping fails or input is null/undefined
  }
};
// --- End Add: Stock Status Mapping Helpers ---

const VariantManager = () => {
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'initial' | 'generated' | 'manual' | 'bulk'>('initial'); // Explicitly type the state
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageUploading, setImageUploading] = useState<boolean>(false);
  // --- Re-add missing state --- 
  const [isUpdating, setIsUpdating] = useState<boolean>(false);     // UPDATE Submit
  const [isEditImageUploading, setIsEditImageUploading] = useState<boolean>(false); // EDIT Image Upload
  // --- End re-add ---
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);
  
  // Get the currently selected variant
  const selectedVariant = variants[selectedVariantIndex] || null;
  
  // Add state for managing attribute fields in manual mode
  const [attributeFields, setAttributeFields] = useState<VariantAttributeField[]>([
    { name: 'Flavour', value: '' },
    { name: 'Nicotine-strength', value: '' }
  ]);

  // Add state for storing product attributes and terms
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [attributeTerms, setAttributeTerms] = useState<Record<number, any[]>>({});
  
  // Add state to track all possible combinations and used combinations
  const [allPossibleCombinations, setAllPossibleCombinations] = useState<Array<Record<string, any>>>([]);
  const [usedCombinations, setUsedCombinations] = useState<Array<Record<string, any>>>([]);
  const [allCombinationsUsed, setAllCombinationsUsed] = useState<boolean>(false);
  const [pendingCombination, setPendingCombination] = useState<Record<string, any> | null>(null);
  
  // Add state for images of the new variant being created
  const [pendingCreateImages, setPendingCreateImages] = useState<File[]>([]);
  const [pendingCreateImagePreviews, setPendingCreateImagePreviews] = useState<string[]>([]);
  
  // Access the product form context
  const { formData } = useProductForm();

  // Add state for edit form's immediate image uploads
  const [isEditUploading, setIsEditUploading] = useState<boolean>(false);

  // --- EDIT FORM STATE --- 
  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    reset: resetEditForm,
    watch: watchEdit,
    formState: editFormState, // Contains errors, isValid, isDirty
    trigger: triggerEdit,
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    mode: "all",
    // --- EDIT: Use simple null/defaults matching simplified schema ---
    defaultValues: { 
      slug: "",
      price: null as any, // Required, but start as null for RHF
      stock: null as any, // Required, but start as null for RHF
      status: "active", 
      depositPrice: null,
      purchasePrice: null,
      lowStockThreshold: null, // Use correct casing
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null, 
      description: null, 
      stockStatus: "In Stock", // UI field
    },
    // --- END EDIT ---
  });

  // --- CREATE FORM STATE --- 
  const {
    control: createControl,
    handleSubmit: handleCreateSubmit,
    setValue: setCreateValue,
    reset: resetCreateForm,
    watch: watchCreate,
    formState: createFormState, // Contains errors, isValid, isDirty
    trigger: triggerCreate,
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    mode: "all", 
    // --- EDIT: Use simple null/defaults matching simplified schema ---
    defaultValues: { 
      slug: "",
      price: null as any, 
      stock: null as any, 
      status: "active", 
      depositPrice: null,
      purchasePrice: null,
      lowStockThreshold: null, // Use correct casing
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null, 
      description: null,
      stockStatus: "In Stock",
    },
    // --- END EDIT ---
  });

  // --- Add state for delete confirmation dialog --- 
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [variantToDeleteId, setVariantToDeleteId] = useState<string | null>(null);

  // --- Add useForm for Bulk Update --- 
  const {
    control: bulkControl,
    handleSubmit: handleBulkSubmit,
    reset: resetBulkForm,
    watch: watchBulk, // Get watch function for bulk form
    setValue: bulkSetValue, // Get setValue for bulk form
    formState: bulkFormState, // <-- Extract formState as bulkFormState
  } = useForm<BulkUpdateFormData>({
    resolver: zodResolver(bulkUpdateSchema),
    mode: "onChange", // Validate on change for immediate feedback
    defaultValues: { // Default to empty/undefined indicating no change
      price: undefined,
      stock: undefined,
      status: undefined,
      stockStatus: undefined,
      depositPrice: undefined,
      purchasePrice: undefined,
      lowStockThreshold: undefined,
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      barcode: undefined,
      description: undefined,
    },
  });
  // --- End useForm for Bulk Update --- 

  // Helper function to remove temporary images
  const removeTemporaryImages = (tempIds: number[]) => {
    // Get fresh state
    const currentVariants = [...variants];
    
    // Filter out temporary images
    const permanentImages = currentVariants[selectedVariantIndex].images?.filter(
      img => !tempIds.includes(Number(img.id))
    ) || [];
    
    // Update the variant without the temporary images
    currentVariants[selectedVariantIndex] = {
      ...currentVariants[selectedVariantIndex],
      images: permanentImages
    };
    
    setVariants(currentVariants);
  };

  // Handle file upload for variant images
  const handleImageUpload = (files: File[]) => {
    // This function now ONLY handles uploads for EXISTING variants via editDropzone
    console.log("Handling image upload for EXISTING variant:", selectedVariant?.id);
    if (files.length === 0 || !selectedVariant) {
      console.warn("handleImageUpload called without files or selectedVariant");
      return; 
    } 
    // Basic validation for uploaded files
    const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) { 
            showSnackbar(`File ${file.name} exceeds 5MB limit.`, "error");
            return false; 
        }
        if (!['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type)) {
            showSnackbar(`File ${file.name} has an invalid type. Only PNG, JPG, JPEG, WEBP allowed.`, "error");
            return false; 
        }
        return true;
      });

    if (validFiles.length === 0) {
        showSnackbar("No valid files to upload.", "warning");
        return;
    }
 
     setImageUploading(true);
     
     // Store temp IDs to track them later
     const tempIds: number[] = [];
     
     // Create preview URLs temporarily while uploading
     const previewImages = validFiles.map((file, idx) => {
       const tempId = -1 * (Date.now() + idx); // Temporary ID as negative number
       tempIds.push(tempId);
       return {
         id: tempId,
         image_url: URL.createObjectURL(file),
         is_primary: false
       };
     });
     
     // Make a DEEP COPY of the variants to avoid state mutation issues
     const updatedVariants = variants.map(variant => ({...variant}));
     
     // Make a deep copy of selected variant's images array or initialize it
     const currentImages = updatedVariants[selectedVariantIndex].images ? 
       [...updatedVariants[selectedVariantIndex].images] : 
       [];
     
     // Add preview images to the variant
     updatedVariants[selectedVariantIndex] = {
       ...updatedVariants[selectedVariantIndex],
       images: [...currentImages, ...previewImages],
       pendingImages: [
         ...(updatedVariants[selectedVariantIndex].pendingImages || []),
         ...validFiles
       ]
     };
     
     // Update state with preview images
     setVariants(updatedVariants);
     
     // Get the product ID and variant ID for the API call
     const productId = searchParams.get('productId');
     const variantId = selectedVariant.id;
     
     if (!productId || !variantId) {
       // Clean up the blob URLs to prevent memory leaks
       previewImages.forEach(img => {
         if (typeof img.image_url === 'string' && img.image_url.startsWith('blob:')) {
           URL.revokeObjectURL(img.image_url);
         }
       });
       
       setImageUploading(false);
       showSnackbar("Missing product or variant ID", "error");
       return;
     }
     
     // Create FormData for API upload
     const formData = new FormData();
     validFiles.forEach((file) => {
       formData.append("files", file);
     });
     
     // Call the upload API
     uploadVariantImages(String(productId), String(variantId), formData)
       .then((response) => {
         // Process the response to get uploaded images
         let newImages: any[] = [];
         
         // Handle different possible response structures
         if (Array.isArray(response)) {
           newImages = response;
         } else if (response && typeof response === "object") {
           // Try different possible response structures
           if (response.data?.variant?.variantImages) {
             newImages = response.data.variant.variantImages;
           } else if (response.variant?.variantImages) {
             newImages = response.variant.variantImages;
           } else if (response.data?.variantImages) {
             newImages = response.data.variantImages;
           } else if (response.data && Array.isArray(response.data)) {
             newImages = response.data;
           }
         }
         
         // Ensure all images have the expected properties
         const processedImages: VariantImage[] = newImages.map((img: any) => ({
           id: Number(img.id || img.image_id),
           image_url: img.image_url || img.url || img.image_url,
           is_primary: !!img.is_primary
         }));
         
         if (processedImages.length === 0) {
           console.warn("Could not extract images from response:", response);
           showSnackbar("Images uploaded but response format was unexpected", "warning");
           
           // Clean up the temporary preview images on error
           removeTemporaryImages(tempIds);
           // Also reset uploading state
           setImageUploading(false); 
           return;
         }
         
         // Create a fresh copy of variants to avoid stale state issues
         // Need to use functional update to guarantee latest state
         setVariants(currentVariants => {
            const latestVariants = [...currentVariants];
            // Check if the index is still valid
            if (selectedVariantIndex >= latestVariants.length) {
                console.warn("Selected variant index out of bounds after upload.");
                return currentVariants; // Return original state if index is invalid
            }
            const currentVariant = latestVariants[selectedVariantIndex];
            
            // Remove any temporary preview images (negative IDs that we tracked)
            const permanentImages = currentVariant.images?.filter(
            img => !tempIds.includes(Number(img.id))
            ) || [];
            
            // Create a set of existing image IDs to prevent duplicates
            const existingImageIds = new Set(permanentImages.map(img => Number(img.id)));
            
            // Filter out any images from the response that we already have
            const uniqueNewImages = processedImages.filter(img => !existingImageIds.has(Number(img.id)));
            
            // Only keep one primary image - if multiple are marked primary, prefer the newer ones
            let foundPrimary = permanentImages.some(img => img.is_primary);
            
            const processedPermanentImages = permanentImages.map(img => ({...img}));
            const processedUniqueNewImages = uniqueNewImages.map(img => {
            // If this image is primary but we already have a primary, make it non-primary
            if (img.is_primary && foundPrimary) {
                return {...img, is_primary: false};
            }
            // If this image is primary, update our flag
            if (img.is_primary) {
                foundPrimary = true;
            }
            return img;
            });
            
            // Update the variant with the deduplicated images
            latestVariants[selectedVariantIndex] = {
            ...currentVariant,
            images: [...processedPermanentImages, ...processedUniqueNewImages],
            pendingImages: [] // Clear pending files for this variant
            };

            // Clean up blob URLs for previews just added
            previewImages.forEach(img => {
                if (typeof img.image_url === 'string' && img.image_url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.image_url);
                }
            });
            return latestVariants;
         });
         
         setImageUploading(false);
         showSnackbar("Images uploaded successfully", "success");
       })
       .catch((error) => {
         console.error("Error uploading images:", error);
         
         // Remove the temporary preview images on error
         removeTemporaryImages(tempIds);
         
         setImageUploading(false);
          // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
       })
       .finally(() => {
          // --- Reset specific loading state for edit form --- 
          setIsEditUploading(false);
          // --- End reset specific loading state --- 
          setImageUploading(false); // Reset global too, just in case
       });
  };
  
  // --- Dropzone Hooks ---
  // For Create Form
  const { 
    getRootProps: createGetRootProps, 
    getInputProps: createGetInputProps, 
    isDragActive: createIsDragActive 
  } = useDropzone({
    onDrop: acceptedFiles => {
      const validFiles = acceptedFiles.filter(file => file.size <= 5 * 1024 * 1024); // Max 5MB
      if (validFiles.length !== acceptedFiles.length) {
        showSnackbar("Some files exceed the 5MB size limit.", "warning");
      }
      setPendingCreateImages(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPendingCreateImagePreviews(prev => [...prev, ...newPreviews]);
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    disabled: isSubmitting || imageUploading,
  });

  // For Edit Form (uploads immediately)
  const { 
    getRootProps: editGetRootProps, 
    getInputProps: editGetInputProps, 
    isDragActive: editIsDragActive 
  } = useDropzone({
    onDrop: async acceptedFiles => {
      if (!selectedVariant || (typeof selectedVariant.id === 'string' && selectedVariant.id.startsWith('#'))) { // Check type for startsWith
        showSnackbar("Please select an existing variant to upload images.", "warning");
        return;
      }
      const productId = searchParams.get('productId');
      if (!productId) {
        showSnackbar("Product ID not found", "error");
        return;
      }

      const validFiles = acceptedFiles.filter(file => file.size <= 5 * 1024 * 1024); // Max 5MB
      if (validFiles.length !== acceptedFiles.length) {
        showSnackbar("Some files exceed the 5MB size limit.", "warning");
      }
      if (validFiles.length === 0) return;

      setImageUploading(true); // Start upload indicator specifically for edit
      try {
        console.log(`Uploading ${validFiles.length} images for existing variant ${selectedVariant.id}...`);
        // Use handleImageUpload as it contains the API call and state update logic
        await handleImageUpload(validFiles); 

      } catch (error) {
        console.error("Error uploading images for variant:", error);
        // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }
      } finally {
        setImageUploading(false); // Ensure this resets even if handleImageUpload fails internally
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    disabled: isSubmitting || imageUploading || !selectedVariant || (typeof selectedVariant.id === 'string' && selectedVariant.id.startsWith('#')), // Check type
  });
  // --- End Dropzone Hooks ---
  
  // Handle switching between different view modes
  const handleGenerateVariants = async () => {
    // Switch to generated mode and fetch variants from API
    setIsLoading(true);
    setViewMode('generated');
    
    try {
      // This would be replaced with an actual API call to generate variants
      // based on the product attributes
      
      // For now, we'll just show an empty state
      setVariants([]);
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }    }
  };
  
  // Function to fetch product attributes from API
  const fetchProductAttributes = async (productId: number) => {
    setIsLoading(true);
    try {
      const response = await getProduct(productId);
      
      // First load variants from API response if available
      if (response?.data?.variants && response.data.variants.length > 0) {
        const apiVariants = response.data.variants.map((apiVariant: any) => {
          // Convert API variant attributes to the format we use in our component
          const attributes: Record<string, string> = {};
          if (apiVariant.variantAttributes && apiVariant.variantAttributes.length > 0) {
            apiVariant.variantAttributes.forEach((attr: any) => {
              if (attr.attribute && attr.term) {
                attributes[attr.attribute.name] = attr.term.name;
              }
            });
          }
          
          // Create our variant object
          return {
            id: apiVariant.id.toString(),
            slug: apiVariant.slug,
            price: apiVariant.price,
            stock: apiVariant.stock,
            // Map API status to capitalized state format
            status: apiVariant.status === 'active' ? 'Active' : 'Inactive', 
            stockStatus: mapApiStockStatusToForm(apiVariant.stock_status),
            depositPrice: apiVariant.discount_price,
            purchasePrice: apiVariant.purchase_price,
            lowStockThreshold: apiVariant.low_stock_threshold,
            weight: apiVariant.weight,
            length: apiVariant.length,
            width: apiVariant.width,
            height: apiVariant.height,
            barcode: apiVariant.barcode,
            description: apiVariant.description,
            attributes,
            // Map images if they exist
            images: apiVariant.variantImages 
              ? apiVariant.variantImages.map((img: any) => ({
                  id: img.id,
                  image_url: img.image_url,
                  is_primary: img.is_primary
                }))
              : [],
            errors: {}
          };
        });
        
        // Set loaded variants
        setVariants(apiVariants);
        if (apiVariants.length > 0) {
          setSelectedVariantIndex(0);
        }
      }
      
      if (response?.data?.productAttributeTerms) {
        // Group attributes and their terms
        const attributeGroups: Record<number, { name: string, terms: any[] }> = {};
        
        response.data.productAttributeTerms.forEach((term: any) => {
          if (term.used_in_variation && term.attribute && term.term) {
            if (!attributeGroups[term.attribute_id]) {
              attributeGroups[term.attribute_id] = {
                name: term.attribute.name,
                terms: []
              };
            }
            
            // Check if term is already in the group to avoid duplicates
            const existingTerm = attributeGroups[term.attribute_id].terms.find(
              t => t.id === term.term.id
            );
            
            if (!existingTerm) {
            attributeGroups[term.attribute_id].terms.push({
                id: term.term.id,
              name: term.term.name
            });
            }
          }
        });
        
        // Convert to array format for state
        const attributes = Object.entries(attributeGroups).map(([attrId, data]) => ({
          id: Number(attrId),
          name: data.name,
          used_in_variation: true
        }));
        
        // Set attribute terms
        const terms: Record<number, any[]> = {};
        Object.entries(attributeGroups).forEach(([attrId, data]) => {
          terms[Number(attrId)] = data.terms;
        });
        
        setProductAttributes(attributes);
        setAttributeTerms(terms);
        
        // Update attribute fields based on available attributes
        if (attributes.length > 0) {
          setAttributeFields(
            attributes.map(attr => ({
              name: attr.name,
              value: ''
            }))
          );
          
          // Generate combinations with a slight delay to ensure state is updated
          setTimeout(() => {
            const existingVariants = response?.data?.variants || [];
            generateAttributeCombinationsFromApi(attributes, terms, existingVariants);
          }, 500);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching product attributes:', error);
      // showSnackbar('Failed to load product attributes', 'error');
      setIsLoading(false);
    }
  };

  // Add this function to generate combinations and check which ones are already used
  const generateAttributeCombinationsFromApi = (
    attributes: any[], 
    attributeTermsMap: Record<number, any[]>,
    existingVariants: any[]
  ) => {
    if (attributes.length === 0) {
      return;
    }
    
    // Create a map of attribute IDs to terms for combination generation
    const attributeTermsForCombination: Record<number, any[]> = {};
    attributes.forEach(attr => {
      const attributeId = attr.id;
      if (attributeTermsMap[attributeId] && attributeTermsMap[attributeId].length > 0) {
        attributeTermsForCombination[attributeId] = attributeTermsMap[attributeId];
      }
    });
    
    // Get attribute IDs that have terms
    const attributeIds = Object.keys(attributeTermsForCombination).map(Number);
    
    if (attributeIds.length === 0) {
      return;
    }
    
    // Function to create combinations recursively
    const generateCombinations = (attrIndex: number, currentCombination: Record<string, any> = {}) => {
      // If we've processed all attributes, return the current combination
      if (attrIndex >= attributeIds.length) {
        return [currentCombination];
      }
      
      const results: Record<string, any>[] = [];
      const currentAttrId = attributeIds[attrIndex];
      const currentAttr = attributes.find(attr => attr.id === currentAttrId);
      const termsForCurrentAttr = attributeTermsForCombination[currentAttrId] || [];
      
      // For each term of the current attribute
      termsForCurrentAttr.forEach(term => {
        // Add this term to the current combination
        const newCombination = {
          ...currentCombination,
          [currentAttr?.name || `Attribute ${currentAttrId}`]: {
            term_id: term.id,
            attribute_id: currentAttrId,
            value: term.name
          }
        };
        
        // Generate combinations for the next attribute
        const nextCombinations = generateCombinations(attrIndex + 1, newCombination);
        results.push(...nextCombinations);
      });
      
      return results;
    };
    
    // Start the recursive combination generation
    const allCombinations = generateCombinations(0);
    
    if (allCombinations.length === 0) {
      return;
    }
    
    // Mark combinations as used if they match existing variants
    const usedCombos: Record<string, any>[] = [];
    
    // Function to check if a variant matches a combination
    const variantMatchesCombination = (variant: any, combination: Record<string, any>) => {
      // Check if the variant has the same attribute values as the combination
      for (const [attrName, attrValue] of Object.entries(combination)) {
        if (typeof attrValue !== 'object' || !attrValue.term_id) continue;
        
        // Find matching attribute in the variant
        const matchingAttr = variant.variantAttributes?.find((attr: any) => 
          attr.attribute?.name === attrName && attr.term_id === attrValue.term_id
        );
        
        if (!matchingAttr) return false;
      }
      
      return true;
    };
    
    // Check each combination against existing variants
    existingVariants.forEach((variant: any) => {
      const matchingCombination = allCombinations.find(combo => 
        variantMatchesCombination(variant, combo)
      );
      
      if (matchingCombination && !usedCombos.some(used => 
        isCombinationMatch(used, matchingCombination)
      )) {
        usedCombos.push(matchingCombination);
      }
    });
    
    // Set state
    setAllPossibleCombinations(allCombinations);
    setUsedCombinations(usedCombos);
    setAllCombinationsUsed(usedCombos.length === allCombinations.length);
    
    // If there are unused combinations, set up the form for the first unused one
    const unusedCombination = allCombinations.find(combo => 
      !usedCombos.some(used => isCombinationMatch(used, combo))
    );
    
    if (unusedCombination) {
      setPendingCombination(unusedCombination);
      setupFormForCombination(unusedCombination);
    } else {
      // All combinations are used
      setPendingCombination(null);
      setAllCombinationsUsed(true);
    }
  };

  // Add new function to fetch variants
  const fetchVariants = async (productId: number) => {
    setIsLoading(true);
    try {
      const response = await getProduct(productId);
      
      // First load variants from API response if available
      if (response?.data?.variants && response.data.variants.length > 0) {
        const apiVariants = response.data.variants.map((apiVariant: any) => {
          // Convert API variant attributes to the format we use in our component
          const attributes: Record<string, string> = {};
          if (apiVariant.variantAttributes && apiVariant.variantAttributes.length > 0) {
            apiVariant.variantAttributes.forEach((attr: any) => {
              if (attr.attribute && attr.term) {
                attributes[attr.attribute.name] = attr.term.name;
              }
            });
          }
          
          // Create our variant object
          return {
            id: apiVariant.id.toString(),
            slug: apiVariant.slug,
            price: apiVariant.price,
            stock: apiVariant.stock,
            status: apiVariant.status === 'active' ? 'Active' : 'Inactive',
            depositPrice: apiVariant.discount_price,
            purchasePrice: apiVariant.purchase_price,
            lowStockThreshold: apiVariant.low_stock_threshold,
            weight: apiVariant.weight,
            length: apiVariant.length,
            width: apiVariant.width,
            height: apiVariant.height,
            barcode: apiVariant.barcode,
            description: apiVariant.description,
            attributes,
            // Map images if they exist
            images: apiVariant.variantImages 
              ? apiVariant.variantImages.map((img: any) => ({
                  id: img.id,
                  image_url: img.image_url,
                  is_primary: img.is_primary
                }))
              : [],
            errors: {}
          };
        });
        
        // Set loaded variants
        setVariants(apiVariants);
        if (apiVariants.length > 0) {
          setSelectedVariantIndex(0);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching variants:', error);
      // showSnackbar('Failed to load variants', 'error');
      setIsLoading(false);
    }
  };

  // Modify handleAddManually to include variant fetching
  const handleAddManually = async () => {
    // Switch to manual mode
    setViewMode('manual');
    
    // Check if we have a product ID
    if (formData?.productId) {
      // First fetch variants
      await fetchVariants(formData.productId);
      
      // Then fetch attributes if needed
      if (productAttributes.length === 0) {
        await fetchProductAttributes(formData.productId);
      }
    }
    
    // Generate attribute combinations if needed
    if (allPossibleCombinations.length === 0) {
      generateAttributeCombinations();
    }
    
    // Reset the CREATE form
    resetCreateForm({ 
      slug: "",
      price: null as any,
      stock: null as any, 
      status: "active", 
      depositPrice: null,
      purchasePrice: null,
      lowStockThreshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null, 
      description: null,
      stockStatus: "In Stock",
    });
  };

  // Modify useEffect to handle initial load
  useEffect(() => {
    if (formData?.productId) {
      // If we're in manual mode, fetch both variants and attributes
      if (viewMode === 'manual') {
        fetchVariants(formData.productId);
        fetchProductAttributes(formData.productId);
      }
      // If we're not in manual mode, only fetch attributes
      else {
        fetchProductAttributes(formData.productId);
      }
    }
  }, [formData?.productId, viewMode]);

  // --- Add New Function: handleCreateVariantImageUpload ---
  const handleCreateVariantImageUpload = async (productId: string, variantId: string, files: File[]): Promise<VariantImage[]> => {
    if (files.length === 0 || !productId || !variantId) {
      console.log("Skipping image upload: No files or missing IDs.");
      return []; // No images to upload or missing IDs
    }

    setImageUploading(true); // Set uploading state
    const imageFormData = new FormData();
    files.forEach(file => imageFormData.append('files', file));

    try {
      const uploadResponse = await uploadVariantImages(productId, variantId, imageFormData);
      console.log("Image upload response for new variant:", uploadResponse);
      
      // --- Start Edit: Process response and update variant state ---
      let newImages: any[] = [];
      // Handle different possible response structures (similar to handleImageUpload)
      if (Array.isArray(uploadResponse)) {
        newImages = uploadResponse;
      } else if (uploadResponse && typeof uploadResponse === "object") {
        if (uploadResponse.data?.variant?.variantImages) {
          newImages = uploadResponse.data.variant.variantImages;
        } else if (uploadResponse.variant?.variantImages) {
          newImages = uploadResponse.variant.variantImages;
        } else if (uploadResponse.data?.variantImages) {
          newImages = uploadResponse.data.variantImages;
        } else if (uploadResponse.data && Array.isArray(uploadResponse.data)) {
          newImages = uploadResponse.data;
        }
      }

      // Ensure all images have the expected properties
      const processedImages: VariantImage[] = newImages.map((img: any) => ({
        id: Number(img.id || img.image_id),
        image_url: img.image_url || img.url || img.image_url,
        is_primary: !!img.is_primary
      }));

      if (processedImages.length > 0) {
        // Update the specific variant in the state with the uploaded images
        setVariants(currentVariants => {
          const variantIndex = currentVariants.findIndex(v => String(v.id) === String(variantId));
          if (variantIndex === -1) {
            console.warn("Could not find newly created variant in state to update images");
            return currentVariants; // Variant not found, return original state
          }
          
          const updatedVariants = [...currentVariants];
          const currentVariant = updatedVariants[variantIndex];
          
          // Ensure the images array exists
          const existingImages = currentVariant.images || [];
          
          // Add the new images (could add de-duplication if needed)
          updatedVariants[variantIndex] = {
            ...currentVariant,
            images: [...existingImages, ...processedImages]
          };
          
          return updatedVariants;
        });
        console.log(`Added ${processedImages.length} images to variant ${variantId}`);
      } else {
        console.warn("Could not extract uploaded images from response:", uploadResponse);
        showSnackbar("Variant created, but image response was unclear.", "warning");
      }
      // --- End Edit: Process response and update variant state ---

    } catch (uploadError) {
      console.error("Error uploading images for new variant:", uploadError);
      showSnackbar("Variant created, but failed to upload images", "error");
      return []; // Return empty array on upload error
    } finally {
      setImageUploading(false); // Reset uploading state regardless of outcome
      // Clear pending images only after successful or failed upload attempt
      setPendingCreateImages([]);
      pendingCreateImagePreviews.forEach(URL.revokeObjectURL); // Clean up blob URLs
      setPendingCreateImagePreviews([]);
    }
    // Add a default return for edge cases where try/catch might be skipped (though unlikely here)
    return []; // Ensure a value is always returned
  };
  // --- End Function ---

  // Add form submission handler (for CREATE form)
  const onSubmit = async (data: VariantFormData) => {
    // --- Start Add: Explicitly trigger validation for CREATE form --- 
    const isValidForm = await triggerCreate(); // <-- Use triggerCreate
    if (!isValidForm) {
        showSnackbar("Please fix the errors in the form", "error");
        setIsSubmitting(false); // Ensure submission state is reset
        return; // Stop submission if validation fails
    }
    // --- End Add ---
    
    setIsSubmitting(true);
    
    try {
      if (!pendingCombination) {
        showSnackbar("No pending combination to process", "error");
        setIsSubmitting(false);
        return;
      }
      
      // Helper function (can be moved outside if used elsewhere)
      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num; // Return null if not a valid number
      };
      
      // --- EDIT: Build API payload only with non-null values --- 
      interface ProductVariant {
        slug: string;
        price: number;
        stock: number;
        status: 'active' | 'inactive';
        attributes: Array<{ attribute_id: number; term_id: number; }>;
        [key: string]: any; // Allow additional optional properties
      }

      const variantPayload: ProductVariant = {
        // Always include required fields
        slug: data.slug,
        price: transformOptionalNumber(data.price) || 0, // Ensure non-null
        stock: transformOptionalNumber(data.stock) || 0, // Ensure non-null
        status: data.status as 'active' | 'inactive',
        attributes: Object.values(pendingCombination)
          .filter(value => typeof value === 'object' && value.attribute_id && value.term_id)
          .map(value => ({
            attribute_id: Number((value as any).attribute_id),
            term_id: Number((value as any).term_id)
          }))
      };

      // Add optional fields only if they have values
      const optionalFields = {
        discount_price: transformOptionalNumber(data.depositPrice),
        purchase_price: transformOptionalNumber(data.purchasePrice),
        low_stock_threshold: transformOptionalNumber(data.lowStockThreshold),
        weight: transformOptionalNumber(data.weight),
        length: transformOptionalNumber(data.length),
        width: transformOptionalNumber(data.width),
        height: transformOptionalNumber(data.height),
        barcode: data.barcode?.trim() || undefined,
        description: data.description?.trim() || undefined
      };

      // Only add non-null/undefined optional fields to payload
      Object.entries(optionalFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          variantPayload[key] = value;
        }
      });

      // Call the API to create the variant
      let newVariantApiResponse: any = null; 
      if (formData?.productId) {
        console.log("Creating variant with payload:", { variants: [variantPayload] });
        newVariantApiResponse = await createProductVariants(formData.productId, {
          variants: [variantPayload]
        });
        console.log("Create variant API response:", newVariantApiResponse);
      } else {
        showSnackbar("Product ID not found", "error");
        setIsSubmitting(false);
        return;
      }
      
      const createdVariantData = newVariantApiResponse?.data?.[0]; // Get the created variant data
      const createdVariantId = createdVariantData?.id; 

      let uploadedImages: VariantImage[] = [];

      if (!createdVariantId) {
        console.error("Could not extract created variant ID from API response:", newVariantApiResponse);
        showSnackbar("Variant created, but could not get ID. Images might not be uploaded.", "warning");
      } else {
        if (pendingCreateImages.length > 0 && formData?.productId) {
          uploadedImages = await handleCreateVariantImageUpload(String(formData.productId), String(createdVariantId), pendingCreateImages);
        }
      }
      
      // --- EDIT: Create local state variant using simple types from FORM DATA --- 
      const newVariant: Variant = {
        id: createdVariantId ? String(createdVariantId) : `#TEMP-${Date.now()}`,
        slug: data.slug,
        attributes: Object.entries(pendingCombination).reduce((acc, [key, value]) => {
          if (typeof value === 'object' && value.value) {
            acc[key] = value.value;
          }
          return acc;
        }, {} as Record<string, string>),
        price: transformOptionalNumber(data.price),
        stock: transformOptionalNumber(data.stock),
        status: data.status === 'active' ? 'Active' : 'Inactive', 
        depositPrice: transformOptionalNumber(data.depositPrice),
        purchasePrice: transformOptionalNumber(data.purchasePrice),
        lowStockThreshold: transformOptionalNumber(data.lowStockThreshold), // Use correct casing
        weight: transformOptionalNumber(data.weight),
        length: transformOptionalNumber(data.length),
        width: transformOptionalNumber(data.width),
        height: transformOptionalNumber(data.height),
        barcode: data.barcode || null,
        description: data.description?.trim() || null,
        images: uploadedImages, 
        pendingImages: [],
        errors: {}
      };
      // --- END EDIT --- 
      
      const updatedVariants = [...variants, newVariant];
      setVariants(updatedVariants);
      setSelectedVariantIndex(updatedVariants.length - 1);
      
      if (pendingCombination) {
        const newUsedCombinations = [...usedCombinations, pendingCombination];
        setUsedCombinations(newUsedCombinations);
        setAllCombinationsUsed(newUsedCombinations.length === allPossibleCombinations.length);
      
        const nextCombination = allPossibleCombinations.find(combo => 
          !newUsedCombinations.some(used => isCombinationMatch(used, combo))
        );
      
        if (nextCombination) {
          setPendingCombination(nextCombination);
          setupFormForCombination(nextCombination);
        } else {
          setPendingCombination(null);
          setAllCombinationsUsed(true);
        }
      }
      
      showSnackbar("Variant created successfully", "success");
    } catch (error) {
      console.error("Error creating variant:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }    } finally {
      setIsSubmitting(false);
      setImageUploading(false); 
    }
  };

  // Filter variants based on search term
  const filteredVariants = variants.filter(variant => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in ID
    if (variant.id.toLowerCase().includes(searchLower)) return true;
    
    // Search in slug
    if (variant.slug.toLowerCase().includes(searchLower)) return true;
    
    // Search in attributes
    for (const [key, value] of Object.entries(variant.attributes)) {
      if (
        key.toLowerCase().includes(searchLower) ||
        value.toLowerCase().includes(searchLower)
      ) {
        return true;
      }
    }
    
    return false;
  });

  // Function to add a new attribute field
  const addAttributeField = () => {
    setAttributeFields([...attributeFields, { name: '', value: '' }]);
  };
  
  // Function to update an attribute field
  const updateAttributeField = (index: number, field: 'name' | 'value', value: string) => {
    const updatedFields = [...attributeFields];
    updatedFields[index][field] = value;
    setAttributeFields(updatedFields);
  };
  
  // Function to remove an attribute field
  const removeAttributeField = (index: number) => {
    const updatedFields = [...attributeFields];
    updatedFields.splice(index, 1);
    setAttributeFields(updatedFields);
  };
  
  // Function to apply attributes to the selected variant
  const applyAttributes = () => {
    if (attributeFields.length === 0) {
      // showSnackbar("No attributes available", "error");
      return;
    }
    
    // Check if all required fields are filled
    const hasEmptyRequiredFields = attributeFields.some(field => !field.value);
    if (hasEmptyRequiredFields) {
      showSnackbar("Please select a value for each attribute", "error");
      return;
    }
    
    // Create attributes object
    const attributes: Record<string, string> = {};
    attributeFields.forEach(field => {
      if (field.name && field.value) {
        attributes[field.name] = field.value;
      }
    });
    
    // If we have a selected variant, update it
    if (selectedVariant) {
      const updatedVariants = [...variants];
      updatedVariants[selectedVariantIndex] = {
        ...updatedVariants[selectedVariantIndex],
        attributes
      };
      
      setVariants(updatedVariants);
      showSnackbar("Attributes applied to variant", "success");
    } else {
      // Otherwise create a new variant
      // --- EDIT: Correctly initialize new variant --- 
      const newVariant: Variant = {
        id: `#${Math.floor(Math.random() * 10000000)}`,
        slug: generateSlugFromAttributes(attributes),
        attributes,
        price: null, // Initialize as null
        stock: null, // Initialize as null
        status: 'Active',
        depositPrice: null,
        purchasePrice: null,
        lowStockThreshold: null,
        weight: null,
        length: null,
        width: null,
        height: null,
        barcode: null,
        description: null,
        images: [],
        pendingImages: [],
        errors: {}
      };
       // --- END EDIT --- 
      
      setVariants([...variants, newVariant]); // Type should now match
      setSelectedVariantIndex(variants.length);
      showSnackbar("New variant created", "success");
    }
  };
  
  // Function to generate combinations of attribute terms
  const generateAttributeCombinations = () => {
    if (productAttributes.length === 0) {
      // showSnackbar("No attributes available", "error");
      return;
    }
    
    // Create a map of attribute IDs to terms
    const attributeTermsMap: Record<number, any[]> = {};
    productAttributes.forEach(attr => {
      const attributeId = attr.id;
      if (attributeTerms[attributeId] && attributeTerms[attributeId].length > 0) {
        attributeTermsMap[attributeId] = attributeTerms[attributeId];
      }
    });
    
    // Get attribute IDs that have terms
    const attributeIds = Object.keys(attributeTermsMap).map(Number);
    
    if (attributeIds.length === 0) {
      showSnackbar("No attribute terms found", "error");
      return;
    }
    
    // Function to create combinations recursively
    const generateCombinations = (attrIndex: number, currentCombination: Record<string, any> = {}) => {
      // If we've processed all attributes, return the current combination
      if (attrIndex >= attributeIds.length) {
        return [currentCombination];
      }
      
      const results: Record<string, any>[] = [];
      const currentAttrId = attributeIds[attrIndex];
      const currentAttr = productAttributes.find(attr => attr.id === currentAttrId);
      const termsForCurrentAttr = attributeTermsMap[currentAttrId] || [];
      
      // For each term of the current attribute
      termsForCurrentAttr.forEach(term => {
        // Add this term to the current combination
        const newCombination = {
          ...currentCombination,
          [currentAttr?.name || `Attribute ${currentAttrId}`]: {
            term_id: term.id,
            attribute_id: currentAttrId,
            value: term.name
          }
        };
        
        // Generate combinations for the next attribute
        const nextCombinations = generateCombinations(attrIndex + 1, newCombination);
        results.push(...nextCombinations);
      });
      
      return results;
    };
    
    // Start the recursive combination generation
    const allCombinations = generateCombinations(0);
    
    if (allCombinations.length === 0) {
      showSnackbar("No combinations generated", "warning");
      return;
    }
    
    // Calculate which combinations are already used by checking existing variants
    const usedCombos = [];
    
    variants.forEach(variant => {
      const matchingCombination = allCombinations.find(combo => {
        // Check if all combination attributes match the variant's attributes
        for (const [attrName, attrValue] of Object.entries(combo)) {
          if (typeof attrValue !== 'object' || !attrValue.value) continue;
          
          const variantAttrValue = variant.attributes[attrName];
          if (variantAttrValue !== (attrValue as any).value) {
            return false;
          }
        }
        return true;
      });
      
      if (matchingCombination) {
        usedCombos.push(matchingCombination);
      }
    });
    
    // Set state
    setAllPossibleCombinations(allCombinations);
    setUsedCombinations(usedCombos);
    setAllCombinationsUsed(usedCombos.length === allCombinations.length);
    
    // If there are unused combinations, set up the form for the first unused one
    const unusedCombination = allCombinations.find(combo => 
      !usedCombos.some(used => isCombinationMatch(used, combo))
    );
    
    if (unusedCombination) {
      setPendingCombination(unusedCombination);
      setupFormForCombination(unusedCombination);
    } else {
      // All combinations are used
      setPendingCombination(null);
      setAllCombinationsUsed(true);
    }
    
    return allCombinations;
  };
  
  // Add function to check if a combination is already used
  const isCombinationUsed = (combination: Record<string, any>) => {
    return usedCombinations.some(usedCombo => isCombinationMatch(usedCombo, combination));
  };

  // Add function to check if two combinations match
  const isCombinationMatch = (combo1: Record<string, any>, combo2: Record<string, any>) => {
    if (!combo1 || !combo2) return false;
    
    // Check if all attributes in combo1 match in combo2
    for (const [key, value] of Object.entries(combo1)) {
      // Skip non-attribute keys
      if (key === 'id' || key === 'slug' || key === 'price' || key === 'stock') continue;
      
      // For attribute fields
      const combo1Value = typeof value === 'object' ? value.term_id : value;
      const combo2Value = combo2[key] ? (typeof combo2[key] === 'object' ? combo2[key].term_id : combo2[key]) : undefined;
      
      if (combo1Value != combo2Value) {
        return false;
      }
    }
    
    return true;
  };

  // Add function to set up the form for a specific combination
  const setupFormForCombination = (combination: Record<string, any>) => {
    // Update attribute fields based on the combination
    const newAttributeFields = [];
    
    for (const [key, value] of Object.entries(combination)) {
      if (typeof value === 'object' && value.attribute_id && value.term_id) {
        newAttributeFields.push({
          name: key,
          value: value.value
        });
      }
    }
    
    setAttributeFields(newAttributeFields);
    
    // Generate a slug based on the attribute values
    const slug = Object.entries(combination)
      .filter(([key, value]) => typeof value === 'object' && value.value)
      .map(([_, value]) => (value as any).value)
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    
    // Reset the CREATE form with default values and the generated slug
    resetCreateForm({ // <-- CORRECTED: Use resetCreateForm
      slug: slug,
      price: null as any,
      // --- EDIT: Reset complex fields to undefined for create --- 
      stock: null as any,
      status: "active",
      stockStatus: "In Stock",
      depositPrice: null,
      purchasePrice: null,
      lowStockThreshold: null, // Use correct casing
      weight: null,
      length: null,
      width: null,
      height: null,
      // --- END EDIT ---
      barcode: null,
      description: null,
    });
  };

  // Add function to check remaining combinations
  const getRemainingCombinationsCount = () => {
    return allPossibleCombinations.length - usedCombinations.length;
  };
  
  // Helper function to generate a slug from attributes
  const generateSlugFromAttributes = (attributes: Record<string, string>) => {
    // Create a slug from attribute values, joined with hyphens
    return Object.values(attributes)
      .filter(value => value) // Filter out empty values
      .join('-')
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove any characters that aren't lowercase letters, numbers, or hyphens
      .substring(0, 50); // Limit length
  };

  // Handle setting an image as primary
  const handleSetPrimaryImage = (imageId: number) => {
    if (!selectedVariant) return;
    
    const productId = searchParams.get('productId');
    const variantId = selectedVariant.id;
    
    if (!productId || !variantId) {
      showSnackbar("Missing product or variant ID", "error");
      return;
    }
    
    // First update UI for immediate feedback
    const updatedVariants = [...variants];
    const currentImages = updatedVariants[selectedVariantIndex].images || [];
    
    // Store original state for error recovery
    const originalVariants = [...variants];
    
    // Update all images to set only the selected one as primary
    const updatedImages = currentImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    
    updatedVariants[selectedVariantIndex] = {
      ...updatedVariants[selectedVariantIndex],
      images: updatedImages
    };
    
    setVariants(updatedVariants);
    
    // Then call the API
    setVariantPrimaryImage(String(productId), String(variantId), String(imageId))
      .then(() => {
        showSnackbar("Primary image updated", "success");
      })
      .catch(error => {
        console.error("Error setting primary image:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }        
        // Restore original state if API call fails
        setVariants(originalVariants);
      });
  };

  // Handle deleting an image
  const handleDeleteImage = (imageId: number) => {
    if (!selectedVariant) return;
    
    // Check if this is a temporary image (negative ID)
    if (imageId < 0) {
      // Just remove from local state without API call
      const updatedVariants = [...variants];
      const currentImages = updatedVariants[selectedVariantIndex].images || [];
      
      // Find the temporary image to remove its preview URL
      const imageToRemove = currentImages.find(img => img.id === imageId);
      if (imageToRemove && typeof imageToRemove.image_url === 'string' && imageToRemove.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.image_url);
      }
      
      // Remove the image from local state
      updatedVariants[selectedVariantIndex] = {
        ...updatedVariants[selectedVariantIndex],
        images: currentImages.filter(img => img.id !== imageId),
        pendingImages: (updatedVariants[selectedVariantIndex].pendingImages || [])
          .filter((_, idx) => idx !== currentImages.findIndex(img => img.id === imageId))
      };
      
      setVariants(updatedVariants);
      return;
    }
    
    const productId = searchParams.get('productId');
    const variantId = selectedVariant.id;
    
    if (!productId || !variantId) {
      showSnackbar("Missing product or variant ID", "error");
      return;
    }
    
    // --- Start Edit: Add logic for auto-setting new primary --- 
    // Keep a copy of the original state for error recovery
    const originalVariants = JSON.parse(JSON.stringify(variants)); // Deep copy
    const currentVariantIndex = variants.findIndex(v => v.id === selectedVariant.id);
    if (currentVariantIndex === -1) return; 

    const currentImages = variants[currentVariantIndex].images || [];
    const imageToDelete = currentImages.find(img => img.id === imageId);
    const wasPrimary = imageToDelete?.is_primary || false; // Check if it was primary BEFORE optimistic update
    // --- End Edit --- 
    
    // First update the UI to give immediate feedback (Optimistic Update)
    const updatedVariants = [...variants];
    // --- Start Edit: Use correct index for optimistic update --- 
    const updatedImages = updatedVariants[currentVariantIndex].images || [];
    updatedVariants[currentVariantIndex] = {
      ...updatedVariants[currentVariantIndex],
      images: updatedImages.filter(img => img.id !== imageId)
    };
    // --- End Edit --- 
    
    setVariants(updatedVariants);
    
    // Then call the API
    deleteVariantImage(String(productId), String(variantId), String(imageId))
      .then(() => {
        showSnackbar("Image deleted successfully", "success");
        
        // --- Start Edit: Auto-set new primary logic --- 
        if (wasPrimary) {
          // Use functional update to get the absolute latest state
          setVariants(currentState => {
              const variantIdx = currentState.findIndex(v => v.id === variantId);
              if (variantIdx === -1) return currentState; // Should not happen

              const remainingImages = currentState[variantIdx].images || [];
              if (remainingImages.length > 0) {
                  const newPrimaryImageId = remainingImages[0].id;
                  // Check if the new candidate is valid and not already primary (it shouldn't be)
                  if (newPrimaryImageId && !remainingImages[0].is_primary) { 
                      console.log(`Auto-setting image ${newPrimaryImageId} as new primary for variant ${variantId}`);
                      // Use setTimeout to ensure this runs after the current state update/render cycle
                      setTimeout(() => handleSetPrimaryImage(newPrimaryImageId), 0); 
                  }
              }
              // Return the state as is; handleSetPrimaryImage will trigger its own update
              return currentState; 
          });
        }
        // --- End Edit --- 
      })
      .catch(error => {
        console.error("Error deleting image:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }        
        // Restore the image in the UI if the API call fails
        setVariants(originalVariants);
      });
  };

  // --- Add function to handle variant updates --- 
  const handleUpdateVariant = async (data: VariantFormData) => { 
    const variantId = selectedVariant?.id;

    if (!variantId || variantId.startsWith('#TEMP')) {
      showSnackbar("Cannot update unsaved variant", "error");
      return;
    }

    const productId = searchParams.get('productId');
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const originalVariant = selectedVariant;
      if (!originalVariant) {
          showSnackbar("Original variant data not found for comparison.", "error");
          setIsSubmitting(false);
          return;
      }
      
      // Retrieve original attributes from selectedVariant state for API payload
      const attributePayload = Object.entries(originalVariant.attributes)
        .map(([attrName, termName]) => {
          const attribute = productAttributes.find(attr => attr.name === attrName);
          if (!attribute) return null;
          const terms = attributeTerms[attribute.id] || [];
          const term = terms.find(t => t.name === termName);
          if (!term) return null;
          return { attribute_id: attribute.id, term_id: term.id };
        })
        .filter(item => item !== null) as { attribute_id: number; term_id: number }[];

      // Helper function (can be moved outside if used elsewhere)
      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num; // Return null if not a valid number
      };
       const transformOptionalBarcode = (value: string | null | undefined): string | null => {
          const trimmedValue = typeof value === 'string' ? value.trim() : null;
          if (!trimmedValue) return null;
          // Return null if validation fails, otherwise the trimmed value
          return trimmedValue.length >= 3 && trimmedValue.length <= 50 ? trimmedValue : null; 
      };
      
      // --- EDIT: Build API payload conditionally using simple types & correct names --- 
      const apiPayload: Record<string, any> = {};
      let hasChanges = false;

      // Required fields (compare simple types)
      if (data.slug !== originalVariant.slug) { apiPayload.slug = data.slug; hasChanges = true; }
      if (transformOptionalNumber(data.price) !== transformOptionalNumber(originalVariant.price)) { apiPayload.price = transformOptionalNumber(data.price); hasChanges = true; }
      if (transformOptionalNumber(data.stock) !== transformOptionalNumber(originalVariant.stock)) { apiPayload.stock = transformOptionalNumber(data.stock); hasChanges = true; }
      
      // --- EDIT: Check and include status if changed --- 
      const formStatusApi = data.status as 'active' | 'inactive'; // Value from form
      const originalStatusApi = (originalVariant.status === 'Active' ? 'active' : 'inactive');
      if (formStatusApi !== originalStatusApi) { 
        apiPayload.status = formStatusApi; 
        hasChanges = true; 
      }
      // --- END EDIT --- 
      
      // Compare attributes (simple JSON comparison)
      const currentAttributePayloadString = JSON.stringify(attributePayload.sort((a,b) => a.attribute_id - b.attribute_id));
      const originalAttributePayloadString = JSON.stringify((originalVariant.variantAttributes || []).map(a => ({attribute_id: a.attribute_id, term_id: a.term_id})).sort((a,b) => a.attribute_id - b.attribute_id));
      if (currentAttributePayloadString !== originalAttributePayloadString) { apiPayload.attributes = attributePayload; hasChanges = true; }

      // --- EDIT: Check and include stock_status if changed --- 
      const formStockStatusApi = mapFormStockStatusToApi(data.stockStatus); // Map form value to API format
      const originalStockStatusApi = mapFormStockStatusToApi(originalVariant.stockStatus); // Map original state value to API format
      
      if (formStockStatusApi !== originalStockStatusApi) {
        apiPayload.stock_status = formStockStatusApi; 
        hasChanges = true;
      }
      // --- END EDIT --- 

      // Optional fields (compare simple types, use API names)
      const currentDeposit = transformOptionalNumber(data.depositPrice);
      if (currentDeposit !== transformOptionalNumber(originalVariant.depositPrice)) { apiPayload.discount_price = currentDeposit; hasChanges = true; }

      const currentPurchase = transformOptionalNumber(data.purchasePrice);
      if (currentPurchase !== transformOptionalNumber(originalVariant.purchasePrice)) { apiPayload.purchase_price = currentPurchase; hasChanges = true; }

      const currentLowStock = transformOptionalNumber(data.lowStockThreshold); // Use correct casing for form data
      if (currentLowStock !== transformOptionalNumber(originalVariant.lowStockThreshold)) { apiPayload.low_stock_threshold = currentLowStock; hasChanges = true; } // API uses snake_case

      const currentWeight = transformOptionalNumber(data.weight);
      if (currentWeight !== transformOptionalNumber(originalVariant.weight)) { apiPayload.weight = currentWeight; hasChanges = true; }

      const currentLength = transformOptionalNumber(data.length);
      if (currentLength !== transformOptionalNumber(originalVariant.length)) { apiPayload.length = currentLength; hasChanges = true; }
      
      const currentWidth = transformOptionalNumber(data.width);
      if (currentWidth !== transformOptionalNumber(originalVariant.width)) { apiPayload.width = currentWidth; hasChanges = true; }

      const currentHeight = transformOptionalNumber(data.height);
      if (currentHeight !== transformOptionalNumber(originalVariant.height)) { apiPayload.height = currentHeight; hasChanges = true; }
      
      const currentBarcode = transformOptionalBarcode(data.barcode); // Use validated/transformed value
      if (currentBarcode !== (originalVariant.barcode || null)) { apiPayload.barcode = currentBarcode; hasChanges = true; }
      
      const currentDescription = data.description?.trim() || null;
      if (currentDescription !== (originalVariant.description || null)) { apiPayload.description = currentDescription; hasChanges = true; }
      // --- END EDIT ---

      if (!hasChanges) {
          showSnackbar("No changes detected to update.", "info");
          setIsSubmitting(false);
          return;
      }

      console.log("Updating variant (changed fields): ", variantId, "Payload:", apiPayload);

      const numericProductId = Number(productId);
      const numericVariantId = Number(variantId);

      if (isNaN(numericProductId) || isNaN(numericVariantId)) {
          showSnackbar("Invalid Product or Variant ID for update.", "error");
          setIsSubmitting(false);
          return;
      }

      await updateProductVariant(numericProductId, numericVariantId, apiPayload as UpdateProductVariantRequest);

      showSnackbar("Variant updated successfully", "success");

      // --- EDIT: Update local state using simple types from FORM DATA --- 
      setVariants(prev => prev.map(v => { 
          if (v.id === variantId) {
            const updatedVariant: Variant = { 
              ...v, 
              slug: data.slug,
              price: transformOptionalNumber(data.price), 
              stock: transformOptionalNumber(data.stock), 
              status: (data.status === 'active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive', 
              // --- Add stockStatus update here --- 
              stockStatus: data.stockStatus as 'In Stock' | 'Out of Stock' | 'Back Order', 
              // --- End Add --- 
              depositPrice: transformOptionalNumber(data.depositPrice),
              purchasePrice: transformOptionalNumber(data.purchasePrice),
              lowStockThreshold: transformOptionalNumber(data.lowStockThreshold), // Use correct casing
              weight: transformOptionalNumber(data.weight),
              length: transformOptionalNumber(data.length),
              width: transformOptionalNumber(data.width),
              height: transformOptionalNumber(data.height),
              barcode: transformOptionalBarcode(data.barcode),
              description: data.description?.trim() || null,
              // Keep existing variantAttributes and images unless specifically updated elsewhere
              variantAttributes: v.variantAttributes, 
              images: v.images,       
            }; 
            console.log(`[handleUpdateVariant] Updating LOCAL state for variant ${variantId}:`, updatedVariant);
            return updatedVariant;
          } else {
            return v; 
          }
        })
      );
      // --- END EDIT --- 

    } catch (error) {
      console.error("Error updating variant:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }    } finally {
      setIsSubmitting(false); 
    }
  };

  // --- Add function to handle confirmed variant deletion --- 
  const handleConfirmDeleteVariant = async () => {
    if (!variantToDeleteId) return; // Ensure variantToDeleteId is accessible

    // Check if it's a temporary ID (doesn't exist on backend yet)
    if (variantToDeleteId.startsWith('#TEMP')) {
      // Ensure selectedVariant is accessible if used here for comparison
      const currentSelectedId = selectedVariant?.id;
      const deletedIndex = variants.findIndex(v => v.id === variantToDeleteId);
      setVariants(prevVariants => prevVariants.filter(v => v.id !== variantToDeleteId)); // Ensure setVariants and variantToDeleteId are accessible
      showSnackbar("Unsaved variant removed", "success"); // Ensure showSnackbar is accessible
      setIsDeleteDialogOpen(false); // Ensure setIsDeleteDialogOpen is accessible
      setVariantToDeleteId(null); // Ensure setVariantToDeleteId is accessible
      // Reset selection if the deleted one was selected
      if(currentSelectedId === variantToDeleteId) { 
        setSelectedVariantIndex(Math.max(0, deletedIndex - 1)); // Ensure setSelectedVariantIndex is accessible
      }
      return;
    }

    setIsSubmitting(true); // Ensure setIsSubmitting is accessible
    try {
      await deleteProductVariant(Number(variantToDeleteId)); 

      const deletedIndex = variants.findIndex(v => v.id === variantToDeleteId);
      
      const newVariants = variants.filter(v => v.id !== variantToDeleteId);
      setVariants(newVariants); // Ensure setVariants is accessible
      
      showSnackbar("Variant deleted successfully", "success");
      
      if (newVariants.length === 0) {
        setSelectedVariantIndex(0);
        // resetEditForm(); // <-- Use resetEditForm (clear edit form if no variants left)
      } else if (deletedIndex >= 0) {
        setSelectedVariantIndex(Math.max(0, deletedIndex - 1));
      }

    } catch (error) {
      console.error("Error deleting variant:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }    } finally {
      setIsDeleteDialogOpen(false);
      setVariantToDeleteId(null);
      setIsSubmitting(false);
    }
  };

  // --- Add Handler for Bulk Update Form Submission --- 
  const onBulkSubmit: SubmitHandler<BulkUpdateFormData> = async (data) => {
    console.log("Bulk update data:", data);
    setIsBulkSubmitting(true);

    // Filter out fields that were not changed (are undefined)
    // Explicitly type the accumulator and the final result
    const changes = Object.entries(data).reduce<Partial<BulkUpdateFormData>>((acc, [key, value]) => {
      // --- Start Edit: Handle complex price object --- 
      if (key === 'price' || key === 'depositPrice' || key === 'purchasePrice') {
        // Type guard to ensure value is the price object or undefined
        // Use a more specific type assertion for the price-like objects
        const complexValue = value as BulkUpdateFormData['price'] | BulkUpdateFormData['depositPrice'] | BulkUpdateFormData['purchasePrice'];
        // Only include price if type AND value are provided
        if (complexValue && complexValue.type && (complexValue.value !== undefined && complexValue.value !== null)) {
          acc[key] = {
            type: complexValue.type,
            value: Number(complexValue.value), // Ensure value is number
            is_percentage: !!complexValue.is_percentage // Ensure boolean, default false
          };
        }
      } 
      // --- End Edit --- 
      // Handle other fields (non-price)
      else if (value !== undefined && value !== null && value !== '') { // Check for actual values
        // Special handling for numeric fields potentially needing casting
        if ([ 'stock', 'lowStockThreshold', 'weight', 'length', 'width', 'height'].includes(key)) {
          acc[key] = Number(value); // Ensure numeric values are numbers
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as Partial<BulkUpdateFormData>); // Use Partial type for changes

    if (Object.keys(changes).length === 0) {
      showSnackbar("No changes were specified for bulk update.", "warning");
      setIsBulkSubmitting(false);
      return;
    }

    // Prepare payloads for API update (assuming an API endpoint exists for bulk update)
    // This part is hypothetical as there's no bulk update API function imported/used yet
    // You would typically map each variant to an update payload
    const updatePayloads = variants.map(variant => ({
      id: Number(variant.id), // Assuming variant ID is numeric for API
      ...changes // Apply the filtered changes
      // Note: You might need to adjust field names (e.g., depositPrice to discount_price) for the API
      // e.g., discount_price: changes.depositPrice, purchase_price: changes.purchasePrice etc.
    }));

    console.log("Bulk update API payloads (hypothetical):", updatePayloads);

    // --- Simulate API Call --- 
    // Replace this with your actual bulk update API call
    try {
      // Example: await bulkUpdateProductVariants(productId, updatePayloads);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // Update local state after successful API call
      setVariants(prevVariants => 
        prevVariants.map(variant => {
          const updatedFields: Partial<Variant> = {};
          // Map the changes back to the Variant state structure
          // Ensure type consistency when updating state
          if (changes.price && changes.price.type === 'set') { 
            // This is a simplified example for local state update.
            // A real implementation would need to handle increase/decrease/percentage logic.
            updatedFields.price = Number(changes.price.value); 
          } 
          if (changes.stock !== undefined) updatedFields.stock = Number(changes.stock);
          if (changes.status !== undefined) updatedFields.status = changes.status === 'active' ? 'Active' : 'Inactive'; // Ensure capitalized
          if (changes.depositPrice && changes.depositPrice.type === 'set') { 
             updatedFields.depositPrice = Number(changes.depositPrice.value); 
          }
          if (changes.purchasePrice && changes.purchasePrice.type === 'set') { 
             updatedFields.purchasePrice = Number(changes.purchasePrice.value); 
          }
          if (changes.lowStockThreshold !== undefined) updatedFields.lowStockThreshold = Number(changes.lowStockThreshold);
          if (changes.weight !== undefined) updatedFields.weight = Number(changes.weight);
          if (changes.length !== undefined) updatedFields.length = Number(changes.length);
          if (changes.width !== undefined) updatedFields.width = Number(changes.width);
          if (changes.height !== undefined) updatedFields.height = Number(changes.height);
          if (changes.barcode !== undefined) updatedFields.barcode = String(changes.barcode);
          if (changes.description !== undefined) updatedFields.description = String(changes.description);
          // Note: stockStatus is form-only, update based on actual stock if needed
          
          return { ...variant, ...updatedFields };
        })
      );

      showSnackbar("Bulk update applied successfully!", "success");
      resetBulkForm(); // Reset the bulk form after successful submission
    } catch (error) { 
      console.error("Bulk update failed:", error);
  // Check for error structure properly
      if (error?.errors && error?.errors.length > 0) {
        showSnackbar(error.errors[0]?.msg, "error");
      } else if (
        error?.error &&
        Array.isArray(error?.error) &&
        error.error.length > 0
      ) {
        showSnackbar(error.error[0]?.message, "error");
      } else if (error?.message) {
        showSnackbar(error.message, "error");
      } else {
        const errorMessage = "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }    } finally {
      setIsBulkSubmitting(false);
    }
  };
  // --- End Handler --- 

  // Add these useEffect hooks back in after the fetchVariants function
  // Add a new useEffect to handle variant initialization
  useEffect(() => {
    // If we have attributes but no combinations, generate them
    if (productAttributes.length > 0 && allPossibleCombinations.length === 0) {
      generateAttributeCombinationsFromApi(productAttributes, attributeTerms, variants);
    }
    
    // If viewMode changes to manual, check if we need to initialize combinations
    if (viewMode === 'manual' && productAttributes.length > 0 && allPossibleCombinations.length === 0) {
      generateAttributeCombinationsFromApi(productAttributes, attributeTerms, variants);
    }
  }, [productAttributes, viewMode, attributeTerms, variants]);

  // Add back the useEffect for resetting edit form
  useEffect(() => {
    console.log(`[useEffect resetEditForm] Running for index: ${selectedVariantIndex}`);
    // Explicitly check if variants exist and index is valid before resetting
    if (variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length) {
      const currentSelectedVariant = variants[selectedVariantIndex];
      // Log the variant data being used
      console.log('[useEffect resetEditForm] currentSelectedVariant:', JSON.stringify(currentSelectedVariant, null, 2)); 
      
      const resetData = { 
        slug: currentSelectedVariant.slug ?? null,
        price: currentSelectedVariant.price ?? null, 
        stock: currentSelectedVariant.stock ?? null, 
        status: (currentSelectedVariant.status === 'Active' ? 'active' : 'inactive') as 'active' | 'inactive',
        // Ensure stockStatus uses the value from the current state directly
        stockStatus: currentSelectedVariant.stockStatus || 'In Stock', 
        depositPrice: currentSelectedVariant.depositPrice ?? null, 
        purchasePrice: currentSelectedVariant.purchasePrice ?? null, 
        lowStockThreshold: currentSelectedVariant.lowStockThreshold ?? null, 
        weight: currentSelectedVariant.weight ?? null, 
        length: currentSelectedVariant.length ?? null, 
        width: currentSelectedVariant.width ?? null, 
        height: currentSelectedVariant.height ?? null, 
        barcode: currentSelectedVariant.barcode ?? null, 
        description: currentSelectedVariant.description ?? null, 
      };
      // Log the data being sent to reset
      console.log('[useEffect resetEditForm] Resetting form with data:', JSON.stringify(resetData, null, 2));
      resetEditForm(resetData);
    } else {
      console.log('[useEffect resetEditForm] No valid variant selected, resetting to defaults.');
      // Reset EDIT form to simple null/defaults 
      resetEditForm({ 
        slug: "", 
        price: null, 
        stock: null, 
        status: "active",
        depositPrice: null, 
        purchasePrice: null,
        stockStatus: "In Stock", 
        lowStockThreshold: null, 
        weight: null, 
        length: null, 
        width: null, 
        height: null, 
        barcode: null, 
        description: null
      });
    }
  }, [variants, selectedVariantIndex, resetEditForm, variants[selectedVariantIndex]]);

  return (
    <div className="w-full">      
      {/* Button Toolbar with Search Field */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button 
            className={`py-2 px-4 border font-medium rounded-lg ${
              viewMode === 'generated' 
                ? 'bg-[#006C38] text-white' 
                : 'border-[#006C38] text-[#006C38] hover:bg-green-50'
            }`}
            onClick={handleGenerateVariants}
            disabled={isLoading}
          >
            {isLoading && viewMode === 'generated' ? 'Generating...' : 'Generate variations'}
          </button>
          <button 
            className={`py-2 px-4 border font-medium rounded-lg ${
              viewMode === 'manual' 
                ? 'bg-[#006C38] text-white' 
                : 'border-[#006C38] text-[#006C38] hover:bg-green-50'
            }`}
            onClick={handleAddManually}
            disabled={isLoading}
          >
            Add manually
          </button>
          {/* <button 
            className={`py-2 px-4 border font-medium rounded-lg ${
              viewMode === 'bulk' 
                ? 'bg-[#006C38] text-white' 
                : 'border-[#006C38] text-[#006C38] hover:bg-green-50'
            }`}
            onClick={() => {
              setViewMode('bulk');
              resetBulkForm();
            }}
            disabled={isLoading}
          >
            Bulk Update
          </button> */}
        </div>

        {/* Search Bar - Moved to right side */}
        {/* {variants.length > 0 && viewMode !== 'initial' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center w-[250px] relative border rounded-full">
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full py-2 px-3 outline-none bg-white rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-2 flex items-center">
                <SearchIcon className="text-gray-500 mr-1" />
                <TuneIcon className="text-gray-500" />
              </div>
            </div> */}

            {/* Reset button - Already checked viewMode !== 'initial' in outer conditional */}
            {/* <button 
              className="py-2 px-4 bg-[#FF0004] text-white rounded hover:bg-red-600"
              onClick={() => {
                if (confirm('Are you sure you want to reset? All unsaved variants will be lost.')) {
                  handleAddManually();
                }
              }}
              disabled={isLoading}
            >
              Remove All
            </button>
          </div>
        )} */}

        {/* Show only Remove All button when search bar is hidden */}
        {(!variants.length || viewMode === 'bulk') && viewMode !== 'initial' && (
          <button 
            className="py-2 px-4 bg-[#FF0004] text-white rounded hover:bg-red-600"
            onClick={() => {
              if (confirm('Are you sure you want to reset? All unsaved variants will be lost.')) {
                handleAddManually();
              }
            }}
            disabled={isLoading}
          >
            Remove All
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <FuseLoading />
          <span className="ml-2">Loading variants...</span>
        </div>
      )}

      {/* Show UI based on view mode */}
      {!isLoading && viewMode !== 'initial' && (
        <>
          {/* Conditional Rendering using View Components */} 
          {viewMode === 'manual' && (
            <ManualVariantView
              // Add key prop based on selected variant ID
              key={selectedVariant ? selectedVariant.id : 'manual-view-no-variant'} 
              // EDIT Form Props
              editControl={editControl}
              handleEditSubmit={handleEditSubmit}
              editErrors={editFormState.errors}
              editFormState={editFormState} // Pass full edit form state
              setEditValue={setEditValue}
              // CREATE Form Props
              createControl={createControl}
              handleCreateSubmit={handleCreateSubmit}
              createErrors={createFormState.errors}
              createFormState={createFormState} // Pass full create form state
              setCreateValue={setCreateValue}
              // Submit Handlers (passed separately)
              onSubmitCreate={onSubmit} // Pass the original combined onSubmit (now create logic)
              onSubmitUpdate={handleUpdateVariant} // Pass the specific update handler
              // Other general props (remove form-specific ones if not needed by ManualVariantView directly)
              // reset={resetEditForm} // Reset handled by specific functions now
              // watch={watchEdit} // Watch can be derived from control if needed
              // trigger={triggerEdit} // Trigger handled by specific functions now
              // Variant & Attribute State
              variants={variants}
              selectedVariant={selectedVariant}
              selectedVariantIndex={selectedVariantIndex}
              setSelectedVariantIndex={setSelectedVariantIndex}
              setVariants={setVariants} // Pass setVariants function
              productAttributes={productAttributes}
              attributeTerms={attributeTerms}
              attributeFields={attributeFields}
              setAttributeFields={setAttributeFields}
              pendingCombination={pendingCombination}
              setPendingCombination={setPendingCombination}
              allPossibleCombinations={allPossibleCombinations}
              usedCombinations={usedCombinations}
              isCombinationMatch={isCombinationMatch} // Pass helper
              setupFormForCombination={setupFormForCombination}
              allCombinationsUsed={allCombinationsUsed}
              filteredVariants={filteredVariants} // Pass filtered list
              // Loading & Submission States
              isSubmitting={isSubmitting}
              imageUploading={imageUploading}
              // Image Handling
              pendingCreateImages={pendingCreateImages}
              setPendingCreateImages={setPendingCreateImages}
              pendingCreateImagePreviews={pendingCreateImagePreviews}
              setPendingCreateImagePreviews={setPendingCreateImagePreviews}
              createGetRootProps={createGetRootProps}
              createGetInputProps={createGetInputProps}
              createIsDragActive={createIsDragActive}
              editGetRootProps={editGetRootProps}
              editGetInputProps={editGetInputProps}
              editIsDragActive={editIsDragActive}
              handleSetPrimaryImage={handleSetPrimaryImage}
              handleDeleteImage={handleDeleteImage}
              // Dialog State & Handlers
              setVariantToDeleteId={setVariantToDeleteId}
              setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              // Other
              showSnackbar={showSnackbar}
              // --- Add missing props back --- 
              isUpdating={isUpdating}     
              isEditImageUploading={isEditImageUploading} 
              // --- End add ---
            />
          )}
          
          {viewMode === 'generated' && (
            // Assuming GenerateVariantsView mainly needs loading state for now
            <GenerateVariantsView isLoading={isLoading}  allCombinationsUsed={allCombinationsUsed}
/> 
            // Pass other relevant props if needed, e.g., generatedCombinations, actions
          )}

          {viewMode === 'bulk' && (
            <BulkUpdateView
              control={bulkControl} // Use bulk form control
              handleSubmit={handleBulkSubmit} // Use bulk form handleSubmit
              onSubmit={onBulkSubmit} // Pass the bulk submit logic
              watch={watchBulk} // Use bulk form watch
              setValue={bulkSetValue} // Use bulk form setValue
              errors={bulkFormState.errors} // Use bulk form errors
              formState={bulkFormState} // Pass the full bulk form state object
              isSubmitting={isBulkSubmitting} // Pass bulk submitting state
            />
          )}
          
          {/* --- REMOVED INLINE JSX FOR VIEWS --- */}
        </>
      )}
      {/* --- Confirmation Dialog --- */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-variant-dialog-title"
        aria-describedby="delete-variant-dialog-description"
      >
        <DialogTitle id="delete-variant-dialog-title">{"Confirm Variant Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-variant-dialog-description">
            Are you sure you want to delete this variant? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteVariant} color="error" autoFocus disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} color="inherit"/> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VariantManager