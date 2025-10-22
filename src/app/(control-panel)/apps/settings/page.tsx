import { Metadata } from "next";
import SettingsPageClient from "./SettingsPageClient";

export const metadata: Metadata = {
  title: "Settings | Admin",
  description: "Manage application settings",
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}

