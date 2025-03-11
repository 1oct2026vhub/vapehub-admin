import { redirect } from 'next/navigation';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DASHBOARDS | VapeHub",
  description: "Manage your projects efficiently with VapeHub's dashboard.",
};

function DashboardsPage() {
	redirect(`/dashboards/project`);
	return null;
}

export default DashboardsPage;
