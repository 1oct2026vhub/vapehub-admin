import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  FormControlLabel,
  Switch,
  Button,
  DialogActions,
  Typography,
} from '@mui/material';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FooterLink, updateFooterLink } from '@/services/apiFooter';
import FormInputField from '@/components/Shared/FormInputField';
import AppButton from '@/components/Shared/AppButton';

// Define validation schema using Zod
const linkSchema = z.object({
  label: z.string()
    .min(1, "Label is required")
    .max(50, "Label must not exceed 50 characters"),
  
  url: z.string()
    .min(1, "URL is required")
    .max(200, "URL must not exceed 200 characters")
    .regex(/^\/[a-z0-9\-\/_]*$|^https?:\/\/.+$/i, "URL must start with a slash (/) for internal links or be a valid URL for external links"),
  
  order: z.coerce.number()
    .int("Order must be an integer")
    .min(0, "Order must be a positive number"),
  
  is_active: z.boolean().default(true)
});

type LinkFormType = z.infer<typeof linkSchema>;

// Helper function to check if section is brand-related
const isBrandSection = (sectionTitle: string): boolean => {
  const brandKeywords = ['brand', 'brands', 'manufacturer', 'manufacturers'];
  return brandKeywords.some(keyword => 
    sectionTitle.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Helper function to format URL with brand prefix (only for brand sections)
const formatUrlWithBrand = (url: string, sectionTitle: string): string => {
  // Only apply brand prefix for brand-related sections
  if (!isBrandSection(sectionTitle)) {
    return url; // Keep as is for non-brand sections
  }
  
  // For brand sections: if URL already starts with /brand/, return as is
  if (url.startsWith('/brand/')) {
    return url;
  }
  
  // For brand sections: if URL starts with /, add /brand prefix
  if (url.startsWith('/')) {
    return `/brand${url}`;
  }
  
  // This shouldn't happen due to validation, but fallback
  return `/brand/${url}`;
};

// Helper function to remove brand prefix for display in form (only for brand sections)
const removeBrandPrefix = (url: string, sectionTitle: string): string => {
  // Only remove brand prefix for brand-related sections
  if (!isBrandSection(sectionTitle)) {
    return url; // Keep as is for non-brand sections
  }
  
  // For brand sections: if URL starts with /brand/, remove /brand prefix
  if (url.startsWith('/brand/')) {
    return url.substring(6); // Remove '/brand' (6 characters), keep the '/'
  }
  
  return url;
};

interface EditLinkDialogProps {
  open: boolean;
  onClose: () => void;
  link: FooterLink;
  sectionTitle: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onUpdate: (updatedLink: FooterLink) => void;
}

export default function EditLinkDialog({
  open,
  onClose,
  link,
  sectionTitle,
  onSuccess,
  onError,
  onUpdate,
}: EditLinkDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const methods = useForm<LinkFormType>({
    mode: "all",
    defaultValues: {
      label: link.label,
      url: removeBrandPrefix(link.url, sectionTitle), // Remove brand prefix for display
      order: link.order,
      is_active: link.is_active,
    },
    resolver: zodResolver(linkSchema),
  });

  const { isValid } = methods.formState;

  useEffect(() => {
    if (open) {
      methods.reset({
        label: link.label,
        url: removeBrandPrefix(link.url, sectionTitle), // Remove brand prefix for display
        order: link.order,
        is_active: link.is_active,
      });
    }
  }, [open, link]);

  const handleSubmit = async (data: LinkFormType) => {
    try {
      setSubmitting(true);
      
      // Format URL with brand prefix (only for brand sections)
      const formattedData = {
        ...data,
        url: formatUrlWithBrand(data.url, sectionTitle),
      };
      
      const updatedLink = await updateFooterLink(link.id, {
        ...formattedData,
        section_id: link.section_id,
      });
      onSuccess("Footer link updated successfully");
      onUpdate(updatedLink);
      onClose();
    } catch (error: any) {
      console.error("Failed to update footer link:", error);
      onError(error?.message || "Failed to update footer link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Link</DialogTitle>
      <DialogContent>
        <Box py={1}>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <Box display="grid" gridTemplateColumns="1fr" gap={2}>
                <FormInputField
                  name="label"
                  control={methods.control}
                  label="Label"
                  required
                />
                <FormInputField
                  name="url"
                  control={methods.control}
                  label="URL"
                  required
                />
                {isBrandSection(sectionTitle) && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    URL will be automatically prefixed with "/brand" (e.g., "/bar-juice" becomes "/brand/bar-juice")
                  </Typography>
                )}
                <FormInputField
                  name="order"
                  control={methods.control}
                  label="Order"
                  type="number"
                  required
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={methods.watch("is_active")}
                      onChange={(e) =>
                        methods.setValue("is_active", e.target.checked)
                      }
                    />
                  }
                  label="Active"
                />
              </Box>

              <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <AppButton
                  type="submit"
                  loading={submitting}
                  disabled={!isValid || submitting}
                  label="Update"
                />
              </DialogActions>
            </form>
          </FormProvider>
        </Box>
      </DialogContent>
    </Dialog>
  );
} 