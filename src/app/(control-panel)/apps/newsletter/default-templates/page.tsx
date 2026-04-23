import { Metadata } from "next";
import DefaultNewsletterTemplatesPageClient from "./DefaultNewsletterTemplatesPageClient";

export const metadata: Metadata = {
  title: "Default Email Templates | VapeHub",
};

export default function DefaultNewsletterTemplatesPage() {
  return <DefaultNewsletterTemplatesPageClient />;
}
