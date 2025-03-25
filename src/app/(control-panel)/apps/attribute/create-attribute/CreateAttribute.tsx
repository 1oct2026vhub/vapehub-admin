// 'use client';

// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import FusePageCarded from '@fuse/core/FusePageCarded';
// import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
// import CreateAttributeHeader from './CreateAttributeHeader';
// import { useRouter } from 'next/navigation';
// import axiosInstance from '@/utils/axiosApi';
// import FormInputField from '@/components/Shared/FormInputField';
// import FormSelectField from '@/components/Shared/SelectField';
// import { Typography } from '@mui/material';
// import AppButton from '@/components/Shared/AppButton';
// import { useSnackbar } from '@/contexts/SnackbarContext';

// const schema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   slug: z.string().min(1, 'Slug is required'),
//   description: z.string().optional(),
//   type: z.enum(['select', 'radio', 'checkbox']),
//   sort_order: z.enum(['custom', 'name', 'name_numeric']),
// });

// type FormData = z.infer<typeof schema>;

// const defaultValues: FormData = {
//   name: '',
//   slug: '',
//   description: '',
//   type: 'select',
//   sort_order: 'custom',
// };

// const typeOptions = [
//   { label: 'Select', value: 'select' },
//   { label: 'Radio', value: 'radio' },
//   { label: 'Checkbox', value: 'checkbox' },
// ];

// const sortOrderOptions = [
//   { label: 'Custom', value: 'custom' },
//   { label: 'Name', value: 'name' },
//   { label: 'Name (Numeric)', value: 'name_numeric' },
// ];

// function CreateAttribute() {
//   const isMobile = useThemeMediaQuery((theme: any) => theme.breakpoints.down('lg'));
//   const router = useRouter();
//     const { showSnackbar } = useSnackbar(); //Use Snackbar
//       const [isLoading, setIsLoading] = useState(false);

//   const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
//     defaultValues,
//     resolver: zodResolver(schema),
//   });

//   const onSubmit = async (data: FormData) => {
//     try {
//       await axiosInstance.post('/api/admin/attributes', data);
//       // router.push('/apps/attributes');
//     } catch (error: any) {

//      if (error?.errors) {
//         showSnackbar(error?.errors[0]?.msg, "error")
//       }
//       else {
//         const errorMessage = error?.message || 'An unexpected error occurred';
//         showSnackbar(errorMessage, 'error');

//       }

//       const errorData = error || error; // Handle both API and unexpected errors
//       if (errorData?.error && typeof errorData.error === 'object') {
//         Object.entries(errorData.error).forEach(([field, message]) => {
//           if (typeof message === 'string') {
//             // setError(field, { type: 'manual', message });
//             showSnackbar(` ${message}`, 'error');
//           }
//         });
//       } else {
//         // setError('root', { type: 'manual', message: errorMessage });
//       }
//       return false;
//     }
//     finally {
//       setIsLoading(false); // Stop loading after success or failure
//     }
//   };

//   return (
//     // <FusePageCarded
//     //   // header={<CreateAttributeHeader />}
//     //   content={
//         <div className="p-16 sm:p-24 max-w-3xl">
//           <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">New Attributes</Typography>
//           <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col ">
//             <FormInputField
//               name="name"
//               control={control}
//               label="Name"
//             />
//             <FormInputField
//               name="slug"
//               control={control}
//               label="Slug"
//             />
//             <FormInputField
//               name="description"
//               control={control}
//               label="Description"
//               multiline
//               rows={4}
//             />
//             <FormSelectField
//               name="type"
//               control={control}
//               label="Type"
//               options={typeOptions}
//             />
//             <FormSelectField
//               name="sort_order"
//               control={control}
//               label="Sort Order"
//               options={sortOrderOptions}
//             />
//             <AppButton
//                     label="Create"
//                     // loading={isLoading}
//                     type="submit"
//                     fullWidth
//                     size="large"
//                     // disabled={!isValid || isMutating}
//                     className="mt-4 w-full"
//                 />
//           </form>
//         </div>
//     //   }
//     //   scroll={isMobile ? 'normal' : 'content'}
//     // />
//   );
// }

// export default CreateAttribute;

// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useRouter } from "next/navigation";
// import { Alert, Typography, MenuItem, Select } from "@mui/material";
// import AppButton from "@/components/Shared/AppButton";
// import FormInputField from "@/components/Shared/FormInputField";
// import { usePost } from "@/hooks/useFetch";
// import { createAttribute } from "@/services/apiAttribute";
// import { useSnackbar } from "@/contexts/SnackbarContext";
// import { useEffect, useState } from "react";
// import FormSelectField from "@/components/Shared/SelectField";

// const schema = z.object({
//   name: z.string().min(1, "Attribute Name is required"),
//   slug: z.string().min(1, "Slug is required"),
//   description: z.string().optional(),
//   type: z.string().min(1, "Type is required"),
//   sort_order: z.string().min(0, "Sort order must be a positive number"),
// });

// const defaultValues = {
//   name: "",
//   slug: "",
//   description: "",
//   type: "select",
//   sort_order: 0,
// };

// export type FormType = z.infer<typeof schema>;

// const attributeTypes = [
//   { value: "select", label: "Select" },
//   { value: "radio", label: "Radio" },
//   { value: "checkbox", label: "Checkbox" },
//   { value: "text", label: "Text" },
//   { value: "textarea", label: "Textarea" },
// ];
// const typeOptions = [
//   { label: "Select", value: "select" },
//   { label: "Radio", value: "radio" },
//   { label: "Checkbox", value: "checkbox" },
// ];

// const sortOrderOptions = [
//   { label: "Custom", value: "custom" },
//   { label: "Name", value: "name" },
//   { label: "Name (Numeric)", value: "name_numeric" },
// ];

// function CreateAttribute() {
//   const router = useRouter();
//   const { showSnackbar } = useSnackbar();
//   const [isLoading, setIsLoading] = useState(false);

//   const { control, formState, handleSubmit, watch, setValue } =
//     useForm<FormType>({
//       mode: "all",
//       // defaultValues,
//       resolver: zodResolver(schema),
//     });

//   const { isValid, errors, dirtyFields } = formState;
//   const { trigger: triggerCreateAttribute, isMutating } = usePost(
//     "createAttribute",
//     createAttribute,
//   );

//   // // Auto-generate slug from name
//   // const name = watch('name');
//   // useEffect(() => {
//   //   if (name) {
//   //     const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
//   //     setValue('slug', slug);
//   //   }
//   // }, [name, setValue]);

//   const onSubmit = async (formData: FormType) => {
//     try {
//       setIsLoading(true); // Start loading
//       await triggerCreateAttribute(formData);
//       showSnackbar("Attribute created successfully!", "success");
//       router.push("/apps/attribute");
//     } catch (error) {
//       if (error?.errors) {
//         showSnackbar(error?.errors[0]?.msg, "error");
//       } else {
//         const errorMessage = error?.message || "An unexpected error occurred";
//         showSnackbar(errorMessage, "error");
//       }
//       const errorData = error || error; // Handle both API and unexpected errors
//       if (errorData?.error && typeof errorData.error === "object") {
//         Object.entries(errorData.error).forEach(([field, message]) => {
//           if (typeof message === "string") {
//             // setError(field, { type: 'manual', message });
//             showSnackbar(` ${message}`, "error");
//           }
//         });
//       } else {
//         // setError('root', { type: 'manual', message: errorMessage });
//       }
//       return false;
//     } finally {
//       setIsLoading(false); // Stop loading after success or failure
//     }
//   };

//   return (
//     <div className="md:px-64 p-4">
//       <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
//         New Attribute
//       </Typography>

//       <form
//         name="attributeForm"
//         noValidate
//         className="flex flex-col"
//         onSubmit={handleSubmit(onSubmit)}
//       >
//         {errors?.root?.message && (
//           <Alert className="mb-8" severity="error">
//             {errors?.root?.message}
//           </Alert>
//         )}

//         <FormInputField
//           name="name"
//           control={control}
//           label="Attribute Name"
//           type="text"
//           required
//         />

//         <FormInputField
//           name="slug"
//           control={control}
//           label="Slug"
//           type="text"
//           required
//         />

//         <FormInputField
//           name="description"
//           control={control}
//           label="Description"
//           type="text"
//         />
//         <FormSelectField
//           name="type"
//           control={control}
//           label="Type"
//           options={typeOptions}
//           required
//         />
//         <FormSelectField
//           name="sort_order"
//           control={control}
//           label="Sort Order"
//           options={sortOrderOptions}
//           required
//         />

//         {/* <FormInputField
//                     name="type"
//                     control={control}
//                     label="Type"
//                     type="select"
//                     required
//                     select
//                 >
//                     {attributeTypes.map((type) => (
//                         <MenuItem key={type.value} value={type.value}>
//                             {type.label}
//                         </MenuItem>
//                     ))}
//                 </FormInputField>

//                 <FormInputField
//                     name="sort_order"
//                     control={control}
//                     label="Sort Order"
//                     type="number"
//                     required
//                 /> */}

//         <AppButton
//           label="Create"
//           loading={isLoading}
//           type="submit"
//           fullWidth
//           size="large"
//           disabled={!isValid || isMutating}
//           className="mt-4 w-full"
//         />
//       </form>
//     </div>
//   );
// }

// export default CreateAttribute;




// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { useRouter } from "next/navigation";
// import { Alert, Typography } from "@mui/material";
// import AppButton from "@/components/Shared/AppButton";
// import FormInputField from "@/components/Shared/FormInputField";
// import { usePost } from "@/hooks/useFetch";
// import { createAttribute } from "@/services/apiAttribute";
// import { useSnackbar } from "@/contexts/SnackbarContext";
// import { useState } from "react";
// import FormSelectField from "@/components/Shared/SelectField";

// // ✅ Schema with strict validation rules
// const schema = z.object({
//   name: z
//     .string()
//     .min(1, "Attribute Name is required")
//     .max(50, "Attribute Name must be at most 50 characters")
//     .regex(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters and spaces allowed"),

//   slug: z
//     .string()
//     .min(1, "Slug is required")
//     .max(50, "Slug must be at most 50 characters")
//     .regex(/^[a-z0-9-]+$/, "Slug must be lowercase and can contain hyphens only"),

//   description: z
//     .string()
//     .min(1, "Description is required")
//     .optional(),
//     // .max(200, "Description must be at most 200 characters"),

//   type: z.enum(["select", "radio", "checkbox", "text", "textarea"], {
//     message: "Type is required",
//   }),

//   sort_order: z
//     .string()
//     .min(1, "Sort order is required")
//     .refine((val) => ["custom", "name", "name_numeric"].includes(val), {
//       message: "Invalid sort order value",
//     }),
// });

// const defaultValues = {
//   name: "",
//   slug: "",
//   description: "",
//   type: "select",
//   sort_order: "custom",
// };

// export type FormType = z.infer<typeof schema>;

// const typeOptions = [
//   { label: "Select", value: "select" },
//   { label: "Radio", value: "radio" },
//   { label: "Checkbox", value: "checkbox" },
//   { label: "Text", value: "text" },
//   { label: "Textarea", value: "textarea" },
// ];

// const sortOrderOptions = [
//   { label: "Custom", value: "custom" },
//   { label: "Name", value: "name" },
//   { label: "Name (Numeric)", value: "name_numeric" },
// ];

// function CreateAttribute() {
//   const router = useRouter();
//   const { showSnackbar } = useSnackbar();
//   const [isLoading, setIsLoading] = useState(false);

//   const { control, formState, handleSubmit } = useForm<FormType>({
//     mode: "all",
//     defaultValues,
//     resolver: zodResolver(schema),
//   });

//   const { isValid, errors } = formState;

//   const { trigger: triggerCreateAttribute, isMutating } = usePost(
//     "createAttribute",
//     createAttribute,
//   );

//   const onSubmit = async (formData: FormType) => {
//     try {
//       setIsLoading(true); // Start loading
//       await triggerCreateAttribute(formData);
//       showSnackbar("Attribute created successfully!", "success");
//       router.push("/apps/attribute");
//     } catch (error) {
//       if (error?.errors) {
//         showSnackbar(error?.errors[0]?.msg, "error");
//       } else {
//         const errorMessage = error?.message || "An unexpected error occurred";
//         showSnackbar(errorMessage, "error");
//       }
//     } finally {
//       setIsLoading(false); // Stop loading after success or failure
//     }
//   };

//   return (
//     <div className="md:px-64 p-4">
//       <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">
//         New Attribute
//       </Typography>

//       <form
//         name="attributeForm"
//         noValidate
//         className="flex flex-col"
//         onSubmit={handleSubmit(onSubmit)}
//       >
//         {errors?.root?.message && (
//           <Alert className="mb-8" severity="error">
//             {errors?.root?.message}
//           </Alert>
//         )}

//         {/* Attribute Name Field */}
//         <FormInputField
//           name="name"
//           control={control}
//           label="Attribute Name"
//           type="text"
//           required
//           error={!!errors.name}
//           helperText={errors.name?.message}
//         />

//         {/* Slug Field */}
//         <FormInputField
//           name="slug"
//           control={control}
//           label="Slug"
//           type="text"
//           required
//           error={!!errors.slug}
//           helperText={errors.slug?.message}
//         />

//         {/* Description Field */}
//         <FormInputField
//           name="description"
//           control={control}
//           label="Description"
//           type="text"
//           required
//           error={!!errors.description}
//           helperText={errors.description?.message}
//         />

//         {/* Type Field */}
//         <FormSelectField
//           name="type"
//           control={control}
//           label="Type"
//           options={typeOptions}
//           required
//           error={!!errors.type}
//           helperText={errors.type?.message}
//         />

//         {/* Sort Order Field */}
//         <FormSelectField
//           name="sort_order"
//           control={control}
//           label="Sort Order"
//           options={sortOrderOptions}
//           required
//           error={!!errors.sort_order}
//           helperText={errors.sort_order?.message}
//         />

//         <AppButton
//           label="Create"
//           loading={isLoading}
//           type="submit"
//           fullWidth
//           size="large"
//           disabled={!isValid || isMutating}
//           className="mt-4 w-full"
//         />
//       </form>
//     </div>
//   );
// }

// export default CreateAttribute;





"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Alert, Typography } from "@mui/material";
import AppButton from "@/components/Shared/AppButton";
import FormInputField from "@/components/Shared/FormInputField";
import { usePost } from "@/hooks/useFetch";
import { createAttribute } from "@/services/apiAttribute";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useState } from "react";
import FormSelectField from "@/components/Shared/SelectField";
import PageBreadcrumb from "@/components/PageBreadcrumb";

// ✅ Schema with strict validation rules
const schema = z.object({
  name: z
    .string()
    .min(1, "Attribute Name is required")
    .max(50, "Attribute Name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Only alphanumeric characters and spaces allowed"),

  slug: z.string()
    .min(1, "Slug is required")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must be a valid URL-friendly string (lowercase letters, numbers, and hyphens only)"),

  description: z
    .string()
    .optional(),
  // .max(200, "Description must be at most 200 characters"),

  type: z.enum(["select", "radio", "text", "image"], {
    message: "Type is required",
  }),

  sort_order: z.enum(["custom", "name", "id"], {
    message: "Invalid sort order value",
  }),
});

const defaultValues: FormType = {
  name: "",
  slug: "",
  description: "",
  type: "select",
  sort_order: "custom",
};

export type FormType = z.infer<typeof schema>;

const typeOptions = [
  { label: "Select", value: "select" },
  { label: "Radio", value: "radio" },
  { label: "Text", value: "text" },
  { label: "Image", value: "image" },
];

const sortOrderOptions = [
  { label: "Custom", value: "custom" },
  { label: "Name", value: "name" },
  { label: "Id", value: "id" },
];

function CreateAttribute() {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const { control, formState, handleSubmit, setError } = useForm<FormType>({
    mode: "all",
    defaultValues,
    resolver: zodResolver(schema),
  });

  const { isValid, dirtyFields, errors } = formState;

  const { trigger: triggerCreateAttribute, isMutating } = usePost(
    "createAttribute",
    createAttribute
  );

  const onSubmit = async (formData: FormType) => {
    setIsLoading(true); // Start loading
    try {
      await triggerCreateAttribute(formData);
      showSnackbar("Attribute created successfully!", "success");
      router.push("/apps/attribute");
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
            setError(field as any, { type: "manual", message });
            showSnackbar(message, "error");
          }
        });
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="md:px-64 p-4">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          New Attribute
        </Typography>
      </div>

      <form
        name="attributeForm"
        noValidate
        className="flex flex-col"
        onSubmit={handleSubmit(onSubmit)}
      >
        {errors?.root?.message && (
          <Alert className="mb-8" severity="error">
            {errors?.root?.message}
          </Alert>
        )}

        {/* Attribute Name Field */}
        <FormInputField
          name="name"
          control={control}
          label="Attribute Name"
          type="text"
          required
        />

        {/* Slug Field */}
        <FormInputField
          name="slug"
          control={control}
          label="Slug"
          type="text"
          required
        />

        {/* Description Field */}
        <FormInputField
          name="description"
          control={control}
          label="Description"
          type="text"
        />

        {/* Type Field */}
        <FormSelectField
          name="type"
          control={control}
          label="Type"
          options={typeOptions}
          required
        />

        {/* Sort Order Field */}
        <FormSelectField
          name="sort_order"
          control={control}
          label="Sort Order"
          options={sortOrderOptions}
          required
        />

        <AppButton
          label="Create"
          loading={isLoading}
          type="submit"
          fullWidth
          size="large"
          aria-label="Create Attribute"
          disabled={!isValid || !dirtyFields || isMutating}
          className="mt-4 w-full"
        />
      </form>
    </div>
  );
}

export default CreateAttribute;
