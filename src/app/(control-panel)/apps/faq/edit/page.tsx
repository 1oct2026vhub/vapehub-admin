"use client";

import { useSearchParams } from "next/navigation";
import FaqForm from '../FaqForm';
import { type FaqItem } from '@/services/apiFaq';

export default function EditFaqPage() {
  const searchParams = useSearchParams();
  
  // Get FAQ data from URL parameters
  const faqData = searchParams.get('faqData');
  let faqToEdit: FaqItem | null = null;
  
  if (faqData) {
    try {
      faqToEdit = JSON.parse(decodeURIComponent(faqData));
    } catch (error) {
      console.error('Error parsing FAQ data:', error);
    }
  }

  return <FaqForm mode="edit" faqToEdit={faqToEdit} />;
}
