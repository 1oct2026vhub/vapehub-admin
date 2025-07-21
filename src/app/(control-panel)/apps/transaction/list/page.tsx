import { Metadata } from "next";
import TransactionListApp from "./TransactionListApp";
import PageBreadcrumb from "@/components/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Transactions | VapeHub",
  description: "List of all transactions in the system",
};

function TransactionListPage() {
  return (
    <div>
      <PageBreadcrumb />
      <TransactionListApp />
    </div>
  );
}

export default TransactionListPage; 