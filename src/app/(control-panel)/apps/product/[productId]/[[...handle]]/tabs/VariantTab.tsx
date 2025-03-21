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

const variantSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.number().optional(),
        slug: z.string().min(1, "Slug is required and cannot be empty"),
        price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number({ 
            required_error: "Price is required",
            invalid_type_error: "Price must be a number" 
          }).min(0, "Price must be >= 0"),
        ),
        stock: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number({ 
            required_error: "Stock is required",
            invalid_type_error: "Stock must be a number" 
          }).min(0, "Stock must be >= 0"),
        ),
        status: z.boolean(),
        discount_price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        purchase_price: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        low_stock_threshold: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        weight: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        length: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        width: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        height: z.preprocess(
          (val) => (val === "" ? null : Number(val)),
          z.number().nullable(),
        ),
        barcode: z.string().nullable(),
        description: z.string().nullable(),
        attributes: z.array(
          z.object({
            attribute_id: z.number().min(1, "Attribute ID is required"),
            term_id: z.number().min(1, "Term must be selected for each attribute"),
          })
        ).min(1, "At least one attribute must be selected"),
      }),
    )
    .min(1, "At least one variant is required"),
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

  // Compute default variant with safe attribute initialization
  const createDefaultVariant = (isNewVariant: boolean = false) => {
    // If existing variants exist from getProduct API and it's not a new variant, use the first variant's data
    if (formData.variants && formData.variants.length > 0 && !isNewVariant) {
      const existingVariant = formData.variants[0];
      return {
        id: existingVariant.id,
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
            }))
          : existingVariant.attributes || variationAttributes.map((attr) => {
              // Ensure we have a valid term_id
              const availableTerms = (formData.attributesResponse?.productAttributeTerms || [])
                .filter(
                  (term) => 
                    term.attribute_id === attr.attribute_id && 
                    term.used_in_variation
                );
              
              return {
                attribute_id: Number(attr.attribute_id),
                term_id: availableTerms.length > 0 
                  ? Number(availableTerms[0].term_id)
                  : 0, // Fallback to 0 if no terms available
              };
            }),
      };
    }

    // Create a new empty variant with only attribute structure
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
      attributes: variationAttributes.map((attr) => {
        // Find first unused term for this attribute
        const availableTerms = (formData.attributesResponse?.productAttributeTerms || [])
          .filter(
            (term) => 
              term.attribute_id === attr.attribute_id && 
              term.used_in_variation &&
              (!usedTerms[attr.attribute_id] || 
               !usedTerms[attr.attribute_id].has(term.term_id))
          );
        
        return {
          attribute_id: Number(attr.attribute_id),
          term_id: 0, // Start with no term selected
        };
      }),
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
      variants: formData.variants || [createDefaultVariant()], // Initialize with existing variants or default
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
      variant.attributes.forEach((attr) => {
        if (!newUsedTerms[attr.attribute_id]) {
          newUsedTerms[attr.attribute_id] = new Set();
        }
        // Only add if term_id is a valid number
        if (attr.term_id && attr.term_id !== 0) {
          newUsedTerms[attr.attribute_id].add(attr.term_id);
        }
      });
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
    
    return (formData.attributesResponse?.productAttributeTerms || [])
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

  const onSubmit = async (data: FormData) => {
    // Detailed logging of form submission
    console.log("Form submitted:", data);
    console.log("Form validation errors:", errors);
    console.log("Is form valid:", isValid);
    console.log("Existing form data:", formData);

    // Detailed error logging
    Object.keys(errors).forEach((key) => {
      console.error(`Error in ${key}:`, (errors as any)[key]);
    });

    // Validate data manually
    if (!data.variants || data.variants.length === 0) {
      showSnackbar("No variants defined", "error");
      return;
    }

    // Validate each variant with detailed logging
    const invalidVariants = data.variants.filter((variant, index) => {
      const variantErrors: string[] = [];

      if (!variant.slug) variantErrors.push(`Variant ${index + 1}: Slug is missing`);
      if (!variant.price) variantErrors.push(`Variant ${index + 1}: Price is missing`);
      if (!variant.stock) variantErrors.push(`Variant ${index + 1}: Stock is missing`);
      
      const invalidAttributes = variant.attributes.filter(attr => !attr.term_id);
      if (invalidAttributes.length > 0) {
        variantErrors.push(`Variant ${index + 1}: Some attributes are missing term selection`);
      }

      if (variantErrors.length > 0) {
        console.error(`Variant ${index + 1} errors:`, variantErrors);
        return true;
      }
      return false;
    });

    if (invalidVariants.length > 0) {
      showSnackbar("Some variants are missing required information", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Ensure we have a productId
      if (!formData.productId) {
        throw new Error("Product ID is required");
      }

      // Transform the data to match API requirements
      const transformedData = {
        variants: data.variants.map((variant) => ({
          id: variant.id, // Include existing variant ID if present
          slug: variant.slug,
          price: Number(variant.price),
          stock: Number(variant.stock),
          status: variant.status,
          discount_price: variant.discount_price
            ? Number(variant.discount_price)
            : null,
          purchase_price: variant.purchase_price
            ? Number(variant.purchase_price)
            : null,
          low_stock_threshold: variant.low_stock_threshold
            ? Number(variant.low_stock_threshold)
            : null,
          weight: variant.weight ? Number(variant.weight) : null,
          length: variant.length ? Number(variant.length) : null,
          width: variant.width ? Number(variant.width) : null,
          height: variant.height ? Number(variant.height) : null,
          barcode: variant.barcode,
          description: variant.description,
          attributes: variant.attributes.map(attr => ({
            attribute_id: attr.attribute_id,
            term_id: attr.term_id
          })),
        })),
      };

      console.log("Calling API with transformed data:", transformedData);

      // Call the API
      const response = await createProductVariants(
        formData.productId,
        transformedData,
      );
      console.log("API response:", response);

      // After successful creation, fetch the latest product data
      try {
        console.log("Fetching updated product data...");
        const productResponse = await getProduct(formData.productId);
        console.log("Updated product data received:", productResponse?.data);
        
        if (productResponse?.data?.variants) {
          // Convert API variant data to form data format
          const updatedVariants = productResponse.data.variants.map((variant: any) => ({
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
          
          // Update form with fresh data from API
          reset({ variants: updatedVariants });
          
          // Also update form context
          updateFormData({
            variants: updatedVariants,
            attributesResponse: {
              productAttributeTerms: productResponse.data.productAttributeTerms || [],
              productAttributes: productResponse.data.productAttributes || []
            },
            hasErrors: false,
          });
          
          console.log("Form updated with latest variant data:", updatedVariants);
        } else {
          // If no variants in response, use the ones from the form submission
          updateFormData({
            variants: data.variants,
            hasErrors: false,
          });
        }
      } catch (fetchError) {
        console.error("Error fetching updated product data:", fetchError);
        // Fall back to using the submitted data
        updateFormData({
          variants: data.variants,
          hasErrors: false,
        });
      }

      showSnackbar("Product variants saved successfully", "success");
      markStepAsCompleted(3);
      nextStep();
    } catch (error) {
      console.error("API error:", error);

      if (error.response) {
        showSnackbar(
          error.response.data.message || "Failed to save variants",
          "error",
        );
      } else if (error.request) {
        showSnackbar("Network error, please try again", "error");
      } else {
        showSnackbar(error.message || "An unexpected error occurred", "error");
      }
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
          : variant.attributes || [],
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
    <form 
      onSubmit={(e) => {
        e.preventDefault(); // Prevent default form submission
        handleSubmit(
          onSubmit, 
          (validationErrors) => {
            console.error("Detailed validation errors:", validationErrors);
            
            // Construct a more informative error message
            const errorMessages = Object.entries(validationErrors)
              .map(([key, error]) => `${key}: ${error?.message}`)
              .join('; ');
            
            showSnackbar(
              errorMessages || "Please fix form errors before submitting", 
              "error"
            );
          }
        )(e); // Immediately invoke the returned function
      }} 
      className="space-y-4"
    >
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
                    onChange={(event) => {
                      const selectedValue = Number(event.target.value);
                      setValue(`variants.${index}.attributes.${attrIndex}.term_id`, selectedValue);
                    }}
                  />
                  <input
                    type="hidden"
                    {...register(
                      `variants.${index}.attributes.${attrIndex}.attribute_id`,
                    )}
                    value={attr.attribute_id}
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
