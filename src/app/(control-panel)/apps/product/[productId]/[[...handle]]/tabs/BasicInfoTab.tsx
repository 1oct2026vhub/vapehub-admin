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
import FormMultiTextField from '@/components/Shared/FormMultiTextField';

const schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must not exceed 50 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(200, "Slug must be at most 200 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"
    ),
  description: z.string().optional().default(""),
  category_id: z.array(z.number()).optional(),
  category_id_display: z.array(z.string()).min(1, "At least one category is required"),
  brand_id: z.array(z.number()).optional(),
  brand_id_display: z.array(z.string()).min(1, "At least one brand is required"),
  is_new: z.boolean().optional(),
});

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
  required, 
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
  required: boolean;
  placeholder: string;
  searchTerm: string;
}) => {
  return (
    <FormMultiTextField
      name={`${name}_display`}
      control={control}
      label={label}
      suggestions={options.map(option => option.label)}
      error={error}
      errorMessage={errorMessage}
      onInputChange={onInputChange}
      loading={loading}
      required={required}
      placeholder={placeholder}
      helperText={searchTerm && options.length === 0 ? "No data found!" : undefined}
      noOptionsText={searchTerm && options.length === 0 ? "No data found" : undefined}
      searchTerm={searchTerm}
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
      category_id: formData.category_id || [],
      category_id_display: formData.category_id_display || [],
      brand_id: formData.brand_id || [],
      brand_id_display: formData.brand_id_display || [],
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
            
            setCategoryOptions(options);
          } else {
            // Explicitly set to empty array when no results
            setCategoryOptions([]);
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
          setCategoryOptions([]);
        } finally {
          // Always set loading to false
          setCategoryLoading(false);
        }
      }, 400),
    []
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
            
            setBrandOptions(options);
          } else {
            // Explicitly set to empty array when no results
            setBrandOptions([]);
          }
        } catch (error) {
          console.error("Error fetching brands:", error);
          setBrandOptions([]);
        } finally {
          // Always set loading to false
          setBrandLoading(false);
        }
      }, 400),
    []
  );

  // Fetch selected category and brand on edit
  const fetchSelectedOptions = async (category_id: number[], brand_id: number[]) => {
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
            setValue("description", productData.description || "");
            setValue("category_id", productData.Categories?.map(c => c.id) || []);
            setValue("brand_id", productData.Brands?.map(b => b.id) || []);
            setValue("category_id_display", productData.Categories?.map(c => c.name) || []);
            setValue("brand_id_display", productData.Brands?.map(b => b.name) || []);
            setValue("is_new", productData.is_new ?? true);

            // Fetch selected category and brand details
            await fetchSelectedOptions(productData.Categories?.map(c => c.id), productData.Brands?.map(b => b.id));

            // Update form context
            updateFormData({
              name: productData.name || "",
              slug: productData.slug || "",
              description: productData.description || "",
              category_id: productData.Categories?.map(c => c.id) || [],
              brand_id: productData.Brands?.map(b => b.id) || [],
              category_id_display: productData.Categories?.map(c => c.name) || [],
              brand_id_display: productData.Brands?.map(b => b.name) || [],
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
  
      // Get display values and convert back to IDs
      const categoryDisplayNames = data.category_id_display || [];
      const brandDisplayNames = data.brand_id_display || [];
      
      const categoryIds = categoryDisplayNames.map(name => {
        const option = categoryOptions.find(opt => opt.label === name);
        return option ? option.value : null;
      }).filter((id): id is number => id !== null);
      
      const brandIds = brandDisplayNames.map(name => {
        const option = brandOptions.find(opt => opt.label === name);
        return option ? option.value : null;
      }).filter((id): id is number => id !== null);

      // Validate required fields
      if (!data.name || !data.slug || categoryIds.length === 0 || brandIds.length === 0) {
        throw new Error("Please fill in all required fields");
      }

      // Format the data according to the API requirements
      const productData: CreateProductData = {
        name: data.name.trim(),
        slug: data.slug.trim(),
        description: data.description || "",
        category_ids: categoryIds,
        brand_ids: brandIds,
        is_new: Boolean(data.is_new),
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
            <FormMultiSelectWithMapping
              name="category_id"
              control={control}
              label="Category"
              options={categoryOptions}
              error={!!errors.category_id}
              errorMessage={categoryError || errors.category_id?.message?.toString()}
              onInputChange={(query) => {
                setCategorySearchInput(query);
                fetchCategories(query);
              }}
              loading={categoryLoading}
              required
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
              name="brand_id"
              control={control}
              label="Brand"
              options={brandOptions}
              error={!!errors.brand_id}
              errorMessage={brandError || errors.brand_id?.message?.toString()}
              onInputChange={(query) => {
                setBrandSearchInput(query);
                fetchBrands(query);
              }}
              loading={brandLoading}
              required
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
