'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Alert, Typography } from '@mui/material';
import AppButton from '@/components/Shared/AppButton';
import FormInputField from '@/components/Shared/FormInputField';
import { usePost } from '@/hooks/useFetch';
import { createBrand } from '@/services/apiProductBrand';
import { useSnackbar } from '@/contexts/SnackbarContext';
import FormFileUpload from '@/components/Shared/FormFileUpload';
import { useState } from 'react';

const schema = z.object({
    name: z.string().min(1, 'Brand Name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    logo: z.instanceof(File).optional(),
});

const defaultValues = {
    name: '',
    slug: '',
    description: '',
    logo: null,
};

export type FormType = {
    name: string;
    slug: string;
    description?: string;
    logo?: File;
};

function CreateBrandForm() {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isLoading, setIsLoading] = useState(false);

    const { control, formState, handleSubmit, setValue } = useForm({
        mode: 'all',
        defaultValues,
        resolver: zodResolver(schema),
    });

    const { isValid, dirtyFields, errors } = formState;
    const { trigger: triggerCreateBrand, isMutating } = usePost('createBrand', createBrand);

    // async function onSubmit(formData) {
    //     setIsLoading(true);
    //     try {
    //         const formDataObj = new FormData();
    //         Object.entries(formData).forEach(([key, value]) => {
    //             if (value) formDataObj.append(key, value);
    //         });

    //         await triggerCreateBrand(formDataObj);
    //         showSnackbar('Brand created successfully!', 'success');
    //         router.push('/brands');
    //     } catch (error) {
    //         showSnackbar(error?.message || 'An unexpected error occurred', 'error');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }

    // async function onSubmit(formData) {
    //     setIsLoading(true);
    
    //     try {
    //         const formDataObj = new FormData();
    
    //         Object.entries(formData).forEach(([key, value]) => {
    //             if (value) {
    //                 if (key === "slug") {
    //                     value = value.toLowerCase(); // ✅ Convert slug to lowercase
    //                 }
    //                 if (key === "logo" && value instanceof File) {
    //                     formDataObj.append("logo", value, value.name); // ✅ Ensure file is sent as binary
    //                 } else {
    //                     formDataObj.append(key, value);
    //                 }
    //             }
    //         });
    
    //         console.log("Final Payload:", formDataObj.get("logo")); // Debugging
    
    //         await triggerCreateBrand(formDataObj);
    //         showSnackbar("Brand created successfully!", "success");
    //         router.push("/apps/product-brand");
    //     } catch (error) {
    //         showSnackbar(error?.message || "An unexpected error occurred", "error");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }

    async function onSubmit(formData: Record<string, unknown>) {
        setIsLoading(true);
    
        try {
            const formDataObj = new FormData();
    
            Object.entries(formData).forEach(([key, value]) => {
                if (value) {
                    if (key === "slug" && typeof value === "string") {
                        value = value.toLowerCase(); // ✅ Safe conversion
                    }
    
                    if (key === "logo" && value instanceof File) {
                        formDataObj.append("logo", value, value.name); // ✅ Ensure file is sent as binary
                    } else if (typeof value === "string") {
                        formDataObj.append(key, value); // ✅ Ensure only strings are appended
                    }
                }
            });
    
            console.log("Final Payload:", formDataObj.get("logo")); // Debugging
    
            await triggerCreateBrand(formDataObj);
            showSnackbar("Brand created successfully!", "success");
            router.push("/apps/product-brand");
        } catch (error) {
            showSnackbar(error?.message || "An unexpected error occurred", "error");
        } finally {
            setIsLoading(false);
        }
    }
    
    
    

    return (
        <div className='md:px-64 p-4'>
            <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-8 mt-8">New Brand</Typography>
            <form
                name="brandForm"
                noValidate
                className="flex w-full flex-col justify-center"
                onSubmit={handleSubmit(onSubmit)}
            >
                {errors?.root?.message && (
                    <Alert className="mb-8" severity="error">
                        {errors?.root?.message}
                    </Alert>
                )}

                <FormInputField name="name" control={control} label="Brand Name" type="text" required />
                <FormInputField name="slug" control={control} label="Slug" type="text" required />
                <FormInputField name="description" control={control} label="Description" type="text" />
                <FormFileUpload name="logo" control={control} label="Logo (optional)" setValue={setValue} />

                <AppButton
                    label="Create"
                    loading={isLoading}
                    type="submit"
                    fullWidth
                    size="large"
                    disabled={!isValid || isMutating}
                    className="mt-4 w-full"
                />
            </form>
        </div>
    );
}

export default CreateBrandForm;
