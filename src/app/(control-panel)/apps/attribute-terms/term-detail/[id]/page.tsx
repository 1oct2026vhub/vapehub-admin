// 'use client';

// import TermDetail from '../TermDetail';

// export default function TermDetailPage({ params }: { params: { id: string } }) {
//   return <TermDetail id={params.id} />;
// }

// // 'use client';

// // import TermDetail from '../TermDetail';

// // interface PageProps {
// //   params: {
// //     id: string;
// //   };
// // }

// // // ✅ Explicitly cast `params` to the correct type
// // const TermDetailPage = ({ params }: PageProps) => {
// //   const id = (params as { id: string }).id;
// //   return <TermDetail id={id} />;
// // };

// // export default TermDetailPage;


"use client";
import { useSearchParams } from "next/navigation";
import TermDetail from "../TermDetail";

const TermDetailPage = () => {
  const searchParams = useSearchParams();
  const userData = searchParams.get("userData");

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <TermDetail />
    </div>
  );
};

export default TermDetailPage;