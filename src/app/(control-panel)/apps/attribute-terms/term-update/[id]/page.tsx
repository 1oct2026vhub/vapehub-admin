"use client";
import { useSearchParams } from "next/navigation";
import EditTerm from "../EditTerm";

const EditTermPage = () => {
  const searchParams = useSearchParams();
  const termData = searchParams ? searchParams.get("termData") : null;

  const term = termData
    ? JSON.parse(decodeURIComponent(termData))
    : null;

  console.log("Term data in page component:", term);

  return <EditTerm />;
};

export default EditTermPage;
