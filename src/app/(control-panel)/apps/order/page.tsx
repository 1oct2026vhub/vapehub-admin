import OrderApp from './OrderApp';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Management | Admin",
  description: "Manage customer orders",
};

function OrderPage() {
  return <OrderApp />;
}

export default OrderPage; 