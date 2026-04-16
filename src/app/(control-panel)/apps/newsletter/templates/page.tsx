import { Metadata } from "next";
import NewsletterTemplatesPageClient from "./NewsletterTemplatesPageClient";

export const metadata: Metadata = {
  title: "Email Templates | VapeHub",
};

export default function NewsletterTemplatesPage() {
  return <NewsletterTemplatesPageClient />;
}
