import AdminDashboardApp from './AdminDashboardApp';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | Admin",
  description: "Admin Dashboard with statistics and performance metrics",
};

function AdminDashboardPage() {
  return <AdminDashboardApp />;
}

export default AdminDashboardPage; 