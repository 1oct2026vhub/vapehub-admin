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
} from "@/services/apiProduct";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useCallback, useMemo } from "react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { useProductForm } from "../ProductFormContext";
import { getAuthToken } from "@/utils/auth";
import FormSearchableSelectField from "@/components/Shared/FormSearchableSelectField";
import FormCKEditor from "@/components/Shared/FormCKEditor";
import debounce from 'lodash/debounce';
import { Grid, Stack, Button as MuiButton, Box as MuiBox } from "@mui/material";
import AddNewCategoryModal from "../components/AddNewCategoryModal";
import AddNewBrandModal from "../components/AddNewBrandModal";

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional().default(""),
  category_id: z
    .any()
    .refine((val) => val && Number(val) > 0, {
      message: "Category is required",
    })
    .transform((val) => Number(val)),
  brand_id: z
    .any()
    .refine((val) => val && Number(val) > 0, {
      message: "Brand is required",
    })
    .transform((val) => Number(val)),
  is_new: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface Option {
  value: number | string;
  label: string;
}

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

  const [brandLoading, setBrandLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState<Option[]>([]);
  const [brandError, setBrandError] = useState("");
  const [brandSearchInput, setBrandSearchInput] = useState("");

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
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      name: formData.name || "",
      slug: formData.slug || "",
      description: formData.description || "",
      category_id: formData.category_id || 0,
      brand_id: formData.brand_id || 0,
      // is_new: formData.is_new ?? true,
    },
    resolver: zodResolver(schema),
  });

  // Fetch initial category and brand options
  useEffect(() => {
    fetchCategories("");
    fetchBrands("");
  }, []);

  // Fetch categories based on search query
  const fetchCategories = useMemo(
    () =>
      debounce(async (query: string) => {
        // Only search if query is empty or has at least 2 chars
        if (query.length === 0 || query.length >= 2) {
          try {
            setCategoryLoading(query.length > 0);
            setCategoryError("");
            
            // Use same parameters as in ProductListTable
            const response = await listProductCategory({
              search: query,
              search_only_name: true,
              limit: 1000
            });
            
            if (response?.data?.categories) {
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
              
              setCategoryOptions(options);
            } else {
              setCategoryOptions([]);
            }
          } catch (error) {
            console.error("Error fetching categories:", error);
            setCategoryOptions([]);
          }
        }
      }, 400),
    []
  );

  // Fetch brands based on search query
  const fetchBrands = useMemo(
    () =>
      debounce(async (query: string) => {
        // Only search if query is empty or has at least 2 chars
        if (query.length === 0 || query.length >= 2) {
          try {
            setBrandLoading(query.length > 0);
            setBrandError("");
            
            // Use same parameters as in ProductListTable
            const response = await listProductBrand({
              search: query,
              search_only_name: true,
              limit: 1000
            });
            
            if (response?.data?.brands) {
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
              
              setBrandOptions(options);
            } else {
              setBrandOptions([]);
            }
          } catch (error) {
            console.error("Error fetching brands:", error);
            setBrandOptions([]);
          }
        }
      }, 400),
    []
  );

  // Fetch selected category and brand on edit
  const fetchSelectedOptions = async (categoryId: number, brandId: number) => {
    if (categoryId > 0) {
      try {
        const response = await listProductCategory({ 
          id: categoryId, 
          search_only_name: true 
        });
        
        if (response?.data?.categories && response.data.categories.length > 0) {
          const category = response.data.categories[0];
          // Add to options if not already present
          setCategoryOptions(prev => {
            // First check if this category is already in the options
            if (!prev.some(option => option.value === category.id)) {
              return [...prev, { value: category.id, label: category.name }];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error fetching selected category:", error);
        showSnackbar("Failed to load category details", "error");
      }
    }
    
    if (brandId > 0) {
      try {
        const response = await listProductBrand({ 
          id: brandId, 
          search_only_name: true 
        });
        
        if (response?.data?.brands && response.data.brands.length > 0) {
          const brand = response.data.brands[0];
          // Add to options if not already present
          setBrandOptions(prev => {
            // First check if this brand is already in the options
            if (!prev.some(option => option.value === brand.id)) {
              return [...prev, { value: brand.id, label: brand.name }];
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error fetching selected brand:", error);
        showSnackbar("Failed to load brand details", "error");
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
          console.log("Product data received:", response?.data);

          if (response?.data) {
            const productData = response.data;

            // Update form with fetched data
            setValue("name", productData.name || "");
            setValue("slug", productData.slug || "");
            setValue("description", productData.description || "");
            setValue("category_id", productData.category_id || 0);
            setValue("brand_id", productData.brand_id || 0);
            setValue("is_new", productData.is_new ?? true);

            // Fetch selected category and brand details
            await fetchSelectedOptions(productData.category_id, productData.brand_id);

            // Update form context
            updateFormData({
              name: productData.name || "",
              slug: productData.slug || "",
              description: productData.description || "",
              category_id: productData.category_id || 0,
              brand_id: productData.brand_id || 0,
              is_new: productData.is_new ?? true,
              productId: Number(finalProductId),
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
      console.log("Starting product creation/update process...");
      console.log("Form data to be submitted:", data);

      // Validate required fields
      if (!data.name || !data.slug || !data.category_id || !data.brand_id) {
        throw new Error("Please fill in all required fields");
      }

      // Format the data according to the API requirements
      const productData: CreateProductData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description || "",
        category_id: Number(data.category_id),
        brand_id: Number(data.brand_id),
        is_new: Boolean(data.is_new),
      };

      console.log("Formatted product data:", productData);

      // Check if we have a valid token
      const token = getAuthToken();
      console.log("Auth token present:", !!token);

      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      let response;
      if (isEditMode) {
        // Update existing product
        console.log("Updating existing product with ID:", productId);
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
        console.log("Creating new product");
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

      console.log("API response:", response);

      if (!response?.data?.id) {
        throw new Error("Failed to save product: No ID returned");
      }

      console.log("Product saved successfully with ID:", response.data.id);
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
      className="flex max-w-5xl flex-col justify-center"
      onKeyDown={(e) => {
        // Prevent form submission on Enter key unless it's inside a button
        if (
          e.key === "Enter" &&
          (e.target as HTMLElement).tagName !== "BUTTON"
        ) {
          console.log("Preventing form submission from Enter key");
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
          <FormInputField
            name="slug"
            control={control}
            label="Slug"
            type="text"
            required
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormSearchableSelectField
              name="category_id"
              control={control}
              label="Category"
              options={categoryOptions}
              loading={false}
              errorMessage={categoryError || errors.category_id?.message?.toString()}
              onInputChange={(query) => {
                setCategorySearchInput(query);
                fetchCategories(query);
              }}
              searchTerm={categorySearchInput}
              required
              loadingText="Searching categories..."
              noOptionsText={
                categorySearchInput.length < 2 && categorySearchInput.length > 0
                  ? "Please enter at least 2 characters"
                  : categoryOptions.length === 0 
                    ? "No categories found" 
                    : "No matching categories"
              }
              placeholder="Search for a category..."
            />
            <MuiButton 
              variant="text" 
              size="small" 
              onClick={() => setIsCategoryModalOpen(true)}
              sx={{ alignSelf: 'flex-start', mt: -0.5, textTransform: 'none' }}
            >
              + Add New Category
            </MuiButton>
          </MuiBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormSearchableSelectField
              name="brand_id"
              control={control}
              label="Brand"
              options={brandOptions}
              loading={false}
              errorMessage={brandError || errors.brand_id?.message?.toString()}
              onInputChange={(query) => {
                setBrandSearchInput(query);
                fetchBrands(query);
              }}
              searchTerm={brandSearchInput}
              required
              loadingText="Searching brands..."
              noOptionsText={
                brandSearchInput.length < 2 && brandSearchInput.length > 0
                  ? "Please enter at least 2 characters"
                  : brandOptions.length === 0 
                    ? "No brands found" 
                    : "No matching brands"
              }
              placeholder="Search for a brand..."
            />
            <MuiButton 
              variant="text" 
              size="small" 
              onClick={() => setIsBrandModalOpen(true)}
              sx={{ alignSelf: 'flex-start', mt: -0.5, textTransform: 'none' }}
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
