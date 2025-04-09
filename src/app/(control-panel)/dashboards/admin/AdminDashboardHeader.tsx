"use client";

import { Typography, Box, Button, Paper, Breadcrumbs } from "@mui/material";
import Link from "next/link";
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { usePathname } from "next/navigation";

const AdminDashboardHeader = () => {
  const pathname = usePathname();

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Admin Dashboard
          </Typography>
          <Breadcrumbs aria-label="breadcrumb">
            <Link href="/" passHref>
              <Box
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                  textDecoration: "none",
                }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Box>
            </Link>
            <Link href="/dashboards" passHref>
              <Box
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                  textDecoration: "none",
                }}
              >
                <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboards
              </Box>
            </Link>
            <Typography
              color="text.primary"
              sx={{ display: "flex", alignItems: "center" }}
            >
              Admin
            </Typography>
          </Breadcrumbs>
        </Box>
        {/* <Box>
          <Button 
            variant="contained" 
            color="primary"
            href="/dashboards/project"
            sx={{ mr: 2 }}
          >
            Project Dashboard
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
          >
            Export Reports
          </Button>
        </Box> */}
      </Box>
    </Paper>
  );
};

export default AdminDashboardHeader;
