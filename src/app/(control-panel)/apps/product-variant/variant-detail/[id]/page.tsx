"use client";
import { useSearchParams } from "next/navigation";
import VariantDetailTable from "../VariantDetailTable";

const VariantDetailPage = () => {
  const searchParams = useSearchParams();
  const categoryData = searchParams ? searchParams.get("userData") : null;

  const category = categoryData
    ? JSON.parse(decodeURIComponent(categoryData))
    : null;

  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <VariantDetailTable />
    </div>
  );
};

export default VariantDetailPage;
