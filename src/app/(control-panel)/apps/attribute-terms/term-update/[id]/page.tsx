"use client";
import EditTerm from "../EditTerm";
import { useEffect } from "react";

const EditTermPage = () => {
  useEffect(() => {
    document.title = "Edit Attribute Term | VapeHub";
  }, []);

  // EditTerm will fetch term data by ID using getAttributeTermDetails API
  return <EditTerm />;
};

export default EditTermPage;
