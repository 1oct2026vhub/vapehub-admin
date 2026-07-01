import { listUser } from "@/services/apiService";
import type { BlogAuthorOption } from "./blogPostFormShared";

export type BlogAuthorListUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  roleId?: number;
  roles?: { id?: number; role?: string };
};

export function isSuperAdminUser(user: BlogAuthorListUser): boolean {
  return user.roles?.role === "super_admin";
}

export function mapUserToAuthorOption(user: BlogAuthorListUser): BlogAuthorOption {
  return {
    id: user.id,
    label:
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email ||
      `User #${user.id}`,
  };
}

export async function fetchSuperAdminAuthorOptions(
  searchTerm: string,
  superAdminRoleId?: number,
): Promise<BlogAuthorOption[]> {
  const response = await listUser({
    search: searchTerm,
    limit: 50,
    ...(superAdminRoleId ? { roleId: superAdminRoleId } : {}),
  });

  const users: BlogAuthorListUser[] =
    response?.data?.users || response?.users || [];

  return users.filter(isSuperAdminUser).map(mapUserToAuthorOption);
}
