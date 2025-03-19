"use client";
import { useSearchParams } from "next/navigation";
import EditForm from "../EditForm";

const EditattributePage = () => {
  const searchParams = useSearchParams();
  const attributeData = searchParams.get("attributeData");

  const attribute = attributeData
    ? JSON.parse(decodeURIComponent(attributeData))
    : null;

  //   if (!user) return <p>No user data found.</p>;

  return <EditForm attribute={attribute} />;
};

export default EditattributePage;
