import { Metadata } from 'next';
import React from 'react';
import CouponTable from '@fuse/core/CouponTable';
import CouponHeader from './CouponHeader';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Coupons | VapeHub',
};

const CouponListPage: React.FC = () => {
  return (
    <div className="p-4">
      <CouponHeader />
      <CouponTable />
    </div>
  );
};

export default CouponListPage; 