"use client";
import { useSearchParams } from "next/navigation";
import EditForm from "../EditForm";

const EditUserPage = () => {
  const searchParams = useSearchParams();
  const userData = searchParams ? searchParams.get("userData") : null;

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

  //   if (!user) return <p>No user data found.</p>;

  return <EditForm user={user} />;
};

export default EditUserPage;
