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
  Chip,
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
import { debounce } from "lodash";
import SearchIcon from "@mui/icons-material/Search";

interface AttributeTerm {
  id: number;
  name: string;
}

interface TermSearchState {
  [key: number]: any;
  _termLookup?: {
    [termId: number]: AttributeTerm;
  };
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
  const [isAttributeSearching, setIsAttributeSearching] = useState(false);
  const [isTermSearching, setIsTermSearching] = useState(false);
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

  // State for search functionality
  const [attributeSearchResults, setAttributeSearchResults] =
    useState<any>(null);
  const [attributeOptions, setAttributeOptions] = useState<
    Record<number, Array<{ value: number; label: string }>>
  >({});
  const [termOptions, setTermOptions] = useState<
    Record<number, Array<{ value: number; label: string }>>
  >({});

  // Original attributes fetch using useFetch
  const { data: attributes } = useFetch(
    ["attributeList", { limit: 100 }],
    listAttributes,
    { limit: 100 }
  );

  const {
    control,
    watch,
    setValue,
    reset,
    formState: { isValid, errors, touchedFields, dirtyFields },
    handleSubmit,
    trigger
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
            ? listAttributeTerms({
                attribute_id: id,
                limit: 100,
                sort_by: "name",
                order: "ASC",
              })
            : Promise.resolve({ data: { terms: [] } })
        )
      ),
    { enabled: attributeIds.some((id) => id > 0) }
  );

  // State for term search results
  const [termSearchResults, setTermSearchResults] = useState<
    Record<number, any>
  >({});

  // Maintain a separate lookup of all term IDs to names for quick reference
  const [termNameLookup, setTermNameLookup] = useState<Record<number, string>>(
    {}
  );

  // Populate termNameLookup whenever terms data changes
  useEffect(() => {
    // Add terms from the terms API response
    if (terms && terms.length > 0) {
      setTermNameLookup((prev) => {
        const newLookup = { ...prev };
        terms.forEach((response) => {
          if (response?.data?.terms) {
            response.data.terms.forEach((term) => {
              newLookup[term.id] = term.name;
            });
          }
        });
        return newLookup;
      });
    }
  }, [terms]);

  // Also populate from product attribute terms when they're loaded
  useEffect(() => {
    if (formData.attributesResponse?.productAttributeTerms?.length) {
      setTermNameLookup((prev) => {
        const newLookup = { ...prev };
        formData.attributesResponse.productAttributeTerms.forEach(
          (attrTerm) => {
            if (attrTerm.term?.id && attrTerm.term?.name) {
              newLookup[attrTerm.term.id] = attrTerm.term.name;
            }
          }
        );
        return newLookup;
      });
    }
  }, [formData.attributesResponse]);

  // Create debounced search function for terms
  const searchTerms = useCallback(
    debounce(async (index: number, attributeId: number, query: string) => {
      if (!attributeId) return;
      
      try {
        setIsTermSearching(true);
        console.log(
          `Searching for terms matching "${query}" for attribute ID ${attributeId}`
        );

        // Always call API, with or without keyword
        const response = await listAttributeTerms({
          attribute_id: attributeId,
          limit: 100, // Increased limit to get more terms
          keyword: query && query.trim().length >= 2 ? query.trim() : undefined,
          sort_by: "name",
          order: "ASC"
        });

        console.log(
          `Found ${response?.data?.terms?.length || 0} matching terms for attribute ${attributeId}`
        );

        // Store the search results
        setTermSearchResults((prev) => ({
          ...prev,
          [attributeId]: response,
        }));

        // Update our term name lookup table with the retrieved terms
        if (response?.data?.terms?.length) {
          setTermNameLookup((prev) => {
            const newLookup = { ...prev };
            response.data.terms.forEach((term) => {
              newLookup[term.id] = term.name;
            });
            return newLookup;
          });
        }
      } catch (error) {
        console.error("Error searching terms:", error);
      } finally {
        setIsTermSearching(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    []
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

  // Load initial attributes data on component mount
  useEffect(() => {
    // Load all attributes for all fields on initial mount
    fields.forEach((_, index) => {
      handleAttributeSearchChange(index, "");
    });
  }, []); // Empty dependency array - run once on mount

  // Initialization for attribute options
  useEffect(() => {
    if (attributes?.data?.attributes) {
      const options = attributes.data.attributes.map((attr) => ({
        value: attr.id,
        label: attr.name,
      }));

      // Create an initial options map for all fields
      const initialOptionsMap = {};
      fields.forEach((_, index) => {
        initialOptionsMap[index] = options;
      });

      setAttributeOptions(initialOptionsMap);
    }
  }, [attributes, fields]);

  // Create debounced search functions
  const searchAttributes = useCallback(
    debounce(async (index: number, query: string) => {
      // Skip API call if the query is empty or too short
      try {
        setIsAttributeSearching(true);
        console.log(`Searching for attributes with query: "${query}"`);

        // Always call API, but only use keyword when it's provided
        const response = await listAttributes({
          limit: 100,
          keyword: query && query.trim().length >= 2 ? query.trim() : undefined,
          sort_by: "name",
          order: "ASC",
        });

        console.log(
          `Found ${response?.data?.attributes?.length || 0} attributes`
        );
        setAttributeSearchResults(response);

        // Update attribute options for this specific index
        if (response?.data?.attributes) {
          const options = response.data.attributes.map((attr) => ({
            value: attr.id,
            label: attr.name,
          }));

          setAttributeOptions((prev) => ({
            ...prev,
            [index]: options,
          }));
        }
      } catch (error) {
        console.error("Error searching attributes:", error);
      } finally {
        setIsAttributeSearching(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    []
  );

  // Handle attribute search input change
  const handleAttributeSearchChange = (index: number, value: string) => {
    // Always call search - if value is empty, it will load all attributes
    searchAttributes(index, value);
  };

  // Function to get available attributes for a specific row
  const getAvailableAttributes = (currentIndex: number) => {
    // Use attributeOptions if available, otherwise use attributes data
    const allAttributeOptions =
      attributeOptions[currentIndex] ||
      attributes?.data?.attributes?.map((attr) => ({
        value: attr.id,
        label: attr.name,
      })) ||
      [];

    // If no options are available yet, return empty array
    if (!allAttributeOptions || allAttributeOptions.length === 0) return [];

    // Get all selected attribute IDs except the current row
    const selectedAttributeIds = attributeSelections
      .map((attr, index) => (index !== currentIndex ? attr.attribute_id : null))
      .filter((id) => id !== null);

    // Filter out already selected attributes, but keep the current attribute
    return allAttributeOptions.filter(
      (attr) => !selectedAttributeIds.includes(attr.value)
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
      shouldValidate: false, // Don't immediately validate to avoid error flash
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // When attribute changes, ensure terms field is properly reset and marked for validation
    if (attributeId) {
      // Set term_ids to empty array but don't validate yet
      setValue(`attributes.${index}.term_ids`, [], {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: true
      });
      
      // Clear any term search results for previous attribute
      setTermSearchResults(prev => {
        const newState = {...prev};
        // Remove previous attribute's results if any
        Object.keys(newState).forEach(key => {
          if (Number(key) !== attributeId) {
            delete newState[key];
          }
        });
        return newState;
      });
      
      // Immediately search for terms for this attribute to populate dropdown
      searchTerms(index, attributeId, "");
    }
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

    // Sort the terms alphabetically by label
    return uniqueTerms.sort((a, b) => a.label.localeCompare(b.label));
  };

  // Function to get available terms for a specific attribute
  const getAvailableTerms = (index: number, attributeId: number | null) => {
    if (!attributeId) return [];

    // First check for search results
    const searchedTerms = termSearchResults[attributeId]?.data?.terms || [];

    // Get terms from fetched data if available
    const termsList = terms && terms[index]?.data?.terms || [];
    const productAttributeTerms = formData.attributesResponse?.productAttributeTerms || [];

    // Combined unique terms from search results and fetched data
    const combinedTerms = getUniqueTermOptions(
      productAttributeTerms,
      searchedTerms.length > 0 ? searchedTerms : termsList,
      attributeId as number
    );

    // Log for debugging
    console.log(`Available terms for attribute ${attributeId}:`, combinedTerms.length);
    
    return combinedTerms;
  };

  const onSubmit = async (data: FormData) => {
    if (!productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    // Check if any attribute or term fields are empty
    const hasEmptyFields = data.attributes.some(
      attr => !attr.attribute_id || attr.term_ids.length === 0
    );
    
    if (hasEmptyFields) {
      showSnackbar("Please fill out all required attribute and term fields", "error");
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
      let response;
      
      if (isEditMode) {
        // For update, we need to format the request differently
        const updateRequest: UpdateProductAttributesRequest = {
          attributes: data.attributes.map((attr) => ({
            attribute_id: Number(attr.attribute_id),
            term_ids: attr.term_ids.map(id => Number(id)), // Ensure all IDs are numbers
            is_visible_page: attr.is_visible_page,
            used_in_variation: attr.used_in_variation,
          })),
        };

        console.log("Updating product attributes:", updateRequest);
        response = await updateProductAttributes(Number(productId), updateRequest);
        showSnackbar("Product attributes updated successfully", "success");
      } else {
        // For new products, flatten attributes and terms into attribute-term pairs
        const addRequest: AddProductAttributesRequest = {
          attributes: data.attributes.flatMap((attr) =>
            attr.term_ids.map((termId) => ({
              attribute_id: Number(attr.attribute_id),
              term_id: Number(termId),
              is_visible_page: attr.is_visible_page,
              used_in_variation: attr.used_in_variation,
            }))
          ),
        };

        console.log("Adding product attributes:", addRequest);
        response = await addProductAttributes(Number(productId), addRequest);
        showSnackbar("Product attributes saved successfully", "success");
        nextStep();
      }

      // Update form data
      updateFormData({
        attributes: data.attributes.map((attr) => ({
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map(id => Number(id)),
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

      // More detailed error logging
      console.error("Full error details:", JSON.stringify(error));

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
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log("Form validation errors:", errors);
          
          // Show specific error messages based on which fields failed validation
          if (errors.attributes) {
            const errorMessages = [];
            
            errors.attributes.forEach((attrError, index) => {
              if (attrError?.attribute_id) {
                errorMessages.push(`Attribute #${index + 1}: ${attrError.attribute_id.message}`);
              }
              if (attrError?.term_ids) {
                errorMessages.push(`Terms for Attribute #${index + 1}: ${attrError.term_ids.message}`);
              }
            });
            
            if (errorMessages.length > 0) {
              showSnackbar(errorMessages[0], "error");
            } else {
              showSnackbar("Please fill out all required fields", "error");
            }
          }
        })}
        className="flex w-full flex-col justify-center space-y-6"
        noValidate
      >
        {fields.map((field, index) => (
          <Paper key={field.id} className="p-5 relative">
            <div className="grid grid-cols-2 gap-6">
              <div className="h-auto min-h-[80px]">
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
                      fieldState: { error, invalid, isTouched },
                    }) => (
                      <Autocomplete
                        options={getAvailableAttributes(index)}
                        getOptionLabel={(option) => option.label}
                        value={
                          value
                            ? attributeOptions[index]?.find(
                                (opt) => opt.value === value
                              ) ||
                              (attributes?.data?.attributes?.find(
                                (attr) => attr.id === value
                              )
                                ? {
                                    value,
                                    label: attributes.data.attributes.find(
                                      (attr) => attr.id === value
                                    ).name,
                                  }
                                : null)
                            : null
                        }
                        onChange={(event, newValue) => {
                          onChange(newValue ? newValue.value : null);
                          handleAttributeChange(
                            index,
                            newValue ? Number(newValue.value) : null
                          );
                        }}
                        onInputChange={(event, value) => {
                          // Only trigger search when user is actually typing (not on selection)
                          if (event && event.type === "change") {
                            handleAttributeSearchChange(index, value);
                          }
                        }}
                        onOpen={() => {
                          // Ensure we load all options when dropdown opens
                          handleAttributeSearchChange(index, "");
                        }}
                        loading={isAttributeSearching}
                        loadingText="Searching attributes..."
                        noOptionsText="No attributes found"
                        blurOnSelect
                        forcePopupIcon={true}
                        popupIcon={
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#2E9970] mt-[-2px]" />
                        }
                        filterOptions={(x) => x} // Disable client-side filtering so we use server-side only
                        openOnFocus
                        selectOnFocus
                        clearOnBlur={false}
                        handleHomeEndKeys
                        disablePortal={false}
                        renderOption={(props, option, { selected }) => (
                          <li
                            {...props}
                            className={`${props.className} ${
                              selected ? "bg-[#f0f7f4]" : ""
                            }`}
                          >
                            <div className="flex items-center w-full">
                              <span
                                className={`flex-1 ${
                                  selected ? "font-medium text-[#2E9970]" : ""
                                }`}
                              >
                                {option.label}
                              </span>
                              {selected && (
                                <span className="text-[#2E9970] ml-2 text-sm">
                                  ✓
                                </span>
                              )}
                            </div>
                          </li>
                        )}
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
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isAttributeSearching ? (
                                    <CircularProgress size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
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
                                borderRadius: 0,
                                "& fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "none"
                                    : "linear-gradient(to right, #2E9970, #005434) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.attribute_id
                                    ? "#d32f2f"
                                    : undefined,
                                  borderRadius: 0,
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
                                  borderRadius: 0,
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
                                  borderRadius: 0,
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
                          "& .MuiAutocomplete-root": {
                            height: "auto",
                          },
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 0,
                            "&.Mui-focused fieldset": {
                              borderColor: errors?.attributes?.[index]
                                ?.attribute_id
                                ? "#d32f2f"
                                : "#2E9970",
                              borderWidth: "2px",
                              borderRadius: 0,
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

              <div className="h-auto min-h-[80px] mb-4">
                <FormControl
                  sx={{ minWidth: 180, width: "100%" }}
                  size="small"
                  error={!!errors?.attributes?.[index]?.term_ids}
                >
                  <Controller
                    name={`attributes.${index}.term_ids`}
                    control={control}
                    rules={{ required: "At least one term is required" }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error, invalid, isTouched },
                    }) => (
                      <Autocomplete
                        multiple
                        limitTags={10}
                        options={getAvailableTerms(index, field.attribute_id)}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        disableCloseOnSelect
                        selectOnFocus
                        clearOnBlur={false}
                        handleHomeEndKeys
                        onInputChange={(event, value) => {
                          // Only trigger search when user is actually typing (not on selection)
                          if (
                            field.attribute_id &&
                            event &&
                            event.type === "change"
                          ) {
                            // Add term searching functionality
                            if (value && value.trim().length >= 2) {
                              searchTerms(index, field.attribute_id, value);
                            }
                          }
                        }}
                        onOpen={() => {
                          // Load all terms when dropdown opens
                          if (field.attribute_id) {
                            searchTerms(index, field.attribute_id, "");
                          }
                        }}
                        renderOption={(props, option, { selected }) => (
                          <li
                            {...props}
                            className={`${props.className} ${
                              selected ? "bg-[#f0f7f4]" : ""
                            }`}
                          >
                            <div className="flex items-center w-full">
                              <span
                                className={`flex-1 ${
                                  selected ? "font-medium text-[#2E9970]" : ""
                                }`}
                              >
                                {option.label}
                              </span>
                              {selected && (
                                <span className="text-[#2E9970] ml-2 text-sm">
                                  ✓
                                </span>
                              )}
                            </div>
                          </li>
                        )}
                        value={
                          value
                            ? value.map((termId) => {
                                // First try to find in the options
                                const termOption = getAvailableTerms(
                                  index,
                                  field.attribute_id
                                ).find((opt) => opt.value === termId);

                                // If found, use it
                                if (termOption) {
                                  return termOption;
                                }

                                // Try to find the name in our lookup
                                if (termNameLookup[termId]) {
                                  return {
                                    value: termId,
                                    label: termNameLookup[termId],
                                  };
                                }

                                // Check in product attribute terms
                                const productAttributeTerm =
                                  formData.attributesResponse?.productAttributeTerms?.find(
                                    (term) =>
                                      term.term_id === termId && term.term?.name
                                  );

                                if (productAttributeTerm?.term?.name) {
                                  return {
                                    value: termId,
                                    label: productAttributeTerm.term.name,
                                  };
                                }

                                // Fallback to showing the ID with a label
                                return {
                                  value: termId,
                                  label: `Term ${termId}`,
                                };
                              })
                            : []
                        }
                        onChange={(event, newValue) => {
                          // Map the selected options to their value property and ensure they are numbers
                          const termIds = newValue.map((item) => Number(item.value));
                          
                                
                          // Update form value
                          onChange(termIds);
                          
                          // Force validation after selection to clear any errors
                          setTimeout(() => {
                            setValue(`attributes.${index}.term_ids`, termIds, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true
                            });
                          }, 0);
                        }}
                        loading={isTermSearching}
                        loadingText="Searching terms..."
                        noOptionsText="No terms found"
                        blurOnSelect
                        forcePopupIcon={true}
                        popupIcon={
                          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#2E9970] mt-[-2px]" />
                        }
                        filterOptions={(x) => x} // Disable client-side filtering
                        renderTags={(tagValue, getTagProps) =>
                          tagValue.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={option.value}
                              label={option.label}
                              sx={{
                                backgroundColor: "#f2f2f2",
                                borderRadius: "16px",
                                fontSize: "0.75rem",
                                height: "24px",
                                margin: "2px",
                                "& .MuiChip-deleteIcon": {
                                  color: "#999",
                                  fontSize: "0.875rem",
                                  "&:hover": {
                                    color: "#555",
                                  },
                                },
                                "& .MuiChip-label": {
                                  color: "#333",
                                  fontWeight: 400,
                                  padding: "0 6px",
                                },
                              }}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Terms"
                            variant="outlined"
                            size="small"
                            error={!!errors?.attributes?.[index]?.term_ids}
                            required
                            helperText={
                              errors?.attributes?.[index]?.term_ids?.message
                            }
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isTermSearching ? (
                                    <CircularProgress size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            FormHelperTextProps={{
                              sx: {
                                color: errors?.attributes?.[index]?.term_ids
                                  ? "#d32f2f"
                                  : "inherit",
                                marginLeft: 0,
                                position: "absolute",
                                bottom: -20,
                              },
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                padding: "4px 6px",
                                minHeight: "30px",
                                height: "auto",
                                borderRadius: 0,
                                "& fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "none"
                                    : "linear-gradient(to right, #2E9970, #005434) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "#d32f2f"
                                    : undefined,
                                  borderRadius: 0,
                                },
                                "&:hover fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "none"
                                    : "linear-gradient(to right, #247C5C, #003F29) 1",
                                  borderColor: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "#d32f2f"
                                    : undefined,
                                  borderRadius: 0,
                                },
                                "&.Mui-focused fieldset": {
                                  borderImage: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "none"
                                    : "linear-gradient(to right, #1E7A56, #004C30) 1",
                                  borderWidth: "1px",
                                  borderColor: errors?.attributes?.[index]
                                    ?.term_ids
                                    ? "#d32f2f"
                                    : undefined,
                                  borderRadius: 0,
                                },
                              },
                              "& .MuiInputLabel-root": {
                                color: errors?.attributes?.[index]?.term_ids
                                  ? "#d32f2f"
                                  : "#2E9970",
                                fontSize: "0.875rem",
                              },
                              "& .MuiInputLabel-root.Mui-focused": {
                                color: errors?.attributes?.[index]?.term_ids
                                  ? "#d32f2f"
                                  : "#2E9970",
                              },
                              "& .MuiAutocomplete-endAdornment": {
                                top: "calc(50% - 12px)",
                              },
                              "& .MuiFormLabel-asterisk": {
                                color: "red",
                              },
                              "& .MuiInputBase-root": {
                                flexWrap: "wrap",
                              },
                              "& .MuiChip-root": {
                                maxWidth: "100%",
                              },
                            }}
                          />
                        )}
                        sx={{
                          "& .MuiAutocomplete-root": {
                            height: "auto",
                          },
                          "& .MuiOutlinedInput-root": {
                            height: "auto",
                            minHeight: "40px",
                            borderRadius: 0,
                            "&.Mui-focused fieldset": {
                              borderImage: errors?.attributes?.[index]?.term_ids
                                ? "none"
                                : "linear-gradient(to right, #1E7A56, #004C30) 1",
                              borderColor: errors?.attributes?.[index]?.term_ids
                                ? "#d32f2f"
                                : undefined,
                              borderWidth: "1px",
                              borderRadius: 0,
                            },
                          },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: errors?.attributes?.[index]?.term_ids
                              ? "#d32f2f"
                              : "#2E9970",
                          },
                          "& .MuiAutocomplete-tag": {
                            margin: "2px",
                            maxWidth: "calc(100% - 4px)",
                          },
                          "& .MuiAutocomplete-inputRoot": {
                            flexWrap: "wrap",
                            height: "auto",
                            minHeight: "40px",
                            paddingTop: "2px",
                            paddingBottom: "2px",
                          },
                          "& .MuiAutocomplete-endAdornment": {
                            bottom: "50%",
                            transform: "translateY(-50%)",
                          },
                          "& .MuiAutocomplete-popupIndicator": {
                            color: "#2E9970",
                          },
                          "& .MuiAutocomplete-popupIndicatorOpen": {
                            transform: "rotate(180deg)",
                          },
                        }}
                      />
                    )}
                  />
                </FormControl>
              </div>

              <div className="flex items-center">
                <FormCheckboxField
                  name={`attributes.${index}.is_visible_page`}
                  control={control}
                  label="Visible on product page"
                />
              </div>

              <div className="flex items-center">
                <FormCheckboxField
                  name={`attributes.${index}.used_in_variation`}
                  control={control}
                  label="Used for variations"
                />
              </div>
            </div>
            {fields.length > 1 && (
              <IconButton
                onClick={() => handleDeleteAttribute(index)}
                className="absolute top-3 right-3"
                size="small"
                disabled={isLoading}
                type="button"
                sx={{
                  color: "error.main",
                  backgroundColor: "#f8f8f8",
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

        <div className="flex justify-center mt-4">
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
            // className="rounded-full px-6 py-2 bg-[#f0f7f4] text-[#2E9970] border-[#2E9970] hover:bg-[#d5efe5] hover:border-[#005434]"
          />
        </div>

        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <AppButton
            label="Previous"
            onClick={previousStep}
            variant="outlined"
            disabled={isSubmitting}
            className="rounded-md min-w-[120px]"
          />
          <AppButton
            label={isEditMode ? "Update" : "Next"}
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => {
              // Manually trigger validation before form submission
              trigger().then(isValid => {
                if (!isValid) {
                  showSnackbar("Please fill out all required fields", "error");
                  console.log("Form validation errors:", errors);
                }
              });
            }}
            className="rounded-md min-w-[120px]"
          />
        </div>
      </form>
    </div>
  );
}

export default AttributesTab;
