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
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
  // State to track expanded accordion panel
  const [expandedPanel, setExpandedPanel] = useState<number | null>(0);
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

  // Use ref to track fetch status
  const urlProductIdStr = searchParams ? searchParams.get("productId") : null;
  const urlProductIdNum = urlProductIdStr ? Number(urlProductIdStr) : null;
  
  const productId = formData.productId || (urlProductIdNum !== null && !isNaN(urlProductIdNum) ? urlProductIdNum : 0);

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
    { enabled: attributeIds.some((id) => id !== null && id > 0) }
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

        // Always call API, with or without keyword
        const response = await listAttributeTerms({
          attribute_id: attributeId,
          limit: 100, // Increased limit to get more terms
          keyword: query && query.trim().length >= 2 ? query.trim() : undefined,
          sort_by: "name",
          order: "ASC"
        });

      

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
    }, 1500), // Increased debounce time for better performance
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
      const response = await getProduct(productId);
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

        // Update form with the loaded attribute data
        replace(attributeGroups);

        // ---> Populate initial attribute IDs set
        setInitialAttributeIds(new Set(attributeGroups.map(attr => attr.attribute_id).filter(id => id != null)));

        // ---> Store initial attributes data for comparison
        setInitialAttributes(JSON.parse(JSON.stringify(attributeGroups)));

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

        // Always call API, but only use keyword when it's provided
        const response = await listAttributes({
          limit: 100,
          keyword: query && query.trim().length >= 2 ? query.trim() : undefined,
          sort_by: "name",
          order: "ASC",
        });

      
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
    const trimmedValue = value.trim();
    if (trimmedValue.length >= 2) { 
      setAttributeOptions((prev) => ({
        ...prev,
        [index]: undefined,
      }));
    }
    searchAttributes(index, value);
  };

  // Function to get available attributes for a specific row
  const getAvailableAttributes = (currentIndex: number) => {
    let optionsForThisField = attributeOptions[currentIndex];

    if (optionsForThisField === undefined && isAttributeSearching) {
      return [];
    }

    if (optionsForThisField === undefined && !isAttributeSearching) {
      optionsForThisField = attributes?.data?.attributes?.map((attr) => ({
        value: attr.id,
        label: attr.name,
      })) || [];
    }
    
    const allAttributeOptions = optionsForThisField || [];

    const selectedAttributeIds = attributeSelections
      .map((attr, index) => (index !== currentIndex ? attr.attribute_id : null))
      .filter((id) => id !== null && id !== undefined);

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
    
    return combinedTerms;
  };

  // Helper function to check if an attribute has been modified
  const isAttributeModified = (currentAttr: FormProductAttribute): boolean => {
    // If it's a new attribute (not in initial list), it's modified
    if (!initialAttributeIds.has(currentAttr.attribute_id)) {
      return true;
    }

    // Find the matching initial attribute
    const initialAttr = initialAttributes.find(
      (attr) => attr.attribute_id === currentAttr.attribute_id
    );

    if (!initialAttr) {
      return true; // New attribute
    }

    // Compare term_ids (order doesn't matter)
    const currentTermIds = [...currentAttr.term_ids].sort();
    const initialTermIds = [...initialAttr.term_ids].sort();
    
    if (currentTermIds.length !== initialTermIds.length) {
      return true;
    }
    
    if (!currentTermIds.every((id, index) => id === initialTermIds[index])) {
      return true;
    }

    // Compare boolean flags
    if (currentAttr.is_visible_page !== initialAttr.is_visible_page) {
      return true;
    }

    if (currentAttr.used_in_variation !== initialAttr.used_in_variation) {
      return true;
    }

    return false;
  };

  const onSubmit = async (data: FormData) => {
    if (!productId) {
      showSnackbar("Product ID is missing. Cannot save attributes.", "error");
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
        // Filter to only include modified or new attributes
        const modifiedAttributes = data.attributes.filter(isAttributeModified);

        // If no attributes were modified, show a message and don't make API call
        if (modifiedAttributes.length === 0) {
          showSnackbar("No changes detected", "info");
          setIsSubmitting(false);
          return;
        }

        // For update, we need to format the request differently
        const updateRequest: UpdateProductAttributesRequest = {
          attributes: modifiedAttributes.map((attr) => ({
            attribute_id: Number(attr.attribute_id),
            term_ids: attr.term_ids.map(id => Number(id)), // Ensure all IDs are numbers
            is_visible_page: attr.is_visible_page,
            used_in_variation: attr.used_in_variation,
          })),
        };

        response = await updateProductAttributes(productId, updateRequest);
        showSnackbar("Product attributes updated successfully", "success");
        
        // Update initial state with current values after successful update
        const updatedAttributesList = data.attributes.map((attr) => ({
          attribute_id: Number(attr.attribute_id),
          term_ids: attr.term_ids.map(id => Number(id)),
          is_visible_page: attr.is_visible_page,
          used_in_variation: attr.used_in_variation,
        }));
        setInitialAttributes(JSON.parse(JSON.stringify(updatedAttributesList)));
        setInitialAttributeIds(new Set(updatedAttributesList.map(attr => attr.attribute_id).filter(id => id != null)));
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

        response = await addProductAttributes(productId, addRequest);
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
    if (!productId) {
      showSnackbar("Product ID not found", "error");
      return;
    }

    try {
      setIsLoading(true);
      const attributeToDelete = fields[index];
      const productAttributeTerms =
        formData.attributesResponse?.productAttributeTerms;

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

          try {
            await deleteProductAttributeTerm(productId, term.id);
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

      // Update initial attributes state to remove deleted attribute
      setInitialAttributes((prev) => 
        prev.filter((attr) => attr.attribute_id !== attributeToDelete.attribute_id)
      );
      setInitialAttributeIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(attributeToDelete.attribute_id);
        return newSet;
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

  // Function to handle accordion panel changes
  const handleAccordionChange = (panel: number) => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null);
  };

  // Update the append function to create new attribute and open its panel
  const handleAddNewAttribute = () => {
    // First append the new attribute
    append({
      attribute_id: null as any,
      term_ids: [],
      is_visible_page: true,
      used_in_variation: false,
      default_value: "",
    });
    
    // Then set the expanded panel to be the newly added one
    // This has to be done with a slight delay to allow the append to complete
    setTimeout(() => {
      setExpandedPanel(fields.length);
    }, 50);
  };

  const [searchQuery, setSearchQuery] = useState("");

  // Filter fields based on search query
  const filteredFields = fields.filter((field, index) => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const attributeName = attributeOptions[index]?.find(opt => opt.value === watch(`attributes.${index}.attribute_id`))?.label || 
      attributes?.data?.attributes?.find(attr => attr.id === watch(`attributes.${index}.attribute_id`))?.name || 
      '';
    
    // Check if attribute name matches
    if (attributeName.toLowerCase().includes(searchLower)) return true;
    
    // Check if any terms match
    const termIds = watch(`attributes.${index}.term_ids`) || [];
    return termIds.some(termId => {
      const termName = termNameLookup[termId] || '';
      return termName.toLowerCase().includes(searchLower);
    });
  });

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // ---> Add state to track initially loaded attribute IDs
  const [initialAttributeIds, setInitialAttributeIds] = useState<Set<number>>(new Set());

  // ---> Add state to track initial attributes data for comparison
  const [initialAttributes, setInitialAttributes] = useState<FormProductAttribute[]>([]);

  // ---> Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [attributeToDeleteIndex, setAttributeToDeleteIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-10">
        <FuseLoading />
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          
          // Show specific error messages based on which fields failed validation
          if (errors.attributes && Array.isArray(errors.attributes)) {
            const errorMessages: string[] = [];
            
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
        className="flex w-full flex-col justify-center"
        noValidate
      >
        <div className="w-[50%]">
          <Typography variant="h5" className="font-bold text-gray-800 mb-4">Product Attributes</Typography>
          
          <div className="flex justify-between items-center mb-6">
            {fields.length > 0 && (
              <TextField
                placeholder="Search attributes or terms..."
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#666' }} />
                    </InputAdornment>
                  ),
                  style: { backgroundColor: "white" }
                }}
                sx={{
                  width: "300px",
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "white",
                    borderRadius: "8px",
                    height: "38px",
                  }
                }}
              />
            )}
            <AppButton
              label={
                <>
                  <AddIcon className="mr-2" />
                  Add Attribute
                </>
              }
              type="button"
              variant="contained"
              onClick={handleAddNewAttribute}
              className="rounded-md px-4 py-1.5 bg-[#2E9970] text-white hover:bg-[#247C5C] ml-auto"
            />
          </div>
        </div>
        
        {fields.length === 0 ? (
          <div className="w-[50%] flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
            <Typography variant="h6" className="text-gray-600 mb-2">No Attributes Added Yet</Typography>
            <Typography variant="body2" className="text-gray-500 text-center mb-4">
              Start by adding attributes like color, size, or material for your product
            </Typography>
            <AppButton
              label={
                <>
                  <AddIcon className="mr-2" />
                  Add First Attribute
                </>
              }
              type="button"
              variant="contained"
              onClick={handleAddNewAttribute}
              className="rounded-md px-4 py-1.5 bg-[#2E9970] text-white hover:bg-[#247C5C]"
            />
          </div>
        ) : (
          filteredFields.map((field, index) => {
            // Find the actual index in the fields array
            const actualIndex = fields.findIndex(f => f.id === field.id);
            
            return (
            <Accordion
              key={field.id}
              expanded={expandedPanel === actualIndex}
              onChange={handleAccordionChange(actualIndex)}
              elevation={1}
              className="bg-white shadow-lg rounded-md w-[50%] overflow-visible mb-3"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`attribute-panel-${actualIndex}-content`}
                id={`attribute-panel-${actualIndex}-header`}
                className="min-h-[64px] py-2"
                sx={{
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0',
                    overflow: 'visible'
                  },
                  '&.Mui-expanded': {
                    backgroundColor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    minHeight: '64px'
                  }
                }}
              >
                <div className="flex items-center justify-between w-full pr-8">
                  <div className="flex flex-col">
                    <Typography 
                      className={`text-lg font-semibold ${!watch(`attributes.${actualIndex}.attribute_id`) ? 'text-gray-500' : ''}`}
                    >
                      {watch(`attributes.${actualIndex}.attribute_id`) 
                        ? attributeOptions[actualIndex]?.find(opt => opt.value === watch(`attributes.${actualIndex}.attribute_id`))?.label || 
                          attributes?.data?.attributes?.find(attr => attr.id === watch(`attributes.${actualIndex}.attribute_id`))?.name || 
                          `Attribute ${actualIndex + 1}`
                        : `New Attribute ${actualIndex + 1}`}
                    </Typography>
                    
                    {/* Term Chips - Move below name - ONLY SHOW WHEN COLLAPSED */}
                    {watch(`attributes.${actualIndex}.term_ids`)?.length > 0 && expandedPanel !== actualIndex && (
                      <div className="flex flex-wrap gap-1 mt-1 max-w-[350px] overflow-hidden">
                        {watch(`attributes.${actualIndex}.term_ids`).slice(0, 3).map(termId => (
                          <Chip
                            key={termId}
                            label={termNameLookup[termId] || `Term ${termId}`}
                            size="small"
                            sx={{
                              backgroundColor: "#e0e7ff",
                              color: "#4338ca",
                              fontSize: "0.7rem",
                              height: "20px",
                              fontWeight: 500,
                              borderRadius: '4px',
                            }}
                          />
                        ))}
                        {watch(`attributes.${actualIndex}.term_ids`).length > 3 && (
                          <Chip
                            label={`+${watch(`attributes.${actualIndex}.term_ids`).length - 3} more`}
                            size="small"
                            sx={{
                              backgroundColor: "#f3f4f6",
                              color: "#6b7280",
                              fontSize: "0.7rem",
                              height: "20px",
                              borderRadius: '4px',
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {fields.length > 1 && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttributeToDeleteIndex(actualIndex);
                      setIsDeleteDialogOpen(true);
                    }}
                    size="small"
                    disabled={isLoading}
                    className="absolute right-12 top-4"
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
                      zIndex: 1,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </AccordionSummary>
              <AccordionDetails className="p-5">
                <div className="flex flex-col space-y-4">
                  {/* --- Start Edit: Conditionally Render ENTIRE Attribute Section --- */}
                  {/* {field.attribute_id !== null && !initialAttributeIds.has(field.attribute_id as number) && ( */}
                    {/* // Only render this section for NEW attributes */}
                    <div> 
                      <p className="font-medium mb-1">Attribute <span className="text-red-500">*</span></p>
                      {/* Existing conditional logic for dropdown remains inside */} 
                      <FormControl
                        sx={{ width: "100%" }}
                        size="small"
                        error={!!errors?.attributes?.[actualIndex]?.attribute_id}
                      >
                        <Controller
                          name={`attributes.${actualIndex}.attribute_id`}
                          control={control}
                          rules={{ required: "Attribute is required" }}
                          render={({
                            field: { onChange, value },
                            fieldState: { error, invalid, isTouched },
                          }) => (
                            <Autocomplete
                              options={getAvailableAttributes(actualIndex)}
                              getOptionLabel={(option) => option.label || ''} 
                              value={
                                value
                                  ? attributeOptions[actualIndex]?.find(
                                      (opt) => opt.value === value
                                    ) ||
                                    (attributes?.data?.attributes?.find(
                                      (attr) => attr.id === value
                                    )
                                      ? {
                                          value,
                                          label: attributes.data.attributes.find(
                                            (attr) => attr.id === value
                                          )!.name,
                                        }
                                      : null)
                                  : null
                              }
                              onChange={(event, newValue) => {
                                const newAttributeId = newValue ? Number(newValue.value) : null;
                                if (newAttributeId !== null) {
                                  handleAttributeChange(actualIndex, newAttributeId);
                                } else {
                                  // Handle clear
                                  handleAttributeChange(actualIndex, null as any);
                                }
                              }}
                              onInputChange={(event, inputValue) => {
                                if (event && event.type === "change") {
                                  handleAttributeSearchChange(actualIndex, inputValue);
                                }
                              }}
                              onOpen={() => {
                                handleAttributeSearchChange(actualIndex, "");
                              }}
                              loading={isAttributeSearching}
                              loadingText="Searching attributes..."
                              noOptionsText="No attributes found"
                              blurOnSelect
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Select attribute"
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  error={!!errors?.attributes?.[actualIndex]?.attribute_id}
                                  helperText={
                                    errors?.attributes?.[actualIndex]?.attribute_id?.message
                                  }
                                  InputProps={{
                                    ...params.InputProps,
                                    style: { backgroundColor: "white"},
                                    endAdornment: (
                                      <>
                                        {isAttributeSearching ? (
                                          <CircularProgress size={20} />
                                        ) : null}
                                        {params.InputProps.endAdornment}
                                      </>
                                    ),
                                  }}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      backgroundColor: "white",
                                      borderRadius: "4px",
                                      height: "auto",
                                      minHeight: "48px",
                                      paddingY: "6px"
                                    }
                                  }}
                                />
                              )}
                            />
                          )}
                        />
                      </FormControl>
                    </div>
                  {/* )} */}
                  {/* --- End Edit --- */}

                  <div>
                    <p className="font-medium mb-1">Terms <span className="text-red-500">*</span></p>
                    <FormControl
                      sx={{ width: "100%" }}
                      size="small"
                      error={!!errors?.attributes?.[actualIndex]?.term_ids}
                    >
                      <Controller
                        name={`attributes.${actualIndex}.term_ids`}
                        control={control}
                        rules={{ required: "At least one term is required" }}
                        render={({
                          field: { onChange, value },
                          fieldState: { error }
                        }) => (
                          <Autocomplete
                            multiple
                            options={getAvailableTerms(actualIndex, field.attribute_id)}
                            getOptionLabel={(option) => option.label}
                            value={
                              value
                                ? value.map((termId) => {
                                    // Find in options
                                    const termOption = getAvailableTerms(
                                      actualIndex,
                                      field.attribute_id
                                    ).find((opt) => opt.value === termId);

                                    if (termOption) {
                                      return termOption;
                                    }

                                    // Try lookup
                                    if (termNameLookup[termId]) {
                                      return {
                                        value: termId,
                                        label: termNameLookup[termId],
                                      };
                                    }

                                    // Fallback
                                    return {
                                      value: termId,
                                      label: `Term ${termId}`,
                                    };
                                  })
                                : []
                            }
                            onChange={(event, newValue) => {
                              // Check for duplicates before updating
                              const uniqueValues: Array<{ value: number; label: string; }> = [];
                              const uniqueSet = new Set();
                              
                              newValue.forEach(item => {
                                const itemValue = Number(item.value);
                                if (!uniqueSet.has(itemValue)) {
                                  uniqueSet.add(itemValue);
                                  uniqueValues.push(item);
                                }
                              });
                              
                              const termIds = uniqueValues.map((item) => Number(item.value));
                              onChange(termIds);
                              
                              // Force validation
                              setTimeout(() => {
                                setValue(`attributes.${actualIndex}.term_ids`, termIds, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true
                                });
                                
                                // Refresh the terms list after selection
                                if (field.attribute_id) {
                                  searchTerms(actualIndex, field.attribute_id, "");
                                }
                              }, 0);
                            }}
                            onInputChange={(event, value) => {
                              if (field.attribute_id && event) {
                                // Always search, but use the query value if it's long enough
                                searchTerms(
                                  actualIndex, 
                                  field.attribute_id, 
                                  value && value.trim().length >= 2 ? value : ""
                                );
                              }
                            }}
                            loading={isTermSearching}
                            loadingText="Loading terms..."
                            noOptionsText="No terms available"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Select or search terms"
                                variant="outlined"
                                size="small"
                                error={!!errors?.attributes?.[actualIndex]?.term_ids}
                                helperText={
                                  errors?.attributes?.[actualIndex]?.term_ids?.message
                                }
                                InputProps={{
                                  ...params.InputProps,
                                  style: { backgroundColor: "white" },
                                  endAdornment: (
                                    <>
                                      {isTermSearching ? (
                                        <CircularProgress size={20} />
                                      ) : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    backgroundColor: "white",
                                    borderRadius: "4px",
                                    height: "auto",
                                    minHeight: "48px",
                                    paddingY: "6px"
                                  }
                                }}
                                onClick={() => {
                                  // Load all terms when clicking in the field
                                  if (field.attribute_id) {
                                    searchTerms(actualIndex, field.attribute_id, "");
                                  }
                                }}
                              />
                            )}
                            onOpen={() => {
                              // Load all terms when dropdown opens
                              if (field.attribute_id) {
                                searchTerms(actualIndex, field.attribute_id, "");
                              }
                            }}
                            disableCloseOnSelect
                            renderTags={(value, getTagProps) => 
                              value.map((option, index) => (
                                <Chip 
                                  {...getTagProps({ index })}
                                  key={option.value}
                                  label={option.label}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#e6e6fa",
                                    color: "black",
                                    fontSize: "0.75rem",
                                    fontWeight: 500,
                                    height: "24px",
                                    borderRadius: "16px",
                                    margin: "2px",
                                    "& .MuiChip-deleteIcon": {
                                      color: "gray",
                                      width: "16px",
                                      height: "16px",
                                      margin: "0 2px 0 -6px",
                                      cursor: "pointer"
                                    },
                                    "& .MuiChip-label": {
                                      padding: "0 8px",
                                    },
                                  }}
                                />
                              ))
                            }
                            isOptionEqualToValue={(option, value) => option.value === value.value}
                            getOptionDisabled={(option) => {
                              const currentSelectedIds = value || [];
                              return currentSelectedIds.some(id => id === option.value);
                            }}
                            ListboxProps={{
                              sx: {
                                "& .MuiAutocomplete-option": {
                                  padding: "6px 12px",
                                  "&[aria-selected='true']": {
                                    backgroundColor: "#e3f2fd !important",
                                    "&::after": {
                                      content: '"✓"',
                                      position: "absolute",
                                      right: "10px",
                                      color: "#2E9970",
                                      fontWeight: "bold"
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      />
                    </FormControl>
                  </div>

                  <div className="flex space-x-2">
                    <FormCheckboxField
                      name={`attributes.${actualIndex}.is_visible_page`}
                      control={control}
                      label="Visible on product page"
                    />
                    <FormCheckboxField
                      name={`attributes.${actualIndex}.used_in_variation`}
                      control={control}
                      label="Used for variations"
                    />
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>
          )})
        )}

        {fields.length > 0 && filteredFields.length === 0 && (
          <div className="w-[50%] flex flex-col items-center justify-center py-8 px-4 border border-gray-200 rounded-md bg-gray-50">
            <Typography variant="body1" className="text-gray-600 mb-2">No attributes match your search</Typography>
            <Typography variant="body2" className="text-gray-500 text-center">
              Try adjusting your search criteria
            </Typography>
          </div>
        )}

      

        <div className="flex justify-between mt-6 pt-4">
          <AppButton
            label="Previous"
            onClick={previousStep}
            variant="outlined"
            disabled={isSubmitting}
            className="rounded-md min-w-[120px]"
          />
          <div className="flex gap-3">
            <div className="flex justify-end">
          <AppButton
            label={
              <>
                <AddIcon className="mr-2" />
                Add Attribute
              </>
            }
            type="button"
            variant="contained"
            onClick={handleAddNewAttribute}
            className="rounded-md px-4 py-1.5 bg-[#2E9970] text-white hover:bg-[#247C5C]"
          />
        </div>
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
                }
              });
            }}
            className="rounded-md min-w-[120px]"
          />
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this attribute?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={() => {
            if (attributeToDeleteIndex !== null) {
              handleDeleteAttribute(attributeToDeleteIndex);
            }
            setIsDeleteDialogOpen(false);
          }} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AttributesTab;
