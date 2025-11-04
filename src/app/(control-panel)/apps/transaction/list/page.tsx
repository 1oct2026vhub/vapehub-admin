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
      <div className="px-6 mt-6">
      <PageBreadcrumb />
      </div>
      <TransactionListApp />
    </div>
  );
}

export default TransactionListPage; 