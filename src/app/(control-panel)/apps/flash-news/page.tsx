import { Metadata } from 'next';
import React from 'react';
import FlashNewsTable from './FlashNewsTable';
import FlashNewsHeader from './FlashNewsHeader';

// metadata is a server-side export
export const metadata: Metadata = {
  title: 'Flash News | VapeHub',
};

const FlashNewsListPage = () => {
  return (
    <div className="p-4">
      <FlashNewsHeader />
      <FlashNewsTable />
    </div>
  );
};
export default FlashNewsListPage; 