import { redirect } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DASHBOARDS | Admin",
  description: "Manage your business with comprehensive dashboards.",
};

function DashboardsPage() {
  // Default to project dashboard, but now users can navigate to /dashboards/admin as well
  redirect(`/dashboards/admin`);
  // redirect("/dashboards/project");
  return null;
}

export default DashboardsPage;
