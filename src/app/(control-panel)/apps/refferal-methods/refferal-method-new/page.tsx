'use client';

import { Box, Typography } from "@mui/material";
import RefferalMethodForm from "./RefferalMethodForm";

function NewRefferalMethodPage() {
	return (
      <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Create New Refferal Method
      </Typography>
      <RefferalMethodForm />
      </Box>
	);
}

export default NewRefferalMethodPage; 