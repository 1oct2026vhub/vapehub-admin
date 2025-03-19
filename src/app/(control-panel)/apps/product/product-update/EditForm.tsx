"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useFetch } from "@/hooks/useFetch";
import { listProductCategory } from "@/services/apiProductCategory";
import { listProductBrand } from "@/services/apiProductBrand";
import { createProduct } from "@/services/apiProduct";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import FormSelectField from "@/components/Shared/SelectField";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  price: z.string().min(0, "Price must be a positive number"),
  discount_price: z.string().min(0, "Discount price must be a positive number"),
  stock_quantity: z.string().min(0, "Stock quantity must be a positive number"),
  category_id: z.number().min(1, "Category is required"),
  brand_id: z.number().min(1, "Brand is required"),
});

const defaultValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  discount_price: "",
  stock_quantity: "",
  category_id: "",
  brand_id: "",
};

function EditForm() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const { data: categories } = useFetch(listProductCategory, [], {});
  const { data: brands } = useFetch(listProductBrand, [], {});
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    formState: { isValid, dirtyFields, errors },
    handleSubmit,
  } = useForm({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await createProduct(data);
      showSnackbar("Product created successfully", "success");
      router.push("/apps/product");
    } catch (error) {
      showSnackbar("Failed to create product", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center"
    >
      <FormInputField
        name="name"
        control={control}
        label="Name"
        type="text"
        required
      />
      <FormInputField
        name="slug"
        control={control}
        label="Slug"
        type="text"
        required
      />
      <FormInputField
        name="description"
        control={control}
        label="Description"
        type="text"
        multiline
        rows={5}
      />
      <FormInputField
        name="price"
        control={control}
        label="Price"
        type="text"
        required
      />
      <FormInputField
        name="discount_price"
        control={control}
        label="Discount Price"
        type="text"
        required
      />
      <FormInputField
        name="stock_quantity"
        control={control}
        label="Stock Quantity"
        type="text"
        required
      />
      <FormSelectField
        name="category_id"
        control={control}
        label="Category"
        options={
          categories?.map((category) => ({
            value: category.id,
            label: category.name,
          })) || [
            { value: 1, label: "Pablo" },
            { value: 2, label: "Pabloo" },
            { value: 3, label: "Pablooo" },
          ]
        }
        required
      />
      <FormSelectField
        name="brand_id"
        control={control}
        label="Brand"
        options={
          brands?.map((brand) => ({ value: brand.id, label: brand.name })) || [
            { value: 1, label: "Pablo" },
            { value: 2, label: "Pabloo" },
            { value: 3, label: "Pablooo" },
          ]
        }
        required
      />

      <AppButton
        label="Next"
        loading={isLoading}
        type="submit"
        fullWidth
        size="large"
        disabled={!isValid || isLoading}
        className="mt-4"
      />
    </form>
  );
}

export default EditForm;
