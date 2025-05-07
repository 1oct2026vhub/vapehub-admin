import { Metadata, ResolvingMetadata } from 'next';
import TransactionDetailApp from "./TransactionDetailApp";

type Props = {
  params: { transactionId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const transactionId = params.transactionId;

  // optionally, fetch data to generate metadata (e.g., transaction details)
  // const transaction = await fetch(`https://.../transactions/${transactionId}`).then((res) => res.json());

  return {
    title: `Transaction #${transactionId} | VapeHub`,
    description: `View details for transaction ${transactionId}.`,
    // openGraph: {
    //   title: `Transaction #${transactionId} - Admin Dashboard | VapeHub`,
    //   description: `Details for transaction ${transactionId}`,
    //   // images: [transaction.imageUrl || '/default-transaction-image.png'],
    // },
  };
}

// The page component itself
// The existing function TransactionDetailPage() can likely remain as is if 
// TransactionDetailApp uses a hook like useParams() from 'next/navigation' 
// to get the transactionId on the client side, or if it's passed through context.
// If TransactionDetailApp needs transactionId as a direct prop from a Server Component page,
// you would adjust like this:
// export default function TransactionDetailPage({ params }: Props) {
//   return <TransactionDetailApp transactionId={params.transactionId} />;
// }

function TransactionDetailPage() {
  return <TransactionDetailApp />;
}

export default TransactionDetailPage; 