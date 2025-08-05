"use client";

import FusePageCarded from "@fuse/core/FusePageCarded";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import FuseTabs from "src/components/tabs/FuseTabs";
import FuseTab from "src/components/tabs/FuseTab";
import ProductHeader from "./ProductHeader";
import BasicInfoTab from "./tabs/BasicInfoTab";
import ProductImagesTab from "./tabs/ProductImagesTab";
import AttributesTab from "./tabs/AttributesTab";
// import PricingTab from "./tabs/PricingTab";
import { ProductFormProvider, useProductForm } from "./ProductFormContext";
// import VariantTab from "./tabs/VariantTab";
import { useParams } from "next/navigation";
import { getProduct } from "@/services/apiProduct";
import { useSnackbar } from "@/contexts/SnackbarContext";
import VariantManager from "./tabs/VariantManager";
import FaqAccordion from "../../../faq/FaqAccordion";
import SeoTab from "./tabs/SeoTab";
import DealsTab from "./tabs/DealsTab";
// import FaqTab from "./tabs/FaqTab"; // You will need to create and import this later

const steps = ["basic-info", "product-images", "attributes", "variants", "faq", "deals", "seo"];

function ProductContent() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));
  const { formData, setCurrentStep, isStepCompleted, updateFormData } = useProductForm();
  const params = useParams();
  const { showSnackbar } = useSnackbar();
  const productId = params?.productId as string;

  const handleTabChange = (event: React.SyntheticEvent, value: string) => {
    const stepIndex = steps.indexOf(value);
    setCurrentStep(stepIndex);
  };

  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProductData = async () => {
      if (productId && productId !== "new") {
        try {
          const response = await getProduct(Number(productId));
          const productData = response.data;
          // Update form data with fetched product information
          updateFormData({
            name: productData.name,
            slug: productData.slug,
            description: productData.description,
            category_ids: productData.category_id,
            brand_ids: productData.brand_id,
            is_new: productData.is_new,
            productId: Number(productId),
            // Add other fields as needed
          });
        } catch (error) {
          console.error("Error fetching product:", error);
          // showSnackbar("Failed to load product data", "error");
        }
      }
    };

    fetchProductData();
  }, [productId]);
  console.log("productId", productId);
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
