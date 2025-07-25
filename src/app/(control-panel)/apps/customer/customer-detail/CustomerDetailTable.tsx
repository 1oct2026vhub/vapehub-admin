"use client";
import { useParams } from "next/navigation";
import { Paper, Typography, Grid, Box, Avatar, Chip } from "@mui/material";
import { customerDetails } from "@/services/apiService";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { formatDate } from "@/utils/actions";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export type UserType = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: number | null;
  gender: string | null;
  dob: string | null;
  blocked?: boolean;
  createdAt?: string | null;
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [customerDetail, setCustomerDetail] = useState<UserType | null>(null);

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid customer ID</p>;
  }

  const { data, error, isLoading } = useFetch(["customerDetail", id], () =>
    customerDetails(id),
  );

  useEffect(() => {
    if (data?.data) {
      setCustomerDetail(data.data);
    }
  }, [data]);

  if (isLoading) return <FuseLoading />;
  if (error || !customerDetail) {
    return (
      <p className="text-center text-red-500 mt-28">Customer not found!</p>
    );
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const formatGender = (gender: string | null) => {
    if (!gender) return "N/A";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  return (
    <div className="mt-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Customer Details
        </Typography>
      </div>

      <Paper
        className="flex flex-col flex-auto shadow-1 rounded-lg overflow-hidden w-full h-full p-6"
        elevation={1}
      >
        {/* Customer Profile Header */}
        <Box className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: '#2E9970',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            {getInitials(customerDetail.first_name, customerDetail.last_name)}
          </Avatar>
          <Box>
            <Typography variant="h4" className="font-bold text-gray-800">
              {customerDetail.first_name} {customerDetail.last_name}
            </Typography>
            <Typography variant="body1" color="text.secondary" className="mt-1">
              Customer ID: {customerDetail.id}
            </Typography>
            {customerDetail.blocked && (
              <Chip
                label="Blocked"
                color="error"
                size="small"
                className="mt-2"
              />
            )}
          </Box>
        </Box>

        {/* Customer Details Grid */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <EmailIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email Address
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {customerDetail.email}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <PhoneIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {customerDetail.phone || "N/A"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <WcIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {formatGender(customerDetail.gender)}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CakeIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {customerDetail.dob ? formatDate(customerDetail.dob) : "N/A"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <CalendarTodayIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {customerDetail.createdAt ? formatDate(customerDetail.createdAt) : "N/A"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <PersonIcon color="action" />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Account Status
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {customerDetail.blocked ? "Blocked" : "Active"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
}
