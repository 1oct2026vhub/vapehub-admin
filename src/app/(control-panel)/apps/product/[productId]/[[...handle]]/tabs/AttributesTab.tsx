"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  IconButton,
  Paper,
  CircularProgress,
  TextField,
  Autocomplete,
  FormControl,
} from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormSelectField from "@/components/Shared/SelectField";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm } from "../ProductFormContext";
import { useFetch } from "@/hooks/useFetch";
import { listAttributes } from "@/services/apiAttribute";
import { listAttributeTerms } from "@/services/apiAttributeTerm";
import {
  addProductAttributes,
  getProduct,
  updateProductAttributes,
  deleteProductAttributeTerm,
  type AddProductAttributesRequest,
  type UpdateProductAttributesRequest,
  type ProductAttribute as ApiProductAttribute,
} from "@/services/apiProduct";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useRouter, useSearchParams } from "next/navigation";
import FuseLoading from "@fuse/core/FuseLoading";
import PageBreadcrumb from "src/components/PageBreadcrumb";

interface AttributeTerm {
  id: number;
  name: string;
}

interface ProductAttributeTerm {
  id: number;
  attribute_id: number;
  term_id: number;
  term: {
    id: number;
    name: string;
  };
  attribute?: {
    id: number;
    name: string;
  };
}

interface FormProductAttribute {
  attribute_id: number;
  term_ids: number[];
  is_visible_page: boolean;
  used_in_variation: boolean;
  default_value?: string;
}

const attributeSchema = z.object({
  attributes: z.array(
    z.object({
      attribute_id: z
        .union([z.number().min(1, "Attribute is required"), z.null()])
        .refine((val) => val !== null && val > 0, {
          message: "Attribute is required",
        }),
      term_ids: z.array(z.number()).min(1, "At least one term is required"),
      is_visible_page: z.boolean(),
      used_in_variation: z.boolean(),
      default_value: z.string().optional(),
    })
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

  // Get productId from URL or formData and ensure it's a number
  const productId =
    formData.productId ||
    (searchParams.get("productId")
      ? Number(searchParams.get("productId"))
      : null);

  // Determine if we're in edit mode based on existing attributes
  const isEditMode = Boolean(
    formData.attributes && formData.attributes.length > 0
  );

  const { data: attributes } = useFetch(
    ["attributeList", { limit: 100 }], // Include limit in the query key
    listAttributes,
    { limit: 100 } // Pass limit as a query parameter
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
      attributes:
        formData.attributes && formData.attributes.length > 0
          ? formData.attributes
          : [
              {
                attribute_id: null as any,
                term_ids: [],
                is_visible_page: true,
                used_in_variation: false,
                default_value: "",
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
            ? listAttributeTerms({ attribute_id: id, limit: 100 }) // Add limit here
            : Promise.resolve({ data: { terms: [] } })
        )
      ),
    { enabled: attributeIds.some((id) => id > 0) }
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
      if (
        response?.data?.productAttributeTerms &&
        response.data.productAttributeTerms.length > 0
      ) {
        console.log(
          "Product attributes found:",
          response.data.productAttributeTerms
        );

        // Group terms by attribute_id
        const attributeGroups: FormProductAttribute[] = Object.values(
          response.data.productAttributeTerms.reduce((acc, attr) => {
            // Use attribute_id as the key
            if (!acc[attr.attribute_id]) {
              acc[attr.attribute_id] = {
                attribute_id: Number(attr.attribute_id),
                term_ids: [Number(attr.term_id)],
                is_visible_page: Boolean(attr.is_visible_page),
                used_in_variation: Boolean(attr.used_in_variation),
                default_value: "", // Initialize with empty default value
              };
            } else {
              // Add term_id to existing attribute group if not already present
              if (
                !acc[attr.attribute_id].term_ids.includes(Number(attr.term_id))
              ) {
                acc[attr.attribute_id].term_ids.push(Number(attr.term_id));
              }
            }

            return acc;
          }, {} as Record<number, FormProductAttribute>)
        );

        console.log("Grouped attribute data:", attributeGroups);

        // Update form with the loaded attribute data
        replace(attributeGroups);

        // Update form context data
        updateFormData({
          attributes: attributeGroups,
          attributesResponse: {
            productAttributeTerms: response.data.productAttributeTerms,
          },
        });

        markStepAsCompleted(2);
      } else if (formData.attributes && formData.attributes.length > 0) {
        // If no API data but we have attributes in form context, use those
        // Ensure all attribute_id values are numbers
        const attributesWithNumberIds = formData.attributes.map((attr) => ({
          ...attr,
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map((id) => Number(id)),
        }));
        replace(attributesWithNumberIds);
      }

      // Mark fetch as completed
      fetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching product data:", error);
      // showSnackbar("Failed to load product data", "error");

      // If API fails but we have attributes in form context, use those
      if (formData.attributes && formData.attributes.length > 0) {
        // Ensure all attribute_id values are numbers
        const attributesWithNumberIds = formData.attributes.map((attr) => ({
          ...attr,
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map((id) => Number(id)),
        }));
        replace(attributesWithNumberIds);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    productId,
    formData.attributes,
    formData.productId,
    replace,
    updateFormData,
    markStepAsCompleted,
    showSnackbar,
  ]);

  // Fetch product data on component mount
  useEffect(() => {
    fetchProductData();
  }, [productId]); // Only depend on productId, not fetchProductData

  // Function to get available attributes for a specific row
  const getAvailableAttributes = (currentIndex: number) => {
    if (!attributes?.data?.attributes) return [];

    // Get all selected attribute IDs except the current row
    const selectedAttributeIds = attributeSelections
      .map((attr, index) => (index !== currentIndex ? attr.attribute_id : null))
      .filter((id) => id !== null);

    // Filter out already selected attributes, but keep the current attribute
    return attributes.data.attributes
      .filter((attr) => !selectedAttributeIds.includes(attr.id))
      .map((attr) => ({
        value: attr.id,
        label: attr.name,
      }));
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

  // Add this helper function to deduplicate terms
  const getUniqueTermOptions = (
    existingTerms: ProductAttributeTerm[] = [],
    fetchedTerms: AttributeTerm[] = [],
    attributeId: number
  ): Array<{ value: number; label: string }> => {
    // Create a Set to track unique term IDs
    const uniqueTermIds = new Set<number>();
    const uniqueTerms: Array<{ value: number; label: string }> = [];

    // First add existing terms
    if (existingTerms && existingTerms.length > 0) {
      existingTerms
        .filter((attr) => attr.attribute_id === attributeId)
        .forEach((attr) => {
          if (!uniqueTermIds.has(attr.term_id)) {
            uniqueTermIds.add(attr.term_id);
            uniqueTerms.push({
              value: attr.term_id,
              label: attr.term.name,
            });
          }
        });
    }

    // Then add fetched terms that aren't already included
    if (fetchedTerms && fetchedTerms.length > 0) {
      fetchedTerms.forEach((term) => {
        if (!uniqueTermIds.has(term.id)) {
          uniqueTermIds.add(term.id);
          uniqueTerms.push({
            value: term.id,
            label: term.name,
          });
        }
      });
    }

    return uniqueTerms;
  };

  const onSubmit = async (data: FormData) => {
    if (!productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    // Check if at least one attribute is used in variation
    const hasVariationAttribute = data.attributes.some(
      (attr) => attr.used_in_variation
    );
    if (!hasVariationAttribute) {
      showSnackbar(
        "Please choose at least one attribute with 'Used in Variation' enabled",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform the data to match the API requirements
      const transformedData: UpdateProductAttributesRequest = {
        attributes: data.attributes.map((attr) => {
          const request = {
            attribute_id: attr.attribute_id,
            is_visible_page: attr.is_visible_page,
            used_in_variation: attr.used_in_variation,
          };

          // If there's only one term, use term_id
          if (attr.term_ids.length === 1) {
            return {
              ...request,
              term_id: attr.term_ids[0],
            };
          }
          // If there are multiple terms, use term_ids
          return {
            ...request,
            term_ids: attr.term_ids,
          };
        }),
      };

      console.log("Submitting attribute data:", transformedData);

      let response;
      if (isEditMode) {
        // Update existing attributes
        response = await updateProductAttributes(
          Number(productId),
          transformedData
        );
        showSnackbar("Product attributes updated successfully", "success");
      } else {
        // For new products, we need to convert the request to match AddProductAttributesRequest
        const addRequest: AddProductAttributesRequest = {
          attributes: data.attributes.flatMap((attr) =>
            attr.term_ids.map((termId) => ({
              attribute_id: attr.attribute_id,
              term_id: termId,
              is_visible_page: attr.is_visible_page,
              used_in_variation: attr.used_in_variation,
            }))
          ),
        };

        response = await addProductAttributes(Number(productId), addRequest);
        showSnackbar("Product attributes saved successfully", "success");
        nextStep();
        // router.push(`/apps/product/${productId}/variant?from=attributes`);
      }

      // Update form data
      updateFormData({
        attributes: data.attributes.map((attr) => ({
          attribute_id: attr.attribute_id,
          term_ids: attr.term_ids,
          is_visible_page: attr.is_visible_page,
          used_in_variation: attr.used_in_variation,
        })),
        attributesResponse: response.data,
        hasErrors: false,
      });

      markStepAsCompleted(2);
      fetchedRef.current = false;
    } catch (error) {
      console.error("Error submitting attributes:", error);

      if (
        error?.type === "unique violation" ||
        error?.message?.includes("unique")
      ) {
        showSnackbar(
          "Each term can only be used once per attribute. Please check for duplicate terms.",
          "error"
        );
      } else if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        showSnackbar(error?.message || "An unexpected error occurred", "error");
      }

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
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

  // Add the handleDeleteAttribute function
  const handleDeleteAttribute = async (index: number) => {
    try {
      setIsLoading(true);
      const attributeToDelete = fields[index];
      const productAttributeTerms =
        formData.attributesResponse?.productAttributeTerms;

      if (!productId) {
        showSnackbar("Product ID not found", "error");
        return;
      }

      if (fields.length <= 1) {
        showSnackbar("Cannot delete the last attribute", "error");
        return;
      }

      // If this is an existing attribute (has matching terms in productAttributeTerms)
      if (productAttributeTerms && attributeToDelete.attribute_id) {
        const attributeTerms = productAttributeTerms.filter(
          (term) => term.attribute_id === attributeToDelete.attribute_id
        );

        // Delete each attribute term
        for (const term of attributeTerms) {
          console.log(
            `Deleting attribute term ID: ${term.id} for product ${productId}`
          );
          try {
            await deleteProductAttributeTerm(Number(productId), term.id);
            console.log(`Successfully deleted attribute term ID: ${term.id}`);
          } catch (error) {
            console.error(
              `Error deleting attribute term ID: ${term.id}:`,
              error
            );
            throw error; // Re-throw to trigger the outer catch block
          }
        }
        showSnackbar("Attribute deleted successfully", "success");
      }

      // Remove from form
      remove(index);

      // Update form data context
      const updatedAttributes = [...(formData.attributes || [])];
      updatedAttributes.splice(index, 1);
      updateFormData({
        attributes: updatedAttributes,
        attributesResponse: {
          ...formData.attributesResponse,
          productAttributeTerms:
            formData.attributesResponse?.productAttributeTerms?.filter(
              (term) => term.attribute_id !== attributeToDelete.attribute_id
            ),
        },
      });
    } catch (error) {
      if (error?.errors) {
        showSnackbar(error?.errors[0]?.msg, "error");
      } else {
        const errorMessage = error?.message || "An unexpected error occurred";
        showSnackbar(errorMessage, "error");
      }

      const errorData = error || error;
      if (errorData?.error && typeof errorData.error === "object") {
        Object.entries(errorData.error).forEach(([field, message]) => {
          if (typeof message === "string") {
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <FuseLoading />
        {/* <CircularProgress /> */}
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col justify-center space-y-4"
      >
        {fields.map((field, index) => (
          <Paper key={field.id} className="p-4 relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16">
                {" "}
                {/* Fixed height wrapper (h-14 = 56px in Tailwind) */}
                <FormControl
                  sx={{ minWidth: 180, width: "100%" }}
                  size="small"
                  error={!!errors?.attributes?.[index]?.attribute_id}
                >
                  <Controller
                    name={`attributes.${index}.attribute_id`}
                    control={control}
                    rules={{ required: "Attribute is required" }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error },
                    }) => (
                      <Autocomplete
                        options={getAvailableAttributes(index)}
                        getOptionLabel={(option) => option.label}
                        value={
                          attributes?.data?.attributes?.find(
                            (attr) => attr.id === value
                          )
                            ? {
                                value,
                                label: attributes.data.attributes.find(
                                  (attr) => attr.id === value
                                ).name,
                              }
                            : null
                        }
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.value : null);
                          handleAttributeChange(
                            index,
                            newValue ? Number(newValue.value) : null
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Attribute"
                            variant="outlined"
                            size="small"
                            error={!!errors?.attributes?.[index]?.attribute_id}
                            required
                            helperText={
                              errors?.attributes?.[index]?.attribute_id?.message
                            }
                            FormHelperTextProps={{
                              sx: {
                                color: errors?.attributes?.[index]?.attribute_id
                                  ? "#d32f2f"
                                  : "inherit",
                                marginLeft: 0,
                                position: "absolute",
                                bottom: -20,
                              },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                "& fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "none"
                                    : "linear-gradient(to right, #2E9970, #005434) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "#d32f2f"
                                    : undefined,
                                },
                                "&:hover fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "none"
                                    : "linear-gradient(to right, #247C5C, #003F29) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "#d32f2f"
                                    : undefined,
                                },
                                "&.Mui-focused fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "none"
                                    : "linear-gradient(to right, #1E7A56, #004C30) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "#d32f2f"
                                    : undefined,
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: errors?.attributes?.[index]?.attribute_id
                                  ? "#d32f2f"
                                  : "#2E9970",
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: errors?.attributes?.[index]?.attribute_id
                                  ? "#d32f2f"
                                  : "#2E9970",
                              },
                              "& .MuiFormLabel-asterisk": {
                                color: "red",
                              },
                            }}
                          />
                        )}
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&.Mui-focused fieldset": {
                              borderColor: errors?.attributes?.[index]
                                ?.attribute_id
                                ? "#d32f2f"
                                : "#2E9970",
                              borderWidth: "2px",
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: errors?.attributes?.[index]?.attribute_id
                              ? "#d32f2f"
                              : "#2E9970",
                          },
                        }}
                      />
                    )}
                  />
                </FormControl>
              </div>

              <div className="h-14">
                {" "}
                {/* Fixed height wrapper (h-14 = 56px in Tailwind) */}
                <FormSelectField
                  name={`attributes.${index}.term_ids`}
                  control={control}
                  label="Terms"
                  options={getUniqueTermOptions(
                    formData.attributesResponse?.productAttributeTerms || [],
                    terms?.[index]?.data?.terms || [],
                    field.attribute_id
                  )}
                  required
                  isMulti
                  onTermRemove={(termId) => handleTermRemove(index, termId)}
                />
              </div>

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
                onClick={() => handleDeleteAttribute(index)}
                className="absolute top-2 right-2"
                size="small"
                disabled={isLoading}
                type="button"
                sx={{
                  color: "error.main",
                  "&:hover": {
                    backgroundColor: "error.light",
                    color: "error.main",
                  },
                  "&.Mui-disabled": {
                    color: "error.light",
                  },
                }}
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
                attribute_id: null as any,
                term_ids: [],
                is_visible_page: true,
                used_in_variation: false,
                default_value: "",
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
            label={isEditMode ? "Update" : "Next"}
            type="submit"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}

export default AttributesTab;
