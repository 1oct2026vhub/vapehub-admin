'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const EmailEditor = dynamic(() => import('@/features/email-builder'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#EAEEF3]">
      <div className="animate-pulse text-sm text-gray-600">Loading email builder...</div>
    </div>
  ),
});

export default function EmailBuilderPageClient() {
  const router = useRouter();

  const handlePreview = (html: string) => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <EmailEditor
        onBack={() => router.back()}
        backLabel="Back"
        onPreview={handlePreview}
      />
    </div>
  );
}
