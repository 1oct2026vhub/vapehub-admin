"use client";

import { useParams } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { getUserDetail } from "@/services/apiService";
import EditForm from "../EditForm";
import type { FormType } from "../EditForm";
import FuseLoading from "@fuse/core/FuseLoading";
import { Alert } from "@mui/material";

function mapApiUserToFormType(apiUser: any): FormType | null {
  const dataObj = apiUser?.data ?? apiUser;
  const user = dataObj?.user ?? dataObj;
  if (!user?.id) return null;
  return {
    id: String(user.id),
    first_name: user.first_name ?? user.firstName ?? "",
    last_name: user.last_name ?? user.lastName ?? "",
    phone: user.phone ?? "",
    dob: user.dob
      ? new Date(user.dob).toISOString().split("T")[0]
      : "",
    roleId: typeof user.roleId === "number" ? user.roleId : Number(user.role_id ?? user.roleId) || 1,
    gender: user.gender ?? "other",
  };
}

const EditUserPage = () => {
  const params = useParams();
  const id = params?.id as string | undefined;

  const { data, error, isLoading } = useFetch(
    ["userDetail", id],
    () => getUserDetail(id),
    {},
    { skip: !id }
  );

  const user = data ? mapApiUserToFormType(data) : null;

  if (!id) {
    return (
      <Alert severity="error" className="m-4">
        Invalid user ID
      </Alert>
    );
  }

  if (isLoading) return <FuseLoading />;

  if (error || !user) {
    return (
      <div className="p-4">
        <Alert severity="error">
          {error?.message || "User not found. Please try again."}
        </Alert>
      </div>
    );
  }

  return <EditForm user={user} />;
};

export default EditUserPage;
