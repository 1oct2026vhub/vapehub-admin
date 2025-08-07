'use client';

import DealsTable from "@fuse/core/DealsTable";
import DealsHeader from "./DealsHeader";
import { useRouter } from "next/navigation";

function DealsPageClient() {
    const router = useRouter();
    
    const handleCreateClick = () => {
        router.push('/apps/deals/deal-new');
    };

    return (
        <div className="p-4">
            <DealsHeader onCreateClick={handleCreateClick} />
            <DealsTable />
        </div>
    );
}

export default DealsPageClient; 