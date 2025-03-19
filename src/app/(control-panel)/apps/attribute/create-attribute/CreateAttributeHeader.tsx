"use client";

import { Typography } from "@mui/material";
import FuseSvgIcon from "@fuse/core/FuseSvgIcon";
import { motion } from "framer-motion";
import AppButton from "@/components/Shared/AppButton";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

function CreateAttributeHeader() {
  const router = useRouter();
  const { formState, handleSubmit } = useForm();

  return (
    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-32 px-24 md:px-32">
      <div className="flex flex-col items-center sm:items-start space-y-8 sm:space-y-0 w-full sm:max-w-full min-w-0">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { delay: 0.3 } }}
        >
          <Typography
            className="flex items-center sm:mb-12"
            component={motion.span}
            role="button"
            tabIndex={0}
            onClick={() => router.back()}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                router.back();
              }
            }}
          >
            <FuseSvgIcon size={20}>heroicons-outline:arrow-left</FuseSvgIcon>
            <span className="flex mx-4 font-medium">Back</span>
          </Typography>
        </motion.div>

        <div className="flex items-center max-w-full">
          <motion.div
            className="flex flex-col items-center sm:items-start min-w-0 mx-8 sm:mx-16"
            initial={{ x: -20 }}
            animate={{ x: 0, transition: { delay: 0.3 } }}
          >
            <Typography className="text-16 sm:text-20 truncate font-semibold">
              New Attribute
            </Typography>
            <Typography variant="caption" className="font-medium">
              Create a new attribute
            </Typography>
          </motion.div>
        </div>
      </div>
      <motion.div
        className="flex"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }}
      >
        <AppButton
          className="whitespace-nowrap mx-4"
          variant="contained"
          label="Save"
          type="submit"
          disabled={!formState.isDirty}
          onClick={() => {
            const form = document.querySelector("form");
            if (form) {
              form.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true }),
              );
            }
          }}
        />
      </motion.div>
    </div>
  );
}

export default CreateAttributeHeader;
