import React from 'react';
import CouponTable from '@fuse/core/CouponTable';
import CouponHeader from './CouponHeader';

const CouponListPage: React.FC = () => {
  return (
    <div className="p-4">
      <CouponHeader />
      <CouponTable />
    </div>
  );
};

export default CouponListPage; 