"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SettingsForm from "../../components/SettingsForm";
import { getSettingDetails } from "@/services/apiSetting";
import FuseLoading from "@fuse/core/FuseLoading";

export default function EditSettingPageClient() {
  const params = useParams();
  const id = params?.id as string;
  const [contentKey, setContentKey] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setError("Invalid setting ID");
      setIsLoading(false);
      return;
    }

    const fetchSetting = async () => {
      try {
        setIsLoading(true);
        const response = await getSettingDetails(id);
        if (response.data?.content_key) {
          setContentKey(response.data.content_key);
        }
      } catch (err: any) {
        console.error("Failed to fetch setting:", err);
        setError(err?.message || "Failed to load setting");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetting();
  }, [id]);

  if (isLoading) {
    return <FuseLoading />;
  }

  if (error || !id || isNaN(Number(id))) {
    return <p className="text-center text-red-500 mt-28">{error || "Invalid setting ID"}</p>;
  }

  return <SettingsForm mode="edit" settingId={id} contentKey={contentKey} />;
}

