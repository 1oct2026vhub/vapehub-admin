import { Metadata } from "next";
import CampaignHistoryPageClient from "./CampaignHistoryPageClient";

export const metadata: Metadata = {
  title: "Email Campaign History | VapeHub",
};

export default function CampaignHistoryPage() {
  return <CampaignHistoryPageClient />;
}
