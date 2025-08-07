'use client';

import PromotionalEmailForm from './_components/PromotionalEmailForm';
import PageBreadcrumb from '@/components/PageBreadcrumb';

const PromotionalEmailPageClient = () => {
    return (
        <div className="p-6">
            <PageBreadcrumb />        
            <PromotionalEmailForm />
        </div>
    )
}

export default PromotionalEmailPageClient; 