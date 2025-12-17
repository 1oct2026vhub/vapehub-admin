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
    updateEntityBanner,
    deleteEntityBanner
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
import BannerModal from './components/BannerModal';
import { Card, CardMedia, CardContent, CardActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [associatedProducts, setAssociatedProducts] = useState<ProductInDeal[]>([]);
    const [productToRemove, setProductToRemove] = useState<ProductInDeal | null>(null);
    const [banners, setBanners] = useState<any[]>([]);
    const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<any | null>(null);
    const [isDeletingBanner, setIsDeletingBanner] = useState<number | null>(null);
    const [createdDealId, setCreatedDealId] = useState<number | null>(null);

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
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "tiered_qty_json",
    });

    const dealType = watch('deal_type');

    // Fetch existing banners
    useEffect(() => {
        const fetchBanners = async () => {
            const dealId = deal?.id || createdDealId;
            if (!dealId) return;
            
            try {
                const response = await getEntityBanners({ type: "deal", deal_id: dealId });
                if (response?.data?.entityBanners) {
                    setBanners(response.data.entityBanners);
                }
            } catch (error) {
                console.error("Error fetching banners:", error);
            }
        };

        if (deal?.id || createdDealId) {
            fetchBanners();
        }
    }, [deal?.id, createdDealId]);

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
        }
    }, [deal, reset]);


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
                setCreatedDealId(dealId);
                
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

    const handleCreateBanner = () => {
        if (banners.length >= 3) {
            showSnackbar("Maximum 3 banners allowed", "error");
            return;
        }
        setEditingBanner(null);
        setIsBannerModalOpen(true);
    };

    const handleEditBanner = (banner: any) => {
        setEditingBanner(banner);
        setIsBannerModalOpen(true);
    };

    const handleDeleteBanner = async (bannerId: number) => {
        const dealId = deal?.id || createdDealId;
        if (!dealId) return;
        
        if (!window.confirm("Are you sure you want to delete this banner?")) {
            return;
        }

        setIsDeletingBanner(bannerId);
        try {
            await deleteEntityBanner(bannerId);
            setBanners(banners.filter(b => b.id !== bannerId));
            showSnackbar("Banner deleted successfully!", "success");
        } catch (error: any) {
            console.error("Error deleting banner:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete banner";
            showSnackbar(errorMessage, "error");
        } finally {
            setIsDeletingBanner(null);
        }
    };

    const handleSaveBanner = async (data: any) => {
        const dealId = deal?.id || createdDealId;
        if (!dealId) {
            throw new Error("Deal ID is missing");
        }

        const bannerData = {
            type: "deal",
            deal_id: dealId,
            image: data.imageFile instanceof File ? data.imageFile : (data.image || undefined),
            alt: data.alt || "",
            url: data.url || "",
            order: data.order || 0,
        };

        if (editingBanner?.id) {
            // Update existing banner
            await updateEntityBanner(editingBanner.id, bannerData);
            showSnackbar("Banner updated successfully!", "success");
        } else {
            // Check limit before creating
            if (banners.length >= 3) {
                throw new Error("Maximum 3 banners allowed");
            }
            // Create new banner
            await createEntityBanner(bannerData);
            showSnackbar("Banner created successfully!", "success");
        }

        // Refresh banners list
        const response = await getEntityBanners({ type: "deal", deal_id: dealId });
        if (response?.data?.entityBanners) {
            setBanners(response.data.entityBanners);
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
                        {(deal?.id || createdDealId) && (
                            <Box sx={{ mt: 4, mb: 2, p: 3, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                        Deal Banners ({banners.length}/3)
                                    </Typography>
                                    <AppButton
                                        label="Create Banner"
                                        type="button"
                                        onClick={handleCreateBanner}
                                        disabled={banners.length >= 3}
                                        size="medium"
                                        disableGradient
                                        sx={{ 
                                            backgroundColor: "#2E9970", 
                                            "&:hover": { backgroundColor: "#1E7A56" },
                                            color: "#fff"
                                        }}
                                    />
                                </Box>

                                {banners.length === 0 ? (
                                    <Typography variant="body2" color="textSecondary" sx={{ textAlign: "center", py: 3 }}>
                                        No banners created yet. Click "Create Banner" to add one.
                                    </Typography>
                                ) : (
                                    <Grid container spacing={2}>
                                        {banners.map((banner) => (
                                            <Grid item xs={12} sm={6} md={4} key={banner.id}>
                                                <Card>
                                                    {banner.image && (
                                                        <CardMedia
                                                            component="img"
                                                            height="140"
                                                            image={banner.image}
                                                            alt={banner.alt || "Banner"}
                                                            sx={{ objectFit: "contain" }}
                                                        />
                                                    )}
                                                    <CardContent>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Alt: {banner.alt || "N/A"}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            URL: {banner.url || "N/A"}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Order: {banner.order ?? 0}
                                                        </Typography>
                                                    </CardContent>
                                                    <CardActions>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditBanner(banner)}
                                                            color="primary"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteBanner(banner.id)}
                                                            color="error"
                                                            disabled={isDeletingBanner === banner.id}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}

                                <BannerModal
                                    open={isBannerModalOpen}
                                    onClose={() => {
                                        setIsBannerModalOpen(false);
                                        setEditingBanner(null);
                                    }}
                                    onSave={handleSaveBanner}
                                    initialData={editingBanner}
                                    isEdit={!!editingBanner}
                                />
                            </Box>
                        )}
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