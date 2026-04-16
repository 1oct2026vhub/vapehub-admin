import { Metadata } from "next";
import CreateEmailBuilderPageClient from "../../create-email-builder/CreateEmailBuilderPageClient";

export const metadata: Metadata = {
  title: "Edit Email Builder | VapeHub",
};

type EditEmailBuilderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEmailBuilderPage({ params }: EditEmailBuilderPageProps) {
  const { id } = await params;
  return <CreateEmailBuilderPageClient initialTemplateId={id} />;
}

