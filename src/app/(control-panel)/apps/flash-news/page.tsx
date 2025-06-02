import React from 'react';
import FlashNewsTable from './FlashNewsTable';
import FlashNewsHeader from './FlashNewsHeader';

const FlashNewsListPage = () => {
  return (
    <div className="p-4">
      <FlashNewsHeader />
      <FlashNewsTable />
    </div>
  );
};
export default FlashNewsListPage; 