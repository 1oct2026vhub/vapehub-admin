"use client";

import FooterSectionsApp from "./FooterSectionsApp";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function FooterClientWrapper() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <FooterSectionsApp />
    </LocalizationProvider>
  );
} 