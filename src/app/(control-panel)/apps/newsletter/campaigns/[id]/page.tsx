import { Metadata } from "next";
import CampaignDetailPageClient from "./CampaignDetailPageClient";

export const metadata: Metadata = {
  title: "Campaign Detail | VapeHub",
};

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  return <CampaignDetailPageClient campaignId={id} />;
}
