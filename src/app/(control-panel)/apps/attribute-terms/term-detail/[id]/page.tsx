'use client';

import TermDetail from '../TermDetail';

export default function TermDetailPage({ params }: { params: { id: string } }) {
  return <TermDetail id={params.id} />;
}

// 'use client';

// import TermDetail from '../TermDetail';

// interface PageProps {
//   params: {
//     id: string;
//   };
// }

// // ✅ Explicitly cast `params` to the correct type
// const TermDetailPage = ({ params }: PageProps) => {
//   const id = (params as { id: string }).id;
//   return <TermDetail id={id} />;
// };

// export default TermDetailPage;


