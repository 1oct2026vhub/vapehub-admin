import { Suspense } from "react";
import { Metadata } from "next";
import CreateEmailBuilderPageClient from "./CreateEmailBuilderPageClient";

export const metadata: Metadata = {
  title: "Create Email Builder | VapeHub",
};

function EmailBuilderFallback() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center p-6">
      <span className="text-gray-500">Loading email builder…</span>
    </div>
  );
}

export default function CreateEmailBuilderPage() {
  return (
    <Suspense fallback={<EmailBuilderFallback />}>
      <CreateEmailBuilderPageClient />
    </Suspense>
  );
}
