import OrderDetail from './OrderDetail';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details | Admin",
  description: "View and manage order details",
};

function OrderDetailPage() {
  return <OrderDetail />;
}

export default OrderDetailPage; 