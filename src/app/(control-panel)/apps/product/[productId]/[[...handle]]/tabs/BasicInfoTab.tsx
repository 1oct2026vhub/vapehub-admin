"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useFetch } from "@/hooks/useFetch";
import { listProductCategory } from "@/services/apiProductCategory";
import { listProductBrand } from "@/services/apiProductBrand";
import {
  createProduct,
  getProduct,
  type CreateProductData,
  updateProduct,
  listProducts,
} from "@/services/apiProduct";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useCallback, useMemo } from "react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useProductForm } from "../ProductFormContext";
import { getAuthToken } from "@/utils/auth";
import { Autocomplete, TextField, Chip } from "@mui/material";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import debounce from 'lodash/debounce';
import { Grid, Stack, Button as MuiButton, Box as MuiBox } from "@mui/material";
import AddNewCategoryModal from "../components/AddNewCategoryModal";
import AddNewBrandModal from "../components/AddNewBrandModal";
import FormMultiTextField from '@/components/Shared/FormMultiTextField';
import FormCheckboxField from '@/components/Shared/FormCheckboxField';

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(150, "Name must not exceed 150 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug must be at most 200 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  sku: z.string().optional(),
  description: z.string().optional().default(""),
  key_highlights: z.string().optional().default(""),
  category_ids: z.array(z.number()).min(1, "At least one category is required"),
  brand_ids: z.array(z.number()).min(1, "At least one brand is required"),
  linked_product_ids: z.array(z.number()).optional().default([]),
  is_new: z.boolean().optional(),
  is_discontinued: z.boolean().optional(),
});
// Same redirect URL validation as EditBannerForm: empty or valid URL
const redirectUrlSchema = z.string().url("Invalid URL format").optional().or(z.literal(""));

type FormData = z.infer<typeof schema>;

interface Option {
  value: number | string;
  label: string;
}

// Custom component to handle ID-to-name mapping for categories and brands
const FormMultiSelectWithMapping = ({ 
  name, 
  control, 
  label, 
  options, 
  error, 
  errorMessage, 
  onInputChange, 
  loading, 
  placeholder,
  searchTerm,
}: {
  name: string;
  control: any;
  label: string;
  options: Option[];
  error: boolean;
  errorMessage?: string;
  onInputChange: (query: string) => void;
  loading: boolean;
  placeholder: string;
  searchTerm: string;
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[]}
      render={({ field: { onChange, value } }) => {
        // Convert IDs to display names for the Autocomplete
        const displayValues = Array.isArray(value) 
          ? value.map(id => {
              const option = options.find(opt => opt.value === id);
              return option ? option.label : '';
            }).filter(Boolean)
          : [];

        return (
          <Autocomplete
            multiple
            freeSolo
            options={options.map(option => option.label)}
            value={displayValues}
            loading={loading}
            loadingText="Loading..."
            noOptionsText={searchTerm && options.length === 0 ? "No data found" : "No options"}
            onChange={(_, newValue) => {
              // Convert display names back to IDs
              const ids = newValue.map(displayName => {
                const option = options.find(opt => opt.label === displayName);
                return option ? option.value : null;
              }).filter((id): id is number => id !== null);
              
              onChange(ids);
            }}
            onInputChange={(_, inputValue, reason) => {
              // Only trigger search when user is actually typing (not when clearing or selecting)
              if (reason === 'input') {
                onInputChange?.(inputValue);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                variant="outlined"
                placeholder={placeholder}
                error={error}
                helperText={error ? errorMessage : (searchTerm && options.length === 0 ? "No data found!" : undefined)}
                sx={{ 
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white'
                  }
                }}
              />
            )}
            renderTags={(value: string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={`${option}-${index}`}
                />
              ))
            }
            // Ensure selected values are always visible in the input
            filterSelectedOptions={false}
          />
        );
      }}
    />
  );
};

function BasicInfoTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();
  
  const [isLoading, setIsLoading] = useState(false);
  const { formData, updateFormData, nextStep, markStepAsCompleted } = useProductForm();
  const [productId, setProductId] = useState<number | null>(null);
  
  // State for modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // State for searchable select options
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);

  const [brandLoading, setBrandLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<Option[]>([]);
  const [brandError, setBrandError] = useState("");
  const [brandSearchInput, setBrandSearchInput] = useState("");
  const [selectedBrandNames, setSelectedBrandNames] = useState<string[]>([]);

  // State for linked products
  const [linkedProductLoading, setLinkedProductLoading] = useState(false);
  const [linkedProductOptions, setLinkedProductOptions] = useState<Option[]>([]);
  const [linkedProductError, setLinkedProductError] = useState("");
  const [linkedProductSearchInput, setLinkedProductSearchInput] = useState("");

  const [redirectUrlError, setRedirectUrlError] = useState("");

  // Determine if we're in edit mode
  const isEditMode = Boolean(productId && productId > 0);

  const {
    control,
    trigger,
    setValue,
    reset,
    formState: { isValid, errors },
    handleSubmit,
    watch,
    getValues,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      name: formData.name || "",
      slug: formData.slug || "",
      sku: formData.sku || "",
      description: formData.description || "",
      key_highlights: formData.key_highlights || "",
      category_ids: formData.category_ids || [],
      brand_ids: formData.brand_ids || [],
      linked_product_ids: formData.linked_product_ids || [],
      is_discontinued: formData.is_discontinued ?? false,
      // is_new: formData.is_new ?? true,
    },
    resolver: zodResolver(schema),
  });

  // Fetch initial category, brand, and linked product options
  useEffect(() => {
    fetchCategories("");
    fetchBrands("");
    fetchLinkedProducts("");
  }, []);

  // Watch form values and trigger validation when category_ids or brand_ids change
  const watchedCategoryIds = watch("category_ids");
  const watchedBrandIds = watch("brand_ids");
  const watchedLinkedProductIds = watch("linked_product_ids");

  useEffect(() => {
    console.log("Category IDs changed:", watchedCategoryIds);
    if (watchedCategoryIds && watchedCategoryIds.length > 0) {
      trigger("category_ids");
    }
  }, [watchedCategoryIds, trigger]);

  useEffect(() => {
    console.log("Brand IDs changed:", watchedBrandIds);
    if (watchedBrandIds && watchedBrandIds.length > 0) {
      trigger("brand_ids");
    }
  }, [watchedBrandIds, trigger]);

  // Prevent current product from being in linked products
  useEffect(() => {
    if (productId && watchedLinkedProductIds && watchedLinkedProductIds.includes(productId)) {
      const filteredIds = watchedLinkedProductIds.filter(id => id !== productId);
      setValue("linked_product_ids", filteredIds);
    }
  }, [watchedLinkedProductIds, productId, setValue]);

  // Debug: Log form state and errors
  useEffect(() => {
    console.log("Form state:", { isValid, errors, watchedCategoryIds, watchedBrandIds });
  }, [isValid, errors, watchedCategoryIds, watchedBrandIds]);

  // Fetch categories based on search query
  const fetchCategories = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          // Always set loading to true when search starts
          setCategoryLoading(true);
          setCategoryError("");
          
          // Use same parameters as in ProductListTable
          const response = await listProductCategory({
            search: query,
            search_only_name: true,
            limit: 1000
          });
          
          // If no categories found, set options to empty array
          if (response?.data?.categories && response.data.categories.length > 0) {
            // Deduplicate categories based on ID first
            const uniqueCategories = deduplicateById(response.data.categories);
            
            // Sort the categories intelligently based on search query
            let sortedCategories = [...uniqueCategories];
            if (query && query.length >= 1) {
              sortedCategories = sortSearchResults(sortedCategories, query, 'name');
            }
            
            // Map the categories from the API response
            const options = sortedCategories.map((category: any) => ({
              value: category.id,
              label: category.name,
            }));
            
            // Always include currently selected categories in the options
            setCategoryOptions(prev => {
              const currentSelectedIds = watchedCategoryIds || [];
              const selectedOptions = currentSelectedIds.map(id => {
                const existingOption = prev.find(opt => opt.value === id);
                return existingOption || { value: id, label: `Category ${id}` };
              });
              
              // Merge selected options with new options, avoiding duplicates
              const mergedOptions = [...selectedOptions];
              options.forEach(newOption => {
                if (!mergedOptions.some(opt => opt.value === newOption.value)) {
                  mergedOptions.push(newOption);
                }
              });
              
              return mergedOptions;
            });
          } else {
            // Even when no search results, keep currently selected options
            setCategoryOptions(prev => {
              const currentSelectedIds = watchedCategoryIds || [];
              return prev.filter(option => currentSelectedIds.includes(Number(option.value)));
            });
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          // Keep currently selected options even on error
          setCategoryOptions(prev => {
            const currentSelectedIds = watchedCategoryIds || [];
            return prev.filter(option => currentSelectedIds.includes(Number(option.value)));
          });
        } finally {
          // Always set loading to false
          setCategoryLoading(false);
        }
      }, 400),
    [watchedCategoryIds]
  );

  // Fetch brands based on search query
  const fetchBrands = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          // Always set loading to true when search starts
          setBrandLoading(true);
          setBrandError("");
          
          // Use same parameters as in ProductListTable
          const response = await listProductBrand({
            search: query,
            search_only_name: true,
            limit: 1000
          });
          
          // If no brands found, set options to empty array
          if (response?.data?.brands && response.data.brands.length > 0) {
            // Deduplicate brands based on ID first
            const uniqueBrands = deduplicateById(response.data.brands);
            
            // Sort the brands intelligently based on search query
            let sortedBrands = [...uniqueBrands];
            if (query && query.length >= 1) {
              sortedBrands = sortSearchResults(sortedBrands, query, 'name');
            }
            
            // Map the brands from the API response
            const options = sortedBrands.map((brand: any) => ({
              value: brand.id,
              label: brand.name,
            }));
            
            // Always include currently selected brands in the options
            setBrandOptions(prev => {
              const currentSelectedIds = watchedBrandIds || [];
              const selectedOptions = currentSelectedIds.map(id => {
                const existingOption = prev.find(opt => opt.value === id);
                return existingOption || { value: id, label: `Brand ${id}` };
              });
              
              // Merge selected options with new options, avoiding duplicates
              const mergedOptions = [...selectedOptions];
              options.forEach(newOption => {
                if (!mergedOptions.some(opt => opt.value === newOption.value)) {
                  mergedOptions.push(newOption);
                }
              });
              
              return mergedOptions;
            });
          } else {
            // Even when no search results, keep currently selected options
            setBrandOptions(prev => {
              const currentSelectedIds = watchedBrandIds || [];
              return prev.filter(option => currentSelectedIds.includes(Number(option.value)));
            });
          }
        } catch (error) {
          console.error("Error fetching brands:", error);
          // Keep currently selected options even on error
          setBrandOptions(prev => {
            const currentSelectedIds = watchedBrandIds || [];
            return prev.filter(option => currentSelectedIds.includes(Number(option.value)));
          });
        } finally {
          // Always set loading to false
          setBrandLoading(false);
        }
      }, 400),
    [watchedBrandIds]
  );

  // Fetch linked products based on search query (only published and not deleted)
  const fetchLinkedProducts = useMemo(
    () =>
      debounce(async (query: string) => {
        try {
          setLinkedProductLoading(true);
          setLinkedProductError("");
          
          // Filter for published and not deleted products, exclude current product if editing
          const params: any = {
            keyword: query,
            status: "published",
            deleted: false,
            limit: 1000
          };
          
          // Exclude current product from linked products to avoid circular references
          if (productId) {
            params.exclude_ids = [productId];
          }
          
          const response = await listProducts(params);
          
          if (response?.data?.products && response.data.products.length > 0) {
            // Filter out deleted products, only include published ones, and exclude current product
            const validProducts = response.data.products.filter((product: any) => 
              product.status === "published" && 
              !product.deletedAt &&
              product.id !== productId
            );
            
            // Deduplicate products based on ID
            const uniqueProducts = deduplicateById(validProducts);
            
            // Sort intelligently based on search query
            let sortedProducts = [...uniqueProducts];
            if (query && query.length >= 1) {
              sortedProducts = sortSearchResults(sortedProducts, query, 'name');
            }
            
            // Map the products from the API response
            const options = sortedProducts.map((product: any) => ({
              value: product.id,
              label: product.name,
            }));
            
            // Always include currently selected products in the options
            setLinkedProductOptions(prev => {
              const currentSelectedIds = watchedLinkedProductIds || [];
              const selectedOptions = currentSelectedIds.map(id => {
                // Skip if it's the current product
                if (id === productId) return null;
                const existingOption = prev.find(opt => opt.value === id);
                return existingOption || { value: id, label: `Product ${id}` };
              }).filter((opt): opt is Option => opt !== null);
              
              // Merge selected options with new options, avoiding duplicates
              const mergedOptions = [...selectedOptions];
              options.forEach(newOption => {
                // Don't add current product
                if (newOption.value !== productId && !mergedOptions.some(opt => opt.value === newOption.value)) {
                  mergedOptions.push(newOption);
                }
              });
              
              return mergedOptions;
            });
          } else {
            // Even when no search results, keep currently selected options (excluding current product)
            setLinkedProductOptions(prev => {
              const currentSelectedIds = watchedLinkedProductIds || [];
              return prev.filter(option => 
                currentSelectedIds.includes(Number(option.value)) && 
                option.value !== productId
              );
            });
          }
        } catch (error) {
          console.error("Error fetching linked products:", error);
          // Keep currently selected options even on error (excluding current product)
          setLinkedProductOptions(prev => {
            const currentSelectedIds = watchedLinkedProductIds || [];
            return prev.filter(option => 
              currentSelectedIds.includes(Number(option.value)) && 
              option.value !== productId
            );
          });
        } finally {
          setLinkedProductLoading(false);
        }
      }, 400),
    [watchedLinkedProductIds, productId]
  );

  // Fetch selected category, brand, and linked products on edit
  const fetchSelectedOptions = async (category_id: number[], brand_id: number[], linked_product_id: number[]) => {
    if (category_id?.length > 0) {
      try {
        const response = await listProductCategory({ 
          ids: category_id, 
          search_only_name: true 
        });
        
        if (response?.data?.categories && response.data.categories.length > 0) {
          const categoryNames = response.data.categories.map(cat => cat.name);
          setSelectedCategoryNames(categoryNames);
          
          // Add to options if not already present
          setCategoryOptions(prev => {
            const newOptions = [...prev];
            response.data.categories.forEach(category => {
              if (!newOptions.some(option => option.value === category.id)) {
                newOptions.push({ value: category.id, label: category.name });
              }
            });
            return newOptions;
          });
        }
      } catch (error) {
        console.error("Error fetching selected category:", error);
        showSnackbar("Failed to load category details", "error");
      }
    }
    
    if (brand_id?.length > 0) {
      try {
        const response = await listProductBrand({ 
          ids: brand_id, 
          search_only_name: true 
        });
        
        if (response?.data?.brands && response.data.brands.length > 0) {
          const brandNames = response.data.brands.map(brand => brand.name);
          setSelectedBrandNames(brandNames);
          
          // Add to options if not already present
          setBrandOptions(prev => {
            const newOptions = [...prev];
            response.data.brands.forEach(brand => {
              if (!newOptions.some(option => option.value === brand.id)) {
                newOptions.push({ value: brand.id, label: brand.name });
              }
            });
            return newOptions;
          });
        }
      } catch (error) {
        console.error("Error fetching selected brand:", error);
        showSnackbar("Failed to load brand details", "error");
      }
    }

    if (linked_product_id?.length > 0) {
      try {
        const response = await listProducts({ 
          ids: linked_product_id,
          status: "published",
          deleted: false
        });
        
        if (response?.data?.products && response.data.products.length > 0) {
          // Filter for published and not deleted products
          const validProducts = response.data.products.filter((product: any) => 
            product.status === "published" && !product.deletedAt
          );
          
          // Add to options if not already present
          setLinkedProductOptions(prev => {
            const newOptions = [...prev];
            validProducts.forEach((product: any) => {
              if (!newOptions.some(option => option.value === product.id)) {
                newOptions.push({ value: product.id, label: product.name });
              }
            });
            return newOptions;
          });
        }
      } catch (error) {
        console.error("Error fetching selected linked products:", error);
        showSnackbar("Failed to load linked product details", "error");
      }
    }
  };

  // Fetch product data when component mounts or productId changes
  useEffect(() => {
    const fetchProductData = async () => {
      const urlProductId = searchParams ? searchParams.get("productId") : null;
      const finalProductId = urlProductId || localStorage.getItem("productId");

      if (finalProductId && finalProductId !== "new") {
        try {
          setProductId(Number(finalProductId));
          const response = await getProduct(Number(finalProductId));
          if (response?.data) {
            const productData = response.data;

            // Update form with fetched data
                         setValue("name", productData.name || "");
             setValue("slug", productData.slug || "");
             setValue("sku", productData.sku || "");
             setValue("description", productData.description || "");
             setValue("key_highlights", productData.key_highlights || "");
             setValue("category_ids", productData.Categories?.map(c => c.id) || []);
             setValue("brand_ids", productData.Brands?.map(b => b.id) || []);
             setValue("linked_product_ids", productData.LinkedProducts?.map(p => p.id) || []);
             setValue("is_new", productData.is_new ?? true);
             setValue("is_discontinued", productData.is_discontinued ?? false);

            // Fetch selected category, brand, and linked product details
            await fetchSelectedOptions(
              productData.Categories?.map(c => c.id) || [],
              productData.Brands?.map(b => b.id) || [],
              productData.LinkedProducts?.map(p => p.id) || []
            );

                         // Update form context
            // Extract redirect URL from either the new `redirect` object (preferred)
            // or the legacy `redirect_url` string field.
            const extractedRedirectUrl = productData?.redirect?.redirect_url ?? productData?.redirect_url ?? "";

            updateFormData({
               name: productData.name || "",
               slug: productData.slug || "",
               sku: productData.sku || "",
               description: productData.description || "",
               key_highlights: productData.key_highlights || "",
               category_ids: productData.Categories?.map(c => c.id) || [],
               brand_ids: productData.Brands?.map(b => b.id) || [],
               linked_product_ids: productData.LinkedProducts?.map(p => p.id) || [],
               is_new: productData.is_new ?? true,
               is_discontinued: productData.is_discontinued ?? false,
               productId: Number(finalProductId),
               deletedAt: productData.deletedAt ?? null,
              redirect_url: extractedRedirectUrl,
             });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          // showSnackbar("Failed to load product details", "error");
        }
      } else {
        // Clear productId if we're creating a new product
        setProductId(null);
        localStorage.removeItem("productId");
      }
    };

    fetchProductData();
  }, [searchParams, setValue]);

     const onSubmit = async (data: FormData) => {
     setIsLoading(true);
     try {
   
       // Validate required fields
       if (!data.name || !data.slug || data.category_ids.length === 0 || data.brand_ids.length === 0) {
         throw new Error("Please fill in all required fields");
       }

       const redirectUrlValue = (formData.redirect_url ?? "").trim();
       if (formData.deletedAt && redirectUrlValue) {
         const parsed = redirectUrlSchema.safeParse(redirectUrlValue);
         if (!parsed.success) {
           setRedirectUrlError(parsed.error.errors[0]?.message ?? "Invalid URL format");
           setIsLoading(false);
           return;
         }
       }

       // Format the data according to the API requirements
       const productData: CreateProductData = {
         name: data.name.trim(),
         slug: data.slug.trim(),
         ...(data.sku && { sku: data.sku.trim() }),
         description: data.description || "",
         key_highlights: data.key_highlights || "",
         category_ids: data.category_ids,
         brand_ids: data.brand_ids,
         linked_product_ids: data.linked_product_ids || [],
         is_new: Boolean(data.is_new),
         is_discontinued: Boolean(data.is_discontinued),
         ...(formData.deletedAt && { redirect_url: (formData.redirect_url ?? "").trim() || undefined }),
       };


      // Check if we have a valid token
      const token = getAuthToken();

      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      let response;
      if (isEditMode) {
        // Update existing product
        response = await updateProduct(Number(productId), productData);
        showSnackbar("Product updated successfully", "success");

        // Update form data and stay on the same page
        updateFormData({
          ...data,
          productId: Number(productId),
          hasErrors: false,
        });
      } else {
        // Create new product
        response = await createProduct(productData);
        showSnackbar("Product created successfully", "success");

        // Update form data and move to next step
        updateFormData({
          ...data,
          productId: response.data.id,
          hasErrors: false,
        });

        // Update URL with the new product ID
        router.push(`/apps/product/edit?productId=${response.data.id}`);

        // Move to next step only for new products
        nextStep();
      }


      if (!response?.data?.id) {
        throw new Error("Failed to save product: No ID returned");
      }

    } catch (error: any) {
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

  // Helper function to deduplicate items by ID
  const deduplicateById = (items) => {
    const uniqueMap = new Map();
    items.forEach(item => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    return Array.from(uniqueMap.values());
  };
  
  // Helper function to sort search results intelligently
  const sortSearchResults = (items, query, field) => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase();
    
    // First, filter out results that don't match at all if we have a meaningful query
    let filteredItems = items;
    if (lowerQuery.length >= 2) {
      const matchingItems = items.filter(item => 
        item[field].toLowerCase().includes(lowerQuery)
      );
      
      // Only use filtered items if we have results, otherwise fall back to all items
      if (matchingItems.length > 0) {
        filteredItems = matchingItems;
      }
    }
    
    return filteredItems.sort((a, b) => {
      const aName = a[field].toLowerCase();
      const bName = b[field].toLowerCase();
      
      // 1. Exact matches first
      if (aName === lowerQuery && bName !== lowerQuery) return -1;
      if (bName === lowerQuery && aName !== lowerQuery) return 1;
      
      // 2. Starts with matches second
      if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
      if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
      
      // 3. Contains matches third
      const aContainsIndex = aName.indexOf(lowerQuery);
      const bContainsIndex = bName.indexOf(lowerQuery);
      
      if (aContainsIndex >= 0 && bContainsIndex < 0) return -1;
      if (bContainsIndex >= 0 && aContainsIndex < 0) return 1;
      
      // 4. If both contain, sort by position of match (earlier matches first)
      if (aContainsIndex >= 0 && bContainsIndex >= 0) {
        if (aContainsIndex !== bContainsIndex) {
          return aContainsIndex - bContainsIndex;
        }
      }
      
      // 5. Alphabetical order for equal match quality
      return aName.localeCompare(bName);
    });
  };

  const handleCategoryCreated = (newCategory: { id: number; name: string }) => {
    // Add to options if not already present to avoid duplicates from subsequent full fetch
    setCategoryOptions(prev => {
      if (!prev.some(option => option.value === newCategory.id)) {
        return [...prev, { value: newCategory.id, label: newCategory.name }];
      }
      return prev;
    });
    setIsCategoryModalOpen(false);
    fetchCategories(""); 
  };

  const handleBrandCreated = (newBrand: { id: number; name: string }) => {
    setBrandOptions(prev => {
      if (!prev.some(option => option.value === newBrand.id)) {
        return [...prev, { value: newBrand.id, label: newBrand.name }];
      }
      return prev;
    });
    setIsBrandModalOpen(false);
    fetchBrands("");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex max-w-5xl flex-col justify-center"
      onKeyDown={(e) => {
        // Prevent form submission on Enter key unless it's inside a button
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).tagName !== "BUTTON"
        ) {
          e.preventDefault();
          return false;
        }
      }}
    >
      <Grid container spacing={3}>
      
        <Grid item xs={12} md={6}>
          <FormInputField
            name="name"
            control={control}
            label="Name"
            type="text"
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            <FormInputField
              name="slug"
              control={control}
              label="Slug"
              type="text"
              required
            />
            <MuiBox sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <MuiBox sx={{ flex: 1 }}>
                <FormInputField
                  name="sku"
                  control={control}
                  label="SKU"
                  type="text"
                />
              </MuiBox>
              <MuiButton 
                variant="outlined" 
                onClick={() => {
                  const currentSlug = getValues("slug");
                  if (currentSlug) {
                    setValue("sku", currentSlug, { shouldValidate: true });
                    showSnackbar("SKU filled with slug value", "success");
                  } else {
                    showSnackbar("Please enter a slug first", "warning");
                  }
                }}
                sx={{ 
                  // mt: '8px',
                  height: '40px',
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  px: 2,
                  borderColor: '#247c5c',
                  color: '#247c5c',
                  '&:hover': {
                    borderColor: '#1a5c43',
                    backgroundColor: 'rgba(36, 124, 92, 0.04)',
                  }
                }}
              >
                Same as slug
              </MuiButton>
            </MuiBox>
          </Stack>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormMultiSelectWithMapping
              name="category_ids"
              control={control}
              label="Category"
              options={categoryOptions}
              error={!!errors.category_ids}
              errorMessage={categoryError || errors.category_ids?.message?.toString()}
              onInputChange={(query) => {
                setCategorySearchInput(query);
                fetchCategories(query);
              }}
              loading={categoryLoading}
              placeholder="Search for a category..."
              searchTerm={categorySearchInput}
            />
            <MuiButton 
              variant="text" 
              size="small" 
              onClick={() => setIsCategoryModalOpen(true)}
              sx={{ alignSelf: 'flex-start', mt: -0.5, textTransform: 'none', color: '#247c5c' }}
            >
              + Add New Category
            </MuiButton>
          </MuiBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormMultiSelectWithMapping
              name="brand_ids"
              control={control}
              label="Brand"
              options={brandOptions}
              error={!!errors.brand_ids}
              errorMessage={brandError || errors.brand_ids?.message?.toString()}
              onInputChange={(query) => {
                setBrandSearchInput(query);
                fetchBrands(query);
              }}
              loading={brandLoading}
              placeholder="Search for a brand..."
              searchTerm={brandSearchInput}
            />
            <MuiButton 
              variant="text" 
              size="small" 
              onClick={() => setIsBrandModalOpen(true)}
              sx={{ alignSelf: 'flex-start', mt: -0.5, textTransform: 'none', color: '#247c5c' }}
            >
              + Add New Brand
            </MuiButton>
          </MuiBox>
        </Grid>
        
        <Grid item xs={12}>
          <FormCKEditor
            name="description"
            control={control}
            label="Description"
            defaultValue={formData.description || ""}
          />
        </Grid>
        
        {/* <Grid item xs={12}>
          <FormInputField
            name="key_highlights"
            control={control}
            label="Key Highlights"
            type="text"
            multiline
            rows={4}
          />
        </Grid> */}
          {formData.deletedAt && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Redirect URL (Optional)"
              placeholder="https://example.com"
              value={formData.redirect_url ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                updateFormData({ redirect_url: value });
                const trimmed = value.trim();
                if (!trimmed) {
                  setRedirectUrlError("");
                } else {
                  const parsed = redirectUrlSchema.safeParse(trimmed);
                  setRedirectUrlError(parsed.success ? "" : (parsed.error.errors[0]?.message ?? "Invalid URL format"));
                }
              }}
              size="small"
              error={!!redirectUrlError}
              helperText={redirectUrlError || "Leave empty to remove redirect. Enter a valid URL (e.g. https://example.com)."}
              sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "white" } }}
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <FormCheckboxField
            name="is_discontinued"
            control={control}
            label="Discontinued (permanently out of stock)"
          />
        </Grid>

        <Grid item xs={12}>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormMultiSelectWithMapping
              name="linked_product_ids"
              control={control}
              label="Linked Products"
              options={linkedProductOptions}
              error={!!errors.linked_product_ids}
              errorMessage={linkedProductError || errors.linked_product_ids?.message?.toString()}
              onInputChange={(query) => {
                setLinkedProductSearchInput(query);
                fetchLinkedProducts(query);
              }}
              loading={linkedProductLoading}
              placeholder="Search for a product..."
              searchTerm={linkedProductSearchInput}
            />
          </MuiBox>
        </Grid>
        
        <Grid item xs={12} sx={{ mt: 2 }}>
          <AppButton
            label={isEditMode ? "Update" : "Next"}
            loading={isLoading}
            type="submit"
            fullWidth
            size="large"
            disabled={!isValid || isLoading}
          />
        </Grid>
      </Grid>
      <AddNewCategoryModal
        open={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
      <AddNewBrandModal
        open={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onBrandCreated={handleBrandCreated}
      />
    </form>
  );
}

export default BasicInfoTab;
