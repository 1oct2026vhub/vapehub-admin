"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Paper,
  Grid,
  TextField,
  IconButton,
  SelectChangeEvent,
  Box,
  Typography,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm, type ProductFormData } from "../ProductFormContext";
import {
  createProductVariants,
  deleteProductVariant,
  getProduct,
  type ProductVariant,
  type CreateProductVariantsRequest,
  updateProductVariant,
  uploadVariantImages,
  setVariantPrimaryImage,
  deleteVariantImage,
} from "@/services/apiProduct";
import FormSelectField from "@/components/Shared/SelectField";
import FormInputField from "@/components/Shared/FormInputField";
import DeleteIcon from "@mui/icons-material/Delete";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";

// Create a styled version of TextField with the app's styling
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderImage: "linear-gradient(to right, #2E9970, #005434) 1",
    },
    "&:hover fieldset": {
      borderImage: "linear-gradient(to right, #247C5C, #003F29) 1",
    },
    "&.Mui-focused fieldset": {
      borderImage: "linear-gradient(to right, #1E7A56, #004C30) 1",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#2E9970",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2E9970",
  },
  /* Hide Edge's default password reveal icon */
  "& input::-ms-reveal, & input::-ms-clear": {
    display: "none",
  },
  // Ensure fullWidth is applied by default
  width: "100%",
}));

type Variant = NonNullable<ProductFormData["variants"]>[number] & {
  variantAttributes?: Array<{
    attribute_id: number;
    term_id: number;
    term: {
      id: number;
      name: string;
      slug: string;
    };
    attribute: {
      id: number;
      name: string;
      type: string;
    };
  }>;
  images?: VariantImage[];
};

interface FormData {
  variants: Array<{
    id?: number;
    slug: string;
    price: number;
    stock: number;
    status: "active" | "inactive";
    discount_price: number | null;
    purchase_price: number | null;
    low_stock_threshold: number | null;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    barcode: string | null;
    description: string | null;
    attributes: Array<{
      attribute_id: number;
      term_id: number;
    }>;
  }>;
}

interface VariationAttribute {
  attribute_id: number;
  used_in_variation: boolean;
  allTerms: Array<{
    value: number;
    label: string;
  }>;
}

interface ProductAttributeTerm {
  attribute_id: number;
  term_id: number;
  used_in_variation: boolean;
  term: {
    id: number;
    name: string;
  };
}

// Form validation schema
const schema = z.object({
  variants: z.array(
    z.object({
      id: z.union([z.number(), z.string(), z.null()]).optional(),
      slug: z.string().min(1, "Slug is required"),
      price: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z.literal("NaN").refine(() => false, "Please enter a valid number"),
          z
            .number()
            .positive("Price must be greater than zero")
            .max(9999999.99, "Price exceeds maximum limit")
            .refine(
              (val) => {
                const str = val.toString();
                return !str.includes(".") || str.split(".")[1].length <= 2;
              },
              { message: "Price can have at most 2 decimal places" }
            ),
          z.null().refine(() => false, "Price is required"),
        ])
      ),
      stock: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number"), z.number().int("Stock must be a whole number").min(0, "Stock must be a non-negative number"), z.null().refine(() => false, "Stock is required")])),
      status: z.enum(["active", "inactive"]),
      discount_price: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z
            .literal("NaN")
            .refine(
              () => false,
              "Please enter a valid number for discount price"
            ),
          z
            .number()
            .min(0, "Discount price cannot be negative")
            .max(9999999.99, "Discount price exceeds maximum limit")
            .refine(
              (val) => {
                const str = val.toString();
                return !str.includes(".") || str.split(".")[1].length <= 2;
              },
              { message: "Discount price can have at most 2 decimal places" }
            )
            .nullable()
            .optional(),
        ])
      ),
      purchase_price: z.preprocess(
        (val) => {
          if (val === "" || val === null || val === undefined) return null;
          const parsed = Number(val);
          return isNaN(parsed) ? "NaN" : parsed;
        },
        z.union([
          z
            .literal("NaN")
            .refine(
              () => false,
              "Please enter a valid number for purchase price"
            ),
          z
            .number()
            .min(0, "Purchase price cannot be negative")
            .max(9999999.99, "Purchase price exceeds maximum limit")
            .refine(
              (val) => {
                const str = val.toString();
                return !str.includes(".") || str.split(".")[1].length <= 2;
              },
              { message: "Purchase price can have at most 2 decimal places" }
            ),
          z.null().refine(() => false, "Purchase price is required"),
        ])
      ),
      low_stock_threshold: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number for low stock threshold"), z.number().int("Low stock threshold must be a whole number").min(0, "Low stock threshold must be a non-negative number"), z.null().refine(() => false, "Low stock threshold is required")])),
      weight: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number for weight"), z.number().min(0, "Weight must be a non-negative number"), z.null()])),
      length: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number for length"), z.number().min(0, "Length must be a non-negative number"), z.null()])),
      width: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number for width"), z.number().min(0, "Width must be a non-negative number"), z.null()])),
      height: z.preprocess((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const parsed = Number(val);
        return isNaN(parsed) ? "NaN" : parsed;
      }, z.union([z.literal("NaN").refine(() => false, "Please enter a valid number for height"), z.number().min(0, "Height must be a non-negative number"), z.null()])),
      barcode: z
        .string()
        // .min(1, "Barcode is required")
        .max(50, "Barcode cannot exceed 50 characters")
        // .nullable()
        // .transform((val) => (val === null ? "" : val))
        .nullable()
        .optional(),
      description: z.string().nullable().optional(),
      attributes: z
        .array(
          z.object({
            attribute_id: z.number(),
            term_id: z.number().min(1, "Please select a term value"),
          })
        )
        .min(1, "At least one attribute is required"),
    })
  ),
});

// Add new interface for variant images
interface VariantImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

// For section headings, create a custom component to add red asterisks
const SectionHeading = ({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <Grid item xs={12}>
    <Box sx={{ borderBottom: "1px dashed #eee", mb: 2, pb: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center" }}
      >
        {children}
        {required && <span style={{ color: "red", marginLeft: "3px" }}>*</span>}
      </Typography>
    </Box>
  </Grid>
);

// For field labels with double asterisks (required critical fields)
const RequiredDoubleAsterisk = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {children} <span style={{ color: "red", marginLeft: "3px" }}>*</span>
  </div>
);

// For field labels with single asterisk (required fields)
const RequiredSingleAsterisk = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {children} <span style={{ color: "red", marginLeft: "3px" }}>*</span>
  </div>
);

// Add ValidationMessage component after styled TextField
const ValidationMessage = ({ error }: { error?: string }) => {
  if (!error) return null;
  return (
    <Typography
      variant="caption"
      color="error"
      sx={{ pl: 1, display: "block", mt: 0.5 }}
    >
      {error}
    </Typography>
  );
};

function VariantTab() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    markStepAsCompleted,
  } = useProductForm();
  const searchParams = useSearchParams();
  const productId = formData.productId || searchParams.get("productId");

  // Determine if we're in edit mode based on existing variants
  const isEditMode = Boolean(
    formData.variants?.some(
      (variant) =>
        variant.id !== undefined &&
        variant.attributes?.some((attr) => attr.term_id > 0)
    )
  );

  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  const [usedTerms, setUsedTerms] = useState<Record<number, Set<number>>>({});
  const fetchedRef = useRef(false);

  // Add state for delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{
    variantId: string | number;
    imageId: string | number;
  } | null>(null);

  // Add state for variant images
  const [variantImages, setVariantImages] = useState<
    Record<string | number, any[]>
  >({});
  const [uploading, setUploading] = useState<Record<string | number, boolean>>(
    {}
  );
  const fileInputRefs = useRef<
    Record<string | number, HTMLInputElement | null>
  >({});

  // Add state for pending images during variant creation
  const [pendingImages, setPendingImages] = useState<Record<number, File[]>>(
    {}
  );
  const [tempImageUrls, setTempImageUrls] = useState<Record<number, string[]>>(
    {}
  );

  // Compute available terms for each attribute
  const variationAttributes = (formData.attributes || [])
    .filter((attr) => attr.used_in_variation && attr.attribute_id > 0)
    .map((attr) => {
      // Get all terms for this attribute from attributeResponse
      const allTerms = (
        formData.attributesResponse?.productAttributeTerms || []
      )
        .filter(
          (term) =>
            term.attribute_id === attr.attribute_id && term.used_in_variation
        )
        .map((term) => ({
          value: term.term_id,
          label: term.term?.name || `Term ${term.term_id}`,
        }));

      return {
        ...attr,
        allTerms,
      };
    });

  // Helper function to create a default variant
  const createDefaultVariant = (presetAttributes = []) => {
    // Ensure we have valid attributes with term_id > 0
    let attributes;

    if (presetAttributes && presetAttributes.length > 0) {
      // Make sure all attributes have valid term_id
      attributes = presetAttributes.map((attr) => {
        if (!attr.term_id || attr.term_id <= 0) {
          // Try to find a valid term for this attribute
          const attrTerms = getAllTermsForAttribute(attr.attribute_id);
          const validTermId = attrTerms.length > 0 ? attrTerms[0].value : 1;
          return {
            attribute_id: Number(attr.attribute_id),
            term_id: Number(validTermId),
          };
        }
        return attr;
      });
    } else {
      // Create attributes from variation attributes
      attributes = variationAttributes.map((attr) => {
        const validTerm =
          attr.allTerms && attr.allTerms.length > 0
            ? attr.allTerms[0].value
            : 1;

        return {
          attribute_id: Number(attr.attribute_id),
          term_id: Number(validTerm),
        };
      });
    }

    return {
      slug: "",
      price: null,
      stock: null,
      status: "active" as const,
      discount_price: null,
      purchase_price: null,
      low_stock_threshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null,
      description: null,
      attributes: attributes,
    };
  };

  // Form setup
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      variants:
        formData.variants && formData.variants.length > 0
          ? formData.variants.map((variant) => ({
              ...variant,
              attributes:
                variant.attributes?.map((attr) => ({
                  attribute_id: Number(attr.attribute_id),
                  term_id: Number(attr.term_id),
                })) || [],
              status: "active" as const,
            }))
          : [createDefaultVariant([])],
    },
    mode: "all",
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Watch all variants to track used terms
  const formVariants = watch("variants") || [];

  // Helper functions to display attribute and term names
  const getTermName = (attributeId, termId) => {
    const term = (
      formData.attributesResponse?.productAttributeTerms || []
    ).find((t) => t.attribute_id === attributeId && t.term_id === termId);
    return term?.term?.name || `Term ${termId}`;
  };

  // Update the getAttributeName function to use the correct property access
  const getAttributeName = (attributeId: number) => {
    // First try to find the attribute in the attributesResponse
    const responseAttribute =
      formData.attributesResponse?.productAttributeTerms?.find(
        (term) => term.attribute_id === attributeId
      )?.attribute;
    if (responseAttribute?.name) {
      return responseAttribute.name;
    }

    // If not found, return a default name
    return `Attribute ${attributeId}`;
  };

  // Function to get all available terms for an attribute
  const getAllTermsForAttribute = useCallback(
    (attributeId: number) => {
      return (formData.attributesResponse?.productAttributeTerms || [])
        .filter(
          (term) => term.attribute_id === attributeId && term.used_in_variation
        )
        .map((term) => ({
          value: term.term_id,
          label: term.term?.name || `Term ${term.term_id}`,
          attributeId: term.attribute_id,
        }));
    },
    [formData.attributesResponse?.productAttributeTerms]
  );

  // Function to generate all possible combinations of attributes
  const generateAllAttributeCombinations = useCallback(() => {
    console.log("Generating all possible attribute combinations");

    // Get all attributes used for variation
    const variationAttrs = (formData.attributes || []).filter(
      (attr) => attr.used_in_variation && attr.attribute_id > 0
    );

    console.log("Variation attributes:", variationAttrs);

    if (variationAttrs.length === 0) {
      console.log("No variation attributes found");
      return [];
    }

    // Create a map of attribute ID to all its terms
    const attributeTermsMap = {};

    variationAttrs.forEach((attr) => {
      const attrId = attr.attribute_id;

      // Get all terms for this attribute
      const terms = (
        formData.attributesResponse?.productAttributeTerms || []
      ).filter(
        (term) =>
          term.attribute_id === attrId && term.used_in_variation && term.term_id
      );

      if (terms.length > 0) {
        attributeTermsMap[attrId] = terms.map((term) => ({
          attribute_id: attrId,
          term_id: term.term_id,
          term_name: term.term?.name || `Term ${term.term_id}`,
        }));
      }
    });

    console.log("Attribute terms map:", attributeTermsMap);

    // Get attribute IDs that have terms
    const attributeIds = Object.keys(attributeTermsMap).map(Number);

    if (attributeIds.length === 0) {
      console.log("No attributes with terms found");
      return [];
    }

    // Function to create combinations recursively
    const generateCombinations = (attrIndex, currentCombination = []) => {
      // If we've processed all attributes, return the current combination
      if (attrIndex >= attributeIds.length) {
        return [currentCombination];
      }

      const results = [];
      const currentAttrId = attributeIds[attrIndex];
      const termsForCurrentAttr = attributeTermsMap[currentAttrId] || [];

      // For each term of the current attribute
      termsForCurrentAttr.forEach((term) => {
        // Add this term to the current combination
        const newCombination = [
          ...currentCombination,
          {
            attribute_id: term.attribute_id,
            term_id: term.term_id,
          },
        ];

        // Generate combinations for the next attribute
        const nextCombinations = generateCombinations(
          attrIndex + 1,
          newCombination
        );
        results.push(...nextCombinations);
      });

      return results;
    };

    // Start the recursive combination generation
    const allCombinations = generateCombinations(0);
    console.log("Generated combinations:", allCombinations);

    return allCombinations;
  }, [formData.attributes, formData.attributesResponse?.productAttributeTerms]);

  // Check if a combination is already used in existing variants
  const isCombinationUsed = useCallback((combination, variants) => {
    if (
      !combination ||
      !Array.isArray(combination) ||
      combination.length === 0
    ) {
      return false;
    }

    // Create a normalized signature for the combination for easy comparison
    const normalizedCombination = [...combination].sort(
      (a, b) => a.attribute_id - b.attribute_id || a.term_id - b.term_id
    );

    const combinationSignature = normalizedCombination
      .map((attr) => `${attr.attribute_id}:${attr.term_id}`)
      .join("|");

    // Check if any existing variant has this exact combination
    return variants.some((variant) => {
      if (
        !variant.attributes ||
        !Array.isArray(variant.attributes) ||
        variant.attributes.length !== combination.length
      ) {
        return false;
      }

      // Create a signature for the variant's attributes
      const normalizedVariantAttributes = [...variant.attributes].sort(
        (a, b) => a.attribute_id - b.attribute_id || a.term_id - b.term_id
      );

      const variantSignature = normalizedVariantAttributes
        .map((attr) => `${attr.attribute_id}:${attr.term_id}`)
        .join("|");

      // Compare signatures
      return variantSignature === combinationSignature;
    });
  }, []);

  // Check if all possible combinations are used
  const areAllCombinationsUsed = useCallback(() => {
    const allCombinations = generateAllAttributeCombinations();
    const currentVariants = formVariants;

    // If there are no possible combinations, consider all used
    if (allCombinations.length === 0) return true;

    const unusedCombinations = allCombinations.filter(
      (combination) => !isCombinationUsed(combination, currentVariants)
    );

    console.log(
      `${unusedCombinations.length} unused combinations out of ${allCombinations.length} total`
    );
    return unusedCombinations.length === 0;
  }, [generateAllAttributeCombinations, isCombinationUsed, formVariants]);

  // Function to check if all required combinations have been added
  const areAllRequiredCombinationsAdded = useCallback(() => {
    return areAllCombinationsUsed();
  }, [areAllCombinationsUsed]);

  // Handle next button click with combination validation
  const handleNextButtonClick = () => {
    // In edit mode, we don't need to check for combinations
    if (isEditMode) {
      const formValues = watch();
      handleFormSubmit(formValues);
      return;
    }

    // Check if we have at least one variant
    const formValues = watch();
    if (!formValues.variants || formValues.variants.length === 0) {
      showSnackbar("Please add at least one variant", "warning");
      return;
    }

    // Check if all possible combinations have been added
    const allCombinations = generateAllAttributeCombinations();
    if (allCombinations.length > formValues.variants.length) {
      showSnackbar("Please add all combinations", "warning");
      return;
    }

    // Proceed with submission
    handleFormSubmit(formValues);
  };

  // Update the handleAddVariant function
  const handleAddVariant = () => {
    const allCombinations = generateAllAttributeCombinations();
    const currentVariants = formVariants;

    // No possible combinations
    if (!allCombinations || allCombinations.length === 0) {
      showSnackbar(
        "No combinations available. Please add attributes and terms first.",
        "warning"
      );
      return;
    }

    // Find first unused combination
    const unusedCombination = allCombinations.find(
      (combination) => !isCombinationUsed(combination, currentVariants)
    );

    if (!unusedCombination) {
      showSnackbar(
        "All possible combinations have been added. You cannot add more variants.",
        "info"
      );
      return;
    }

    // Create new variant with the unused combination
    const newVariant = {
      slug: `variant-${currentVariants.length + 1}`,
      price: null,
      stock: null,
      status: "active" as const,
      discount_price: null,
      purchase_price: null,
      low_stock_threshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null,
      description: null,
      attributes: unusedCombination,
    };

    // Double-check that this combination isn't already used
    if (isCombinationUsed(unusedCombination, currentVariants)) {
      showSnackbar(
        "This combination already exists. Cannot add duplicate variants.",
        "error"
      );
      return;
    }

    append(newVariant);
    updateFormData({
      variants: [...currentVariants, newVariant],
    });

    setTimeout(() => {
      trigger(`variants.${currentVariants.length}`);

      // Check if all combinations are now used
      if (areAllCombinationsUsed()) {
        showSnackbar(
          "All possible combinations have been added. You can now proceed to the next step.",
          "success"
        );
      }
    }, 100);
  };

  // Function to fetch product data including variants
  const fetchProductData = useCallback(
    async (productId: number) => {
      if (!productId) return null;

      setIsLoading(true);
      try {
        console.log("Fetching product data from API for ID:", productId);
        const response = await getProduct(productId);
        console.log("Product data received:", response.data);

        if (response.data.variants && response.data.variants.length > 0) {
          // Convert API variant data to form data format
          const fetchedVariants = response.data.variants.map(
            (variant: any) => ({
              id: variant.id,
              slug: variant.slug || "",
              price:
                typeof variant.price === "string"
                  ? parseFloat(variant.price)
                  : variant.price || 0,
              stock:
                typeof variant.stock === "string"
                  ? parseInt(variant.stock)
                  : variant.stock || 0,
              status:
                variant.status === true ||
                (typeof variant.status === "string" &&
                  variant.status === "active"),
              discount_price: variant.discount_price
                ? typeof variant.discount_price === "string"
                  ? parseFloat(variant.discount_price)
                  : variant.discount_price
                : null,
              purchase_price: variant.purchase_price
                ? typeof variant.purchase_price === "string"
                  ? parseFloat(variant.purchase_price)
                  : variant.purchase_price
                : null,
              low_stock_threshold: variant.low_stock_threshold
                ? typeof variant.low_stock_threshold === "string"
                  ? parseInt(variant.low_stock_threshold)
                  : variant.low_stock_threshold
                : null,
              weight: variant.weight
                ? typeof variant.weight === "string"
                  ? parseFloat(variant.weight)
                  : variant.weight
                : null,
              length: variant.length
                ? typeof variant.length === "string"
                  ? parseFloat(variant.length)
                  : variant.length
                : null,
              width: variant.width
                ? typeof variant.width === "string"
                  ? parseFloat(variant.width)
                  : variant.width
                : null,
              height: variant.height
                ? typeof variant.height === "string"
                  ? parseFloat(variant.height)
                  : variant.height
                : null,
              barcode: variant.barcode || null,
              description: variant.description || null,
              attributes: variant.variantAttributes
                ? variant.variantAttributes.map((varAttr: any) => ({
                    attribute_id: Number(varAttr.attribute_id),
                    term_id: Number(varAttr.term_id),
                  }))
                : [],
              images: variant.variantImages || [], // Store the variant images directly
            })
          );

          console.log("Variants fetched from API:", fetchedVariants);

          // Update form data context
          updateFormData({
            variants: fetchedVariants,
            attributesResponse: {
              productAttributeTerms: response.data.productAttributeTerms || [],
              productAttributes: response.data.productAttributes || [],
            },
          });

          // Reset form with fetched variants
          reset({ variants: fetchedVariants });

          // Initialize variant images state
          const newVariantImages: Record<string | number, any[]> = {};
          fetchedVariants.forEach((variant) => {
            if (variant.id) {
              // Get images directly from the variant's variantImages array
              const images = variant.images.map((img: any) => ({
                id: img.id,
                image_url: img.image_url,
                is_primary: img.is_primary,
              }));

              if (images.length > 0) {
                newVariantImages[variant.id] = images;
              }
            }
          });

          // Update the variant images state
          setVariantImages(newVariantImages);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
        //showSnackbar("Failed to load product variants", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [reset, showSnackbar, updateFormData]
  );

  // Update the getAvailableTermsForAttribute function to filter out used terms
  const getAvailableTermsForAttribute = (
    attributeId: number,
    variantIndex: number
  ) => {
    const currentVariant = formVariants[variantIndex];
    const currentTermId = currentVariant?.attributes?.find(
      (attr) => attr.attribute_id === attributeId
    )?.term_id;

    // Get all terms for this attribute
    const allTerms = getAllTermsForAttribute(attributeId);

    // Filter out terms that are used in other variants
    return allTerms.filter((term) => {
      // Always include the current term for this variant
      if (term.value === currentTermId) {
        return true;
      }

      // Check if this term is used in any other variant
      const isUsedInOtherVariant = formVariants.some(
        (variant, idx) =>
          idx !== variantIndex && // Skip current variant
          variant.attributes?.some(
            (attr) =>
              attr.attribute_id === attributeId && attr.term_id === term.value
          )
      );

      return !isUsedInOtherVariant;
    });
  };

  // Function to check if an attribute has any available terms
  const hasAvailableTerms = (attributeId: number, variantIndex: number) => {
    return getAvailableTermsForAttribute(attributeId, variantIndex).length > 0;
  };

  const handleDeleteVariant = async (
    variantId: number | undefined,
    index: number
  ) => {
    console.log("handleDeleteVariant called with:", { variantId, index });
    try {
      setIsLoading(true);

      if (fields.length <= 1) {
        showSnackbar("Cannot delete the last variant", "error");
        return;
      }

      // Only call the API if we have a valid variantId (for existing variants)
      if (variantId) {
        console.log("Calling delete API for variant ID:", variantId);
        await deleteProductVariant(variantId);
        console.log("API delete successful for variant ID:", variantId);
        showSnackbar("Variant deleted successfully", "success");
      }

      // Remove the variant from the form fields
      remove(index);
      console.log("Removed variant from form fields at index:", index);

      // Update the form data context
      const updatedVariants = [...(formData.variants || [])];
      updatedVariants.splice(index, 1);
      updateFormData({ variants: updatedVariants });
      console.log(
        "Updated form data context with remaining variants:",
        updatedVariants
      );
    } catch (error) {
      console.error("Error deleting variant:", error);
      showSnackbar("Failed to delete variant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the areRequiredFieldsFilled function
  const areRequiredFieldsFilled = (variant: FormData["variants"][0]) => {
    if (!variant) return false;

    // Helper to check if a value is a valid number (either as number or string)
    const isValidNumber = (value: any): boolean => {
      if (typeof value === "number") return value >= 0;
      if (typeof value === "string") {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      }
      return false;
    };

    const requiredFields = {
      slug: Boolean(variant.slug?.trim()),
      price: isValidNumber(variant.price),
      stock: isValidNumber(variant.stock),
      attributes: variant.attributes?.every(
        (attr) =>
          typeof attr.attribute_id === "number" &&
          attr.attribute_id > 0 &&
          typeof attr.term_id === "number" &&
          attr.term_id > 0
      ),
    };

    console.log("Required fields check:", requiredFields);

    return Object.values(requiredFields).every(Boolean);
  };

  // Update the areAllVariantsValid function
  const areAllVariantsValid = useCallback(() => {
    const currentVariants = formVariants;
    if (!currentVariants || currentVariants.length === 0) return false;

    const isValid = currentVariants.every((variant, index) => {
      const variantValid = areRequiredFieldsFilled(variant);
      console.log(`Variant ${index} validation:`, {
        variant,
        isValid: variantValid,
      });
      return variantValid;
    });

    console.log("Form validation:", {
      isValid,
      hasErrors: Object.keys(errors).length > 0,
      variants: currentVariants,
    });

    return isValid && Object.keys(errors).length === 0;
  }, [formVariants, errors]);

  // Update the transformVariantData function to ensure correct status type
  const transformVariantData = (
    variant: FormData["variants"][0]
  ): ProductVariant => {
    // Map through variation attributes to ensure all required attributes are included
    const transformedAttributes = variationAttributes.map((attr) => {
      // Find if this attribute already has a term in the current variant
      const existingAttribute = variant.attributes?.find(
        (a) => a.attribute_id === attr.attribute_id
      );

      // If there's an existing term, use it; otherwise, use the first available term
      const termId =
        existingAttribute?.term_id || attr.allTerms?.[0]?.value || 0;

      return {
        attribute_id: Number(attr.attribute_id),
        term_id: Number(termId),
      };
    });

    return {
      slug: variant.slug,
      price: Number(variant.price),
      stock: Number(variant.stock),
      status: variant.status === "active" ? "active" : "inactive",
      discount_price: variant.discount_price
        ? Number(variant.discount_price)
        : undefined,
      purchase_price: variant.purchase_price
        ? Number(variant.purchase_price)
        : undefined,
      low_stock_threshold: variant.low_stock_threshold
        ? Number(variant.low_stock_threshold)
        : undefined,
      weight: variant.weight ? Number(variant.weight) : undefined,
      length: variant.length ? Number(variant.length) : undefined,
      width: variant.width ? Number(variant.width) : undefined,
      height: variant.height ? Number(variant.height) : undefined,
      barcode: variant.barcode || undefined,
      description: variant.description || undefined,
      attributes: transformedAttributes,
    };
  };

  // Create a form ref to allow direct form submission
  const formRef = useRef<HTMLFormElement>(null);

  // Update the handleFormSubmit function
  const handleFormSubmit = async (data: FormData) => {
    console.log("=== FORM SUBMISSION TRIGGERED ===");
    console.log("Form data:", data);
    console.log("Form errors:", errors);
    console.log("Is edit mode:", isEditMode);

    try {
      // Get current form values
      const formValues = watch();
      console.log("Current form values:", formValues);

      // Skip validation in edit mode
      if (isEditMode) {
        console.log("Edit mode - proceeding with update");
        await onSubmit(formValues);
        return;
      }

      // For new variants, check required fields
      const invalidVariants = formValues.variants.filter((variant, index) => {
        // Check if any required field is missing or invalid
        const isInvalid =
          !variant.slug?.trim() ||
          !variant.price ||
          Number(variant.price) < 0 ||
          !variant.stock ||
          Number(variant.stock) < 0 ||
          !variant.attributes?.length ||
          variant.attributes.some((attr) => !attr.term_id || attr.term_id <= 0);

        if (isInvalid) {
          console.log(`Variant ${index + 1} validation failed:`, {
            hasSlug: Boolean(variant.slug?.trim()),
            hasPrice: Boolean(variant.price),
            priceValue: variant.price,
            hasStock: Boolean(variant.stock),
            stockValue: variant.stock,
            hasAttributes: Boolean(variant.attributes?.length),
            attributes: variant.attributes,
          });
        }

        return isInvalid;
      });

      if (invalidVariants.length > 0) {
        console.log("Validation failed for variants:", invalidVariants);
        return;
      }

      // If we get here, all required fields are filled
      console.log("All required fields are filled, proceeding with submission");
      await onSubmit(formValues);
    } catch (error) {
      console.error("Error in handleFormSubmit:", error);
      showSnackbar("An error occurred while processing your request", "error");
    }
  };

  // Update the onSubmit function
  const onSubmit = async (data: FormData) => {
    console.log("===== FORM SUBMISSION DATA =====", data);
    console.log("Product ID:", productId);

    if (!productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    try {
      setIsLoading(true);
      const transformedData: CreateProductVariantsRequest = {
        variants: data.variants.map(transformVariantData),
      };

      console.log("Submitting variant data:", transformedData);

      if (isEditMode) {
        console.log("IN EDIT MODE - Processing updates for variants");

        // Get existing variants with IDs from context
        const existingVariants = formData.variants?.filter((v) => v.id) || [];
        console.log("Existing variants with IDs:", existingVariants);

        // Store variant indexes that need image uploads
        const variantIndexesToUpload = [];
        data.variants.forEach((variant, index) => {
          if (pendingImages[index]?.length > 0) {
            variantIndexesToUpload.push(index);
          }
        });

        // 1. Process variant updates/creates first - no image uploads yet
        for (let index = 0; index < data.variants.length; index++) {
          const variant = data.variants[index];
          console.log(`Processing variant at index ${index}:`, variant);

          try {
            // If variant has ID, update it
            if (variant.id) {
              console.log(
                `ATTEMPTING TO UPDATE: Variant with ID ${variant.id}`
              );
              const transformedVariant = transformVariantData(variant);
              await updateProductVariant(
                Number(productId),
                variant.id,
                transformedVariant
              );
              console.log(`API SUCCESS: Updated variant ${variant.id}`);
            }
            // If it's a new variant, create it
            else {
              console.log("ATTEMPTING TO CREATE: New variant in edit mode");
              const transformedVariant = transformVariantData(variant);
              await createProductVariants(Number(productId), {
                variants: [transformedVariant],
              });
              console.log("API SUCCESS: Created new variant");
            }
          } catch (error) {
            console.error(
              `Failed to process variant at index ${index}:`,
              error
            );
            throw error;
          }
        }

        // Show success message after all variants are updated
        console.log("All variants processed. Refreshing product data...");
        showSnackbar("Product variants updated successfully", "success");

        // 2. Fetch updated product data to get latest variant IDs
        const updatedProductData = await getProduct(Number(productId));
        console.log("Updated product data:", updatedProductData.data);

        // Extract variants from the updated product data
        const updatedVariants = updatedProductData.data.variants || [];
        console.log("Updated variants:", updatedVariants);

        // 3. Now upload images for each variant that needs it
        if (variantIndexesToUpload.length > 0) {
          console.log("Uploading pending images for variants...");
          let allUploadsSuccessful = true;

          for (const index of variantIndexesToUpload) {
            const originalVariant = data.variants[index];

            // Find corresponding variant in updated data
            // If it had an ID, match by ID; otherwise use attributes to match
            let matchedVariant;

            if (originalVariant.id) {
              // If it had an ID, match by ID
              matchedVariant = updatedVariants.find(
                (v) => v.id === originalVariant.id
              );
            } else {
              // For new variants, match by attributes and slug
              matchedVariant = updatedVariants.find((updatedVariant) => {
                // Both variant should have same attribute combinations
                const originalAttrs = originalVariant.attributes || [];
                const updatedAttrs = updatedVariant.variantAttributes || [];

                // Match by slug as a fallback
                if (updatedVariant.slug === originalVariant.slug) {
                  return true;
                }

                // Try to match by checking all attributes match
                if (originalAttrs.length !== updatedAttrs.length) {
                  return false;
                }

                // Check if all attributes match
                return originalAttrs.every((originalAttr) => {
                  return updatedAttrs.some(
                    (updatedAttr) =>
                      updatedAttr.attribute_id === originalAttr.attribute_id &&
                      updatedAttr.term_id === originalAttr.term_id
                  );
                });
              });
            }

            if (matchedVariant && matchedVariant.id) {
              console.log(
                `Found matched variant for index ${index}:`,
                matchedVariant
              );
              try {
                console.log(
                  `Uploading ${pendingImages[index].length} images for variant ${matchedVariant.id}`
                );
                // Upload and get the results
                const uploadedImages = await uploadPendingImages(
                  matchedVariant.id,
                  index
                );

                // If we got a response with image data, update the UI immediately
                if (uploadedImages.length > 0) {
                  setVariantImages((prev) => {
                    const updated = { ...prev };
                    if (updated[matchedVariant.id]) {
                      // Make sure we don't add duplicate images by checking IDs
                      const existingIds = new Set(
                        updated[matchedVariant.id].map((img) => img.id)
                      );
                      const uniqueNewImages = uploadedImages.filter(
                        (img) => !existingIds.has(img.id)
                      );

                      console.log(
                        `Adding ${
                          uniqueNewImages.length
                        } unique images (filtered out ${
                          uploadedImages.length - uniqueNewImages.length
                        } duplicates)`
                      );

                      updated[matchedVariant.id] = [
                        ...updated[matchedVariant.id],
                        ...uniqueNewImages,
                      ];
                    } else {
                      updated[matchedVariant.id] = uploadedImages;
                    }
                    return updated;
                  });

                  // showSnackbar(
                  //   `Successfully uploaded ${uploadedImages.length} images`,
                  //   "success"3
                  // );
                }
              } catch (error) {
                console.error(
                  `Error uploading images for variant ${matchedVariant.id}:`,
                  error
                );
                showSnackbar(
                  `Failed to upload images for variant ${
                    matchedVariant.slug || index + 1
                  }`,
                  "error"
                );
                allUploadsSuccessful = false;
              }
            } else {
              console.warn(
                `Could not match variant at index ${index} with any updated variant`
              );
              showSnackbar(
                `Could not match variant at index ${
                  index + 1
                } for image upload`,
                "warning"
              );
              allUploadsSuccessful = false;
            }
          }

          if (allUploadsSuccessful) {
            console.log("All images uploaded successfully");
            showSnackbar("All images uploaded successfully", "success");
          } else {
            console.warn("Some image uploads failed");
            showSnackbar("Some image uploads completed with errors", "warning");
          }
        } else {
          // Only fetch product data if there were no image uploads to avoid overwriting our UI state
          fetchedRef.current = false;
          await fetchProductData(Number(productId));
        }

        // No need to refresh data again as we've already updated the UI state directly
        console.log("Update process completed successfully");
      } else {
        // Create new variants
        console.log("CREATING NEW VARIANTS - Not in edit mode");

        // 1. Create the variants
        const response = await createProductVariants(
          Number(productId),
          transformedData
        );
        console.log("API SUCCESS: Created variants", response);
        showSnackbar("Product variants saved successfully", "success");

        // Update form data
        updateFormData({
          variants: data.variants,
          hasErrors: false,
        });

        // 2. Fetch the updated product data to get variant IDs
        console.log("Fetching updated product data...");
        const updatedProductData = await getProduct(Number(productId));
        console.log("Updated product data:", updatedProductData.data);

        // Extract variants from the updated product data
        const updatedVariants = updatedProductData.data.variants || [];
        console.log("Updated variants from product data:", updatedVariants);

        // 3. Upload images for each variant if needed
        const indexesWithPendingImages = Object.keys(pendingImages)
          .filter((index) => pendingImages[Number(index)]?.length > 0)
          .map(Number);

        let allUploadsSuccessful = true;

        if (indexesWithPendingImages.length > 0) {
          console.log("Indexes with pending images:", indexesWithPendingImages);

          // For each index with pending images, find the corresponding variant
          for (const index of indexesWithPendingImages) {
            const originalVariant = data.variants[index];

            // Try to match variants by attributes and slug
            const matchedVariant = updatedVariants.find((updatedVariant) => {
              // Both variant should have same attribute combinations
              const originalAttrs = originalVariant.attributes || [];
              const updatedAttrs = updatedVariant.variantAttributes || [];

              // Match by slug as a fallback
              if (updatedVariant.slug === originalVariant.slug) {
                return true;
              }

              // Try to match by checking all attributes match
              if (originalAttrs.length !== updatedAttrs.length) {
                return false;
              }

              // Check if all attributes match
              return originalAttrs.every((originalAttr) => {
                return updatedAttrs.some(
                  (updatedAttr) =>
                    updatedAttr.attribute_id === originalAttr.attribute_id &&
                    updatedAttr.term_id === originalAttr.term_id
                );
              });
            });

            if (matchedVariant && matchedVariant.id) {
              console.log(
                `Found matched variant for index ${index}:`,
                matchedVariant
              );
              try {
                console.log(
                  `Uploading ${pendingImages[index].length} images for variant ${matchedVariant.id}`
                );
                // Upload and get the results
                const uploadedImages = await uploadPendingImages(
                  matchedVariant.id,
                  index
                );

                // If we got a response with image data, update the UI immediately
                if (uploadedImages.length > 0) {
                  setVariantImages((prev) => {
                    const updated = { ...prev };
                    if (updated[matchedVariant.id]) {
                      // Make sure we don't add duplicate images by checking IDs
                      const existingIds = new Set(
                        updated[matchedVariant.id].map((img) => img.id)
                      );
                      const uniqueNewImages = uploadedImages.filter(
                        (img) => !existingIds.has(img.id)
                      );

                      console.log(
                        `Adding ${
                          uniqueNewImages.length
                        } unique images (filtered out ${
                          uploadedImages.length - uniqueNewImages.length
                        } duplicates)`
                      );

                      updated[matchedVariant.id] = [
                        ...updated[matchedVariant.id],
                        ...uniqueNewImages,
                      ];
                    } else {
                      updated[matchedVariant.id] = uploadedImages;
                    }
                    return updated;
                  });

                  showSnackbar(
                    `Successfully uploaded ${uploadedImages.length} images`,
                    "success"
                  );
                }
              } catch (error) {
                console.error(
                  `Error uploading images for variant ${matchedVariant.id}:`,
                  error
                );
                showSnackbar(
                  `Failed to upload images for variant ${matchedVariant.slug}`,
                  "error"
                );
                allUploadsSuccessful = false;
              }
            } else {
              console.warn(
                `Could not match variant at index ${index} with any updated variant`
              );
              allUploadsSuccessful = false;
            }
          }

          console.log("All image uploads processed");
        }

        // No need to refresh data again as we've handled image uploads directly
        console.log("Variant creation completed successfully");

        // 5. Complete the flow
        markStepAsCompleted(3);
        nextStep();

        // Only redirect if all image uploads were successful
        if (allUploadsSuccessful) {
          router.push("/apps/product/");
        }
      }
    } catch (error) {
      console.error("Error saving variants:", error);

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
      setIsLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (formData.productId && !fetchedRef.current) {
      fetchProductData(formData.productId);
      fetchedRef.current = true;
    }
  }, [formData.productId, fetchProductData]);

  // Add a dependent effect for when variantImages changes to ensure re-render
  useEffect(() => {
    // This effect will run whenever variantImages state changes
    // We don't need to do anything here, just having the dependency triggers re-render
    console.log(
      "Variant images state updated, total variants with images:",
      Object.keys(variantImages).length
    );
  }, [variantImages]);

  // Logging effect - separate from update effects to prevent loops
  useEffect(() => {
    if (formData.attributesResponse) {
      console.log("Attributes API Response:", formData.attributesResponse);
    }

    if (formData.productId) {
      console.log("VariantTab - Product ID:", formData.productId);

      if (formData.variants) {
        console.log("Existing Variants:", formData.variants);
      }

      if (formData.productImages) {
        console.log("VariantTab - Product Images:", formData.productImages);
      }
    }
  }, [
    formData.attributesResponse,
    formData.productId,
    formData.productImages,
    formData.variants,
  ]);

  // Track used terms - only update when variants change
  useEffect(() => {
    // Skip this effect during initial render or if variants haven't changed
    if (!formVariants || formVariants.length === 0) return;

    const newUsedTerms: Record<number, Set<number>> = {};

    formVariants.forEach((variant) => {
      if (Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          if (!newUsedTerms[attr.attribute_id]) {
            newUsedTerms[attr.attribute_id] = new Set();
          }
          if (attr.term_id && attr.term_id !== 0) {
            newUsedTerms[attr.attribute_id].add(attr.term_id);
          }
        });
      }
    });

    // Use Object.keys length to compare if there's a meaningful change
    const currentKeys = Object.keys(usedTerms).length;
    const newKeys = Object.keys(newUsedTerms).length;

    // Only update state if there's an actual change
    if (
      currentKeys !== newKeys ||
      JSON.stringify([...Object.keys(usedTerms)].sort()) !==
        JSON.stringify([...Object.keys(newUsedTerms)].sort())
    ) {
      setUsedTerms(newUsedTerms);
    }
  }, [formVariants]);

  // Add validation state logging, but without causing side effects
  const loggingRef = useRef({ lastLogTime: 0 });
  useEffect(() => {
    // Limit logging frequency to prevent excessive renders
    const now = Date.now();
    if (now - loggingRef.current.lastLogTime < 1000) return;

    loggingRef.current.lastLogTime = now;

    const currentVariants = formVariants;
    const validationState = {
      variantsCount: currentVariants?.length || 0,
      errorsCount: Object.keys(errors).length,
      isValid,
      hasErrors: Object.keys(errors).length > 0,
      areAllVariantsFilled:
        currentVariants?.every(areRequiredFieldsFilled) || false,
      buttonShouldBeEnabled: Boolean(
        !isLoading &&
          currentVariants?.length > 0 &&
          currentVariants?.every(areRequiredFieldsFilled) &&
          Object.keys(errors).length === 0 &&
          isValid
      ),
    };
    console.log("Form validation state:", validationState);
  }, [formVariants, errors, isValid, isLoading]);

  // Check if there are any unused terms available for any attribute
  const hasUnusedTerms = variationAttributes.some((attr) => {
    const availableTerms = (
      formData.attributesResponse?.productAttributeTerms || []
    ).filter(
      (term) =>
        term.attribute_id === attr.attribute_id &&
        term.used_in_variation &&
        (!usedTerms[attr.attribute_id] ||
          !usedTerms[attr.attribute_id].has(term.term_id))
    );
    return availableTerms.length > 0;
  });

  // Update the helper function with proper types
  const hasEnoughTermsForNewVariant = (
    variationAttributes: VariationAttribute[],
    usedTerms: Record<number, Set<number>>,
    formData: {
      attributesResponse?: {
        productAttributeTerms?: ProductAttributeTerm[];
      };
    }
  ): boolean => {
    // If no variation attributes, can't create variants
    if (!variationAttributes || variationAttributes.length === 0) {
      console.log("No variation attributes available");
      return false;
    }

    // Check each variation attribute that is used for variations
    const canCreateNewVariant = variationAttributes.some((attr) => {
      if (!attr.used_in_variation) {
        console.log(
          `Attribute ${attr.attribute_id} is not used for variations`
        );
        return false;
      }

      // Get all available terms for this attribute
      const allTerms = (
        formData.attributesResponse?.productAttributeTerms || []
      ).filter(
        (term) =>
          term.attribute_id === attr.attribute_id && term.used_in_variation
      );

      console.log(
        `Attribute ${attr.attribute_id} has ${allTerms.length} terms`
      );

      // If there's only one or no terms, can't create more variants
      if (allTerms.length <= 1) {
        console.log(
          `Attribute ${attr.attribute_id} has insufficient terms (${allTerms.length})`
        );
        return false;
      }

      // Get used terms for this attribute
      const usedTermsForAttr = usedTerms[attr.attribute_id] || new Set();
      console.log(
        `Attribute ${attr.attribute_id} has ${usedTermsForAttr.size} used terms`
      );

      // Check if there are unused terms available
      const hasUnusedTerms = allTerms.some(
        (term) => !usedTermsForAttr.has(term.term_id)
      );
      console.log(
        `Attribute ${attr.attribute_id} ${
          hasUnusedTerms ? "has" : "does not have"
        } unused terms`
      );

      return hasUnusedTerms;
    });

    console.log(`Can create new variant: ${canCreateNewVariant}`);
    return canCreateNewVariant;
  };

  // Add validation when term is changed to prevent duplicate combinations
  const handleTermChange = (
    event: SelectChangeEvent<unknown>,
    index: number,
    attrIndex: number
  ) => {
    const selectedValue = Number(event.target.value);

    // Get current variants
    const currentVariants = [...formVariants];
    if (!currentVariants[index] || !currentVariants[index].attributes) return;

    // Create a copy of the current variant with the new term value
    const updatedVariant = { ...currentVariants[index] };
    const updatedAttributes = [...updatedVariant.attributes];

    // Update the term_id for the selected attribute
    const attributeId = updatedAttributes[attrIndex]?.attribute_id;
    if (!attributeId) return;

    updatedAttributes[attrIndex] = {
      ...updatedAttributes[attrIndex],
      term_id: selectedValue,
    };

    // Check if this combination would create a duplicate
    const otherVariants = currentVariants.filter((_, i) => i !== index);
    if (isCombinationUsed(updatedAttributes, otherVariants)) {
      showSnackbar(
        "This combination would create a duplicate variant. Please choose a different value.",
        "warning"
      );
      return;
    }

    // If not a duplicate, update the form
    setValue(
      `variants.${index}.attributes.${attrIndex}.term_id`,
      selectedValue
    );
    trigger();
  };

  // Add functions for handling variant images
  const handleFileSelect = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      variantId: string | number | undefined,
      variantIndex: number
    ) => {
      if (!event.target.files || event.target.files.length === 0) {
        console.log("No files selected");
        return;
      }

      const files = Array.from(event.target.files);

      // Validate file types (only accept image files)
      const validFiles = files.filter((file) =>
        ["image/jpeg", "image/png", "image/webp"].includes(file.type)
      );

      if (validFiles.length !== files.length) {
        showSnackbar("Only JPEG, PNG, and WEBP images are allowed", "error");
        // Reset the file input
        if (fileInputRefs.current[variantId || variantIndex]) {
          fileInputRefs.current[variantId || variantIndex].value = "";
        }
        return;
      }

      if (validFiles.length === 0) {
        showSnackbar("Please select at least one image to upload", "warning");
        return;
      }

      try {
        // For existing variants with IDs, upload images immediately
        if (variantId && typeof variantId !== "undefined" && variantId !== "") {
          console.log(
            `Directly uploading images for existing variant ${variantId}`
          );

          // Set loading state
          setUploading((prevState) => ({
            ...prevState,
            [variantId]: true,
          }));

          // Create form data for upload
          const formData = new FormData();
          validFiles.forEach((file) => {
            formData.append("files", file);
          });

          // Upload directly for existing variants
          try {
            const response = await uploadVariantImages(
              String(productId),
              String(variantId),
              formData
            );

            console.log("Direct upload response:", response);

            // Process the response
            let newImages = [];

            // Handle different possible response structures
            if (response?.data?.variant?.variantImages) {
              newImages = response.data.variant.variantImages;
            } else if (response?.variant?.variantImages) {
              newImages = response.variant.variantImages;
            } else if (response?.data?.variantImages) {
              newImages = response.data.variantImages;
            } else if (Array.isArray(response)) {
              newImages = response;
            } else if (response?.data && Array.isArray(response.data)) {
              newImages = response.data;
            }

            // Format images consistently
            const processedImages = newImages.map((img) => ({
              id: img.id || img.image_id,
              image_url: img.image_url || img.url,
              is_primary: !!img.is_primary,
            }));

            if (processedImages.length > 0) {
              // Update the UI state immediately
              setVariantImages((prev) => {
                const updated = { ...prev };
                if (updated[variantId]) {
                  // Make sure we don't add duplicate images by checking IDs
                  const existingIds = new Set(
                    updated[variantId].map((img) => img.id)
                  );
                  const uniqueNewImages = processedImages.filter(
                    (img) => !existingIds.has(img.id)
                  );

                  console.log(
                    `Adding ${
                      uniqueNewImages.length
                    } unique images (filtered out ${
                      processedImages.length - uniqueNewImages.length
                    } duplicates)`
                  );

                  updated[variantId] = [
                    ...updated[variantId],
                    ...uniqueNewImages,
                  ];
                } else {
                  updated[variantId] = processedImages;
                }
                return updated;
              });
              if (response) {
                showSnackbar(response.data?.message, "success");
              }
            }
          } catch (error) {
            console.error("Error directly uploading images:", error);
            showSnackbar("Error uploading images", "error");
          } finally {
            // Clear loading state
            setUploading((prevState) => ({
              ...prevState,
              [variantId]: false,
            }));
          }
        } else {
          // For new variants, store for later upload
          console.log(
            `Storing ${validFiles.length} images for variant at index ${variantIndex}`
          );

          // Create temporary URLs for preview
          const urls = validFiles.map((file) => URL.createObjectURL(file));

          // Store files and URLs in state
          setPendingImages((prev) => ({
            ...prev,
            [variantIndex]: [...(prev[variantIndex] || []), ...validFiles],
          }));

          setTempImageUrls((prev) => ({
            ...prev,
            [variantIndex]: [...(prev[variantIndex] || []), ...urls],
          }));

          showSnackbar(
            `${validFiles.length} images selected. They will be uploaded after saving the variant.`,
            "success"
          );
        }

        // Reset the file input
        if (fileInputRefs.current[variantId || variantIndex]) {
          fileInputRefs.current[variantId || variantIndex].value = "";
        }
      } catch (error) {
        console.error("Error handling files:", error);
        showSnackbar("Error processing images", "error");
      }
    },
    [showSnackbar, productId]
  );

  // Add a function to upload images for existing variants
  const uploadImagesForExistingVariant = async (
    variantId: string | number,
    files: File[]
  ) => {
    if (!productId) {
      showSnackbar("Product ID is missing", "error");
      return;
    }

    // Find the actual numeric variant ID from the form data context
    const foundVariant = formData.variants?.find(
      (v) =>
        v.id === variantId ||
        (v.id !== undefined &&
          variantId !== undefined &&
          String(v.id) === String(variantId))
    );

    if (!foundVariant || foundVariant.id === undefined) {
      showSnackbar(
        "Cannot find variant information. Please save the variant first.",
        "warning"
      );
      return;
    }

    // Ensure we're using the correct numeric ID that the API expects
    const numericVariantId =
      typeof foundVariant.id === "number"
        ? foundVariant.id
        : parseInt(String(foundVariant.id), 10);

    if (isNaN(numericVariantId)) {
      showSnackbar(
        "Invalid variant ID. The API requires a numeric ID.",
        "error"
      );
      return;
    }

    console.log("Found numeric variant ID for upload:", numericVariantId);

    // Create FormData object and append files
    const formDataObj = new FormData();
    files.forEach((file) => {
      formDataObj.append("files", file);
    });

    try {
      console.log(
        `Uploading ${files.length} images for product ${productId}, variant ${numericVariantId}`
      );

      // Set loading state
      setUploading((prevState) => ({
        ...prevState,
        [variantId]: true,
      }));

      // Call API with proper parameters
      const response = await uploadVariantImages(
        String(productId),
        String(numericVariantId),
        formDataObj
      );

      console.log("Upload response:", response);

      // Process the response to extract images
      let newImages = [];

      // First check if response is directly an array of images
      if (Array.isArray(response)) {
        newImages = response.map((img) => ({
          id: img.id || img.image_id,
          image_url: img.image_url || img.url,
          is_primary: !!img.is_primary,
        }));
      }
      // Handle nested response structures
      else if (response && typeof response === "object") {
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
      const processedImages = newImages.map((img) => ({
        id: img.id || img.image_id,
        image_url: img.image_url || img.url || img.image_url,
        is_primary: !!img.is_primary,
      }));

      console.log("Processed images with IDs:", processedImages);

      if (processedImages.length === 0) {
        console.warn("Could not extract images from response:", response);
        showSnackbar(
          "Images uploaded but response format was unexpected",
          "warning"
        );
      }

      // Update the state with the new images
      setVariantImages((prevImages) => {
        // First get any existing images
        const existingImages = prevImages[variantId] || [];

        // Ensure we don't add duplicates by checking IDs
        const existingIds = new Set(existingImages.map((img) => img.id));
        const uniqueNewImages = processedImages.filter(
          (img) => !existingIds.has(img.id)
        );

        const updatedImages = {
          ...prevImages,
          [variantId]: [...existingImages, ...uniqueNewImages],
        };

        console.log("Updated variant images state:", updatedImages);
        return updatedImages;
      });

      // showSnackbar(
      //   `Successfully uploaded ${processedImages.length} images`,
      //   "success"
      // );
      return processedImages;
    } catch (error) {
      console.error("Error uploading images:", error);
      showSnackbar("Error uploading images", "error");
      throw error;
    } finally {
      // Clear loading state
      setUploading((prevState) => ({
        ...prevState,
        [variantId]: false,
      }));
    }
  };

  // Add a function to upload pending images
  const uploadPendingImages = async (variantId: number, index: number) => {
    const files = pendingImages[index];
    if (!files || files.length === 0) return [];

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      console.log(
        `Uploading images for variant ${variantId}:`,
        files.length,
        "files"
      );
      const response = await uploadVariantImages(
        String(productId),
        String(variantId),
        formData
      );

      console.log("Upload response:", response);

      // Process the response and update variantImages state
      let newImages = [];

      // Handle different possible response structures
      if (response?.data?.variant?.variantImages) {
        newImages = response.data.variant.variantImages;
      } else if (response?.variant?.variantImages) {
        newImages = response.variant.variantImages;
      } else if (response?.data?.variantImages) {
        newImages = response.data.variantImages;
      } else if (Array.isArray(response)) {
        newImages = response;
      } else if (response?.data && Array.isArray(response.data)) {
        newImages = response.data;
      }

      // Ensure all images have the required properties
      const processedImages = newImages.map((img) => ({
        id: img.id || img.image_id,
        image_url: img.image_url || img.url,
        is_primary: !!img.is_primary,
      }));

      if (processedImages.length === 0) {
        throw new Error("No images were uploaded successfully");
      }

      console.log("Processed images:", processedImages);

      // Update variantImages state with the new images
      setVariantImages((prev) => {
        const updated = { ...prev };
        // If there are existing images, append the new ones
        if (updated[variantId]) {
          // Make sure we don't add duplicate images by checking IDs
          const existingIds = new Set(updated[variantId].map((img) => img.id));
          const uniqueNewImages = processedImages.filter(
            (img) => !existingIds.has(img.id)
          );

          console.log(
            `Adding ${uniqueNewImages.length} unique images (filtered out ${
              processedImages.length - uniqueNewImages.length
            } duplicates)`
          );

          updated[variantId] = [...updated[variantId], ...uniqueNewImages];
        } else {
          updated[variantId] = processedImages;
        }
        return updated;
      });

      // Clean up temporary data
      setPendingImages((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });

      setTempImageUrls((prev) => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });

      // Clean up object URLs
      tempImageUrls[index]?.forEach((url) => URL.revokeObjectURL(url));

      console.log(
        `Successfully uploaded ${processedImages.length} images for variant ${variantId}`
      );

      return processedImages;
    } catch (error) {
      console.error(`Error uploading images for variant ${variantId}:`, error);
      throw error;
    }
  };

  const handleDeleteImage = useCallback(
    (variantId: string | number, imageId: string | number) => {
      // Open the confirmation modal instead of using the browser's confirm dialog
      setImageToDelete({ variantId, imageId });
      setDeleteModalOpen(true);
    },
    []
  );

  // Function to handle the actual image deletion after confirmation
  const confirmDeleteImage = useCallback(async () => {
    if (!imageToDelete) return;

    const { variantId, imageId } = imageToDelete;

    try {
      // Get the product ID from the context or URL
      if (!productId) {
        showSnackbar("Product ID is missing", "error");
        return;
      }

      // Find the actual numeric variant ID from the form data
      const foundVariant = formData.variants?.find(
        (v) =>
          v.id === variantId ||
          (v.id !== undefined &&
            variantId !== undefined &&
            String(v.id) === String(variantId))
      );

      if (!foundVariant || foundVariant.id === undefined) {
        showSnackbar(
          "Cannot find variant information. Please save the variant first.",
          "warning"
        );
        return;
      }

      // Ensure we're using the correct numeric ID that the API expects
      const numericVariantId =
        typeof foundVariant.id === "number"
          ? foundVariant.id
          : parseInt(String(foundVariant.id), 10);

      if (isNaN(numericVariantId)) {
        showSnackbar(
          "Invalid variant ID. The API requires a numeric ID.",
          "error"
        );
        return;
      }

      // Convert image ID to numeric if needed
      const numericImageId =
        typeof imageId === "number" ? imageId : parseInt(String(imageId), 10);

      if (isNaN(numericImageId)) {
        showSnackbar("Invalid image ID.", "error");
        return;
      }

      console.log(
        "Deleting image:",
        numericImageId,
        "from variant:",
        numericVariantId
      );

      // Call API with proper parameters
      const response = await deleteVariantImage(
        String(productId),
        String(numericVariantId),
        String(numericImageId)
      );

      console.log("Delete image response:", response);

      // Update state to remove the deleted image
      setVariantImages((prev) => {
        const updatedImages = { ...prev };
        if (updatedImages[variantId]) {
          updatedImages[variantId] = updatedImages[variantId].filter(
            (img) =>
              img.id !== numericImageId && img.id !== Number(numericImageId)
          );
        }
        return updatedImages;
      });

      showSnackbar("Image deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting image:", error);
      showSnackbar("Failed to delete image", "error");
    } finally {
      // Close the modal
      setDeleteModalOpen(false);
      setImageToDelete(null);
    }
  }, [formData.variants, productId, showSnackbar, imageToDelete]);

  const handleSetPrimary = useCallback(
    async (variantId: string | number, imageId: string | number) => {
      try {
        // Get the product ID from the context or URL
        if (!productId) {
          showSnackbar("Product ID is missing", "error");
          return;
        }

        // Find the actual numeric variant ID from the form data
        const foundVariant = formData.variants?.find(
          (v) =>
            v.id === variantId ||
            (v.id !== undefined &&
              variantId !== undefined &&
              String(v.id) === String(variantId))
        );

        if (!foundVariant || foundVariant.id === undefined) {
          showSnackbar(
            "Cannot find variant information. Please save the variant first.",
            "warning"
          );
          return;
        }

        // Ensure we're using the correct numeric ID that the API expects
        const numericVariantId =
          typeof foundVariant.id === "number"
            ? foundVariant.id
            : parseInt(String(foundVariant.id), 10);

        if (isNaN(numericVariantId)) {
          showSnackbar(
            "Invalid variant ID. The API requires a numeric ID.",
            "error"
          );
          return;
        }

        // Convert image ID to numeric if needed
        const numericImageId =
          typeof imageId === "number" ? imageId : parseInt(String(imageId), 10);

        if (isNaN(numericImageId)) {
          showSnackbar("Invalid image ID.", "error");
          return;
        }

        console.log(
          "Setting image:",
          numericImageId,
          "as primary for variant:",
          numericVariantId
        );

        // Call API with proper parameters
        const response = await setVariantPrimaryImage(
          String(productId),
          String(numericVariantId),
          String(numericImageId)
        );

        console.log("Set primary image response:", response);

        // Update state to reflect primary status change
        setVariantImages((prev) => {
          const updatedImages = { ...prev };
          if (updatedImages[variantId]) {
            updatedImages[variantId] = updatedImages[variantId].map((img) => ({
              ...img,
              is_primary:
                img.id === numericImageId || img.id === Number(numericImageId),
            }));
          }
          return updatedImages;
        });

        showSnackbar("Primary image set successfully", "success");
      } catch (error) {
        console.error("Error setting primary image:", error);
        showSnackbar("Failed to set primary image", "error");
      }
    },
    [formData.variants, productId, showSnackbar]
  );

  // Add state for showing validation messages
  const [showValidationMessages, setShowValidationMessages] = useState(false);

  // Update the handleFinishClick function
  const handleFinishClick = async () => {
    setShowValidationMessages(true);

    // Trigger validation for all fields
    const result = await trigger();
    const currentFormValues = watch();

    // Check required fields
    const requiredFields = [
      "slug",
      "price",
      "stock",
      "purchase_price",
      "low_stock_threshold",
    ];
    let firstErrorField = null;
    let firstErrorIndex = 0;

    // Check each variant for required fields
    for (let index = 0; index < currentFormValues.variants.length; index++) {
      const variant = currentFormValues.variants[index];

      // Check required fields
      for (const field of requiredFields) {
        if (!variant[field]) {
          firstErrorField = field;
          firstErrorIndex = index;
          break;
        }
      }

      // Check attributes
      if (!firstErrorField && variant.attributes) {
        for (
          let attrIndex = 0;
          attrIndex < variant.attributes.length;
          attrIndex++
        ) {
          const attr = variant.attributes[attrIndex];
          if (!attr.term_id || attr.term_id <= 0) {
            firstErrorField = `attributes.${attrIndex}.term_id`;
            firstErrorIndex = index;
            break;
          }
        }
      }

      if (firstErrorField) break;
    }

    if (firstErrorField) {
      // Scroll to and focus the first error field
      const fieldName = `variants.${firstErrorIndex}.${firstErrorField}`;
      const element = document.querySelector(`[name="${fieldName}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        (element as HTMLElement).focus();
      }
      // showSnackbar('Please fill in all required fields', 'error');
      return;
    }

    // If not in edit mode, check for combinations
    if (!isEditMode) {
      const allCombinations = generateAllAttributeCombinations();
      if (allCombinations.length > currentFormValues.variants.length) {
        showSnackbar("Please add all combinations", "warning");
        return;
      }
    }

    // If validation passes, proceed with form submission
    handleFormSubmit(currentFormValues);
  };

  // Update FormInputField usage to show validation state
  const renderFormField = (index: number, field: string, options: any = {}) => {
    const {
      label,
      type = "text",
      required = false,
      inputProps = {},
      ...rest
    } = options;

    const fieldError =
      showValidationMessages && errors?.variants?.[index]?.[field];
    const errorMessage = fieldError?.message;

    return (
      <FormInputField
        name={`variants.${index}.${field}`}
        control={control}
        label={label}
        type={type}
        required={required}
        className={fieldError ? "error-field" : ""}
        {...rest}
        inputProps={{
          ...inputProps,
          "aria-label": label,
        }}
      />
    );
  };

  // Add styles for error states
  const errorStyles = `
    .error-field .MuiOutlinedInput-root {
      & fieldset {
        border-color: #d32f2f;
      }
      &:hover fieldset {
        border-color: #d32f2f;
      }
      &.Mui-focused fieldset {
        border-color: #d32f2f;
      }
    }
    .error-field .MuiFormLabel-root {
      color: #d32f2f;
    }
    .error-field .MuiFormHelperText-root {
      color: #d32f2f;
    }
  `;

  return (
    <>
      <style jsx global>
        {errorStyles}
      </style>
      <form
        id="variantForm"
        ref={formRef}
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex w-full flex-col justify-center space-y-4"
      >
        {fields.map((field, index) => {
          const variantId = watch(`variants.${index}.id`);
          const variantImages_ = variantId
            ? variantImages[variantId] || []
            : [];
          const isUploading = variantId ? uploading[variantId] || false : false;
          // Add temporary images for display
          const hasPendingImages = !!pendingImages[index]?.length;
          const pendingImageUrls = tempImageUrls[index] || [];

          return (
            <Paper key={field.id} className="p-4 relative">
              <Grid container spacing={2}>
                {variationAttributes.map((attr, attrIndex) => (
                  <Grid item xs={12} sm={6} key={attr.attribute_id}>
                    <FormSelectField
                      name={`variants.${index}.attributes.${attrIndex}.term_id`}
                      control={control}
                      label={getAttributeName(attr.attribute_id)}
                      options={getAllTermsForAttribute(attr.attribute_id).map(
                        (term) => ({
                          value: term.value,
                          label: term.label,
                        })
                      )}
                      required
                      onChange={(event: SelectChangeEvent<unknown>) =>
                        handleTermChange(event, index, attrIndex)
                      }
                    />

                    {/* Set attribute_id as hidden field */}
                    <input
                      type="hidden"
                      {...register(
                        `variants.${index}.attributes.${attrIndex}.attribute_id`
                      )}
                      defaultValue={Number(attr.attribute_id)}
                    />
                  </Grid>
                ))}

                {/* Add visual separator between attributes and product details */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      borderBottom: "1px solid #e0e0e0",
                      my: 2,
                      position: "relative",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      component="span"
                      sx={{
                        position: "absolute",
                        top: "-10px",
                        left: "10px",
                        backgroundColor: "white",
                        px: 1,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      Variant Attributes
                      <span style={{ color: "red", marginLeft: "3px" }}>*</span>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.slug`}
                    control={control}
                    label="Slug"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.price`}
                    control={control}
                    label="Price"
                    type="number"
                    required
                    inputProps={{
                      step: "1",
                      min: "0",
                      onKeyDown: (e) => {
                        if (
                          /[a-zA-Z]/.test(e.key) &&
                          e.key !== "Backspace" &&
                          e.key !== "Delete" &&
                          e.key !== "ArrowLeft" &&
                          e.key !== "ArrowRight" &&
                          e.key !== "Tab"
                        ) {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.discount_price`}
                    control={control}
                    label="Discount Price"
                    type="number"
                    // required
                    inputProps={{
                      step: "1",
                      min: "0",
                      onKeyDown: (e) => {
                        // Allow digits, Backspace, Delete, Arrow keys, and Tab
                        if (
                          /[a-zA-Z]/.test(e.key) && // Restrict letters
                          e.key !== "Backspace" &&
                          e.key !== "Delete" &&
                          e.key !== "ArrowLeft" &&
                          e.key !== "ArrowRight" &&
                          e.key !== "Tab"
                        ) {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.purchase_price`}
                    control={control}
                    label="Purchase Price"
                    type="number"
                    required
                    inputProps={{
                      step: "1",
                      min: "0",
                      onKeyDown: (e) => {
                        // Allow digits, Backspace, Delete, Arrow keys, and Tab
                        if (
                          /[a-zA-Z]/.test(e.key) && // Restrict letters
                          e.key !== "Backspace" &&
                          e.key !== "Delete" &&
                          e.key !== "ArrowLeft" &&
                          e.key !== "ArrowRight" &&
                          e.key !== "Tab"
                        ) {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.stock`}
                    control={control}
                    label="Stock"
                    type="number"
                    required
                    inputProps={{
                      step: "1",
                      min: "0",
                      onKeyDown: (e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          e.key !== "Backspace" &&
                          e.key !== "Delete" &&
                          e.key !== "ArrowLeft" &&
                          e.key !== "ArrowRight" &&
                          e.key !== "Tab"
                        ) {
                          e.preventDefault();
                        }
                        if (e.key === "." || e.key === ",") {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormInputField
                    name={`variants.${index}.low_stock_threshold`}
                    control={control}
                    label="Low Stock Threshold"
                    type="number"
                    required
                    inputProps={{
                      step: "1",
                      min: "0",
                      onKeyDown: (e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          e.key !== "Backspace" &&
                          e.key !== "Delete" &&
                          e.key !== "ArrowLeft" &&
                          e.key !== "ArrowRight" &&
                          e.key !== "Tab"
                        ) {
                          e.preventDefault();
                        }
                        if (e.key === "." || e.key === ",") {
                          e.preventDefault();
                        }
                      },
                    }}
                  />
                </Grid>

                {/* Group dimensions and weight in a single row */}
                <Grid item xs={12}>
                  <Box sx={{ borderBottom: "1px dashed #eee", mb: 2, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Dimensions & Weight
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <FormInputField
                        name={`variants.${index}.weight`}
                        control={control}
                        label="Weight"
                        type="number"
                        inputProps={{
                          step: "1",
                          min: "0",
                          onKeyDown: (e) => {
                            // Allow digits, Backspace, Delete, Arrow keys, and Tab
                            if (
                              /[a-zA-Z]/.test(e.key) && // Restrict letters
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              e.key !== "Tab"
                            ) {
                              e.preventDefault();
                            }
                          },
                          endAdornment: (
                            <InputAdornment position="end">gm</InputAdornment>
                          ), // Move inside inputProps
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormInputField
                        name={`variants.${index}.length`}
                        control={control}
                        label="Length"
                        type="number"
                        inputProps={{
                          step: "1",
                          min: "0",
                          onKeyDown: (e) => {
                            // Allow digits, Backspace, Delete, Arrow keys, and Tab
                            if (
                              /[a-zA-Z]/.test(e.key) && // Restrict letters
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              e.key !== "Tab"
                            ) {
                              e.preventDefault();
                            }
                          },
                          endAdornment: (
                            <InputAdornment position="end">cm</InputAdornment>
                          ), // Move inside inputProps
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormInputField
                        name={`variants.${index}.width`}
                        control={control}
                        label="Width"
                        type="number"
                        inputProps={{
                          step: "1",
                          min: "0",
                          onKeyDown: (e) => {
                            // Allow digits, Backspace, Delete, Arrow keys, and Tab
                            if (
                              /[a-zA-Z]/.test(e.key) && // Restrict letters
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              e.key !== "Tab"
                            ) {
                              e.preventDefault();
                            }
                          },
                          endAdornment: (
                            <InputAdornment position="end">cm</InputAdornment>
                          ), // Move inside inputProps
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormInputField
                        name={`variants.${index}.height`}
                        control={control}
                        label="Height"
                        type="number"
                        inputProps={{
                          step: "1",
                          min: "0",
                          onKeyDown: (e) => {
                            // Allow digits, Backspace, Delete, Arrow keys, and Tab
                            if (
                              /[a-zA-Z]/.test(e.key) && // Restrict letters
                              e.key !== "Backspace" &&
                              e.key !== "Delete" &&
                              e.key !== "ArrowLeft" &&
                              e.key !== "ArrowRight" &&
                              e.key !== "Tab"
                            ) {
                              e.preventDefault();
                            }
                          },
                          endAdornment: (
                            <InputAdornment position="end">cm</InputAdornment>
                          ), // Move inside inputProps
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <FormInputField
                    name={`variants.${index}.barcode`}
                    control={control}
                    label="Barcode"
                    inputProps={{
                      maxLength: 50,
                      onBlur: (e) => {
                        const value = e.target.value.trim();
                        if (!value) {
                          setValue(`variants.${index}.barcode`, "");
                          trigger(`variants.${index}.barcode`);
                        }
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormInputField
                    name={`variants.${index}.description`}
                    control={control}
                    label="Description"
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Show variant images if they exist */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      marginBottom: 2,
                      padding: 2,
                      border: "1px dashed #ccc",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      Images
                    </Typography>

                    {isUploading && (
                      <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        p={2}
                      >
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        <Typography>Uploading images...</Typography>
                      </Box>
                    )}

                    {!isUploading && (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            marginBottom: 2,
                          }}
                        >
                          {/* Show existing images if variant has ID */}
                          {variantId &&
                          variantImages[variantId] &&
                          variantImages[variantId].length > 0 ? (
                            variantImages[variantId].map((image, imgIndex) => (
                              <Box
                                key={image.id || imgIndex}
                                sx={{
                                  position: "relative",
                                  width: 100,
                                  height: 130, // Increased height to accommodate controls
                                  borderRadius: 1,
                                  overflow: "visible", // Changed to visible to allow controls outside
                                }}
                              >
                                {/* Control box above the image */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: -30, // Position above the image
                                    left: 0,
                                    right: 0,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    zIndex: 2,
                                    marginTop: 4,
                                  }}
                                >
                                  <Checkbox
                                    checked={image.is_primary}
                                    onChange={() =>
                                      handleSetPrimary(
                                        variantId,
                                        image.id ? image.id.toString() : ""
                                      )
                                    }
                                    disabled={isUploading || image.is_primary}
                                    size="small"
                                    sx={{ padding: "2px" }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteImage(
                                        variantId,
                                        image.id ? image.id.toString() : ""
                                      )
                                    }
                                    disabled={isUploading}
                                    color="error"
                                    sx={{ padding: "2px" }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>

                                {/* Image container */}
                                <Box
                                  sx={{
                                    position: "relative",
                                    width: 100,
                                    height: 100,
                                    border: (theme) =>
                                      image.is_primary
                                        ? `2px solid ${theme.palette.primary.main}`
                                        : "1px solid #ddd",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={
                                      typeof image.url === "string"
                                        ? image.url
                                        : typeof image.image_url === "string"
                                        ? image.image_url
                                        : ""
                                    }
                                    alt={`Variant ${variantId} image ${imgIndex}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                    onError={(e) => {
                                      console.error(
                                        "Image failed to load:",
                                        image
                                      );
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/100?text=Image+Error";
                                    }}
                                  />
                                </Box>
                              </Box>
                            ))
                          ) : hasPendingImages ? (
                            // Show temporary images for new variants with controls above
                            pendingImageUrls.map((url, imgIndex) => (
                              <Box
                                key={`pending-${index}-${imgIndex}`}
                                sx={{
                                  position: "relative",
                                  width: 100,
                                  height: 130, // Increased height to accommodate controls
                                  borderRadius: 1,
                                  overflow: "visible", // Changed to visible to allow controls outside
                                }}
                              >
                                {/* Control box above the image */}
                                <Box
                                  sx={{
                                    position: "absolute",
                                    top: -30, // Position above the image
                                    right: 0,
                                    display: "flex",
                                    zIndex: 2,
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      // Remove this pending image
                                      setPendingImages((prev) => {
                                        const updated = { ...prev };
                                        if (updated[index]) {
                                          const files = [...updated[index]];
                                          files.splice(imgIndex, 1);
                                          updated[index] = files;
                                        }
                                        return updated;
                                      });

                                      // Revoke the URL and remove it
                                      URL.revokeObjectURL(url);
                                      setTempImageUrls((prev) => {
                                        const updated = { ...prev };
                                        if (updated[index]) {
                                          const urls = [...updated[index]];
                                          urls.splice(imgIndex, 1);
                                          updated[index] = urls;
                                        }
                                        return updated;
                                      });
                                    }}
                                    color="error"
                                    sx={{ padding: "2px" }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>

                                {/* Image container */}
                                <Box
                                  sx={{
                                    position: "relative",
                                    width: 100,
                                    height: 100,
                                    border: "1px solid #ddd",
                                    borderRadius: 1,
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={url}
                                    alt={`Pending image ${imgIndex}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                </Box>
                              </Box>
                            ))
                          ) : (
                            <Typography color="text.secondary">
                              No images uploaded. Click "Upload Images" to add
                              images for this variant.
                            </Typography>
                          )}
                        </Box>

                        {/* Show the file input regardless of variant ID */}
                        <input
                          type="file"
                          multiple
                          onChange={(event) =>
                            handleFileSelect(event, variantId, index)
                          }
                          ref={(el) => {
                            if (el)
                              fileInputRefs.current[variantId || index] = el;
                          }}
                          style={{ display: "none" }}
                          accept="image/jpeg,image/png,image/webp"
                        />
                        <Button
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          onClick={() =>
                            fileInputRefs.current[variantId || index]?.click()
                          }
                          disabled={isUploading}
                          title={
                            variantId
                              ? "Select images to upload immediately"
                              : "Select images first, then click Update to complete the upload"
                          }
                        >
                          {variantId ? "Upload Images" : "Select Images"}
                        </Button>

                        {/* Show message for pending images */}
                        {hasPendingImages && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 1 }}
                          >
                            {pendingImages[index].length} image(s) selected.
                            {!variantId &&
                              " They will be uploaded after saving the variant."}
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Delete Variant Button - Only show for non-default variants */}
              {fields.length > 1 && (
                <IconButton
                  onClick={(e) => {
                    e.preventDefault(); // Prevent form submission
                    const variantId = formData.variants?.[index]?.id;
                    console.log("Deleting variant:", { variantId, index });
                    handleDeleteVariant(variantId, index);
                  }}
                  disabled={isLoading}
                  className="absolute top-2 right-2"
                  color="error"
                  size="small"
                  type="button" // Explicitly set type to button
                  sx={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    margin: "0",
                    zIndex: 2,
                    "&:hover": {
                      backgroundColor: "rgba(211, 47, 47, 0.04)",
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Paper>
          );
        })}

        {/* Add New Variant Button - Only show if not all combinations are used */}
        {!areAllCombinationsUsed() ? (
          <div className="flex justify-center">
            <AppButton
              label="Add Variant"
              onClick={handleAddVariant}
              variant="outlined"
              type="button"
              disabled={isLoading}
            />
          </div>
        ) : (
          <div className="flex justify-center p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="text-green-600 flex items-center">
              <span className="mr-2">✓</span>
              <span>
                All combinations have been added. You can proceed to the next
                step.
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <AppButton
            label="Previous"
            onClick={previousStep}
            variant="outlined"
            disabled={isLoading}
            type="button"
          />
          <div className="flex gap-2">
            <AppButton
              label={isEditMode ? "Update" : "Finish"}
              type="button"
              loading={isLoading}
              disabled={isLoading}
              onClick={handleFinishClick}
            />
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          aria-labelledby="delete-image-dialog-title"
          aria-describedby="delete-image-dialog-description"
        >
          <DialogTitle id="delete-image-dialog-title">
            Confirm Image Deletion
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-image-dialog-description">
              Are you sure you want to delete this image?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteModalOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={confirmDeleteImage} color="error" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </form>
    </>
  );
}

export default VariantTab;
