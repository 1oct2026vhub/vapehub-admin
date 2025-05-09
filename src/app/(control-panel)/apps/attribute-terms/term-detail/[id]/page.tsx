"use client";
import { useSearchParams } from "next/navigation";
import TermDetail from "../TermDetail";

const TermDetailPage = () => {
  const searchParams = useSearchParams();
  const userData = searchParams ? searchParams.get("userData") : null;

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <TermDetail />
    </div>
  );
};

export default TermDetailPage;