"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import FaqForm from '../FaqForm';
import { getFaqById, type FaqItem } from '@/services/apiFaq';

export default function EditFaqPage() {
  const searchParams = useSearchParams();

  const faqId = useMemo(() => {
    const value = searchParams.get('faqId');
    if (!value) return null;

    const parsedId = Number(value);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  }, [searchParams]);

  const [faqToEdit, setFaqToEdit] = useState<FaqItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!faqId) {
      setFaqToEdit(null);
      setError('FAQ ID is missing or invalid.');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadFaq = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getFaqById(faqId);

        if (!isMounted) {
          return;
        }

        if (!response?.success || !response?.data) {
          setFaqToEdit(null);
          setError(response?.message || 'Failed to load FAQ details.');
          return;
        }

        setFaqToEdit(response.data);
      } catch (fetchError: any) {
        if (!isMounted) {
          return;
        }

        console.error('Error fetching FAQ data:', fetchError);
        setFaqToEdit(null);
        setError(
          fetchError?.response?.data?.message ||
            fetchError?.message ||
            'Failed to load FAQ details.'
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFaq();

    return () => {
      isMounted = false;
    };
  }, [faqId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading FAQ details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!faqToEdit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">FAQ data not found.</Alert>
      </Box>
    );
  }

  return <FaqForm mode="edit" faqToEdit={faqToEdit} />;
}
