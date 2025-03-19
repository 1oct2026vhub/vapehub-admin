import useSWR from "swr";
import { listRole } from "@/services/apiService";

export const useRoles = (queryParams = {}) => {
  const { data, mutate } = useSWR(["roleList", queryParams], () =>
    listRole(queryParams),
  );

  console.log("Roles Data:", data || "No data received");

  return {
    roles: data?.roles, // Ensure it's always an array
    mutate,
  };
};
