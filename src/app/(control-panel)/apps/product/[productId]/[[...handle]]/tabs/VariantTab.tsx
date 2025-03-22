"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect } from "react";
import { Paper, Grid, TextField, IconButton, SelectChangeEvent } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm, type ProductFormData } from "../ProductFormContext";
import {
  createProductVariants,
  deleteProductVariant,
  getProduct,
  type ProductVariant,
  type CreateProductVariantsRequest
} from "@/services/apiProduct";
import FormSelectField from "@/components/Shared/SelectField";
import DeleteIcon from "@mui/icons-material/Delete";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
};

interface FormData {
  variants: Array<{
    id?: number;
    slug: string;
    price: number;
    stock: number;
    status: boolean;
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

// const variantSchema = z.object({
//   variants: z
//     .array(
//       z.object({
//         id: z.number().optional(),
//         slug: z.string().min(1, "Slug is required and cannot be empty"),
//         price: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number({ 
//             required_error: "Price is required",
//             invalid_type_error: "Price must be a number" 
//           }).min(0, "Price must be >= 0"),
//         ),
//         stock: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number({ 
//             required_error: "Stock is required",
//             invalid_type_error: "Stock must be a number" 
//           }).min(0, "Stock must be >= 0"),
//         ),
//         status: z.boolean(),
//         discount_price: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         purchase_price: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         low_stock_threshold: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         weight: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         length: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         width: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         height: z.preprocess(
//           (val) => (val === "" ? null : Number(val)),
//           z.number().nullable(),
//         ),
//         barcode: z.string().nullable(),
//         description: z.string().nullable(),
//         attributes: z.array(
//           z.object({
//             attribute_id: z.preprocess(
//               (val) => Number(val),
//               z.number().min(1, "Attribute ID is required")
//             ),
//             term_id: z.preprocess(
//               (val) => Number(val),
//               z.number().min(1, "Term must be selected for each attribute")
//             ),
//           })
//         ).min(1, "At least one attribute must be selected"),
//       }),
//     )
//     .min(1, "At least one variant is required"),
// });


// ✅ Price field validation schema
const variantSchema = z.object({
  variants: z.array(
    z.object({
      id: z.number().optional(),
      slug: z.string().min(1, "Slug is required"),
      price: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z
          .number({
            required_error: "Price is required",
            invalid_type_error: "Price must be a number",
          })
          .min(1, "Price must be greater than 0")
          .max(1000000, "Price exceeds the limit")
          .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
            message: "Only two decimal places allowed",
          })
      ),
      stock: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z
          .number({
            required_error: "Stock is required",
            invalid_type_error: "Stock must be a number",
          })
          .min(0, "Stock must be >= 0")
      ),
      status: z.boolean(),
      discount_price: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Discount price is required",
          invalid_type_error: "Discount price must be a number",
        })
        .min(1, "Discount price must be greater than 0")
        .max(1000000, "Discount price exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      purchase_price: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Purchase price is required",
          invalid_type_error: "Purchase price must be a number",
        })
        .min(1, "Purchase price must be greater than 0")
        .max(1000000, "Purchase price exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      low_stock_threshold: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Low stock threshold is required",
          invalid_type_error: "Low stock threshold must be a number",
        })
      ),
      weight: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Weight is required",
          invalid_type_error: "Weight must be a number",
        })
        .min(1, "Weight must be greater than 0")
        .max(1000000, "Weight exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      length: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Length is required",
          invalid_type_error: "Length price must be a number",
        })
        .min(1, "Length must be greater than 0")
        .max(1000000, "Length exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      width: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Width is required",
          invalid_type_error: "Width must be a number",
        })
        .min(1, "Width must be greater than 0")
        .max(1000000, "Width exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      height: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number({
          required_error: "Height is required",
          invalid_type_error: "Height must be a number",
        })
        .min(1, "Height must be greater than 0")
        .max(1000000, "Height exceeds the limit")
        .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toString()), {
          message: "Only two decimal places allowed",
        })
      ),
      barcode: z.string().nullable(),
      description: z.string().nullable(),
      attributes: z
        .array(
          z.object({
            attribute_id: z.preprocess(
              (val) => Number(val),
              z.number().min(1, "Attribute ID is required")
            ),
            term_id: z.preprocess(
              (val) => Number(val),
              z.number().min(1, "Term must be selected for each attribute")
            ),
          })
        )
        .min(1, "At least one attribute must be selected"),
    })
  )
});

function VariantTab() {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    markStepAsCompleted,
  } = useProductForm();

  // Track used terms across all variants
  const [usedTerms, setUsedTerms] = useState<Record<number, Set<number>>>({});

  // Function to fetch product data including variants
  const fetchProductData = async (productId: number) => {
    if (!productId) return;

    setIsLoading(true);
    try {
      console.log("Fetching product data from API for ID:", productId);
      const response = await getProduct(productId);
      console.log("Product data received:", response.data);

      if (response.data.variants && response.data.variants.length > 0) {
        // Convert API variant data to form data format
        const fetchedVariants = response.data.variants.map((variant: any) => ({
          id: variant.id,
          slug: variant.slug || "",
          price: typeof variant.price === 'string' 
            ? parseFloat(variant.price) 
            : (variant.price || 0),
          stock: typeof variant.stock === 'string' 
            ? parseInt(variant.stock) 
            : (variant.stock || 0),
          status: variant.status === true || 
            (typeof variant.status === 'string' && variant.status === 'active'),
          discount_price: variant.discount_price 
            ? (typeof variant.discount_price === 'string' 
              ? parseFloat(variant.discount_price) 
              : variant.discount_price) 
            : null,
          purchase_price: variant.purchase_price 
            ? (typeof variant.purchase_price === 'string' 
              ? parseFloat(variant.purchase_price) 
              : variant.purchase_price) 
            : null,
          low_stock_threshold: variant.low_stock_threshold 
            ? (typeof variant.low_stock_threshold === 'string' 
              ? parseInt(variant.low_stock_threshold) 
              : variant.low_stock_threshold) 
            : null,
          weight: variant.weight 
            ? (typeof variant.weight === 'string' 
              ? parseFloat(variant.weight) 
              : variant.weight) 
            : null,
          length: variant.length 
            ? (typeof variant.length === 'string' 
              ? parseFloat(variant.length) 
              : variant.length) 
            : null,
          width: variant.width 
            ? (typeof variant.width === 'string' 
              ? parseFloat(variant.width) 
              : variant.width) 
            : null,
          height: variant.height 
            ? (typeof variant.height === 'string' 
              ? parseFloat(variant.height) 
              : variant.height) 
            : null,
          barcode: variant.barcode || null,
          description: variant.description || null,
          attributes: variant.variantAttributes 
            ? variant.variantAttributes.map((varAttr: any) => ({
                attribute_id: Number(varAttr.attribute_id),
                term_id: Number(varAttr.term_id),
              }))
            : [],
        }));

        console.log("Variants fetched from API:", fetchedVariants);
        
        // Update form data context
        updateFormData({
          variants: fetchedVariants,
          attributesResponse: {
            productAttributeTerms: response.data.productAttributeTerms || [],
            productAttributes: response.data.productAttributes || []
          },
        });
        
        // Reset form with fetched variants - note this will only work if the form is already initialized
        reset({ variants: fetchedVariants });
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      showSnackbar("Failed to load product variants", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch product data when component mounts or productId changes
  useEffect(() => {
    if (formData.productId) {
      fetchProductData(formData.productId);
    }
  }, [formData.productId]);

  useEffect(() => {
    if (formData.attributesResponse) {
      console.log("Attributes API Response:", formData.attributesResponse);
    }
    
    if (formData.productId) {
      console.log("VariantTab - Product ID:", formData.productId);
      
      // Log existing variants
      if (formData.variants) {
        console.log("Existing Variants:", formData.variants);
      }
      
      if (formData.productImages) {
        console.log("VariantTab - Product Images:", formData.productImages);
      }
    }
  }, [formData.attributesResponse, formData.productId, formData.productImages, formData.variants]);

  // Compute available terms for each attribute
  const variationAttributes = (formData.attributes || [])
    .filter((attr) => attr.used_in_variation && attr.attribute_id > 0)
    .map((attr) => {
      // Get all terms for this attribute from attributeResponse
      const allTerms = (formData.attributesResponse?.productAttributeTerms || [])
        .filter(
          (term) => 
            term.attribute_id === attr.attribute_id && 
            term.used_in_variation
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

  // Create a new empty variant with only attribute structure
  const createDefaultVariant = (isNewVariant: boolean = false) => {
    // If existing variants exist from getProduct API and it's not a new variant, use the first variant's data
    if (formData.variants && formData.variants.length > 0 && !isNewVariant) {
      const existingVariant = formData.variants[0];
      return {
        id: existingVariant.id,
        product_id: formData.productId,
        slug: existingVariant.slug || "",
        price: typeof existingVariant.price === 'string' 
          ? parseFloat(existingVariant.price) 
          : (existingVariant.price || 0),
        stock: typeof existingVariant.stock === 'string' 
          ? parseInt(existingVariant.stock) 
          : (existingVariant.stock || 0),
        status: existingVariant.status === true || 
          (typeof existingVariant.status === 'string' && existingVariant.status === 'active'),
        discount_price: existingVariant.discount_price 
          ? (typeof existingVariant.discount_price === 'string' 
            ? parseFloat(existingVariant.discount_price) 
            : existingVariant.discount_price) 
          : null,
        purchase_price: existingVariant.purchase_price 
          ? (typeof existingVariant.purchase_price === 'string' 
            ? parseFloat(existingVariant.purchase_price) 
            : existingVariant.purchase_price) 
          : null,
        low_stock_threshold: existingVariant.low_stock_threshold 
          ? (typeof existingVariant.low_stock_threshold === 'string' 
            ? parseInt(existingVariant.low_stock_threshold) 
            : existingVariant.low_stock_threshold) 
          : null,
        weight: existingVariant.weight 
          ? (typeof existingVariant.weight === 'string' 
            ? parseFloat(existingVariant.weight) 
            : existingVariant.weight) 
          : null,
        length: existingVariant.length 
          ? (typeof existingVariant.length === 'string' 
            ? parseFloat(existingVariant.length) 
            : existingVariant.length) 
          : null,
        width: existingVariant.width 
          ? (typeof existingVariant.width === 'string' 
            ? parseFloat(existingVariant.width) 
            : existingVariant.width) 
          : null,
        height: existingVariant.height 
          ? (typeof existingVariant.height === 'string' 
            ? parseFloat(existingVariant.height) 
            : existingVariant.height) 
          : null,
        barcode: existingVariant.barcode ?? null,
        description: existingVariant.description ?? null,
        attributes: (existingVariant as Variant).variantAttributes 
          ? (existingVariant as Variant).variantAttributes!.map(varAttr => ({
              attribute_id: Number(varAttr.attribute_id),
              term_id: Number(varAttr.term_id),
              is_visible: true,
              used_in_variation: true,
              term: varAttr.term,
              attribute: varAttr.attribute
            }))
          : variationAttributes.map((attr) => ({
              attribute_id: Number(attr.attribute_id),
              term_id: 0,
              is_visible: true,
              used_in_variation: true
            })),
      };
    }

    // Create a new empty variant
    return {
      slug: "",
      price: 0,
      stock: 0,
      status: true,
      discount_price: null,
      purchase_price: null,
      low_stock_threshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      barcode: null,
      description: null,
      attributes: variationAttributes.map((attr) => ({
        attribute_id: Number(attr.attribute_id),
        term_id: 0,
        is_visible: true,
        used_in_variation: true
      })),
    };
  };

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      variants: formData.variants && formData.variants.length > 0 
        ? formData.variants.map(variant => ({
            ...variant,
            attributes: Array.isArray(variant.attributes) 
              ? variant.attributes.map(attr => ({
                  attribute_id: Number(attr.attribute_id),
                  term_id: Number(attr.term_id)
                }))
              : variationAttributes.map(attr => ({
                  attribute_id: Number(attr.attribute_id),
                  term_id: 0
                }))
          }))
        : [createDefaultVariant()],
    },
    mode: "all",
    resolver: zodResolver(variantSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Watch all variants to track used terms
  const variants = watch("variants") || [];

  // Update used terms whenever variants change
  useEffect(() => {
    const newUsedTerms: Record<number, Set<number>> = {};
    
    variants.forEach((variant) => {
      if (Array.isArray(variant.attributes)) {
        variant.attributes.forEach((attr) => {
          if (!newUsedTerms[attr.attribute_id]) {
            newUsedTerms[attr.attribute_id] = new Set();
          }
          // Only add if term_id is a valid number
          if (attr.term_id && attr.term_id !== 0) {
            newUsedTerms[attr.attribute_id].add(attr.term_id);
          }
        });
      }
    });

    setUsedTerms(newUsedTerms);
  }, [variants]);

  // Check if there are any unused terms available for any attribute
  const hasUnusedTerms = variationAttributes.some((attr) => {
    const availableTerms = (formData.attributesResponse?.productAttributeTerms || [])
      .filter(
        (term) => 
          term.attribute_id === attr.attribute_id && 
          term.used_in_variation && 
          (!usedTerms[attr.attribute_id] || 
           !usedTerms[attr.attribute_id].has(term.term_id))
      );
    return availableTerms.length > 0;
  });

  // Function to get available terms for a specific attribute and variant
  const getAvailableTermsForAttribute = (attributeId: number, variantIndex: number) => {
    const currentVariant = variants[variantIndex];
    const currentTermId = currentVariant?.attributes?.find(attr => attr.attribute_id === attributeId)?.term_id;
    
    // Get all terms for this attribute
    const allTerms = (formData.attributesResponse?.productAttributeTerms || [])
      .filter(term => 
        term.attribute_id === attributeId && 
        term.used_in_variation && 
        (term.term_id === currentTermId || // Include current term
         !usedTerms[attributeId]?.has(term.term_id)) // Include unused terms
      )
      .map(term => ({
        value: term.term_id,
        label: term.term?.name || `Term ${term.term_id}`,
      }));
      
    console.log(`Available terms for attribute ${attributeId}, variant ${variantIndex}:`, allTerms);
    return allTerms;
  };

  // Function to check if an attribute has any available terms
  const hasAvailableTerms = (attributeId: number, variantIndex: number) => {
    return getAvailableTermsForAttribute(attributeId, variantIndex).length > 0;
  };

  const handleDeleteVariant = async (variantId: number, index: number) => {
    try {
      setIsLoading(true);

      if (fields.length <= 1) {
        showSnackbar("Cannot delete the last variant", "error");
        return;
      }

      if (variantId) {
        await deleteProductVariant(variantId);
      }

      remove(index);

      const updatedVariants = [...(formData.variants || [])];
      updatedVariants.splice(index, 1);
      updateFormData({ variants: updatedVariants });

      showSnackbar("Variant deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting variant:", error);
      showSnackbar("Failed to delete variant", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVariant = () => {
    // Only add variant if there are unused terms
    if (hasUnusedTerms) {
      append(createDefaultVariant(true)); // Pass true to indicate this is a new variant
    } else {
      showSnackbar("All attribute terms have been used", "warning");
    }
  };

  // Transform the data to match API requirements
  const transformVariantData = (variant: any): ProductVariant => {
    const transformedVariant: ProductVariant = {
      slug: variant.slug,
      price: Number(variant.price),
      stock: Number(variant.stock),
      status: Boolean(variant.status),
      discount_price: variant.discount_price ? Number(variant.discount_price) : undefined,
      purchase_price: variant.purchase_price ? Number(variant.purchase_price) : undefined,
      low_stock_threshold: variant.low_stock_threshold ? Number(variant.low_stock_threshold) : undefined,
      weight: variant.weight ? Number(variant.weight) : undefined,
      length: variant.length ? Number(variant.length) : undefined,
      width: variant.width ? Number(variant.width) : undefined,
      height: variant.height ? Number(variant.height) : undefined,
      barcode: variant.barcode || undefined,
      description: variant.description || undefined,
      attributes: Array.isArray(variant.attributes) 
        ? variant.attributes.map((attr: any) => ({
            attribute_id: Number(attr.attribute_id),
            term_id: Number(attr.term_id)
          }))
        : []
    };

    return transformedVariant;
  };

  // Function for debugging attribute values before submission
  const debugAttributeValues = () => {
    const currentVariants = watch("variants");
    currentVariants.forEach((variant, variantIndex) => {
      console.log(`Debugging Variant ${variantIndex + 1} attributes:`);
      variant.attributes.forEach((attr, attrIndex) => {
        console.log(`  Attribute ${attrIndex}: attribute_id=${attr.attribute_id}, term_id=${attr.term_id}`);
      });
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      console.log("Form data being submitted:", JSON.stringify(data, null, 2));
      
      // Debug attributes
      data.variants.forEach((variant, index) => {
        console.log(`Variant ${index + 1} attributes before submission:`);
        if (Array.isArray(variant.attributes)) {
          variant.attributes.forEach((attr, attrIndex) => {
            console.log(`  Attribute ${attrIndex}: attribute_id=${attr.attribute_id} (${typeof attr.attribute_id}), term_id=${attr.term_id} (${typeof attr.term_id})`);
          });
        } else {
          console.log(`  No attributes array for variant ${index + 1}`);
        }
      });

      if (!data.variants || data.variants.length === 0) {
        showSnackbar("No variants defined", "error");
        return;
      }

      setIsLoading(true);

      if (!formData.productId) {
        throw new Error("Product ID is required");
      }

      // Transform variants data for API
      const transformedVariants = data.variants.map(variant => {
        // Make a new object to avoid mutation
        return {
          slug: variant.slug,
          price: Number(variant.price),
          stock: Number(variant.stock),
          status: Boolean(variant.status),
          discount_price: variant.discount_price ? Number(variant.discount_price) : undefined,
          purchase_price: variant.purchase_price ? Number(variant.purchase_price) : undefined,
          low_stock_threshold: variant.low_stock_threshold ? Number(variant.low_stock_threshold) : undefined,
          weight: variant.weight ? Number(variant.weight) : undefined,
          length: variant.length ? Number(variant.length) : undefined,
          width: variant.width ? Number(variant.width) : undefined,
          height: variant.height ? Number(variant.height) : undefined,
          barcode: variant.barcode || undefined,
          description: variant.description || undefined,
          attributes: Array.isArray(variant.attributes)
            ? variant.attributes.map(attr => ({
                attribute_id: Number(attr.attribute_id),
                term_id: Number(attr.term_id)
              }))
            : []
        };
      });
      
      // Create API request payload
      const apiPayload: CreateProductVariantsRequest = {
        variants: transformedVariants
      };

      console.log("API payload:", JSON.stringify(apiPayload, null, 2));

      // Make API call
      const response = await createProductVariants(
        formData.productId,
        apiPayload
      );

      console.log("API response:", response);

      // After successful creation, fetch the latest product data
      const productResponse = await getProduct(formData.productId);
      
      if (productResponse?.data?.variants) {
        updateFormData({
          variants: productResponse.data.variants,
          attributesResponse: {
            productAttributeTerms: productResponse.data.productAttributeTerms || [],
            productAttributes: productResponse.data.productAttributes || []
          }
        });
      }

      showSnackbar("Product variants saved successfully", "success");
      markStepAsCompleted(3);
      nextStep();
    } catch (error) {
      console.error("Error submitting variants:", error);
      const errorMessage = error.response?.data?.message || "Failed to save variants";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to update form when variants data changes
  useEffect(() => {
    if (formData.variants && formData.variants.length > 0) {
      const formattedVariants = formData.variants.map((variant) => ({
        id: variant.id,
        slug: variant.slug || "",
        price: typeof variant.price === 'string' 
          ? parseFloat(variant.price) 
          : (variant.price || 0),
        stock: typeof variant.stock === 'string' 
          ? parseInt(variant.stock) 
          : (variant.stock || 0),
        status: variant.status === true || 
          (typeof variant.status === 'string' && variant.status === 'active'),
        discount_price: variant.discount_price 
          ? (typeof variant.discount_price === 'string' 
            ? parseFloat(variant.discount_price) 
            : variant.discount_price) 
          : null,
        purchase_price: variant.purchase_price 
          ? (typeof variant.purchase_price === 'string' 
            ? parseFloat(variant.purchase_price) 
            : variant.purchase_price) 
          : null,
        low_stock_threshold: variant.low_stock_threshold 
          ? (typeof variant.low_stock_threshold === 'string' 
            ? parseInt(variant.low_stock_threshold) 
            : variant.low_stock_threshold) 
          : null,
        weight: variant.weight 
          ? (typeof variant.weight === 'string' 
            ? parseFloat(variant.weight) 
            : variant.weight) 
          : null,
        length: variant.length 
          ? (typeof variant.length === 'string' 
            ? parseFloat(variant.length) 
            : variant.length) 
          : null,
        width: variant.width 
          ? (typeof variant.width === 'string' 
            ? parseFloat(variant.width) 
            : variant.width) 
          : null,
        height: variant.height 
          ? (typeof variant.height === 'string' 
            ? parseFloat(variant.height) 
            : variant.height) 
          : null,
        barcode: variant.barcode || null,
        description: variant.description || null,
        attributes: (variant as Variant).variantAttributes 
          ? (variant as Variant).variantAttributes!.map(varAttr => ({
              attribute_id: Number(varAttr.attribute_id),
              term_id: Number(varAttr.term_id),
            }))
          : Array.isArray(variant.attributes)
              ? variant.attributes.map(attr => ({
                  attribute_id: Number(attr.attribute_id),
                  term_id: Number(attr.term_id),
                }))
              : variationAttributes.map(attr => ({
                  attribute_id: Number(attr.attribute_id),
                  term_id: 0,
                })),
      }));

      console.log("Updating form with formatted variants:", formattedVariants);
      reset({ variants: formattedVariants });
    }
  }, [formData.variants, reset]);

  // Find the attribute name from attributesResponse
  const getAttributeName = (attributeId: number) => {
    const attribute = (formData.attributesResponse?.productAttributes || [])
      .find(attr => attr.attribute_id === attributeId);
    return attribute?.name || `Attribute ${attributeId}`;
  };

  // Find the term name for a given term ID
  const getTermName = (attributeId: number, termId: number) => {
    const term = (formData.attributesResponse?.productAttributeTerms || [])
      .find(t => t.attribute_id === attributeId && t.term_id === termId);
    return term?.term?.name || `Term ${termId}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, (errors) => {
      console.error("Form validation errors:", errors);
      
      if (errors.variants) {
        // Handle array-level errors
        if (typeof errors.variants === 'string') {
          showSnackbar(errors.variants, "error");
          return;
        }
        
        // Handle individual variant errors
        const errorMessages = Array.isArray(errors.variants) 
          ? errors.variants
              .map((variantError, index) => {
                if (!variantError) return null;
                
                // Extract field names with errors for this variant
                const fieldNames = Object.keys(variantError);
                if (fieldNames.length === 0) return null;
                
                return `Variant ${index + 1}: Issues with ${fieldNames.join(', ')}`;
              })
              .filter(Boolean)
              .join('; ')
          : "Issues with variants";

        showSnackbar(errorMessages || "Please check all variant fields", "error");
      } else {
        showSnackbar("Please check all required fields", "error");
      }
    })} 
    className="space-y-4">
      {fields.map((field, index) => (
        <Paper key={field.id || index} className="p-4 relative">
          <Grid container spacing={2}>
            {variationAttributes.map((attr, attrIndex) => {
              // Skip rendering if this attribute has no available terms for this variant
              if (!hasAvailableTerms(attr.attribute_id, index)) {
                return null;
              }

              // Get available terms for this attribute and variant
              const availableTerms = getAvailableTermsForAttribute(attr.attribute_id, index);

              return (
                <Grid item xs={12} sm={6} key={attr.attribute_id}>
                  <FormSelectField
                    name={`variants.${index}.attributes.${attrIndex}.term_id`}
                    control={control}
                    label={getAttributeName(attr.attribute_id)}
                    options={availableTerms}
                    required
                    onChange={(event: SelectChangeEvent<unknown>) => {
                      const selectedValue = Number(event.target.value);
                      console.log(`Setting term_id=${selectedValue} for variant ${index}, attribute ${attrIndex}`);
                      setValue(`variants.${index}.attributes.${attrIndex}.term_id`, selectedValue);
                    }}
                  />

                  {/* Set attribute_id as hidden field */}
                  <input 
                    type="hidden" 
                    {...register(`variants.${index}.attributes.${attrIndex}.attribute_id`)}
                    defaultValue={Number(attr.attribute_id)}
                  />
                </Grid>
              );
            })}

            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.slug`)}
                fullWidth
                label="Variant Slug"
                error={!!errors.variants?.[index]?.slug}
                helperText={errors.variants?.[index]?.slug?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.price`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Price"
                type="number"
                error={!!errors.variants?.[index]?.price}
                helperText={errors.variants?.[index]?.price?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.discount_price`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Discount Price"
                type="number"
                error={!!errors.variants?.[index]?.discount_price}
                helperText={errors.variants?.[index]?.discount_price?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.purchase_price`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Purchase Price"
                type="number"
                error={!!errors.variants?.[index]?.purchase_price}
                helperText={errors.variants?.[index]?.purchase_price?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.stock`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Stock"
                type="number"
                error={!!errors.variants?.[index]?.stock}
                helperText={errors.variants?.[index]?.stock?.message}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.low_stock_threshold`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Low Stock Threshold"
                type="number"
                error={!!errors.variants?.[index]?.low_stock_threshold}
                helperText={
                  errors.variants?.[index]?.low_stock_threshold?.message
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register(`variants.${index}.weight`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Weight"
                type="number"
                error={!!errors.variants?.[index]?.weight}
                helperText={errors.variants?.[index]?.weight?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.length`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Length"
                type="number"
                error={!!errors.variants?.[index]?.length}
                helperText={errors.variants?.[index]?.length?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.width`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Width"
                type="number"
                error={!!errors.variants?.[index]?.width}
                helperText={errors.variants?.[index]?.width?.message}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...register(`variants.${index}.height`, {
                  valueAsNumber: true,
                })}
                fullWidth
                label="Height"
                type="number"
                error={!!errors.variants?.[index]?.height}
                helperText={errors.variants?.[index]?.height?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register(`variants.${index}.barcode`)}
                fullWidth
                label="Barcode"
                error={!!errors.variants?.[index]?.barcode}
                helperText={errors.variants?.[index]?.barcode?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                {...register(`variants.${index}.description`)}
                fullWidth
                label="Description"
                multiline
                rows={3}
                error={!!errors.variants?.[index]?.description}
                helperText={errors.variants?.[index]?.description?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <FormCheckboxField
                name={`variants.${index}.status`}
                control={control}
                label="Active"
              />
            </Grid>
          </Grid>

          {/* Delete Variant Button - Only show for non-default variants */}
          {fields.length > 1 && (
            <IconButton
              onClick={() =>
                handleDeleteVariant(field.id ? Number(field.id) : 0, index)
              }
              disabled={isLoading}
              className="absolute top-2 right-2"
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Paper>
      ))}

      {/* Add New Variant Button */}
      <div className="flex justify-center">
        <AppButton
          label="Add Variant"
          onClick={handleAddVariant}
          variant="outlined"
          type="button"
          disabled={isLoading || !hasUnusedTerms}
        />
      </div>

      <div className="flex justify-between mt-4">
        <AppButton
          label="Previous"
          onClick={previousStep}
          variant="outlined"
          disabled={isLoading}
        />
        <AppButton 
          label="Next" 
          type="submit" 
          loading={isLoading} 
        />
      </div>
    </form>
  );
}

export default VariantTab;
