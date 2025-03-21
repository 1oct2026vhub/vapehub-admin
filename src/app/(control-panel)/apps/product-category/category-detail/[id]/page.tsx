"use client";
import { useSearchParams } from "next/navigation";
import CategoryDetailTable from "../CategoryDetailTable";

const categoryDetailPage = () => {
  const searchParams = useSearchParams();
  const categoryData = searchParams.get("userData");

  const category = categoryData
    ? JSON.parse(decodeURIComponent(categoryData))
    : null;

  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <CategoryDetailTable />
    </div>
  );
};

export default categoryDetailPage;
