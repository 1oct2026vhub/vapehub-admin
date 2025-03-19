"use client";

import { useSnackbar } from "@/contexts/SnackbarContext";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { IconButton, Paper } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormSelectField from "@/components/Shared/SelectField";
import FormCheckboxField from "@/components/Shared/FormCheckboxField";
import { useProductForm } from "../ProductFormContext";
import { useFetch } from "@/hooks/useFetch";
import { listAttributes } from "@/services/apiAttribute";
import { listAttributeTerms } from "@/services/apiAttributeTerm";
import { addProductAttributes } from "@/services/apiProduct";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface ProductAttribute {
  attribute_id: number;
  term_ids: number[];
  is_visible_page: boolean;
  used_in_variation: boolean;
}

const attributeSchema = z.object({
  attributes: z.array(
    z.object({
      attribute_id: z.number().min(1, "Attribute is required"),
      term_ids: z.array(z.number()).min(1, "At least one term is required"),
      is_visible_page: z.boolean(),
      used_in_variation: z.boolean(),
    }),
  ),
});

type FormData = z.infer<typeof attributeSchema>;

function AttributesTab() {
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    markStepAsCompleted,
  } = useProductForm();
  const { data: attributes } = useFetch(
    ["attributeList", {}],
    listAttributes,
    {},
  );

  const {
    control,
    watch,
    setValue,
    formState: { isValid, errors },
    handleSubmit,
  } = useForm<FormData>({
    mode: "all",
    defaultValues: {
      attributes:
        formData.attributes.length > 0
          ? formData.attributes
          : [
              {
                attribute_id: "",
                term_ids: [],
                is_visible_page: true,
                used_in_variation: false,
              },
            ],
    },
    resolver: zodResolver(attributeSchema),
  });

  const { fields, append, remove } = useFieldArray({
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
            ? listAttributeTerms({ attribute_id: id })
            : Promise.resolve({ data: { terms: [] } }),
        ),
      ),
    { enabled: attributeIds.some((id) => id > 0) },
  );

  // Function to get available attributes for a specific row
  const getAvailableAttributes = (currentIndex: number) => {
    if (!attributes?.data?.attributes) return [];

    // Get all selected attribute IDs except the current row
    const selectedAttributeIds = attributeSelections
      .map((attr, index) => (index !== currentIndex ? attr.attribute_id : 0))
      .filter((id) => id !== 0);

    // Filter out already selected attributes
    return attributes.data.attributes.filter(
      (attr) => !selectedAttributeIds.includes(attr.id),
    );
  };

  const onSubmit = async (data: FormData) => {
    if (!formData.productId) {
      showSnackbar("Please complete the previous steps first", "error");
      return;
    }

    setIsLoading(true);
    try {
      // Transform the data to match the API requirements
      const transformedData = {
        attributes: data.attributes.map((attr) => ({
          attribute_id: attr.attribute_id,
          term_id: attr.term_ids[0], // Take the first term ID since API expects single term_id
          is_visible_page: attr.is_visible_page,
          used_in_variation: attr.used_in_variation,
        })),
      };

      // Save attributes to the product using the API function
      const response = await addProductAttributes(
        formData.productId,
        transformedData,
      );

      // Store both the form data and API response data
      updateFormData({
        attributes: data.attributes as ProductAttribute[],
        attributesResponse: response.data, // Store the API response
        hasErrors: false,
      });

      showSnackbar("Product attributes saved successfully", "success");
      markStepAsCompleted(2);
      nextStep();
    } catch (error) {
      console.error("Error saving product attributes:", error);
      updateFormData({ hasErrors: true });
      showSnackbar("Failed to save product attributes", "error");
    } finally {
      setIsLoading(false);
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col justify-center space-y-4"
    >
      {fields.map((field, index) => (
        <Paper key={field.id} className="p-4 relative">
          <div className="grid grid-cols-2 gap-4">
            <FormSelectField
              name={`attributes.${index}.attribute_id`}
              control={control}
              label="Attribute"
              options={getAvailableAttributes(index).map((attr) => ({
                value: attr.id,
                label: attr.name,
              }))}
              required
            />
            <FormSelectField
              name={`attributes.${index}.term_ids`}
              control={control}
              label="Terms"
              options={
                terms?.[index]?.data?.terms?.map((term) => ({
                  value: term.id,
                  label: term.name,
                })) || []
              }
              required
              isMulti
              onTermRemove={(termId) => handleTermRemove(index, termId)}
            />
            <FormCheckboxField
              name={`attributes.${index}.is_visible_page`}
              control={control}
              label="Visible on product page"
            />
            <FormCheckboxField
              name={`attributes.${index}.used_in_variation`}
              control={control}
              label="Used for variations"
            />
          </div>
          {fields.length > 1 && (
            <IconButton
              onClick={() => remove(index)}
              className="absolute top-2 right-2"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Paper>
      ))}

      <div className="flex justify-center">
        <AppButton
          label={
            <>
              <AddIcon className="mr-2" />
              Add Attribute
            </>
          }
          type="button"
          variant="outlined"
          onClick={() =>
            append({
              attribute_id: 0,
              term_ids: [],
              is_visible_page: true,
              used_in_variation: false,
            })
          }
        />
      </div>

      <div className="flex justify-between mt-4">
        <AppButton
          label="Previous"
          onClick={previousStep}
          variant="outlined"
          disabled={isLoading}
        />
        <AppButton
          label="Next"
          type="submit"
          loading={isLoading}
          disabled={!isValid || isLoading}
        />
      </div>
    </form>
  );
}

export default AttributesTab;
