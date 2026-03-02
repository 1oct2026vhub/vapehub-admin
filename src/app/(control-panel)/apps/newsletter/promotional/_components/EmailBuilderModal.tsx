'use client';

import React, { Suspense, lazy } from 'react';
import { Dialog, DialogContent, Box, CircularProgress } from '@mui/material';

const EmailEditor = lazy(() => import('@/features/email-builder'));

interface EmailBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (html: string, subject?: string) => void;
}

function EmailBuilderModal({ open, onClose, onConfirm }: EmailBuilderModalProps) {
  const handleSave = (html: string, subject?: string) => {
    onConfirm(html, subject);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      maxWidth={false}
      PaperProps={{
        sx: {
          bgcolor: '#EAEEF3',
          '& .MuiDialogContent-root': { p: 0, overflow: 'hidden' },
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {open && (
          <Suspense
            fallback={
              <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
                <CircularProgress />
              </Box>
            }
          >
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <EmailEditor
                onBack={onClose}
                onSave={handleSave}
                backLabel="Close"
                onPreview={(html, subject) => {
                  const w = window.open('', '_blank');
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                  }
                }}
              />
            </Box>
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EmailBuilderModal;
