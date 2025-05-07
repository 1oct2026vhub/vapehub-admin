// "use client";
// import { useSearchParams } from "next/navigation";
import { Metadata, ResolvingMetadata } from 'next';
import CategoryDetailTable from "../CategoryDetailTable";

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
const defaultTitle = "Category Details | VapeHub";

// const categoryDetailPage = () => {
  // const searchParams = useSearchParams();
  // const categoryData = searchParams.get("userData");

  // const category = categoryData
  //   ? JSON.parse(decodeURIComponent(categoryData))
  //   : null;

  // //   if (!user) return <p>No user data found.</p>;
export default function categoryDetailPage({ params }: Props) {
  return (
    <div className="p-4">
      <CategoryDetailTable />
    </div>
  );
};

// export default categoryDetailPage;
