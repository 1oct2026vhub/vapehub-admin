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

// --- START: Imports for Initial View --- 
import VariantDisplayCard from '../components/VariantDisplayCard';
import VariantDetailsForm, { VariantFormData as DetailsFormDataType } from '../components/VariantDetailsForm'; 
// --- END: Imports for Initial View ---

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

// --- EDIT: Align Variant type with BulkUpdateView's EditableVariantData expectations ---
interface Variant {
  id: number; // Changed from string
  product_id: number; // Added
  slug: string;
  regular_price: string; // Changed from number | null, API often returns string
  stock: number; // Changed from number | null
  status: string; // Changed from 'Active' | 'Inactive' to e.g., "active"
  stock_status: string; // Changed from UI enum to API string e.g., "in_stock", MADE REQUIRED
  discount_price: string | null; // Renamed from depositPrice, changed type, MADE NON-OPTIONAL
  purchase_price: string | null; // Changed type, MADE NON-OPTIONAL
  low_stock_threshold: number | null; // Kept as number | null, MADE NON-OPTIONAL
  weight: string | null; // Changed type, MADE NON-OPTIONAL
  length: string | null; // Changed type, MADE NON-OPTIONAL
  width: string | null; // Changed type, MADE NON-OPTIONAL
  height: string | null; // Changed type, MADE NON-OPTIONAL
  barcode: string | null; // Kept as string | null, MADE NON-OPTIONAL
  description: string | null; // Kept as string | null, MADE NON-OPTIONAL
  sku?: string | null; // Added, kept optional as in EditableVariantData
  attributes: Record<string, string>; // Simplified key-value for display/filtering in VariantManager
  variantAttributes: VariantAttribute[]; // Detailed attributes for API/editing, MADE NON-OPTIONAL
  variantImages: VariantImage[]; // Renamed from images, MADE NON-OPTIONAL
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
  regular_price: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Regular Price"),
      z.number()
        .positive("Regular Price must be greater than zero")
        .max(9999999.99, "Regular Price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Regular Price can have at most 2 decimal places" }
        ),
      z.null().refine(() => false, "Regular Price is required"), // Enforce non-null
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
      // Treat cleared input as 0 to avoid triggering other field validations
      if (val === "") return 0;
      if (val === null || val === undefined) return null; // Allow null
      const parsed = Number(val);
      return isNaN(parsed) ? "NaN" : parsed;
    },
    z.union([
      z.literal("NaN").refine(() => false, "Please enter a valid number for Sale price"),
      z.number()
        .min(0, "Sale price cannot be negative")
        .max(9999999.99, "Sale price exceeds maximum limit")
        .refine(
          (val) => {
            const str = val.toString();
            return !str.includes(".") || str.split(".")[1].length <= 2;
          },
          { message: "Sale price can have at most 2 decimal places" }
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
      const v = typeof val === 'string' ? val.trim() : val;
      if (v === "" || v === null || v === undefined) return undefined; // Return undefined for empty values
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed; // Return undefined for invalid numbers
    },
    z.number()
      .int("Low stock threshold must be a whole number")
      .min(0, "Low stock threshold cannot be negative")
      .optional()
      .nullable()
  ),
  weight: z.preprocess(
    (val) => {
      const v = typeof val === 'string' ? val.trim() : val;
      if (v === "" || v === null || v === undefined) return undefined; // Return undefined for empty values
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed; // Return undefined for invalid numbers
    },
    z.number().min(0, "Weight cannot be negative").optional().nullable()
  ),
  length: z.preprocess(
    (val) => {
      const v = typeof val === 'string' ? val.trim() : val;
      if (v === "" || v === null || v === undefined) return undefined; // Return undefined for empty values
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed; // Return undefined for invalid numbers
    },
    z.number().min(0, "Length cannot be negative").optional().nullable()
  ),
  width: z.preprocess(
    (val) => {
      const v = typeof val === 'string' ? val.trim() : val;
      if (v === "" || v === null || v === undefined) return undefined; // Return undefined for empty values
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed; // Return undefined for invalid numbers
    },
    z.number().min(0, "Width cannot be negative").optional().nullable()
  ),
  height: z.preprocess(
    (val) => {
      const v = typeof val === 'string' ? val.trim() : val;
      if (v === "" || v === null || v === undefined) return undefined; // Return undefined for empty values
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed; // Return undefined for invalid numbers
    },
    z.number().min(0, "Height cannot be negative").optional().nullable()
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
  regular_price: z.object({
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

// Helper function to convert API stock status to display format for the edit form
const getValidStockStatus = (status: string | null | undefined): "In Stock" | "Out of Stock" | "Back Order" => {
  const lowerStatus = status?.toLowerCase();
  switch (lowerStatus) {
    case "in_stock":
    case "in stock":
      return "In Stock";
    case "out_of_stock":
    case "out of stock":
      return "Out of Stock";
    case "back_order":
    case "back order":
    case "back_to_order":
      return "Back Order";
    default:
      return "In Stock"; // Default fallback
  }
};

// Define props interface if not already defined, or add isActive to existing one
interface VariantManagerProps {
  isActive: boolean;
}

// --- START: Add basic helper functions --- 
const mapVariantForDisplayCard = (variant: Variant) => {
  let mappedAttrs: Array<{ id: number | string; attribute_name: string; term_name: string }> = [];

  if (variant.variantAttributes && variant.variantAttributes.length > 0) {
    mappedAttrs = variant.variantAttributes.map((attr, index) => {
      const attributeName = attr.attribute?.name;
      const termName = attr.term?.name;
      return {
        id: attr.term?.id || attr.term_id || `attr-${index}`,
        attribute_name: attributeName || 'Attribute N/A (from detailed)',
        term_name: termName || 'Term N/A (from detailed)',
      };
    });
  } else if (variant.attributes && Object.keys(variant.attributes).length > 0) {
    mappedAttrs = Object.entries(variant.attributes).map(([key, value], index) => ({
      id: `simple-attr-${variant.id}-${index}`,
      attribute_name: key,
      term_name: String(value), // Ensure term_name is a string
    }));
  }

  const attributesFormatted = mappedAttrs.reduce((acc, attr) => {
    acc[attr.attribute_name] = attr.term_name;
    return acc;
  }, {} as Record<string, string>);

  // Normalize status for the display card to ensure it's lowercase 'active' or 'inactive'
  const displayCardStatus = variant.status?.toString().toLowerCase() === 'active' ? 'active' : 'inactive';


  return {
    id: variant.id,
    slug: variant.slug,
    price: String(variant.regular_price), // Ensure price is a string for the card
    stock: Number(variant.stock),   // Ensure stock is a number for the card
    status: displayCardStatus,    // Pass the normalized lowercase status
    variantImages: variant.variantImages || [],
    variantAttributes: mappedAttrs,
    attributesFormatted: attributesFormatted
  };
};

const mapVariantForDetailsForm = (variant: Variant | null) => {
  if (!variant) return null;
  return {
    id: variant.id,
    slug: variant.slug,
    variantImages: variant.variantImages || [],
    // Add other fields needed by VariantDetailsForm if any, e.g., attributes for display
  };
};
const VariantManager: React.FC<VariantManagerProps> = ({ isActive }) => { // Add isActive prop
  const { showSnackbar } = useSnackbar();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'initial' | 'generated' | 'manual' | 'bulk'>('initial');
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
  // --- Add State for Remove All Dialog --- 
  const [isRemoveAllDialogOpen, setIsRemoveAllDialogOpen] = useState<boolean>(false);
  // --- Add state to track if variants have been generated ---
  const [hasGeneratedVariants, setHasGeneratedVariants] = useState<boolean>(false);
  
  // --- START: Add ref for original data (needed for DetailsForm later) ---
  const originalSelectedVariantRef = useRef<Variant | null>(null);
  // --- END: Add ref ---

  // --- START: Add ref for form variant ID ---
  const formVariantIdRef = useRef<number | null>(null);
  // --- END: Add ref for form variant ID ---

  // --- Add Ref and Effect for Resetting View Mode --- 
  const prevIsActive = useRef<boolean>(isActive);

  useEffect(() => {
    // Check if the tab just became active (transitioned from false to true)
    if (isActive && !prevIsActive.current) {
      setViewMode('initial');
      // Optionally reset other states if needed when tab becomes active
      // setSearchTerm(''); 
      // setSelectedVariantIndex(0); 
    }
    // Update the previous value for the next render
    prevIsActive.current = isActive;
  }, [isActive]); // Depend only on isActive
  // --- End Add --- 
  
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
    getValues, // Ensure getValues is destructured here
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    mode: "onSubmit", 
    // --- EDIT: Use simple null/defaults matching simplified schema ---
    defaultValues: { 
      slug: "",
      regular_price: null as any, 
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
    mode: "onSubmit", 
    // --- EDIT: Use simple null/defaults matching simplified schema ---
    defaultValues: { 
      slug: "",
      regular_price: null as any, 
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
      regular_price: undefined,
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
    const permanentImages = currentVariants[selectedVariantIndex].variantImages?.filter(
      img => !tempIds.includes(Number(img.id))
    ) || [];
    
    // Update the variant without the temporary images
    currentVariants[selectedVariantIndex] = {
      ...currentVariants[selectedVariantIndex],
      variantImages: permanentImages
    };
    
    setVariants(currentVariants);
  };

  // Handle file upload for variant images
  const handleImageUpload = async (files: File[]) => {
    // This function now ONLY handles uploads for EXISTING variants via editDropzone
    if (files.length === 0 || !selectedVariant) {
      console.warn("handleImageUpload called without files or selectedVariant");
      return; 
    } 
    
    // Import helper validation functions from VariantDetailsForm component
    const { validateImageDimensions, validateFile } = await import('../components/VariantDetailsForm');
    
    // Create array to hold files with validation results
    const filesWithValidation: { file: File; validationError?: string }[] = [];
    
    // Validate each file before proceeding
    for (const file of files) {
      const validationError = await validateFile(file);
      filesWithValidation.push({ file, validationError });
    }
    
    // Filter out valid files for upload
    const validFiles = filesWithValidation.filter(f => !f.validationError).map(f => f.file);
    
    if (validFiles.length === 0) {
      showSnackbar("Image upload failed, please check the image dimensions and file type.", "warning");
      return;
    }
 
    setImageUploading(true);
    
    // Store temp IDs to track them later
    const tempIds: number[] = [];
    
    // Get current form values to preserve them
    const currentFormValues = getValues();

    // Create preview URLs temporarily while uploading
    const previewImages = filesWithValidation.map((fileInfo, idx) => {
      const tempId = -1 * (Date.now() + idx); // Temporary ID as negative number
      tempIds.push(tempId);
      return {
        id: tempId,
        image_url: URL.createObjectURL(fileInfo.file),
        is_primary: false,
        validationError: fileInfo.validationError // Include validation error if any
      };
    });
    
    // Make a DEEP COPY of the variants to avoid state mutation issues
    const updatedVariants = variants.map(variant => ({...variant}));
    
    // Get the variant at the selected index
    const currentVariant = updatedVariants[selectedVariantIndex];
    
    // Merge current form values with variant data to preserve unsaved changes
    const variantWithFormValues = mergeFormValuesWithVariantData(currentVariant, currentFormValues);
    
    // Make a deep copy of selected variant's images array or initialize it
    const currentImages = variantWithFormValues.variantImages ? 
      [...variantWithFormValues.variantImages] : 
      [];
    
    // Add preview images to the variant
    updatedVariants[selectedVariantIndex] = {
      ...variantWithFormValues,
      variantImages: [...currentImages, ...previewImages],
      pendingImages: [
        ...(variantWithFormValues.pendingImages || []),
        ...validFiles
      ]
    };
    
    // Update state with preview images
    setVariants(updatedVariants);
    
    // Get the product ID and variant ID for the API call
    const productId = searchParams ? searchParams.get('productId') : null;
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
    
    // Don't proceed with uploading files that have validation errors
    if (validFiles.length === 0) {
      setImageUploading(false);
      return; // Keep the UI showing validation errors but don't attempt API call
    }
    
    // Create FormData for API upload (only valid files)
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
          
          // Only remove temporary images that don't have validation errors
          const validTempIds = tempIds.filter((_, idx) => !filesWithValidation[idx].validationError);
          removeTemporaryImages(validTempIds);
          
          // Also reset uploading state
          setImageUploading(false); 
          return;
        }
        
        // Create a fresh copy of variants to avoid stale state issues
        // Need to use functional update to guarantee latest state
        setVariants(currentVariants => {
            // Get latest form values again to ensure we have the most up-to-date data
            const latestFormValues = getValues();

            const latestVariants = [...currentVariants];
            // Check if the index is still valid
            if (selectedVariantIndex >= latestVariants.length) {
                console.warn("Selected variant index out of bounds after upload.");
                return currentVariants; // Return original state if index is invalid
            }
            
            // Get the current variant and merge with latest form values
            const currentVariant = latestVariants[selectedVariantIndex];
            const variantWithLatestFormValues = mergeFormValuesWithVariantData(currentVariant, latestFormValues);
            
            // Remove any temporary preview images (negative IDs that we tracked)
            const permanentImages = variantWithLatestFormValues.variantImages?.filter(
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
            
            // Update the variant with the deduplicated images while preserving form values
            latestVariants[selectedVariantIndex] = {
              ...variantWithLatestFormValues,
              variantImages: [...processedPermanentImages, ...processedUniqueNewImages],
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
      if (!selectedVariant) { // ID is number, startsWith removed
        showSnackbar("Please select an existing variant to upload images.", "warning");
        return;
      }
      const productId = searchParams ? searchParams.get('productId') : null;
      if (!productId) {
        return;
      }

      if (acceptedFiles.length === 0) return;

      setImageUploading(true); // Start upload indicator specifically for edit
      try {
        // Use handleImageUpload as it contains the API call and state update logic
        await handleImageUpload(acceptedFiles); 

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
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true,
    disabled: isSubmitting || imageUploading || !selectedVariant, // ID is number, startsWith removed
  });
  // --- End Dropzone Hooks ---
  
  // Handle switching between different view modes
  const handleGenerateVariants = async () => {
    // Switch to generated mode and fetch variants from API
    setIsLoading(true);
    setViewMode('generated');
    setHasGeneratedVariants(true); // Set flag to indicate variants have been generated
    
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
            id: Number(apiVariant.id), // Store as number
            product_id: Number(productId), // Populate product_id
            slug: apiVariant.slug,
            regular_price: String(apiVariant.regular_price), // Store as string
            stock: Number(apiVariant.stock),   // Store as number
            status: apiVariant.status, // Store API string (e.g., "active")
            stock_status: apiVariant.stock_status, 
            discount_price: apiVariant.discount_price !== null && apiVariant.discount_price !== undefined ? String(apiVariant.discount_price) : null,
            purchase_price: apiVariant.purchase_price !== null && apiVariant.purchase_price !== undefined ? String(apiVariant.purchase_price) : null,
            low_stock_threshold: apiVariant.low_stock_threshold !== null && apiVariant.low_stock_threshold !== undefined ? Number(apiVariant.low_stock_threshold) : null,
            weight: apiVariant.weight !== null && apiVariant.weight !== undefined ? String(apiVariant.weight) : null,
            length: apiVariant.length !== null && apiVariant.length !== undefined ? String(apiVariant.length) : null,
            width: apiVariant.width !== null && apiVariant.width !== undefined ? String(apiVariant.width) : null,
            height: apiVariant.height !== null && apiVariant.height !== undefined ? String(apiVariant.height) : null,
            barcode: apiVariant.barcode || null,
            description: apiVariant.description || null,
            sku: apiVariant.sku || null,
            attributes: apiVariant.attributes ? Object.entries(apiVariant.attributes).reduce((acc, [key, val]) => {
              acc[key] = String(val); // Ensure value is string
              return acc;
            }, {} as Record<string, string>) : {},
            variantAttributes: apiVariant.variantAttributes || [], // REVERTED: Direct assignment, assuming API provides full structure
            variantImages: apiVariant.variantImages?.map((img: any) => ({ 
                  id: Number(img.id),
                  image_url: img.image_url,
                  is_primary: img.is_primary
                })) || [],
            errors: {}
          };
        });
        
        // Set loaded variants
        setVariants(apiVariants);
        if (apiVariants.length > 0) {
          setSelectedVariantIndex(0);
          setHasGeneratedVariants(true); // Set flag when variants are loaded
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
    } finally {
      setIsLoading(false); // Ensure loading state is reset
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
            regular_price: apiVariant.regular_price,
            stock: apiVariant.stock,
            status: apiVariant.status === 'active' ? 'Active' : 'Inactive',
            stock_status: mapApiStockStatusToForm(apiVariant.stock_status),
            discount_price: apiVariant.discount_price,
            purchase_price: apiVariant.purchase_price,
            low_stock_threshold: apiVariant.low_stock_threshold,
            weight: apiVariant.weight,
            length: apiVariant.length,
            width: apiVariant.width,
            height: apiVariant.height,
            barcode: apiVariant.barcode,
            description: apiVariant.description,
            attributes,
            // Map images if they exist
            variantImages: apiVariant.variantImages 
              ? apiVariant.variantImages.map((img: any) => ({
                  id: img.id,
                  image_url: img.image_url,
                  is_primary: img.is_primary
                }))
              : [],
            errors: {}
          };
        });
        
        setVariants(apiVariants);
        if (apiVariants.length > 0) {
          setSelectedVariantIndex(0);
          setHasGeneratedVariants(true); 
        }
      } else {
        // If no variants are returned, clear the local state
        setVariants([]);
        setSelectedVariantIndex(0);
        // setHasGeneratedVariants(false); // Optional: consider if this should be reset
      }
      // setIsLoading(false); // Moved to finally
    } catch (error) {
      console.error('Error fetching variants:', error);
      // showSnackbar('Failed to load variants', 'error');
      // setIsLoading(false); // Moved to finally
    } finally {
      setIsLoading(false); // Ensure loading state is reset
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
      regular_price: null as any,
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
      // Always fetch attributes as they might be needed by various views or for context
      fetchProductAttributes(formData.productId);

      // Fetch variants if in 'initial' or 'manual' mode, 
      // or if variants haven't been loaded yet (e.g., first load before viewMode is set by user action)
      if (viewMode === 'initial' || viewMode === 'manual' || variants.length === 0) {
        fetchVariants(formData.productId);
      }
    } else {
      // Optionally clear variants if product ID is removed
      // setVariants([]);
      // setSelectedVariantIndex(0);
    }
  }, [formData?.productId, viewMode]); // Dependencies

  // --- Add New Function: handleCreateVariantImageUpload ---
  const handleCreateVariantImageUpload = async (productId: string, variantId: string, files: File[]): Promise<VariantImage[]> => {
    let uploadedVariantImages: VariantImage[] = []; // Declare return variable at the start

    if (files.length === 0 || !productId || !variantId) {
      return uploadedVariantImages; // Return empty array if no files or IDs
    }

    // Import helper validation functions
    const { validateFile } = await import('../components/VariantDetailsForm');
    
    // Create array to hold files with validation results
    const filesWithValidation: { file: File; validationError?: string }[] = [];
    
    // Validate each file before proceeding
    for (const file of files) {
      const validationError = await validateFile(file);
      filesWithValidation.push({ file, validationError });
    }
    
    // Filter out valid files for upload
    const validFiles = filesWithValidation.filter(f => !f.validationError).map(f => f.file);
    
    if (validFiles.length === 0) {
      return uploadedVariantImages; // Return empty array if no valid files
    }

    setImageUploading(true); // Set uploading state
    const imageFormData = new FormData();
    validFiles.forEach(file => imageFormData.append('files', file));

    try {
      const uploadResponse = await uploadVariantImages(productId, variantId, imageFormData);
      
      let newImagesFromAPI: any[] = []; // Changed from newImages to newImagesFromAPI to avoid conflict if VariantImage[] is also named newImages
      // Handle different possible response structures (similar to handleImageUpload)
      if (Array.isArray(uploadResponse)) {
        newImagesFromAPI = uploadResponse;
      } else if (uploadResponse && typeof uploadResponse === "object") {
        if (uploadResponse.data?.variant?.variantImages) {
          newImagesFromAPI = uploadResponse.data.variant.variantImages;
        } else if (uploadResponse.variant?.variantImages) {
          newImagesFromAPI = uploadResponse.variant.variantImages;
        } else if (uploadResponse.data?.variantImages) {
          newImagesFromAPI = uploadResponse.data.variantImages;
        } else if (uploadResponse.data && Array.isArray(uploadResponse.data)) {
          newImagesFromAPI = uploadResponse.data;
        }
      }

      // Ensure all images have the expected properties
      const processedImages: VariantImage[] = newImagesFromAPI.map((img: any) => ({
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
          const existingImages = currentVariant.variantImages || [];
          
          // Add the new images (could add de-duplication if needed)
          updatedVariants[variantIndex] = {
            ...currentVariant,
            variantImages: [...existingImages, ...processedImages]
          };
          
          return updatedVariants;
        });
        uploadedVariantImages = processedImages; // Assign to the variable that will be returned
      } else {
        console.warn("Could not extract uploaded images from response:", uploadResponse);
        showSnackbar("Variant created, but image response was unclear.", "warning");
        // uploadedVariantImages remains []
      }
      // --- End Edit: Process response and update variant state ---

    } catch (uploadError) {
      console.error("Error uploading images for new variant:", uploadError);
      showSnackbar("Variant created, but failed to upload images", "error");
      // uploadedVariantImages remains [] in case of error, will be returned after finally
    } finally {
      setImageUploading(false); // Reset uploading state regardless of outcome
      // Clear pending images only after successful or failed upload attempt
      setPendingCreateImages([]);
      pendingCreateImagePreviews.forEach(URL.revokeObjectURL); // Clean up blob URLs
      setPendingCreateImagePreviews([]);
    }
    return uploadedVariantImages; // Ensure a value (potentially empty array) is always returned
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

      // Helper function for price fields - returns 0 instead of null for empty values
      const transformPriceNumber = (value: number | string | null | undefined): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num; // Return 0 if not a valid number
      };
      
      // --- EDIT: Build API payload only with non-null values --- 
      // Type for the variant payload to be sent to the API
      interface ProductVariant {
        slug: string;
        price: number;
        stock: number;
        status: 'active' | 'inactive';
        attributes: Array<{ attribute_id: number; term_id: number; }>;
        [key: string]: any; // Allow additional optional properties
      }

      // Base payload with required fields
      const variantPayload: ProductVariant = {
        slug: data.slug,
        price: Number(data.regular_price),
        stock: Number(data.stock),
        status: data.status,
        attributes: Object.values(pendingCombination)
          .filter(value => typeof value === 'object' && value.attribute_id && value.term_id)
          .map(value => ({
            attribute_id: Number((value as any).attribute_id),
            term_id: Number((value as any).term_id)
          }))
      };

      // Define optional fields separately - use transformPriceNumber for price fields
      const optionalFields = {
        discount_price: transformPriceNumber(data.depositPrice),
        purchase_price: transformPriceNumber(data.purchasePrice),
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
        newVariantApiResponse = await createProductVariants(formData.productId, {
          variants: [variantPayload]
        });
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
        id: createdVariantId ? Number(createdVariantId) : 0,
        product_id: Number(formData.productId),
        slug: data.slug,
        regular_price: String(transformOptionalNumber(data.regular_price)),
        stock: Number(transformOptionalNumber(data.stock)),
        status: data.status === 'active' ? 'Active' : 'Inactive',
        stock_status: data.stockStatus === 'In Stock' ? 'in_stock' : data.stockStatus === 'Out of Stock' ? 'out_of_stock' : 'back_order',
        discount_price: String(transformPriceNumber(data.depositPrice)),
        purchase_price: String(transformPriceNumber(data.purchasePrice)),
        low_stock_threshold: transformOptionalNumber(data.lowStockThreshold),
        weight: String(transformOptionalNumber(data.weight)),
        length: String(transformOptionalNumber(data.length)),
        width: String(transformOptionalNumber(data.width)),
        height: String(transformOptionalNumber(data.height)),
        barcode: data.barcode?.trim() || null,
        description: data.description?.trim() || null,
        sku: null,
        attributes: Object.fromEntries(Object.entries(pendingCombination).map(([key, value]) => [key, String((value as any).value)])), // Ensure value is string
        variantAttributes: Object.entries(pendingCombination).map(([attrName, comboValue]) => ({ 
          attribute_id: Number((comboValue as any).attribute_id),
          term_id: Number((comboValue as any).term_id),
          term: { id: Number((comboValue as any).term_id), name: String((comboValue as any).value) }, // Ensure name is string
          attribute: {
            id: Number((comboValue as any).attribute_id),
            name: attrName // Correctly use attrName (the key/name of the attribute from pendingCombination)
          }
        })),
        variantImages: uploadedImages,
        pendingImages: [],
        errors: {}
      };
      // --- END EDIT --- 
      
      const updatedVariants = [...variants, newVariant];
      setVariants(updatedVariants);
      setSelectedVariantIndex(updatedVariants.length - 1);
      setHasGeneratedVariants(true); // Set flag when a new variant is created
      
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
    // --- Add Logging --- 
    
    if (!searchTerm) {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    let match = false;

    // Search in ID
    const idMatch = variant.id?.toString().toLowerCase().includes(searchLower);
    if (idMatch) {
      match = true;
    }
    
    // Search in slug
    const slugMatch = !match && variant.slug?.toLowerCase().includes(searchLower);
    if (slugMatch) {
      match = true;
    }

    // Search in Price (convert to string)
    const priceMatch = !match && variant.regular_price?.toString().includes(searchLower);
    if (priceMatch) {
      match = true;
    }
    
    // Search in Stock (convert to string)
    const stockMatch = !match && variant.stock?.toString().includes(searchLower);
    if (stockMatch) {
      match = true;
    }
    
    // Search in Barcode
    const barcodeMatch = !match && variant.barcode?.toLowerCase().includes(searchLower);
    if (barcodeMatch) {
      match = true;
    }

    // Search in Description
    const descriptionMatch = !match && variant.description?.toLowerCase().includes(searchLower);
    if (descriptionMatch) {
      match = true;
    }
    
    // Search in simple attributes (both name and term value) 
    // This is for the flattened attributes structure (attributes: Record<string, string>)
    if (!match) {
      try {
        for (const [key, value] of Object.entries(variant.attributes || {})) { 
          const keyMatch = key.toLowerCase().includes(searchLower);
          const valueMatch = value?.toString().toLowerCase().includes(searchLower); 
          if (keyMatch || valueMatch) {
            match = true;
            break; // Exit loop once match is found in attributes
          }
        }
      } catch (e) {
         console.error(`[Search Filter] Error processing attributes for variant ${variant.id}:`, e);
      }
    }

    // Search in detailed variantAttributes 
    // This checks the more detailed attribute structure with term/attribute objects
    if (!match && Array.isArray(variant.variantAttributes)) {
      try {
        for (const attr of variant.variantAttributes) {
          // Check attribute name
          if (attr.attribute?.name?.toLowerCase().includes(searchLower)) {
            match = true;
            break;
          }
          
          // Check term name
          if (attr.term?.name?.toLowerCase().includes(searchLower)) {
            match = true;
            break;
          }

          // Check attribute.name + term.name combination (like "Flavour: Cherry Lemon Mints")
          if (attr.attribute?.name && attr.term?.name) {
            const combinedValue = `${attr.attribute.name}: ${attr.term.name}`.toLowerCase();
            if (combinedValue.includes(searchLower)) {
              match = true;
              break;
            }
          }
        }
      } catch (e) {
        console.error(`[Search Filter] Error processing variantAttributes for variant ${variant.id}:`, e);
      }
    }
    
    return match;
    // --- End Logging Additions ---
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
        id: 0,
        product_id: Number(formData.productId),
        slug: generateSlugFromAttributes(attributes),
        regular_price: String(null),
        stock: Number(null),
        status: 'Active',
        stock_status: 'in_stock',
        discount_price: String(null),
        purchase_price: String(null),
        low_stock_threshold: null,
        weight: String(null),
        length: String(null),
        width: String(null),
        height: String(null),
        barcode: null,
        description: null,
        sku: null,
        attributes,
        variantAttributes: [],
        variantImages: [],
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
    const usedCombos: Record<string, any>[] = [];
    
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
      if (key === 'id' || key === 'slug' || key === 'regular_price' || key === 'stock') continue;
      
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
    const newAttributeFields: VariantAttributeField[] = [];
    
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
      regular_price: null as any,
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
    
    const productId = searchParams ? searchParams.get('productId') : null;
    const variantId = selectedVariant.id;
    
    if (!productId || !variantId) {
      showSnackbar("Missing product or variant ID", "error");
      return;
    }
    
    // First update UI for immediate feedback
    const updatedVariants = [...variants];
    
    // Get current form values to preserve them
    const currentFormValues = getValues();
    
    const currentVariant = updatedVariants[selectedVariantIndex];
    
    // Merge form values with current variant data to preserve unsaved changes
    const variantWithFormValues = mergeFormValuesWithVariantData(currentVariant, currentFormValues);
    
    const currentImages = variantWithFormValues.variantImages || [];
    
    // Store original state for error recovery
    const originalVariants = [...variants];
    
    // Update all images to set only the selected one as primary
    const updatedImages = currentImages.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }));
    
    updatedVariants[selectedVariantIndex] = {
      ...variantWithFormValues,
      variantImages: updatedImages
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
      
      // Get current form values to preserve them
      const currentFormValues = getValues();
      
      // Get the current variant
      const currentVariant = updatedVariants[selectedVariantIndex];
      
      // Merge form values with variant data to preserve unsaved changes
      const variantWithFormValues = mergeFormValuesWithVariantData(currentVariant, currentFormValues);
      
      // Get the current images
      const currentImages = variantWithFormValues.variantImages || [];
      
      // Find the temporary image to remove its preview URL
      const imageToRemove = currentImages.find(img => img.id === imageId);
      if (imageToRemove && typeof imageToRemove.image_url === 'string' && imageToRemove.image_url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.image_url);
      }
      
      // Remove the image from local state while preserving form values
      updatedVariants[selectedVariantIndex] = {
        ...variantWithFormValues,
        variantImages: currentImages.filter(img => img.id !== imageId),
        pendingImages: (variantWithFormValues.pendingImages || [])
          .filter((_, idx) => idx !== currentImages.findIndex(img => img.id === imageId))
      };
      
      setVariants(updatedVariants);
      return;
    }
    
    const productId = searchParams ? searchParams.get('productId') : null;
    const variantId = selectedVariant.id;
    
    if (!productId || !variantId) {
      showSnackbar("Missing product or variant ID", "error");
      return;
    }
    
    // Keep a copy of the original state for error recovery
    const originalVariants = JSON.parse(JSON.stringify(variants)); // Deep copy
    
    // Get current form values to preserve them
    const currentFormValues = getValues();
    
    const currentVariantIndex = variants.findIndex(v => v.id === selectedVariant.id);
    if (currentVariantIndex === -1) return; 

    // Get the current variant
    const currentVariant = variants[currentVariantIndex];
    
    // Merge form values with variant data to preserve unsaved changes
    const variantWithFormValues = mergeFormValuesWithVariantData(currentVariant, currentFormValues);

    const currentImages = variantWithFormValues.variantImages || [];
    const imageToDelete = currentImages.find(img => img.id === imageId);
    const wasPrimary = imageToDelete?.is_primary || false; // Check if it was primary BEFORE optimistic update
    
    // First update the UI to give immediate feedback (Optimistic Update)
    const updatedVariants = [...variants];
    
    // Update variant with preserved form values and filtered images
    updatedVariants[currentVariantIndex] = {
      ...variantWithFormValues,
      variantImages: currentImages.filter(img => img.id !== imageId)
    };
    
    setVariants(updatedVariants);
    
    // Then call the API
    deleteVariantImage(String(productId), String(variantId), String(imageId))
      .then(() => {
        showSnackbar("Image deleted successfully", "success");
        
        // Auto-set new primary logic
        if (wasPrimary) {
          // Use functional update to get the absolute latest state
          setVariants(currentState => {
            // Get latest form values
            const latestFormValues = getValues();
            
            const variantIdx = currentState.findIndex(v => v.id === variantId);
            if (variantIdx === -1) return currentState; // Should not happen

            // Get the current variant
            const currentVariant = currentState[variantIdx];
            
            // Merge latest form values with variant data
            const variantWithLatestFormValues = mergeFormValuesWithVariantData(currentVariant, latestFormValues);
            
            const remainingImages = variantWithLatestFormValues.variantImages || [];
            if (remainingImages.length > 0) {
              const newPrimaryImageId = remainingImages[0].id;
              // Check if the new candidate is valid and not already primary (it shouldn't be)
              if (newPrimaryImageId && !remainingImages[0].is_primary) { 
                // Use setTimeout to ensure this runs after the current state update/render cycle
                setTimeout(() => handleSetPrimaryImage(newPrimaryImageId), 0); 
              }
            }
            // Return the state as is; handleSetPrimaryImage will trigger its own update
            return currentState; 
          });
        }
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

    if (!variantId) { // ID is number, startsWith removed
      showSnackbar("Cannot update unsaved variant", "error");
      return;
    }

    const productId = searchParams ? searchParams.get('productId') : null;
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
      // Use the correct source of truth for attributes to prevent incorrect change detection.
      const attributePayload = (originalVariant.variantAttributes || []).map(
        ({ attribute_id, term_id }) => ({ attribute_id, term_id })
      );

      // Helper function (can be moved outside if used elsewhere)
      const transformOptionalNumber = (value: number | string | null | undefined): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num; // Return null if not a valid number
      };

      // Helper function for price fields - returns 0 instead of null for empty values
      const transformPriceNumber = (value: number | string | null | undefined): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = Number(value);
        return isNaN(num) ? 0 : num; // Return 0 if not a valid number
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
      if (transformOptionalNumber(data.regular_price) !== transformOptionalNumber(originalVariant.regular_price)) { apiPayload.regular_price = transformOptionalNumber(data.regular_price); hasChanges = true; }
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
      if (attributePayload.length > 0 && currentAttributePayloadString !== originalAttributePayloadString) {
        apiPayload.attributes = attributePayload;
        hasChanges = true;
      }

      // --- EDIT: Check and include stock_status if changed --- 
      const formStockStatusApi = mapFormStockStatusToApi(data.stockStatus); // Map form value to API format
      // Normalize original stock status to ensure a consistent comparison format
      const normalizedOriginalStockStatusApi = mapFormStockStatusToApi(getValidStockStatus(originalVariant.stock_status));
      
      if (formStockStatusApi !== normalizedOriginalStockStatusApi) {
        apiPayload.stock_status = formStockStatusApi; 
        hasChanges = true; 
      }
      // --- END EDIT ---

      // Optional fields (compare simple types, use API names)
      const saleCleared =
        (data.depositPrice as any) === '' || data.depositPrice === null || data.depositPrice === undefined;
      const currentDeposit = transformPriceNumber(data.depositPrice);
      const originalDeposit = transformPriceNumber(originalVariant.discount_price);
      
      // Only include in payload if there's an actual change
      if (saleCleared && originalDeposit !== 0) {
        apiPayload.discount_price = 0; // When cleared, send 0 for sale price
        hasChanges = true;
        console.log("Sale price cleared - setting to 0");
      } else if (!saleCleared && currentDeposit !== originalDeposit) {
        apiPayload.discount_price = currentDeposit;
        hasChanges = true;
        console.log("Sale price changed:", { currentDeposit, originalDeposit, formValue: data.depositPrice });
      } else {
        console.log("Sale price unchanged:", { currentDeposit, originalDeposit, formValue: data.depositPrice });
      }

      const purchaseCleared =
        (data.purchasePrice as any) === '' || data.purchasePrice === null || data.purchasePrice === undefined;
      const currentPurchase = transformPriceNumber(data.purchasePrice);
      const originalPurchase = transformPriceNumber(originalVariant.purchase_price);
      
      // Only include in payload if there's an actual change
      if (purchaseCleared && originalPurchase !== 0) {
        apiPayload.purchase_price = 0; // Explicitly send 0 when user clears the field
        hasChanges = true;
        console.log("Purchase price cleared - setting to 0");
      } else if (!purchaseCleared && currentPurchase !== originalPurchase) {
        apiPayload.purchase_price = currentPurchase;
        hasChanges = true;
        console.log("Purchase price changed:", { currentPurchase, originalPurchase, formValue: data.purchasePrice });
      } else {
        console.log("Purchase price unchanged:", { currentPurchase, originalPurchase, formValue: data.purchasePrice });
      }

      const currentLowStock = transformOptionalNumber(data.lowStockThreshold); // Use correct casing for form data
      if (currentLowStock !== transformOptionalNumber(originalVariant.low_stock_threshold)) { apiPayload.low_stock_threshold = currentLowStock; hasChanges = true; } // API uses snake_case

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

      // If other fields have changed, we must include the original attributes
      // in the payload, otherwise the API may remove them.
      if (hasChanges && attributePayload.length > 0) {
        apiPayload.attributes = attributePayload;
      }

      // Debug: Log the payload being sent to API
      console.log("API Payload being sent:", apiPayload);
      console.log("Original variant data:", originalVariant);
      console.log("Form data:", data);

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
            // Ensure status is correctly formatted for API and UI
            const apiStatus = data.status === 'active' ? 'active' : 'inactive';
            const displayStatus = data.status === 'active' ? 'Active' : 'Inactive';
                        
            const updatedVariant: Variant = { 
              ...v, 
              slug: data.slug,
              regular_price: String(transformOptionalNumber(data.regular_price)), 
              stock: Number(transformOptionalNumber(data.stock)), 
              // Ensure status is properly set in the correct format for display
              status: displayStatus, 
              // --- Add stockStatus update here --- 
              stock_status: mapFormStockStatusToApi(data.stockStatus), 
              // --- End Add --- 
              discount_price: String(saleCleared ? 0 : transformPriceNumber(data.depositPrice)),
              purchase_price: String(purchaseCleared ? 0 : transformPriceNumber(data.purchasePrice)),
              low_stock_threshold: transformOptionalNumber(data.lowStockThreshold), // Use correct casing
              weight: String(transformOptionalNumber(data.weight)),
              length: String(transformOptionalNumber(data.length)),
              width: String(transformOptionalNumber(data.width)),
              height: String(transformOptionalNumber(data.height)),
              barcode: transformOptionalBarcode(data.barcode),
              description: data.description?.trim() || null,
              // Keep existing variantAttributes and images unless specifically updated elsewhere
              variantAttributes: v.variantAttributes, 
              variantImages: v.variantImages,       
            }; 
            
            // Reset the form with the updated values to reflect the changes
            const resetData = {
              slug: updatedVariant.slug ?? '',
              regular_price: updatedVariant.regular_price ? Number(updatedVariant.regular_price) : null,
              stock: updatedVariant.stock ?? 0,
              status: displayStatus.toLowerCase() as 'active' | 'inactive',
              stockStatus: getValidStockStatus(updatedVariant.stock_status),
              depositPrice: updatedVariant.discount_price ? Number(updatedVariant.discount_price) : null,
              purchasePrice: updatedVariant.purchase_price ? Number(updatedVariant.purchase_price) : null,
              lowStockThreshold: updatedVariant.low_stock_threshold ?? null,
              weight: updatedVariant.weight ? Number(updatedVariant.weight) : null,
              length: updatedVariant.length ? Number(updatedVariant.length) : null,
              width: updatedVariant.width ? Number(updatedVariant.width) : null,
              height: updatedVariant.height ? Number(updatedVariant.height) : null,
              barcode: updatedVariant.barcode ?? '',
              description: updatedVariant.description ?? '',
            };
            resetEditForm(resetData);
            
            // Update the original variant ref to reflect the new state
            originalSelectedVariantRef.current = JSON.parse(JSON.stringify(updatedVariant));
            
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
    if (!variantToDeleteId) return; 

    // Removed: Temporary ID check, assuming all variant IDs are numeric from backend.

    setIsSubmitting(true); 
    try {
      // Corrected API call: Pass only the variant ID, converted to a number.
      await deleteProductVariant(Number(variantToDeleteId)); 

      const deletedIndex = variants.findIndex(v => String(v.id) === variantToDeleteId); 
      
      const newVariants = variants.filter(v => String(v.id) !== variantToDeleteId); 
      setVariants(newVariants); 
      
      if (newVariants.length === 0) {
        setHasGeneratedVariants(false); 
      }
      
      showSnackbar("Variant deleted successfully", "success");
      
      if (newVariants.length === 0) {
        setSelectedVariantIndex(0); 
      } else if (deletedIndex >= 0) { 
        setSelectedVariantIndex(Math.max(0, deletedIndex - 1));
      }

    } catch (error) {
      console.error("Error deleting variant:", error);
      // Error handling as before
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
      setIsDeleteDialogOpen(false);
      setVariantToDeleteId(null);
      setIsSubmitting(false);
    }
  };

  // --- Add Handler for Bulk Update Form Submission --- 
  const onBulkSubmit: SubmitHandler<BulkUpdateFormData> = async (data) => {
    setIsBulkSubmitting(true);

    // Filter out fields that were not changed (are undefined)
    // Explicitly type the accumulator and the final result
    const changes = Object.entries(data).reduce<Partial<BulkUpdateFormData>>((acc, [key, value]) => {
      // --- Start Edit: Handle complex price object --- 
      if (key === 'regular_price' || key === 'depositPrice' || key === 'purchasePrice') {
        // Type guard to ensure value is the price object or undefined
        // Use a more specific type assertion for the price-like objects
        const complexValue = value as BulkUpdateFormData['regular_price'] | BulkUpdateFormData['depositPrice'] | BulkUpdateFormData['purchasePrice'];
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
          if (changes.regular_price && changes.regular_price.type === 'set') { 
            // This is a simplified example for local state update.
            // A real implementation would need to handle increase/decrease/percentage logic.
            updatedFields.regular_price = String(changes.regular_price.value); 
          } 
          if (changes.stock !== undefined) updatedFields.stock = Number(changes.stock);
          if (changes.status !== undefined) updatedFields.status = changes.status === 'active' ? 'Active' : 'Inactive'; // Ensure capitalized
          if (changes.depositPrice && changes.depositPrice.type === 'set') { 
             updatedFields.discount_price = String(changes.depositPrice.value); 
          }
          if (changes.purchasePrice && changes.purchasePrice.type === 'set') { 
             updatedFields.purchase_price = String(changes.purchasePrice.value); 
          }
          if (changes.lowStockThreshold !== undefined) updatedFields.low_stock_threshold = Number(changes.lowStockThreshold);
          if (changes.weight !== undefined) updatedFields.weight = String(changes.weight);
          if (changes.length !== undefined) updatedFields.length = String(changes.length);
          if (changes.width !== undefined) updatedFields.width = String(changes.width);
          if (changes.height !== undefined) updatedFields.height = String(changes.height);
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

  // useEffect for resetting edit form (this is the one we are targeting)
  useEffect(() => {
    const currentSelectedVariant =
      variants && variants.length > 0 && selectedVariantIndex >= 0 && selectedVariantIndex < variants.length
        ? variants[selectedVariantIndex]
        : null;

    if (currentSelectedVariant) {
      if (formVariantIdRef.current !== currentSelectedVariant.id) {
        // Safely convert the status from the variant object to lowercase 'active' or 'inactive' for the form.
        const apiStatus = currentSelectedVariant.status?.toString().toLowerCase() || ''; // Ensure it's a string and lowercase, default to empty if null/undefined
        const formStatus = apiStatus === 'active' ? 'active' : 'inactive'; // Map to form values

        const resetData = {
          slug: currentSelectedVariant.slug ?? '',
          regular_price: currentSelectedVariant.regular_price ? Number(currentSelectedVariant.regular_price) : null,
          stock: currentSelectedVariant.stock ?? 0,
          status: formStatus as 'active' | 'inactive', // Use the derived lowercase formStatus
          stockStatus: getValidStockStatus(currentSelectedVariant.stock_status),
          depositPrice: currentSelectedVariant.discount_price ? Number(currentSelectedVariant.discount_price) : null,
          purchasePrice: currentSelectedVariant.purchase_price ? Number(currentSelectedVariant.purchase_price) : null,
          lowStockThreshold: currentSelectedVariant.low_stock_threshold ?? null,
          weight: currentSelectedVariant.weight ? Number(currentSelectedVariant.weight) : null,
          length: currentSelectedVariant.length ? Number(currentSelectedVariant.length) : null,
          width: currentSelectedVariant.width ? Number(currentSelectedVariant.width) : null,
          height: currentSelectedVariant.height ? Number(currentSelectedVariant.height) : null,
          barcode: currentSelectedVariant.barcode ?? '',
          description: currentSelectedVariant.description ?? '',
        };
        resetEditForm(resetData);
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(currentSelectedVariant));
        formVariantIdRef.current = currentSelectedVariant.id;
      } else {
        originalSelectedVariantRef.current = JSON.parse(JSON.stringify(currentSelectedVariant));
      }
    } else {
      resetEditForm({ 
        slug: "", regular_price: null as any, stock: null as any, status: "active",
        depositPrice: null, purchasePrice: null, stockStatus: "In Stock", 
        lowStockThreshold: null, weight: null, length: null, width: null, height: null, 
        barcode: null, description: null
      });
      originalSelectedVariantRef.current = null;
      formVariantIdRef.current = null;
    }
  }, [variants, selectedVariantIndex, resetEditForm]);

  // --- START: Add basic dirty check (will be expanded later) ---
  const calculateIsActuallyDirty = () => {
      if (viewMode !== 'initial' || !originalSelectedVariantRef.current || !selectedVariant) {
        return editFormState.isDirty; // Fallback for other views or if refs not set
      }
      const formValues = getValues(); // Correctly using getValues from the edit form's useForm
      // Basic comparison: compare stringified versions
      // More robust: compare field by field, handling type differences
      const originalForCompare = mapVariantForDetailsForm(originalSelectedVariantRef.current); // Map to form structure if needed
      // This is a simplified comparison. For production, a deep comparison of relevant fields is better.
      // console.log("Comparing:", JSON.stringify(formValues), JSON.stringify(originalSelectedVariantRef.current));
      return JSON.stringify(formValues) !== JSON.stringify(originalSelectedVariantRef.current); // Placeholder, needs better comparison
  };
  // --- END: Add basic dirty check ---

  const variantsToShow = searchTerm ? filteredVariants : variants;
  const isActuallyDirty = calculateIsActuallyDirty();

  // Helper function to merge unsaved form data with existing variant data
  const mergeFormValuesWithVariantData = (
    variant: Variant,
    formValues: any
  ): Variant => {
    return {
      ...variant,
      slug: formValues.slug || variant.slug,
      regular_price: formValues.regular_price !== null ? String(formValues.regular_price) : variant.regular_price,
      stock: formValues.stock !== null ? Number(formValues.stock) : variant.stock,
      status: formValues.status === 'active' ? 'Active' : 'Inactive',
      stock_status: formValues.stockStatus === 'In Stock' ? 'in_stock' : 
                    formValues.stockStatus === 'Out of Stock' ? 'out_of_stock' : 'back_order',
      discount_price: formValues.depositPrice !== null && formValues.depositPrice !== undefined ? 
                      String(formValues.depositPrice) : variant.discount_price,
      purchase_price: formValues.purchasePrice !== null && formValues.purchasePrice !== undefined ? 
                      String(formValues.purchasePrice) : variant.purchase_price,
      low_stock_threshold: formValues.lowStockThreshold !== null ? 
                           formValues.lowStockThreshold : variant.low_stock_threshold,
      weight: formValues.weight !== null && formValues.weight !== undefined ? 
              String(formValues.weight) : variant.weight,
      length: formValues.length !== null && formValues.length !== undefined ? 
              String(formValues.length) : variant.length,
      width: formValues.width !== null && formValues.width !== undefined ? 
              String(formValues.width) : variant.width,
      height: formValues.height !== null && formValues.height !== undefined ? 
              String(formValues.height) : variant.height,
      barcode: formValues.barcode || variant.barcode,
      description: formValues.description || variant.description,
      // Keep existing attributes and variantAttributes
      attributes: variant.attributes,
      variantAttributes: variant.variantAttributes,
      // Images will be updated separately
    };
  };

  // --- Add Function to handle Remove All Variants --- 
  const handleConfirmRemoveAll = async () => { // Make function async
    setIsRemoveAllDialogOpen(false); // Close dialog immediately
    
    const variantsToDelete = [...variants]; // Copy current variants
    if (variantsToDelete.length === 0) return; // Should not happen, but safe check

    setIsSubmitting(true); // Start loading indicator
    let successCount = 0;
    let errorCount = 0;

    // Process deletions sequentially to avoid overwhelming the backend
    for (const variant of variantsToDelete) {
      try {
        await deleteProductVariant(Number(variant.id));
        successCount++;
      } catch (error) {
        console.error(`[RemoveAll] Failed to delete variant ID: ${variant.id}`, error);
        errorCount++;
      }
    }


    // Update UI after all deletions are attempted
    setVariants([]);
    setSelectedVariantIndex(0); // Reset selection
    resetEditForm(); // Reset the edit form
    setPendingCombination(null); // Clear pending combination
    setHasGeneratedVariants(false); // Reset the flag when all variants are removed
    
    // Refetch combinations/attributes if needed to update counts
    if (formData?.productId) {
      fetchProductAttributes(formData.productId); 
    }

    // Show summary snackbar
    if (errorCount === 0) {
      showSnackbar(`Successfully removed all ${successCount} variants.`, "success");
    } else {
      showSnackbar(`Removed ${successCount} variants. Failed to remove ${errorCount}.`, "warning");
    }

    setIsSubmitting(false); // Stop loading indicator
  };

  // Add mapping functions for different variant types
  const mapToManualVariantData = (variant: Variant): any => {
    // Transform Variant to ManualVariantData
    return {
      id: variant.id,
      product_id: variant.product_id,
      slug: variant.slug,
      regular_price: String(variant.regular_price),
      discount_price: variant.discount_price,
      purchase_price: variant.purchase_price,
      weight: variant.weight,
      length: variant.length,
      width: variant.width,
      height: variant.height,
      description: variant.description,
      barcode: variant.barcode,
      stock: variant.stock,
      low_stock_threshold: variant.low_stock_threshold,
      stock_status: variant.stock_status,
      status: variant.status,
      variantImages: variant.variantImages,
      variantAttributes: variant.variantAttributes
    };
  };

  const mapToGeneratedVariant = (variant: Variant): any => {
    // For GenerateVariantsView, similar structure as ManualVariantData
    return mapToManualVariantData(variant); // Reuse mapping if structures are the same
  };

  const mapToEditableVariantData = (variant: Variant): any => {
    // For BulkUpdateView, similar structure but might need specific fields
    return {
      id: variant.id,
      product_id: variant.product_id,
      slug: variant.slug,
      regular_price: String(variant.regular_price),
      discount_price: variant.discount_price,
      purchase_price: variant.purchase_price,
      weight: variant.weight,
      length: variant.length,
      width: variant.width,
      height: variant.height,
      description: variant.description,
      barcode: variant.barcode,
      stock: variant.stock,
      low_stock_threshold: variant.low_stock_threshold,
      stock_status: variant.stock_status,
      status: variant.status,
      variantImages: variant.variantImages,
      variantAttributes: variant.variantAttributes
    };
  };

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
          <button 
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
          </button>
        </div>

        {/* Search Bar and Remove All Button - Condition updated to show if variants exist, regardless of viewMode */}
        {(variants.length > 0) && (
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
                {searchTerm && (
                  <span 
                    className="cursor-pointer text-gray-500 flex items-center mr-2" 
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </span>
                )}
                <SearchIcon className="text-gray-500 mr-1" />
                <TuneIcon className="text-gray-500" />
              </div>
            </div>

            {/* Remove All button */}
            <button 
              className="py-2 px-4 bg-[#FF0004] text-white rounded hover:bg-red-600 cursor-pointer"
              onClick={() => {
                if (variants.length === 0) {
                  showSnackbar("No variants to remove.", "info");
                  return;
                }
                setIsRemoveAllDialogOpen(true);
              }}
              disabled={isLoading || variants.length === 0}
            >
              Remove All
            </button>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <FuseLoading />
          {/* <span className="ml-2">Loading variants...</span> */}
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
              // Add filtered variants and search term props - with proper mapping
              filteredVariants={searchTerm ? filteredVariants.map(mapToManualVariantData) : undefined}
              searchTerm={searchTerm || ""}
              setVariants={setVariants}
              // CREATE Form Props
              createControl={createControl as any}
              handleCreateSubmit={handleCreateSubmit}
              createErrors={createFormState.errors}
              createFormState={createFormState} // Pass full create form state
              setCreateValue={setCreateValue as any}
              // Submit Handlers (passed separately)
              onSubmitCreate={onSubmit} // Pass the original combined onSubmit (now create logic)
              // Variant & Attribute State
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
            />
          )}
          
          {viewMode === 'generated' && (
            // Pass filteredVariants and searchTerm to GenerateVariantsView
            <GenerateVariantsView 
              isLoading={isLoading}  
              allCombinationsUsed={allCombinationsUsed}
              productAttributes={productAttributes}
              setVariants={setVariants}
              filteredVariants={searchTerm ? filteredVariants.map(mapToGeneratedVariant) : undefined}
              searchTerm={searchTerm || ""}
              onSuccess={() => {
                // Callback when variants are generated successfully
                setHasGeneratedVariants(true);
                // Optionally fetch variants again to refresh the list
                if (formData?.productId) {
                  fetchProductAttributes(formData.productId);
                }
              }}
            /> 
          )}

          {viewMode === 'bulk' && (
            <BulkUpdateView 
              allCombinationsUsed={allCombinationsUsed} 
              variants={variants}
              setVariants={setVariants}
              // Pass filtered variants and search term
              filteredVariants={searchTerm ? filteredVariants.map(mapToEditableVariantData) : undefined}
              searchTerm={searchTerm || ""}
              showSnackbar={showSnackbar}
            />
          )}
          
          {/* Manual Variant View - kept for reference or if switching is needed */}
          {/* {viewMode === 'manual' && (
            <ManualVariantView
              // Add key prop based on selected variant ID
              key={selectedVariant ? selectedVariant.id : 'manual-view-no-variant'} 
              // EDIT Form Props
              // editControl={editControl as any}
              // handleEditSubmit={handleEditSubmit}
              // editErrors={editFormState.errors}
              // editFormState={editFormState} // Pass full edit form state
              // setEditValue={setEditValue as any}
              // CREATE Form Props
              createControl={createControl as any}
              handleCreateSubmit={handleCreateSubmit}
              createErrors={createFormState.errors}
              createFormState={createFormState} // Pass full create form state
              setCreateValue={setCreateValue as any}
              // Submit Handlers (passed separately)
              onSubmitCreate={onSubmit} // Pass the original combined onSubmit (now create logic)
              // onSubmitUpdate={handleUpdateVariant} // Pass the specific update handler
              // Other general props (remove form-specific ones if not needed by ManualVariantView directly)
              // reset={resetEditForm} // Reset handled by specific functions now
              // watch={watchEdit} // Watch can be derived from control if needed
              // trigger={triggerEdit} // Trigger handled by specific functions now
              // Variant & Attribute State
              // variants={variants}
              // selectedVariant={selectedVariant}
              // selectedVariantIndex={selectedVariantIndex}
              // setSelectedVariantIndex={setSelectedVariantIndex}
              // setVariants={setVariants} // Pass setVariants function
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
              // filteredVariants={filteredVariants} // Pass filtered list
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
              // editGetRootProps={editGetRootProps}
              // editGetInputProps={editGetInputProps}
              // editIsDragActive={editIsDragActive}
              // handleSetPrimaryImage={handleSetPrimaryImage}
              // handleDeleteImage={handleDeleteImage}
              // Dialog State & Handlers
              // setVariantToDeleteId={setVariantToDeleteId}
              // setIsDeleteDialogOpen={setIsDeleteDialogOpen}
              // Other
              // showSnackbar={showSnackbar}
              // --- Add missing props back --- 
              // isUpdating={isUpdating}     
              // isEditImageUploading={isEditImageUploading} 
              // --- End add ---
            />
          )} */}
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

      {/* --- Add Remove All Confirmation Dialog --- */}
      <Dialog
        open={isRemoveAllDialogOpen}
        onClose={() => setIsRemoveAllDialogOpen(false)}
        aria-labelledby="remove-all-dialog-title"
        aria-describedby="remove-all-dialog-description"
      >
        <DialogTitle id="remove-all-dialog-title">{"Confirm Remove All Variants"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="remove-all-dialog-description">
            Are you sure you want to remove ALL ({variants.length}) variants for this product?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRemoveAllDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRemoveAll} // Call the new handler
            color="error" 
            autoFocus 
            disabled={isSubmitting} // Use existing submitting state
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit"/> : 'Confirm Remove All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- START: Initial View (Card/Form) --- */}
      {!isLoading && viewMode === 'initial' && (
        <>
          {variantsToShow.length === 0 ? (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No variants found for this product.
                {/* TODO: Add button to switch view if needed */}
              </Typography>
            </Paper>
          ) : (
              <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2 max-h-[600px] overflow-y-auto pr-2">
                  {variantsToShow.map((variant, index) => (
                    <VariantDisplayCard
                      key={variant.id || `variant-card-${index}`} // Ensure unique key
                      variant={mapVariantForDisplayCard(variant)} // Use basic mapping
                      isSelected={selectedVariant?.id === variant.id}
                      onClick={() => {
                          const foundIndex = variants.findIndex(v => v.id === variant.id);
                          if(foundIndex !== -1) {
                             setSelectedVariantIndex(foundIndex);
                          } else {
                              console.warn(`Variant with ID ${variant.id} not found in original variants list.`);
                          }
                      }}
                      onDelete={() => {
                        setVariantToDeleteId(String(variant.id)); // Ensure string for dialog
                        setIsDeleteDialogOpen(true);
                      }}
                      isActionDisabled={isSubmitting || isUpdating} // Basic disable logic
                    />
                  
                  ))}
            </div>
                {selectedVariant ? (
                    <> 
                    <div className="w-full md:w-1/2">
                      <VariantDetailsForm
                        control={editControl as any} // Cast control for now
                        handleSubmit={handleEditSubmit} // Main RHF submit handler
                        onSubmit={handleUpdateVariant} // Your actual update function
                        selectedVariant={mapVariantForDetailsForm(selectedVariant)} // Basic mapping
                        isSaving={isSubmitting || isUpdating} // Combine submitting states
                        isSaveDisabled={isSubmitting || isUpdating || !isActuallyDirty || !editFormState.isValid} 
                        imageGetRootProps={editGetRootProps} 
                        imageGetInputProps={editGetInputProps}
                        isImageDragActive={editIsDragActive}
                        isImageUploading={imageUploading || isEditImageUploading || isEditUploading} 
                        onSetPrimaryImage={handleSetPrimaryImage}
                        onDeleteImage={handleDeleteImage}
                      />
                      </div>
                    </>
                 ) : (
                   <Paper elevation={1} sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
                     <Typography variant="h6" color="text.secondary">
                       Select a variant to view or edit its details.
                     </Typography>
                   </Paper>
                 )}
            
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VariantManager