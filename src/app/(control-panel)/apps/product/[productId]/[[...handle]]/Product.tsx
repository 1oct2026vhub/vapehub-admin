"use client";

import { useEffect } from "react";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import FuseTabs from "src/components/tabs/FuseTabs";
import FuseTab from "src/components/tabs/FuseTab";
import ProductHeader from "./ProductHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import ProductImagesTab from "./tabs/ProductImagesTab";
import AttributesTab from "./tabs/AttributesTab";
import { ProductFormProvider, useProductForm } from "./ProductFormContext";
import { useParams, useSearchParams } from "next/navigation";
import VariantManager from "./tabs/VariantManager";
import FaqAccordion from "../../../faq/FaqAccordion";
import SeoTab from "./tabs/SeoTab";
import DealsTab from "./tabs/DealsTab";

const steps = ["basic-info", "product-images", "attributes", "variants", "faq", "deals", "seo"];

function resolveProductId(
  routeProductId: string | undefined,
  queryProductId: string | null
): number | null {
  // Edit URLs are `/apps/product/edit?productId=123` — numeric ID lives in the query.
  // Create URLs may use `/apps/product/new` or a numeric path segment.
  const candidates = [queryProductId, routeProductId].filter(
    (value): value is string => Boolean(value) && value !== "new" && value !== "edit"
  );

  for (const candidate of candidates) {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function ProductContent() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const { formData, setCurrentStep, isStepCompleted, updateFormData } = useProductForm();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeProductId = params?.productId as string | undefined;
  const productId = resolveProductId(
    routeProductId,
    searchParams ? searchParams.get("productId") : null
  );

  const handleTabChange = (event: React.SyntheticEvent, value: string) => {
    const stepIndex = steps.indexOf(value);
    setCurrentStep(stepIndex);
  };

  // Seed productId early for tabs that depend on form context.
  // Full product details are loaded by BasicInfoTab with the correct field mapping.
  useEffect(() => {
    if (productId && formData.productId !== productId) {
      updateFormData({ productId });
    }
  }, [productId, formData.productId, updateFormData]);
  return (
    // <FusePageCarded
    // className="bg-white"
    //   header={<ProductHeader />}
    //   content={
        <div className="p-4 sm:p-10 space-y-6">
        <ProductHeader />
        <div>
          <FuseTabs
            value={steps[formData.currentStep]}
            onChange={handleTabChange}
          >
            <FuseTab
              value="basic-info"
              label="Basic Info"
              className={isStepCompleted(0) ? "text-primary" : ""}
            />
            <FuseTab
              value="product-images"
              label="Product Images"
              className={isStepCompleted(1) ? "text-primary" : ""}
            />
            <FuseTab
              value="attributes"
              label="Attributes"
              className={isStepCompleted(2) ? "text-primary" : ""}
            />
            <FuseTab
              value="variants"
              label="Variants"
              className={isStepCompleted(3) ? "text-primary" : ""}
            />
            <FuseTab
              value="faq"
              label="FAQ"
              className={isStepCompleted(4) ? "text-primary" : ""} // Assuming step 4 is FAQ
            />
            <FuseTab
              value="deals"
              label="Deals"
              className={isStepCompleted(5) ? "text-primary" : ""}
            />
            <FuseTab
              value="seo"
              label="SEO"
              className={isStepCompleted(6) ? "text-primary" : ""}
            />
          </FuseTabs>
          <div className="mt-4">
            <div className={formData.currentStep !== 0 ? "hidden" : ""}>
              <BasicInfoTab />
            </div>
            <div className={formData.currentStep !== 1 ? "hidden" : ""}>
              <ProductImagesTab />
            </div>
            <div className={formData.currentStep !== 2 ? "hidden" : ""}>
              <AttributesTab />
            </div>
            <div className={formData.currentStep !== 3 ? "hidden" : ""}>
              <VariantManager isActive={formData.currentStep === 3} />
              {/* <VariantTab /> */}
            </div>
            <div className={formData.currentStep !== 4 ? "hidden" : ""}>
              {/* <FaqAccordion productId={formData.productId} entityType="product" /> */}
              {/* <FaqTab /> You will replace this with your actual FaqTab component */}
              {/* <Typography>FAQ Content Goes Here</Typography>  */}
              <FaqAccordion entityId={formData.productId} entityType="product" />
            </div>
            <div className={formData.currentStep !== 5 ? "hidden" : ""}>
              <DealsTab />
            </div>
            <div className={formData.currentStep !== 6 ? "hidden" : ""}>
              <SeoTab />
            </div>
          </div>
        </div>
        </div>
    //   }
    //   scroll={isMobile ? "normal" : "content"}
    // />
  );
}

function Product() {
  return (
    <ProductFormProvider>
      <ProductContent />
    </ProductFormProvider>
  );
}

export default Product;
