"use client";

import EditTerm from "../EditTerm";

export default function EditTermPage({ params }: { params: { id: string } }) {
  return <EditTerm id={params.id} />;
}
