"use client";
import { useSearchParams } from "next/navigation";
import EditTerm from "../EditTerm";
import { useEffect } from "react";

const EditTermPage = () => {
  const searchParams = useSearchParams();
  const termData = searchParams ? searchParams.get("termData") : null;

  const term = termData
    ? JSON.parse(decodeURIComponent(termData))
    : null;

    useEffect(() => {
    document.title = "Edit Attribute Term | VapeHub";
  }, []);

  console.log("Term data in page component:", term);

  return <EditTerm />;
};

export default EditTermPage;
