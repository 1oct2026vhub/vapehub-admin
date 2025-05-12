"use client";
import { useSearchParams } from "next/navigation";
import EditForm from "../EditForm";
import { useEffect } from "react";

const EditUserPage = () => {
  const searchParams = useSearchParams();
  const brandData = searchParams ? searchParams.get("brandData") : null;

  const brand = brandData ? JSON.parse(decodeURIComponent(brandData)) : null;
useEffect(() => {
    document.title = "Update Product  Brand  | VapeHub";
  }, []);
  //   if (!user) return <p>No user data found.</p>;

  return <EditForm brand={brand} />;
};

export default EditUserPage;

// 'use client'
// import { useSearchParams } from 'next/navigation';
// import EditForm from '../EditForm';

// const EditUserPage = () => {
//   const searchParams = useSearchParams();
//   const brandId = searchParams.get('brandId');

// //   const brand = brandData ? JSON.parse(decodeURIComponent(brandData)) : null;

// //   if (!user) return <p>No user data found.</p>;

//   return <EditForm brandId={brandId} />;
// };

// export default EditUserPage;
