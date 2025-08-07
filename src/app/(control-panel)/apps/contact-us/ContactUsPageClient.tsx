'use client';

import { useEffect, useState } from 'react';
import { Paper, Typography, CircularProgress, Alert, Box, Divider } from '@mui/material';
import { ContactInfo, listContactUs, deleteContactUs, getContactUsById } from '@/services/apiContactUs';
import AppButton from '@/components/Shared/AppButton';
import ConfirmationDialog from './ConfirmationDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ContactUsFormModal from './ContactUsFormModal';

export default function ContactUsPageClient() {
    const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSnackbar } = useSnackbar();
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editData, setEditData] = useState<ContactInfo | null>(null);

    useEffect(() => {
        fetchContactInfo();
    }, []);

    async function fetchContactInfo() {
        try {
            setLoading(true);
            const response = await listContactUs();
            if (response.success) {
                setContactInfo(response.data);
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch contact information.');
        } finally {
            setLoading(false);
        }
    }

    const handleCreate = () => {
        setEditData(null);
        setFormModalOpen(true);
    };

    const handleEdit = async (id: number) => {
        try {
            const response = await getContactUsById(id);
            if(response.success){
                setEditData(response.data);
                setFormModalOpen(true);
            } else {
                showSnackbar(response.message, 'error');
            }
        } catch (error: any) {
            showSnackbar(error.message || 'Failed to fetch contact details.', 'error');
        }
    };

    const handleDelete = (id: number) => {
        setSelectedId(id);
        setDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedId === null) return;
        setIsSubmitting(true);
        try {
            const response = await deleteContactUs(selectedId);
            if(response.success){
                showSnackbar('Contact info deleted successfully', 'success');
                fetchContactInfo();
            } else {
                showSnackbar(response.message, 'error');
            }
        } catch (error: any) {
            showSnackbar(error.message || 'Failed to delete contact info', 'error');
        } finally {
            setIsSubmitting(false);
            setDialogOpen(false);
            setSelectedId(null);
        }
    };

    const handleModalClose = () => {
        setFormModalOpen(false);
        setEditData(null);
    };

    const handleModalSave = () => {
        fetchContactInfo();
        handleModalClose();
    };


    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Paper sx={{ p: 4, m: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" gutterBottom>Contact Us Information</Typography>
                {!loading && contactInfo.length === 0 && (
                    <AppButton
                        label="Create New"
                        onClick={handleCreate}
                        variant="contained"
                    />
                )}
            </Box>
            {contactInfo.map((info, index) => (
                <Box key={info.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'end', mb: 1 }}>
                         <Box sx={{ display: 'flex', gap: 1 }}>
                            <AppButton
                                label="Edit"
                                onClick={() => handleEdit(info.id)}
                                variant="outlined"
                                size="small"
                            />
                            <AppButton
                                label="Delete"
                                onClick={() => handleDelete(info.id)}
                                variant="outlined"
                                sx={{ color: 'error.main', borderColor: 'error.main' }}
                                size="small"
                            />
                         </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                Message Us
                            </Typography>
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: 'grey.50', 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                }}
                                dangerouslySetInnerHTML={{ __html: info.send_us_a_message }}
                            />
                        </Box>
                        
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                Call Us
                            </Typography>
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: 'grey.50', 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                }}
                                dangerouslySetInnerHTML={{ __html: info.call_us }}
                            />
                        </Box>
                        
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                Social Media
                            </Typography>
                            <Box 
                                sx={{ 
                                    p: 2, 
                                    bgcolor: 'grey.50', 
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                }}
                                dangerouslySetInnerHTML={{ __html: info.social_media }}
                            />
                        </Box>
                        
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                Contact Details
                            </Typography>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                                {info.facebook && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'grey.700' }}>
                                            Facebook:
                                        </Typography>
                                        <Typography 
                                            component="a" 
                                            href={info.facebook} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {info.facebook}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {info.whatsapp && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'grey.700' }}>
                                            WhatsApp:
                                        </Typography>
                                        <Typography 
                                            component="a" 
                                            href={info.whatsapp} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {info.whatsapp}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {info.instagram && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'grey.700' }}>
                                            Instagram:
                                        </Typography>
                                        <Typography 
                                            component="a" 
                                            href={info.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {info.instagram}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {info.email && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'grey.700' }}>
                                            Email:
                                        </Typography>
                                        <Typography 
                                            component="a" 
                                            href={`mailto:${info.email}`}
                                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {info.email}
                                        </Typography>
                                    </Box>
                                )}
                                
                                {info.phone_number && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'grey.700' }}>
                                            Phone:
                                        </Typography>
                                        <Typography 
                                            component="a" 
                                            href={`tel:${info.phone_number}`}
                                            sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                        >
                                            {info.phone_number}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    </Box>
                    {index < contactInfo.length - 1 && <Divider sx={{ my: 3 }} />}
                </Box>
            ))}
             <ConfirmationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                description="Are you sure you want to delete this contact information? This action cannot be undone."
                confirmText="Delete"
                isSubmitting={isSubmitting}
            />
            <ContactUsFormModal
                open={formModalOpen}
                onClose={handleModalClose}
                onSaved={handleModalSave}
                initialData={editData}
            />
        </Paper>
    );
} 