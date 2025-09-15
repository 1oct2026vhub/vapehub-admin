"use client";

import { useSearchParams } from "next/navigation";
import ContactUsForm from '../ContactUsForm';

export default function EditContactUsPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('id');

  return <ContactUsForm mode="edit" contactId={contactId ? Number(contactId) : null} />;
}
