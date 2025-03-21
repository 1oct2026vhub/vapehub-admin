"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useProductForm } from "./ProductFormContext";
import AppButton from "@/components/Shared/AppButton";
// import {
// 	EcommerceProduct,
// 	useCreateECommerceProductMutation,
// 	useDeleteECommerceProductMutation,
// 	useUpdateECommerceProductMutation
// } from '../../../ECommerceApi';

/**
 * The product header.
 */
function ProductHeader() {
  const router = useRouter();
  const { formData } = useProductForm();

  // const [createProduct] = useCreateECommerceProductMutation();
  // const [saveProduct] = useUpdateECommerceProductMutation();
  // const [removeProduct] = useDeleteECommerceProductMutation();

  // const { name, images, featuredImageId } = watch() as EcommerceProduct;

  // function handleSaveProduct() {
  // 	saveProduct(getValues() as EcommerceProduct);
  // }

  // function handleCreateProduct() {
  // 	createProduct(getValues() as EcommerceProduct)
  // 		.unwrap()
  // 		.then((data) => {
  // 			navigate(`/apps/e-commerce/products/${data.id}`);
  // 		});
  // }

  // function handleRemoveProduct() {
  // 	removeProduct(productId);
  // 	navigate('/apps/e-commerce/products');
  // }

  return (
    // <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between  px-24 md:px-32">
    // 	<div className="flex flex-col items-center sm:items-start space-y-8 mt-8">
    // 		<motion.div
    // 			initial={{ x: 20, opacity: 0 }}
    // 			animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
    // 		>
    // 			<Typography className="flex items-center sm:items-start text-4xl font-extrabold tracking-tight leading-none">
    // 				{formData.productId ? 'Edit Product' : 'New Product'}
    // 			</Typography>
    // 		</motion.div>
    // 	</div>
    // </div>
    <div className="flex grow-0 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        {/* <PageBreadcrumb className="mb-2" /> */}
        <Typography className="text-4xl font-extrabold leading-none tracking-tight">
          New product
        </Typography>
      </motion.span>
    </div>
  );
}

export default ProductHeader;
