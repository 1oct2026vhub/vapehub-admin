// "use client";

// import EditTerm from "../EditTerm";

// export default function EditTermPage({ params }: { params: { id: string } }) {
//   return <EditTerm id={params.id} />;
// }

"use client";
import { useSearchParams } from "next/navigation";
import EditTerm from "../EditTerm";

const EditTermPage = () => {
  const searchParams = useSearchParams();
  const userData = searchParams.get("userData");

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <EditTerm />
    </div>
  );
};

export default EditTermPage;
