"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { Paper, Grid, TextField, IconButton, SelectChangeEvent } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm, type ProductFormData } from "../ProductFormContext";
import {
  createProductVariants,
  deleteProductVariant,
  getProduct,
  type ProductVariant,
  type CreateProductVariantsRequest,
  updateProductVariant
} from "@/services/apiProduct";
import FormSelectField from "@/components/Shared/SelectField";
import DeleteIcon from "@mui/icons-material/Delete";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";

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

const schema = z.object({
  variants: z.array(
    z.object({
      id: z.number().optional(),
      slug: z.string().min(1, "Slug is required"),
      price: z.number().min(0, "Price must be greater than or equal to 0"),
      stock: z.number().min(0, "Stock must be greater than or equal to 0"),
      status: z.enum(["active", "inactive"]).default("active"),
      discount_price: z.number().nullable(),
      purchase_price: z.number().nullable(),
      low_stock_threshold: z.number().nullable(),
      weight: z.number().nullable(),
      length: z.number().nullable(),
      width: z.number().nullable(),
      height: z.number().nullable(),
      barcode: z.string().nullable(),
      description: z.string().nullable(),
      attributes: z.array(
        z.object({
          attribute_id: z.number().min(1, "Attribute is required"),
          term_id: z.number().min(1, "Term is required"),
        })
      ).min(1, "At least one attribute is required"),
    })
  ),
});

function VariantTab() {
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
  const isEditMode = Boolean(formData.variants?.some(variant => 
    variant.id !== undefined && 
    variant.attributes?.some(attr => attr.term_id > 0)
  ));

  // State declarations
  const [isLoading, setIsLoading] = useState(false);
  const [usedTerms, setUsedTerms] = useState<Record<number, Set<number>>>({});
  const fetchedRef = useRef(false);

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

  // Update the createDefaultVariant function to accept and use specific terms
  const createDefaultVariant = (isNewVariant: boolean = false, presetTerms?: Array<{ attribute_id: number; term_id: number }>) => ({
    slug: "",
    price: 0,
    stock: 0,
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
    attributes: presetTerms || variationAttributes.map(attr => ({
      attribute_id: Number(attr.attribute_id),
      term_id: 0,
    })),
  });

  // Add a function to get all available terms for an attribute
  const getAllTermsForAttribute = (attributeId: number) => {
    return (formData.attributesResponse?.productAttributeTerms || [])
      .filter(term => 
        term.attribute_id === attributeId && 
        term.used_in_variation
      )
      .map(term => ({
        value: term.term_id,
        label: term.term?.name || `Term ${term.term_id}`,
        attributeId: term.attribute_id
      }));
  };

  // Form setup
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, dirtyFields },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      variants: formData.variants && formData.variants.length > 0 
        ? formData.variants.map(variant => ({
            ...variant,
            attributes: variant.attributes?.map((attr) => ({
              attribute_id: Number(attr.attribute_id),
              term_id: Number(attr.term_id),
            })) || [],
            status: "active" as const,
          }))
        : [createDefaultVariant()],
    },
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // Watch all variants to track used terms
  const variants = watch("variants") || [];

  // Function to fetch product data including variants
  const fetchProductData = useCallback(async (productId: number) => {
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
        
        // Reset form with fetched variants
        reset({ variants: fetchedVariants });
      }
    } catch (error) {
      console.error("Error fetching product data:", error);
      showSnackbar("Failed to load product variants", "error");
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  // Effects
  useEffect(() => {
    if (formData.productId) {
      fetchProductData(formData.productId);
    }
  }, [formData.productId, fetchProductData]);

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
  }, [formData.attributesResponse, formData.productId, formData.productImages, formData.variants]);

  useEffect(() => {
    const newUsedTerms: Record<number, Set<number>> = {};
    
    variants.forEach((variant) => {
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

  // Update the getAvailableTermsForAttribute function to filter out used terms
  const getAvailableTermsForAttribute = (attributeId: number, variantIndex: number) => {
    const currentVariant = variants[variantIndex];
    const currentTermId = currentVariant?.attributes?.find(attr => attr.attribute_id === attributeId)?.term_id;
    
    // Get all terms for this attribute
    const allTerms = getAllTermsForAttribute(attributeId);
    
    // Filter out terms that are used in other variants
    return allTerms.filter(term => {
      // Always include the current term for this variant
      if (term.value === currentTermId) {
        return true;
      }
      
      // Check if this term is used in any other variant
      const isUsedInOtherVariant = variants.some((variant, idx) => 
        idx !== variantIndex && // Skip current variant
        variant.attributes?.some(attr => 
          attr.attribute_id === attributeId && 
          attr.term_id === term.value
        )
      );
      
      return !isUsedInOtherVariant;
    });
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

  // Update the handleAddVariant function to handle automatic variant creation
  const handleAddVariant = () => {
    const currentVariants = watch("variants") || [];
    
    // If this is the first variant being added
    if (currentVariants.length === 0) {
      // Get all attributes and their terms
      const attributeTerms = variationAttributes.map(attr => ({
        attributeId: attr.attribute_id,
        terms: getAllTermsForAttribute(attr.attribute_id)
      }));
      
      // Create first variant with first terms
      const firstVariantTerms = attributeTerms.map(attr => ({
        attribute_id: attr.attributeId,
        term_id: attr.terms[0]?.value || 0
      }));
      
      // Create second variant with second terms if available
      const hasSecondTerms = attributeTerms.some(attr => attr.terms.length > 1);
      if (hasSecondTerms) {
        const secondVariantTerms = attributeTerms.map(attr => ({
          attribute_id: attr.attributeId,
          term_id: attr.terms[1]?.value || attr.terms[0]?.value || 0
        }));
        
        // Add both variants
        const firstVariant = createDefaultVariant(true, firstVariantTerms);
        const secondVariant = createDefaultVariant(true, secondVariantTerms);
        
        append([firstVariant, secondVariant]);
        
        // Update form data
        updateFormData({
          variants: [firstVariant, secondVariant]
        });
      } else {
        // Add only first variant
        const firstVariant = createDefaultVariant(true, firstVariantTerms);
        append(firstVariant);
        updateFormData({
          variants: [firstVariant]
        });
      }
    } else if (hasUnusedTerms) {
      // Add a single new variant for subsequent additions
      const newVariant = createDefaultVariant(true);
      append(newVariant);
      updateFormData({
        variants: [...currentVariants, newVariant]
      });
    } else {
      showSnackbar("All attribute terms have been used", "warning");
    }
  };

  // Update the getAttributeName function to use the correct property access
  const getAttributeName = (attributeId: number) => {
    // First try to find the attribute in the attributesResponse
    const responseAttribute = formData.attributesResponse?.productAttributeTerms?.find(
      term => term.attribute_id === attributeId
    )?.attribute;
    if (responseAttribute?.name) {
      return responseAttribute.name;
    }
    
    // If not found, return a default name
    return `Attribute ${attributeId}`;
  };

  // Find the term name for a given term ID
  const getTermName = (attributeId: number, termId: number) => {
    const term = (formData.attributesResponse?.productAttributeTerms || [])
      .find(t => t.attribute_id === attributeId && t.term_id === termId);
    return term?.term?.name || `Term ${termId}`;
  };

  // Update the areRequiredFieldsFilled function with more precise checks
  const areRequiredFieldsFilled = (variant: FormData['variants'][0]) => {
    const isValid = Boolean(
      variant.slug?.trim() && // Check slug is not empty
      typeof variant.price === 'number' && variant.price >= 0 && // Check price is valid
      typeof variant.stock === 'number' && variant.stock >= 0 && // Check stock is valid
      variant.attributes?.every(attr => 
        typeof attr.attribute_id === 'number' && attr.attribute_id > 0 && // Check attribute_id
        typeof attr.term_id === 'number' && attr.term_id > 0 // Check term_id
      )
    );
    
    console.log("Variant validation:", {
      variant,
      isValid,
      hasSlug: Boolean(variant.slug?.trim()),
      validPrice: typeof variant.price === 'number' && variant.price >= 0,
      validStock: typeof variant.stock === 'number' && variant.stock >= 0,
      validAttributes: variant.attributes?.every(attr => 
        typeof attr.attribute_id === 'number' && attr.attribute_id > 0 &&
        typeof attr.term_id === 'number' && attr.term_id > 0
      )
    });
    
    return isValid;
  };

  // Update the transformVariantData function to ensure correct status type
  const transformVariantData = (variant: FormData['variants'][0]): ProductVariant => {
    // Map through variation attributes to ensure all required attributes are included
    const transformedAttributes = variationAttributes.map(attr => {
      // Find if this attribute already has a term in the current variant
      const existingAttribute = variant.attributes?.find(
        a => a.attribute_id === attr.attribute_id
      );
      
      // If there's an existing term, use it; otherwise, use the first available term
      const termId = existingAttribute?.term_id || 
        (attr.allTerms?.[0]?.value || 0);
      
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
      discount_price: variant.discount_price ? Number(variant.discount_price) : undefined,
      purchase_price: variant.purchase_price ? Number(variant.purchase_price) : undefined,
      low_stock_threshold: variant.low_stock_threshold ? Number(variant.low_stock_threshold) : undefined,
      weight: variant.weight ? Number(variant.weight) : undefined,
      length: variant.length ? Number(variant.length) : undefined,
      width: variant.width ? Number(variant.width) : undefined,
      height: variant.height ? Number(variant.height) : undefined,
      barcode: variant.barcode || undefined,
      description: variant.description || undefined,
      attributes: transformedAttributes,
    };
  };

  // Update the onSubmit function to use the transformVariantData function
  const onSubmit = async (data: FormData) => {
    if (!productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Transform the data to match the API requirements
      const transformedData: CreateProductVariantsRequest = {
        variants: data.variants.map(transformVariantData),
      };

      console.log("Submitting variant data:", transformedData);

      let response;
      if (isEditMode) {
        // Update existing variants
        const updatePromises = transformedData.variants.map((variant, index) => {
          const variantId = formData.variants?.[index]?.id;
          if (!variantId) {
            throw new Error(`Variant ID not found for index ${index}`);
          }
          return updateProductVariant(Number(productId), variantId, variant);
        });
        response = await Promise.all(updatePromises);
        showSnackbar("Product variants updated successfully", "success");
      } else {
        // Create new variants
        response = await createProductVariants(Number(productId), transformedData);
        showSnackbar("Product variants saved successfully", "success");
      }

      console.log("API response:", response);

      // Store both the form data and API response data
      updateFormData({
        variants: data.variants.map((variant, index) => ({
          ...variant,
          id: isEditMode ? formData.variants?.[index]?.id : response[index]?.id,
        })),
        hasErrors: false,
      });

      markStepAsCompleted(3);
      
      // Reset fetch status to allow re-fetching if needed
      fetchedRef.current = false;
      
      // Only move to next step if we're not in edit mode
      if (!isEditMode) {
        nextStep();
      }
    } catch (error) {
      console.error("Error saving product variants:", error);
      updateFormData({ hasErrors: true });
      showSnackbar("Failed to save product variants", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Update the effect that handles variant data formatting
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
        status: (typeof variant.status === 'boolean' 
          ? variant.status 
          : variant.status === 'active') 
            ? 'active' as const 
            : 'inactive' as const,
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

      console.log("Formatted variants before reset:", formattedVariants);
      reset({ variants: formattedVariants });
    }
  }, [formData.variants, reset]);

  // Add validation state logging
  useEffect(() => {
    const currentVariants = watch("variants");
    const validationState = {
      variants: currentVariants,
      errors,
      isValid,
      dirtyFields,
      hasErrors: Object.keys(errors).length > 0,
      areAllVariantsFilled: currentVariants?.every(areRequiredFieldsFilled),
      buttonShouldBeEnabled: Boolean(
        !isLoading &&
        currentVariants?.length > 0 &&
        currentVariants?.every(areRequiredFieldsFilled) &&
        Object.keys(errors).length === 0 &&
        isValid
      )
    };
    console.log("Form validation state:", validationState);
  }, [watch, errors, isValid, dirtyFields, isLoading]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center space-y-4"
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

              // Get the current variant's attribute value
              const currentVariant = variants[index];
              const currentAttribute = currentVariant?.attributes?.find(
                (a) => a.attribute_id === attr.attribute_id
              );
              const defaultValue = currentAttribute?.term_id || 0;

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
            {/* <Grid item xs={12}>
              <FormCheckboxField
                name={`variants.${index}.status`}
                control={control}
                label="Active"
              />
            </Grid> */}
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
          label={isEditMode ? "Update" : "Next"}
          type="submit"
          loading={isLoading}
          disabled={
            isLoading || 
            !variants.length || // Check if there are variants
            !variants.every(areRequiredFieldsFilled) || // Check if all variants are filled
            Object.keys(errors).length > 0 || // Check for any validation errors
            !isValid // Check overall form validity
          }
        />
      </div>
    </form>
  );
}

export default VariantTab;
