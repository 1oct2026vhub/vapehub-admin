'use client'
import { useSearchParams } from 'next/navigation';
import CustomerDetailTable from '../CustomerDetailTable';

const CustomerDetailPage = () => {
  const searchParams = useSearchParams();
  const userData = searchParams.get('userData');

  const user = userData ? JSON.parse(decodeURIComponent(userData)) : null;

//   if (!user) return <p>No user data found.</p>;

  return (
  <div className='p-4'>
  <CustomerDetailTable  />
  </div>
)};

export default CustomerDetailPage;
