"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useForm, Control } from "react-hook-form";

export interface ProductFormData {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  key_highlights?: string;
  category_ids: number[];
  brand_ids: number[];
  linked_product_ids?: number[];
  related_blog_ids?: number[];
  is_new: boolean;
  is_discontinued: boolean;
  is_coming_soon: boolean;

  // Pricing Info
  price: string;
  discount_price: string;
  cost_price: string;
  tax_rate: string;

  // Inventory Info
  sku: string;
  stock_quantity: string;
  stock_status: "in_stock" | "out_of_stock" | "low_stock";

  // Attributes
  attributes: Array<{
    attribute_id: number;
    term_ids: number[];
    is_visible_page: boolean;
    used_in_variation: boolean;
  }>;

  // Variants
  variants?: Array<{
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

  // Product ID after creation
  productId?: number;

  // Deleted product redirect (only for deleted products)
  deletedAt?: string | null;
  redirect_url?: string;

  // Form state
  currentStep: number;
  isSubmitting: boolean;
  hasErrors: boolean;
  completedSteps: number[];
  attributesResponse?: any; // API response from attributes endpoint

  productImages?: Array<{
    id: number;
    url: string;
    is_primary: boolean;
  }>;
}

interface ProductFormContextType {
  formData: ProductFormData;
  updateFormData: (data: Partial<ProductFormData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setCurrentStep: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  markStepAsCompleted: (step: number) => void;
  control: Control<ProductFormData>;
  handleSubmit: any;
}

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  key_highlights: "",
  category_ids: [],
  brand_ids: [],
  linked_product_ids: [],
  related_blog_ids: [],
  is_new: true,
  is_discontinued: false,
  is_coming_soon: false,

  price: "",
  discount_price: "",
  cost_price: "",
  tax_rate: "",

  sku: "",
  stock_quantity: "",
  stock_status: "in_stock",

  attributes: [],
  variants: [],

  currentStep: 0,
  isSubmitting: false,
  hasErrors: false,
  completedSteps: [],
};

const ProductFormContext = createContext<ProductFormContextType | undefined>(
  undefined,
);

export function ProductFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const { control, watch, reset, handleSubmit } = useForm<ProductFormData>({
    defaultValues: initialFormData,
    mode: "onChange",
  });

  const updateFormData = useCallback((data: Partial<ProductFormData>) => {
    setFormData((prev) => {
        const newFormData = { ...prev, ...data };
        reset(newFormData);
        return newFormData;
    });
  }, [reset]);

  const isStepCompleted = (step: number) => {
    return formData.completedSteps.includes(step);
  };

  const nextStep = () => {
    if (formData.currentStep < 5) {
      // Now 6 steps (0, 1, 2, 3, 4, 5)
      markStepAsCompleted(formData.currentStep);
      setFormData((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const previousStep = () => {
    if (formData.currentStep > 0) {
      setFormData((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const setCurrentStep = (step: number) => {
    setFormData((prev) => ({ ...prev, currentStep: step }));
  };

  const markStepAsCompleted = (step: number) => {
    setFormData((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, step])],
    }));
  };

  return (
    <ProductFormContext.Provider
      value={{
        formData,
        updateFormData,
        nextStep,
        previousStep,
        setCurrentStep,
        isStepCompleted,
        markStepAsCompleted,
        control,
        handleSubmit,
      }}
    >
      {children}
    </ProductFormContext.Provider>
  );
}

export function useProductForm() {
  const context = useContext(ProductFormContext);
  if (!context) {
    throw new Error("useProductForm must be used within a ProductFormProvider");
  }
  return context;
}
