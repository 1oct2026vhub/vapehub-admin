'use client';

import { Typography } from "@mui/material";
import DealForm from "../DealForm";
import PageBreadcrumb from "@/components/PageBreadcrumb";

function NewDealPageClient() {
    return (
        <div className="p-4">
          <PageBreadcrumb />
            <Typography variant="h4" component="h1" className="mb-4 font-bold">
                Create New Deal
            </Typography>
            <DealForm />
        </div>
    );
}

export default NewDealPageClient; 