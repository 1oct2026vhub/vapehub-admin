"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ProductFormData {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  category_id: number;
  brand_id: number;
  is_new: boolean;

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

  // Product ID after creation
  productId?: number;

  // Form state
  currentStep: number;
  isSubmitting: boolean;
  hasErrors: boolean;
  completedSteps: number[];
  attributesResponse?: any; // API response from attributes endpoint
}

interface ProductFormContextType {
  formData: ProductFormData;
  updateFormData: (data: Partial<ProductFormData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  setCurrentStep: (step: number) => void;
  isStepCompleted: (step: number) => boolean;
  markStepAsCompleted: (step: number) => void;
}

const initialFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  category_id: 0,
  brand_id: 0,
  is_new: true,

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

  const updateFormData = (data: Partial<ProductFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const isStepCompleted = (step: number) => {
    return formData.completedSteps.includes(step);
  };

  const nextStep = () => {
    if (formData.currentStep < 3) {
      // Now 4 steps (0, 1, 2, 3)
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
