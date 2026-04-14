import { Suspense } from "react";
import GroupsPageClient from "./GroupsPageClient";

export const metadata = {
  title: "Newsletter Groups",
};

export default function GroupsPage() {
  return (
    <Suspense>
      <GroupsPageClient />
    </Suspense>
  );
}
