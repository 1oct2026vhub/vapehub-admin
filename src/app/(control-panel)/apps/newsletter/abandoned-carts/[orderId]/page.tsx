import AbandonedCartDetailPageClient from "./AbandonedCartDetailPageClient";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AbandonedCartDetailPage({ params }: PageProps) {
  const { orderId } = await params;
  return <AbandonedCartDetailPageClient orderId={orderId} />;
}
