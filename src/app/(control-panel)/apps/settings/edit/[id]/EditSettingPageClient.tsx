"use client";

import { useParams } from "next/navigation";
import SettingsForm from "../../components/SettingsForm";

export default function EditSettingPageClient() {
  const params = useParams();
  const id = params?.id as string;

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500 mt-28">Invalid setting ID</p>;
  }

  return <SettingsForm mode="edit" settingId={id} />;
}

