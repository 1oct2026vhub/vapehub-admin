import { Metadata } from "next";
import CreateEmailBuilderPageClient from "../../create-email-builder/CreateEmailBuilderPageClient";

export const metadata: Metadata = {
  title: "Edit Email Builder | VapeHub",
};

type EditEmailBuilderPageProps = {
  params: {
    id: string;
  };
};

export default function EditEmailBuilderPage({ params }: EditEmailBuilderPageProps) {
  return <CreateEmailBuilderPageClient initialTemplateId={params.id} />;
}

