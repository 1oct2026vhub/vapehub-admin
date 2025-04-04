import { Metadata } from "next";
import TransactionListApp from "./TransactionListApp";

export const metadata: Metadata = {
  title: "Transactions - Admin Dashboard",
  description: "List of all transactions in the system",
};

function TransactionListPage() {
  return <TransactionListApp />;
}

export default TransactionListPage; 