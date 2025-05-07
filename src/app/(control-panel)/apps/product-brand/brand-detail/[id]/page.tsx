// import { useSearchParams } from "next/navigation";
import BrandDetailDisplay from "../BrandDetailTable";
import { Metadata, ResolvingMetadata } from 'next';


type Props = {
  params: { id: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return {
    title: defaultTitle,
  };
}
  // const id = params.id;
const defaultTitle = "Brand Details | VapeHub";
// const BrandDetailPage = () => {
//   const searchParams = useSearchParams();
//   const userData = searchParams.get("userData");

//   const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

//   //   if (!user) return <p>No user data found.</p>;

//   return (
//     <div className="p-4">
//       <BrandDetailDisplay />
//     </div>
//   );
// };

// export default BrandDetailPage;

export default function BrandDetailPage({ params }: Props) {
  return (
    <div className="p-4">
      <BrandDetailDisplay />
    </div>
  );
}

