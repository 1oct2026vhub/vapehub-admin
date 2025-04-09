import { Metadata } from "next";
import TransactionDetailApp from "./TransactionDetailApp";

export const metadata: Metadata = {
  title: "Transaction Details - Admin Dashboard",
  description: "View details of a transaction",
};

function TransactionDetailPage() {
  return <TransactionDetailApp />;
}

export default TransactionDetailPage; 