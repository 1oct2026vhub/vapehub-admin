import { Metadata } from "next";
import SettingsForm from "../components/SettingsForm";

export const metadata: Metadata = {
  title: "Create Setting | Admin",
  description: "Create a new setting",
};

export default function CreateSettingPage() {
  return <SettingsForm mode="create" />;
}

