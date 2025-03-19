"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import { IconButton, Paper, CircularProgress } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormSelectField from "@/components/Shared/SelectField";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm } from "../ProductFormContext";
import { useFetch } from "@/hooks/useFetch";
import { listAttributes } from "@/services/apiAttribute";
import { listAttributeTerms } from "@/services/apiAttributeTerm";
import { addProductAttributes, getProduct } from "@/services/apiProduct";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductAttribute {
  attribute_id: number;
  term_ids: number[];
  is_visible_page: boolean;
  used_in_variation: boolean;
}

const attributeSchema = z.object({
  attributes: z.array(
    z.object({
      attribute_id: z.number().min(1, "Attribute is required"),
      term_ids: z.array(z.number()).min(1, "At least one term is required"),
      is_visible_page: z.boolean(),
      used_in_variation: z.boolean(),
    }),
  ),
});

type FormData = z.infer<typeof attributeSchema>;

function AttributesTab() {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    markStepAsCompleted,
  } = useProductForm();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use ref to track fetch status
  const fetchedRef = useRef(false);
  const productIdRef = useRef<number | null>(null);

  // Get productId from URL or formData
  const productId = formData.productId || (searchParams.get("productId") ? Number(searchParams.get("productId")) : null);

  const { data: attributes } = useFetch(
    ["attributeList", {}],
    listAttributes,
    {},
  );

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { isValid, errors },
    handleSubmit,
  } = useForm<FormData>({
    mode: "all",
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      attributes: [
        {
          attribute_id: 0,
          term_ids: [],
          is_visible_page: true,
          used_in_variation: false,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "attributes",
  });

  // Watch all attribute selections
  const attributeSelections = watch("attributes");

  // Watch attribute_id changes to fetch terms
  const attributeIds = watch("attributes").map((attr) => attr.attribute_id);
  const { data: terms } = useFetch(
    ["attributeTermsList", { ids: attributeIds }],
    () =>
      Promise.all(
        attributeIds.map((id) =>
          id
            ? listAttributeTerms({ attribute_id: id })
            : Promise.resolve({ data: { terms: [] } }),
        ),
      ),
    { enabled: attributeIds.some((id) => id > 0) },
  );

  // Fetch product data including attributes
  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setIsLoading(false);
      return;
    }
    
    // Skip if we've already fetched data for this product ID
    if (fetchedRef.current && productIdRef.current === productId) {
      setIsLoading(false);
      return;
    }
    
    // Update refs to track current fetch state
    productIdRef.current = productId;
    
    setIsLoading(true);
    try {
      console.log("Fetching product data for ID:", productId);
      const response = await getProduct(Number(productId));
      console.log("Product data received:", response?.data);
      
      // Update the form data with product ID if not already set
      if (!formData.productId) {
        updateFormData({
          productId: Number(productId),
        });
      }

      // Check if the API response contains product attribute data
      if (response?.data?.productAttributeTerms && response.data.productAttributeTerms.length > 0) {
        console.log("Product attributes found:", response.data.productAttributeTerms);
        
        // Map API attributes to the form schema format
        const attributeData = response.data.productAttributeTerms.map(attr => ({
          attribute_id: Number(attr.attribute_id),
          term_ids: [Number(attr.term_id)], // API returns single term_id, convert to array
          is_visible_page: Boolean(attr.is_visible_page),
          used_in_variation: Boolean(attr.used_in_variation)
        }));
        
        console.log("Mapped attribute data:", attributeData);
        
        // Update form with the loaded attribute data
        replace(attributeData);
        
        // Update form context data
        updateFormData({
          attributes: attributeData,
          attributesResponse: {
            productAttributeTerms: response.data.productAttributeTerms
          }
        });
        
        markStepAsCompleted(2); // Mark attributes step as completed if data exists
      } else if (formData.attributes && formData.attributes.length > 0) {
        // If no API data but we have attributes in form context, use those
        // Ensure all attribute_id values are numbers
        const attributesWithNumberIds = formData.attributes.map(attr => ({
          ...attr,
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map(id => Number(id))
        }));
        replace(attributesWithNumberIds);
      }
      
      // Mark fetch as completed
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching product data:", error);
      showSnackbar("Failed to load product data", "error");
      
      // If API fails but we have attributes in form context, use those
      if (formData.attributes && formData.attributes.length > 0) {
        // Ensure all attribute_id values are numbers
        const attributesWithNumberIds = formData.attributes.map(attr => ({
          ...attr,
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map(id => Number(id))
        }));
        replace(attributesWithNumberIds);
      }
    } finally {
      setIsLoading(false);
    }
  }, [productId, formData.attributes, formData.productId, replace, updateFormData, markStepAsCompleted, showSnackbar]);

  // Fetch product data on component mount
  useEffect(() => {
    fetchProductData();
  }, [productId]); // Only depend on productId, not fetchProductData

  // Function to get available attributes for a specific row
  const getAvailableAttributes = (currentIndex: number) => {
    if (!attributes?.data?.attributes) return [];

    // Get all selected attribute IDs except the current row
    const selectedAttributeIds = attributeSelections
      .map((attr, index) => (index !== currentIndex ? attr.attribute_id : 0))
      .filter((id) => id !== 0);

    // Combine existing product attributes with available attributes
    const existingAttributeIds = formData.attributesResponse?.productAttributeTerms
      ? formData.attributesResponse.productAttributeTerms.map(attr => attr.attribute_id)
      : [];

    // Filter out already selected attributes
    return attributes.data.attributes.filter(
      (attr) => 
        !selectedAttributeIds.includes(attr.id) && 
        !existingAttributeIds.includes(attr.id)
    );
  };

  // Function to handle attribute change and fetch corresponding terms
  const handleAttributeChange = (index: number, attributeId: number) => {
    const currentAttributes = [...watch("attributes")];

    // Update the current attribute and reset terms
    currentAttributes[index] = {
      ...currentAttributes[index],
      attribute_id: attributeId,
      term_ids: [], // Reset terms when attribute changes
    };

    // Update form values
    setValue("attributes", currentAttributes, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const onSubmit = async (data: FormData) => {
    if (!productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    // Check if at least one attribute is used in variation
    const hasVariationAttribute = data.attributes.some(attr => attr.used_in_variation);
    if (!hasVariationAttribute) {
      showSnackbar("Please choose at least one attribute with 'Used in Variation' enabled", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform the data to match the API requirements
      const transformedData = {
        attributes: data.attributes.map((attr) => ({
          attribute_id: attr.attribute_id,
          term_id: attr.term_ids[0], // Temporarily keep first term_id for API compatibility
          term_ids: attr.term_ids, // Keep full term_ids for future reference
          is_visible_page: attr.is_visible_page,
          used_in_variation: attr.used_in_variation,
        })),
      };

      console.log("Submitting attribute data:", transformedData);

      // Save attributes to the product using the API function
      const response = await addProductAttributes(
        Number(productId),
        transformedData,
      );

      console.log("API response:", response.data);

      // Store both the form data and API response data
      updateFormData({
        attributes: data.attributes as ProductAttribute[],
        attributesResponse: response.data, // Store the API response
        hasErrors: false,
      });

      showSnackbar("Product attributes saved successfully", "success");
      markStepAsCompleted(2);
      
      // Reset fetch status to allow re-fetching if needed
      fetchedRef.current = false;
      
      nextStep();
    } catch (error) {
      console.error("Error saving product attributes:", error);
      updateFormData({ hasErrors: true });
      showSnackbar("Failed to save product attributes", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle term removal
  const handleTermRemove = (index: number, termId: number) => {
    const currentAttributes = [...watch("attributes")];

    // Remove the term from the term_ids array
    currentAttributes[index] = {
      ...currentAttributes[index],
      term_ids: currentAttributes[index].term_ids.filter((id) => id !== termId),
    };

    // Update the form values using setValue
    setValue("attributes", currentAttributes, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <CircularProgress />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center space-y-4"
    >
      {fields.map((field, index) => (
        <Paper key={field.id} className="p-4 relative">
          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              name={`attributes.${index}.attribute_id`}
              control={control}
              label="Attribute"
              options={
                // Combine existing productAttributeTerms with available attributes
                [
                  // First, add existing product attributes
                  ...(formData.attributesResponse?.productAttributeTerms
                    ? formData.attributesResponse.productAttributeTerms.map((attr) => ({
                        value: attr.attribute_id,
                        label: attr.attribute.name,
                      }))
                    : []),
                  
                  // Then add available attributes from listAttributes
                  ...getAvailableAttributes(index).map((attr) => ({
                    value: attr.id,
                    label: attr.name,
                  })),
                ]
              }
              onChange={(e) => {
                const attributeId = Number(e.target.value);
                handleAttributeChange(index, attributeId);
              }}
              required
            />
            <FormSelectField
              name={`attributes.${index}.term_ids`}
              control={control}
              label="Terms"
              options={
                // Combine existing productAttributeTerms with fetched terms
                [
                  // First, add existing product attribute terms
                  ...(formData.attributesResponse?.productAttributeTerms
                    ? formData.attributesResponse.productAttributeTerms
                        .filter((attr) => attr.attribute_id === field.attribute_id)
                        .map((attr) => ({
                          value: attr.term_id,
                          label: attr.term.name,
                        }))
                    : []),
                  
                  // Then add terms from listAttributeTerms
                  ...(terms?.[index]?.data?.terms?.map((term) => ({
                    value: term.id,
                    label: term.name,
                  })) || [])
                ]
              }
              required
              isMulti
              onTermRemove={(termId) => handleTermRemove(index, termId)}
            />
            <FormCheckboxField
              name={`attributes.${index}.is_visible_page`}
              control={control}
              label="Visible on product page"
            />
            <FormCheckboxField
              name={`attributes.${index}.used_in_variation`}
              control={control}
              label="Used for variations"
            />
          </div>
          {fields.length > 1 && (
            <IconButton
              onClick={() => remove(index)}
              className="absolute top-2 right-2"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Paper>
      ))}

      <div className="flex justify-center">
        <AppButton
          label={
            <>
              <AddIcon className="mr-2" />
              Add Attribute
            </>
          }
          type="button"
          variant="outlined"
          onClick={() =>
            append({
              attribute_id: 0,
              term_ids: [],
              is_visible_page: true,
              used_in_variation: false,
            })
          }
        />
      </div>

      <div className="flex justify-between mt-4">
        <AppButton
          label="Previous"
          onClick={previousStep}
          variant="outlined"
          disabled={isSubmitting}
        />
        <AppButton
          label="Next"
          type="submit"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
        />
      </div>
    </form>
  );
}

export default AttributesTab;


