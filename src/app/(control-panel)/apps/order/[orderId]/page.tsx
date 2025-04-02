import OrderDetail from './OrderDetail';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Admin",
  description: "View and manage order details",
};

interface OrderDetailPageProps {
  params: {
    orderId: string;
  };
}

function OrderDetailPage({ params }: OrderDetailPageProps) {
  return <OrderDetail orderId={parseInt(params.orderId)} />;
}

export default OrderDetailPage; 