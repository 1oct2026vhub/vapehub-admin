'use client';

import { useEffect, useState } from 'react';
import { Paper, Typography, CircularProgress, Alert, Box, Divider } from '@mui/material';
import { ContactInfo, listContactUs, deleteContactUs, getContactUsById } from '@/services/apiContactUs';
import AppButton from '@/components/Shared/AppButton';
import ConfirmationDialog from './ConfirmationDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import ContactUsFormModal from './ContactUsFormModal';

export default function ContactUsPage() {
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
                    <Typography variant="h6">Message Us</Typography>
                    <Typography>{info.send_us_a_message}</Typography>
                    <Typography variant="h6">Call Us</Typography>
                    <Typography>{info.call_us}</Typography>
                    <Typography variant="h6">Social Media</Typography>
                    <Typography>{info.social_media}</Typography>
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