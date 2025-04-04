"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import { motion } from "motion/react";
import TransactionsTable from "../components/TransactionsTable";
import { TransactionStatus, TransactionType } from "@/services/apiTransaction";

function TransactionListApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    TransactionStatus | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(
    undefined
  );

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <div>
                <Typography variant="h4" fontWeight="bold">
                  Transactions
                </Typography>
              </div>
            </Box>
          </Grid>

          {/* Transaction Summary Cards */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Typography color="text.secondary" variant="subtitle1">
                  Total Transactions
                </Typography>
                <Typography className="mt-2 text-3xl font-bold">543</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Typography color="text.secondary" variant="subtitle1">
                  Completed Transactions
                </Typography>
                <Typography className="mt-2 text-3xl font-bold text-green-600">
                  432
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Typography color="text.secondary" variant="subtitle1">
                  Failed Transactions
                </Typography>
                <Typography className="mt-2 text-3xl font-bold text-red-600">
                  21
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Typography color="text.secondary" variant="subtitle1">
                  Total Revenue
                </Typography>
                <Typography className="mt-2 text-3xl font-bold text-blue-600">
                  $43,250
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <TransactionsTable
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              searchQuery={searchQuery}
            />
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
}

export default TransactionListApp;
