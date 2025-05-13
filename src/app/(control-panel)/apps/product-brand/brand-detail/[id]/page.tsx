// import { useSearchParams } from "next/navigation";
'use client'
import { useSearchParams, useParams } from "next/navigation";
import BrandDetailDisplay from "../BrandDetailTable";
import { useEffect } from "react";




type Props = {
  params: { id: string };
};

// export async function generateMetadata(
//   { params }: Props,
//   parent: ResolvingMetadata
// ): Promise<Metadata> {
//   return {
//     title: defaultTitle,
//   };
// }
  // const id = params.id;
// const defaultTitle = "Brand Details | VapeHub";
const BrandDetailPage = () => {
  const searchParams = useSearchParams();
  const params = useParams();
  useEffect(() => {
    document.title = "Product Brand Details | VapeHub";
  }, []);

  const userData = searchParams ? searchParams.get("userData") : null;

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;
  const id = params ? params.id : null;
  //   if (!user) return <p>No user data found.</p>;

  return (
    <div className="p-4">
      <BrandDetailDisplay />
    </div>
  );
};

export default BrandDetailPage;

// export default function BrandDetailPage({ params }: Props) {
//   return (
//     <div className="p-4">
//       <BrandDetailDisplay />
//     </div>
//   );
// }

