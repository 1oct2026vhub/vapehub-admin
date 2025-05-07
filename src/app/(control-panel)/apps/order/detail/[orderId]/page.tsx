import { Metadata, ResolvingMetadata } from 'next';
import OrderDetailApp from './OrderDetailApp';

type Props = {
  params: { orderId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const orderId = params.orderId;

  // optionally, fetch data to generate metadata (e.g., order details)
  // const order = await fetch(`https://.../orders/${orderId}`).then((res) => res.json());

  return {
    title: `Order Details - #${orderId} | VapeHub`,
    description: `View the details for order ${orderId}.`,
    // openGraph: {
    //   title: `Order Details - #${orderId}`,
    //   description: `Details for order ${orderId}`,
    //   // images: [order.imageUrl || '/default-order-image.png'],
    // },
  };
}

// The page component itself
// Ensure it receives params if it needs the orderId for rendering
// export default function Page({ params }: Props) {
//   return <OrderDetailApp orderId={params.orderId} />;
// }
// If OrderDetailApp already handles fetching or uses a client-side hook for orderId, 
// the existing export default OrderDetailApp; might be fine.
// For clarity, explicitly passing orderId might be better if OrderDetailApp is a server component
// or needs it as a direct prop.

export default OrderDetailApp; // Assuming OrderDetailApp handles its own data fetching or context for orderId