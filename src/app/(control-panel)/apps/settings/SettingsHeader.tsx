"use client";

import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import AppButton from "@/components/Shared/AppButton";

interface SettingsHeaderProps {
  availableContentKeysCount: number;
  existingSettingsCount: number;
}

const SettingsHeader = ({ availableContentKeysCount, existingSettingsCount }: SettingsHeaderProps) => {
  const router = useRouter();

  const handleCreateClick = () => {
    router.push("/apps/settings/new");
  };

  // Show button only if there are available content keys left
  const canCreateMore = existingSettingsCount < availableContentKeysCount;

  return (
    <div className="flex w-full mb-4">
      <div className="flex flex-col sm:flex-row flex-auto sm:items-center sm:justify-between min-w-0 pb-0 md:pb-0">
        <div className="flex flex-col flex-auto">
          <Typography className="text-3xl font-semibold tracking-tight leading-8">
            Settings
          </Typography>
          <Typography className="font-medium tracking-tight" color="text.secondary">
            Manage application settings
          </Typography>
        </div>
        {canCreateMore && (
          <div className="flex items-center mt-4 sm:mt-0">
            <AppButton
              label="Create Setting"
              onClick={handleCreateClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsHeader;

