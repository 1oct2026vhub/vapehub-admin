'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Button,
    FormControlLabel,
    Switch,
    MenuItem,
    Grid,
    Paper,
    Typography,
    IconButton,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
    createDeal,
    updateDeal,
    DealFormData,
    Deal,
    ProductInDeal,
    removeProductsFromDeal,
    getEntityBanners,
    createEntityBanner,
    updateEntityBanner
} from '@/services/apiDeals';
import FormTextField from '@/components/Shared/FormTextField';
import AppButton from '@/components/Shared/AppButton';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import ProductSelector from './ProductSelector';
import FormFileUploadField from '@/components/Shared/FormFileUploadField';
import FormCKEditor from '@/components/Shared/FormCKEditor';
import FormInputField from '@/components/Shared/FormInputField';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/fileValidation';
import { validateImageDimensions } from '@/utils/imageUtils';
import { id } from 'date-fns/locale';

const dealSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    deal_type: z.enum(['BUY_N_FOR_FIXED']),
    is_active: z.boolean(),
    show_home_page: z.boolean(),
    valid_from: z.string().min(1, 'Valid from date is required'),
    valid_to: z.string().min(1, 'Valid to date is required'),
    required_qty: z.coerce.number().min(1, { message: "Quantity is required." }).positive({ message: "Quantity must be a positive number." }).int({ message: "Quantity must be a whole number." }),
    get_qty: z.coerce.number().optional().nullable(),
    fixed_price: z.coerce.number().min(1, { message:'Fixed price is required.'}).positive({ message: "Price must be a positive number." }),
    discount_percent: z.coerce.number().optional().nullable(),
    tiered_qty_json: z.array(z.object({
        min: z.coerce.number().min(1, "Minimum quantity is required"),
        discount: z.coerce.number().min(1, "Discount is required"),
    })).optional().nullable(),
    bundle_product_ids_json: z.array(z.number()).optional().nullable(),
    description: z.string().optional().nullable(),
    image: z.any().optional()
        .refine((file) => {
            if (typeof file === 'string' || !file) return true;
            return file.size <= MAX_FILE_SIZE;
        }, `Max image size is 5MB.`)
        .refine(
            (file) => {
                if (typeof file === 'string' || !file) return true;
                return ACCEPTED_IMAGE_TYPES.includes(file?.type);
            },
            "Only .jpg, .jpeg, .png and .webp formats are supported."
        )
        .refine(async (file) => {
            if (typeof file === 'string' || !file) return true;
            const dimensions = await validateImageDimensions(file, 660, 250);
            return dimensions.valid;
        }, "Image must be 660x250px."),
    // Banner fields
    bannerImage: z.union([
        z.undefined(),
        z.null(),
        z.string(), // For existing banner image URLs
        z.instanceof(File)
            .refine(
                (file) => file.size <= MAX_FILE_SIZE,
                "Banner file size must be less than 5MB"
            )
            .refine(
                (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
                "Only .jpg, .jpeg, .png, and .webp formats are supported"
            )
    ]).optional().nullable(),
    bannerAlt: z.string().optional(),
    bannerUrl: z.union([
        z.string().url("Banner URL must be a valid URL"),
        z.literal(""),
    ]).optional(),
    bannerOrder: z.number().int().min(0, "Order must be a non-negative integer").optional(),
    bannerId: z.number().optional(), // For existing banner ID
});

interface DealFormProps {
    deal?: Deal;
    onDealCreated?: () => void;
    hideButtons?: boolean;
}

const DealForm: React.FC<DealFormProps> = ({ deal, onDealCreated, hideButtons = false }) => {
    const router = useRouter();
    const { showSnackbar } = useSnackbar();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingBanner, setIsSavingBanner] = useState(false);
    const [associatedProducts, setAssociatedProducts] = useState<ProductInDeal[]>([]);
    const [productToRemove, setProductToRemove] = useState<ProductInDeal | null>(null);
    const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [existingBanner, setExistingBanner] = useState<any>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        watch,
        reset,
        setValue
    } = useForm<DealFormData & {
        bannerImage?: File | string | null | undefined;
        bannerAlt?: string;
        bannerUrl?: string;
        bannerOrder?: number;
        bannerId?: number;
    }>({
        resolver: zodResolver(dealSchema),
        mode: 'all',
        defaultValues: {
            name: '',
            deal_type: 'BUY_N_FOR_FIXED',
            is_active: true,
            show_home_page: false,
            valid_from: '',
            valid_to: '',
            required_qty: null,
            get_qty: null,
            fixed_price: null,
            discount_percent: null,
            tiered_qty_json: [],
            bundle_product_ids_json: [],
            description: '',
            image: null,
            bannerImage: undefined,
            bannerAlt: '',
            bannerUrl: '',
            bannerOrder: 0,
            bannerId: undefined,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "tiered_qty_json",
    });

    const dealType = watch('deal_type');

    // Fetch existing banner data
    useEffect(() => {
        const fetchBanner = async () => {
            if (!deal?.id) return;
            
            try {
                const response = await getEntityBanners({ type: "deal", deal_id: deal.id });
                if (response?.data?.entityBanners && response.data.entityBanners.length > 0) {
                    const banner = response.data.entityBanners[0];
                    setExistingBanner(banner);
                    // Note: We can't set banner fields in reset since they're not part of DealFormData
                    // We'll handle this separately
                }
            } catch (error) {
                console.error("Error fetching banner:", error);
                // Banner might not exist yet, which is fine
            }
        };

        if (deal?.id) {
            fetchBanner();
        }
    }, [deal?.id]);

    useEffect(() => {
        if (deal) {
            reset({
                ...deal,
                fixed_price: Number(deal.fixed_price),
                valid_from: deal.valid_from.split('T')[0],
                valid_to: deal.valid_to.split('T')[0],
                bundle_product_ids_json: deal.products.map(p => p.id),
                image: deal.image_url,
                show_home_page: deal.show_home_page ?? false,
            });
            setAssociatedProducts(deal.products);
            
            // Set banner fields if banner exists
            if (existingBanner) {
                setValue("bannerImage" as any, existingBanner.image);
                setValue("bannerAlt" as any, existingBanner.alt || "");
                setValue("bannerUrl" as any, existingBanner.url || "");
                setValue("bannerOrder" as any, existingBanner.order || 0);
                setValue("bannerId" as any, existingBanner.id);
                setBannerPreview(existingBanner.image);
            }
        }
    }, [deal, reset, existingBanner]);


    const onSubmit = async (data: DealFormData) => {
        setIsSubmitting(true);
        try {
            const slug = data.name
                .toLowerCase()
                .replace(/\s+/g, '-') // Replace spaces with -
                .replace(/[^\w-]+/g, '') // Remove all non-word chars
                .replace(/--+/g, '-') // Replace multiple - with single -
                .replace(/^-+/, '') // Trim - from start of text
                .replace(/-+$/, ''); // Trim - from end of text


            let payload: Partial<DealFormData> & { slug: string }= {
                name: data.name,
                slug,
                deal_type: data.deal_type,
                is_active: data.is_active,
                show_home_page: data.show_home_page,
                valid_from: data.valid_from,
                valid_to: data.valid_to,
                description: data.description,
                image: data.image,
            };

            if (data.deal_type === 'BUY_N_FOR_FIXED') {
                payload = {
                    ...payload,
                    required_qty: data.required_qty,
                    fixed_price: data.fixed_price,
                };
            }
            
            if (deal) {
                await updateDeal(deal.id, payload as DealFormData);
                showSnackbar('Deal updated successfully!', 'success');
                router.push('/apps/deals');
            } else {
                const createdDeal = await createDeal(payload as DealFormData);
                showSnackbar('Deal created successfully!', 'success');
                
                // Debug: Log the response to see the structure
                console.log('Created deal response:', createdDeal);
                
                // Store deal ID for banner creation
                const dealId = createdDeal?.id || (createdDeal as any)?.data?.id || (createdDeal as any)?.deal?.id;
                
                if (onDealCreated) {
                    onDealCreated();
                } else {
                    if (dealId) {
                        // Don't redirect immediately, allow user to save banner if needed
                        // router.push(`/apps/deals/deal-edit/${dealId}`);
                    } else {
                        // Fallback: redirect to deals list if we can't get the ID
                        console.error('Could not get deal ID from response:', createdDeal);
                        router.push('/apps/deals');
                    }
                }
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
      }        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProductAdded = (product: ProductInDeal) => {
        if (!associatedProducts.some(p => p.id === product.id)) {
            setAssociatedProducts(prev => [...prev, { id: product.id, name: product.name, slug: product.slug }]);
        } else {
            showSnackbar('Product is already associated with this deal.', 'info');
        }
    };

    const handleRemoveProduct = (productId: number) => {
        const product = associatedProducts.find((p) => p.id === productId);
        if (product) {
            setProductToRemove(product);
        }
    };

    const handleConfirmRemove = async () => {
        if (!productToRemove || !deal) return;

        try {
            await removeProductsFromDeal(deal.id, [productToRemove.id]);
            setAssociatedProducts((prev) => prev.filter((p) => p.id !== productToRemove.id));
            showSnackbar('Product removed successfully', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Failed to remove product', 'error');
        } finally {
            setProductToRemove(null);
        }
    };

    const onSaveBanner = async () => {
        const dealId = deal?.id;
        if (!dealId) {
            showSnackbar("Please create or select a deal first before saving the banner", "error");
            return;
        }

        setIsSavingBanner(true);
        try {
            const formData = watch() as any;
            
            if (!selectedBannerFile && !formData.bannerAlt && !formData.bannerUrl && !existingBanner) {
                showSnackbar("Please provide at least banner image, alt text, or URL", "error");
                setIsSavingBanner(false);
                return;
            }

            const bannerData = {
                type: "deal",
                deal_id: dealId,
                image: selectedBannerFile instanceof File ? selectedBannerFile : undefined,
                alt: formData.bannerAlt || "",
                url: formData.bannerUrl || "",
                order: formData.bannerOrder || 0,
            };

            if (existingBanner?.id) {
                // Update existing banner
                await updateEntityBanner(existingBanner.id, bannerData);
                showSnackbar("Banner updated successfully!", "success");
            } else {
                // Create new banner
                await createEntityBanner(bannerData);
                showSnackbar("Banner created successfully!", "success");
                // Refresh banner data
                const response = await getEntityBanners({ type: "deal", deal_id: dealId });
                if (response?.data?.entityBanners && response.data.entityBanners.length > 0) {
                    const banner = response.data.entityBanners[0];
                    setExistingBanner(banner);
                    setValue("bannerId" as any, banner.id);
                    setBannerPreview(banner.image);
                }
            }
        } catch (error: any) {
            console.error("Error saving banner:", error);
            const errorResponse = error?.response?.data || error;
            
            // Handle validation errors from the API
            if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
                errorResponse.errors.forEach((validationError: any) => {
                    if (validationError.path && validationError.msg) {
                        showSnackbar(validationError.msg, "error");
                    }
                });
            } else if (errorResponse?.error && Array.isArray(errorResponse.error)) {
                errorResponse.error.forEach((validationError: any) => {
                    if (validationError.path && validationError.message) {
                        showSnackbar(validationError.message, "error");
                    }
                });
            } else if (errorResponse?.errors && !Array.isArray(errorResponse.errors)) {
                showSnackbar(errorResponse.errors[0]?.msg || errorResponse.errors, "error");
            } else {
                const errorMessage = errorResponse?.message || error?.message || "An unexpected error occurred";
                showSnackbar(errorMessage, "error");
            }
        } finally {
            setIsSavingBanner(false);
        }
    };

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: { xs: 2, md: 4 }, backgroundColor: 'white', height: '100%' }}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="name" control={control} label="Name" required />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="deal_type" control={control} label="Deal Type" select required >
                                        <MenuItem value="BUY_N_FOR_FIXED">Buy N For Fixed Price</MenuItem>
                                    </FormTextField>
                                </Grid>

                                {dealType === 'BUY_N_FOR_FIXED' && (
                                    <>
                                        <Grid item xs={12} md={6}>
                                            <FormTextField name="required_qty" control={control} label="Required Quantity" type="number" required />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <FormTextField name="fixed_price" control={control} label="Fixed Price" type="number" required />
                                        </Grid>
                                    </>
                                )}

                                <Grid item xs={12} md={6}>
                                    <FormTextField name="valid_from" control={control} label="Valid From" type="date" InputLabelProps={{ shrink: true }} required />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormTextField name="valid_to" control={control} label="Valid To" type="date" InputLabelProps={{ shrink: true }} required />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormFileUploadField
                                        name="image"
                                        control={control}
                                        label="Deal Image"
                                        defaultImage={deal?.image_url}
                                        exactWidth={660}
                                        exactHeight={250}
                                        helperText="Image must be 660x250 px. Supported formats: PNG, JPG, JPEG, WebP (max 5MB)"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormCKEditor
                                        name="description"
                                        control={control}
                                        label="Description"
                                        defaultValue={deal?.description || ''}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="is_active"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Active" />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Controller
                                        name="show_home_page"
                                        control={control}
                                        render={({ field }) => (
                                            <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Show on Home Page" />
                                        )}
                                    />
                                </Grid>
                            </Grid>

                            {/* {!hideButtons && ( */}
                                <div className="flex justify-end gap-2 mt-10">
                                    <Button variant="outlined" onClick={() => router.push('/apps/deals')}>Cancel</Button>
                                    <AppButton type="submit" label={deal ? "Save Changes" : "Create"} loading={isSubmitting} disabled={!isValid || isSubmitting || (deal && !isDirty)} />
                                </div>
                            {/* )} */}
                        </form>

                        {/* Banner Section - Outside the main form */}
                        <Box sx={{ mt: 4, mb: 2, p: 3, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                Deal Banner (Optional)
                            </Typography>
                            
                            <Box sx={{ mt: 2, mb: 2 }}>
                                <FormFileUploadField
                                    name="bannerImage"
                                    control={control}
                                    label="Banner Image"
                                    onFileChange={(file) => {
                                        setSelectedBannerFile(file);
                                        setValue("bannerImage" as any, file, { shouldValidate: true });
                                        if (file) {
                                            setBannerPreview(URL.createObjectURL(file));
                                        } else {
                                            setBannerPreview(null);
                                        }
                                    }}
                                    helperText="Upload a banner image (Max size: 5MB). Supported formats: PNG, JPG, JPEG, WebP"
                                    defaultImage={typeof (watch() as any).bannerImage === 'string' ? (watch() as any).bannerImage as string : undefined}
                                    hidePreview
                                />
                                {bannerPreview && bannerPreview !== ((watch() as any).bannerImage as string) ? (
                                    <Box sx={{ mt: 2, border: '1px solid #ddd', p: 1, position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={bannerPreview}
                                            alt="New banner preview"
                                            style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain' }}
                                        />
                                    </Box>
                                ) : (
                                    existingBanner?.image && (
                                        <Box sx={{ mt: 2, border: '1px solid #ddd', p: 1, display: 'inline-block' }}>
                                            <img
                                                src={existingBanner.image}
                                                alt={existingBanner.alt || "Current banner"}
                                                style={{ maxWidth: 300, maxHeight: 200, objectFit: 'contain' }}
                                            />
                                        </Box>
                                    )
                                )}
                            </Box>

                            <FormInputField
                                name="bannerAlt"
                                control={control}
                                label="Banner Alt Text"
                                type="text"
                            />

                            <FormInputField
                                name="bannerUrl"
                                control={control}
                                label="Banner URL"
                                type="url"
                                helperText="URL to redirect when banner is clicked"
                            />

                            <FormInputField
                                name="bannerOrder"
                                control={control}
                                label="Banner Order"
                                type="number"
                                helperText="Display order (0 = first)"
                            />

                            <AppButton
                                label="Save Banner"
                                loading={isSavingBanner}
                                type="button"
                                onClick={onSaveBanner}
                                fullWidth
                                size="large"
                                disabled={isSavingBanner}
                                className="mt-4 w-full"
                                disableGradient
                                sx={{ 
                                    backgroundColor: "#2E9970", 
                                    "&:hover": { backgroundColor: "#1E7A56" },
                                    color: "#fff"
                                }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                {deal && (
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: { xs: 2, md: 4 }, height: '100%' }}>
                            <Typography variant="h6" className="mb-4">Associated Products</Typography>
                            <ProductSelector dealId={deal.id} onProductAdded={handleProductAdded} />
                            <List sx={{ mt: 2, maxHeight: 200, overflowY: 'auto' }}>
                                {associatedProducts.map((product, index) => (
                                    <div key={product.id}>
                                        <ListItem
                                        secondaryAction={
                                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveProduct(product.id)}>
                                        <FuseSvgIcon>heroicons-outline:trash</FuseSvgIcon>
                                        </IconButton>
                                        }
                                        >
                                            <ListItemText primary={product.name} />
                                        </ListItem>
                                        {index < associatedProducts.length - 1 && <Divider />}
                                    </div>
                                ))}
                            </List>
                        </Paper>
                    </Grid>
                )}
            </Grid>
            <Dialog open={!!productToRemove} onClose={() => setProductToRemove(null)}>
                <DialogTitle>Confirm Removal</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove <strong>{productToRemove?.name}</strong> from this deal?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductToRemove(null)}>Cancel</Button>
                    <AppButton
                        label="Remove"
                        type="button"
                        onClick={handleConfirmRemove}
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DealForm; 