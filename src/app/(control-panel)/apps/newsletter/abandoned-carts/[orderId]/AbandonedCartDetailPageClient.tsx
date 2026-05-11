"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getAbandonedCartByOrderId } from "@/services/apiAbandonedCarts";

type Props = {
  orderId: string;
};

function prettyLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function AbandonedCartDetailPageClient({ orderId }: Props) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getAbandonedCartByOrderId(orderId);
        if (res?.data && typeof res.data === "object") {
          setDetail(res.data);
        } else {
          setDetail(null);
          showSnackbar(res?.message ?? "No abandoned cart detail found.", "warning");
        }
      } catch (error: unknown) {
        const msg =
          error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : "Failed to load abandoned cart detail.";
        showSnackbar(msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, showSnackbar]);

  const fields = useMemo(() => {
    if (!detail) return [];
    return Object.entries(detail);
  }, [detail]);

  return (
    <Box className="p-6">
      <PageBreadcrumb />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography className="text-3xl font-extrabold leading-none tracking-tight">
          Abandoned cart detail
        </Typography>
        <Button variant="outlined" onClick={() => router.push("/apps/newsletter/abandoned-carts")}>
          Back to abandoned carts
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !detail ? (
        <Typography color="text.secondary">No detail found for order {orderId}.</Typography>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Order ID: {orderId}
            </Typography>
            <Stack spacing={1.25}>
              {fields.map(([key, value]) => (
                <Box key={key}>
                  <Typography variant="body2">
                    <strong>{prettyLabel(key)}:</strong> {formatValue(value)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
