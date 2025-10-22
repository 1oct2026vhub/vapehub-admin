import { Metadata } from "next";
import EditSettingPageClient from "./EditSettingPageClient";

export const metadata: Metadata = {
  title: "Edit Setting | Admin",
  description: "Edit setting",
};

export default function EditSettingPage() {
  return <EditSettingPageClient />;
}

