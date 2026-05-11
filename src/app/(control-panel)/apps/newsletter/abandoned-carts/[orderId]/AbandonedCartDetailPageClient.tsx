"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { getAbandonedCartByOrderId } from "@/services/apiAbandonedCarts";
import { formatDate } from "@/utils/actions";

type Props = {
  orderId: string;
};

type AbandonedCartOrder = {
  id?: number | string;
  order_unique_id?: string;
  status?: string;
  total?: string | number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AbandonedCartUser = {
  id?: number | string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type AbandonedCartCoupon = {
  id?: number | string;
  code?: string | null;
  discount_value?: string | number | null;
  discount_type?: string | null;
};

type AbandonedCartDetail = {
  id?: number | string;
  order_id?: number | string;
  user_id?: number | string;
  coupon_id?: number | string | null;
  order_unique_id?: string;
  customer_email?: string | null;
  first_email_sent_at?: string | null;
  second_email_sent_at?: string | null;
  second_discount_code?: string | null;
  cancelled_at?: string | null;
  recovered_at?: string | null;
  recovered_revenue?: string | number | null;
  status?: string | null;
  last_error?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  order?: AbandonedCartOrder | null;
  user?: AbandonedCartUser | null;
  coupon?: AbandonedCartCoupon | null;
};

function formatLabel(value?: string | null): string {
  if (!value) return "N/A";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function displayText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
}

function displayDate(value: string | null | undefined): string {
  if (!value) return "N/A";
  return formatDate(value);
}

function getStatusColor(
  status?: string | null,
): "success" | "warning" | "error" | "default" {
  const lower = (status ?? "").toLowerCase();
  if (lower === "recovered") return "success";
  if (lower === "cancelled" || lower === "superseded") return "error";
  if (lower === "entered" || lower === "email1_sent" || lower === "email2_sent") return "warning";
  return "default";
}

export default function AbandonedCartDetailPageClient({ orderId }: Props) {
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AbandonedCartDetail | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await getAbandonedCartByOrderId(orderId);
        if (res?.data && typeof res.data === "object") {
          setDetail(res.data as AbandonedCartDetail);
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

  const customerName = useMemo(() => {
    if (!detail?.user) return "N/A";
    const first = detail.user.first_name ?? "";
    const last = detail.user.last_name ?? "";
    const full = `${first} ${last}`.trim();
    return full || "N/A";
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
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {displayText(detail.order_unique_id)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Abandoned Cart ID: {displayText(detail.id)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Order ID: {displayText(detail.order_id)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={formatLabel(detail.status)}
                  color={getStatusColor(detail.status)}
                />
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Customer
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {customerName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {displayText(detail.customer_email ?? detail.user?.email)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>User ID:</strong> {displayText(detail.user_id)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Order
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Order Unique ID:</strong>{" "}
                      {displayText(detail.order?.order_unique_id ?? detail.order_unique_id)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {formatLabel(detail.order?.status)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> {displayText(detail.order?.total)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Reminder & Recovery
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>First Email Sent At:</strong> {displayDate(detail.first_email_sent_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Second Email Sent At:</strong> {displayDate(detail.second_email_sent_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Second Discount Code:</strong> {displayText(detail.second_discount_code)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Recovered Revenue:</strong> {displayText(detail.recovered_revenue)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Recovered At:</strong> {displayDate(detail.recovered_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2">
                    <strong>Cancelled At:</strong> {displayDate(detail.cancelled_at)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Coupon
              </Typography>
              {!detail.coupon ? (
                <Typography variant="body2">N/A</Typography>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Coupon ID:</strong> {displayText(detail.coupon.id)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Code:</strong> {displayText(detail.coupon.code)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Discount Value:</strong> {displayText(detail.coupon.discount_value)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Discount Type:</strong> {formatLabel(detail.coupon.discount_type)}
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                Timeline
              </Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={{ xs: 1, md: 3 }}
                divider={<Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />}
              >
                <Typography variant="body2">
                  <strong>Created:</strong> {displayDate(detail.createdAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Updated:</strong> {displayDate(detail.updatedAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Deleted:</strong> {displayDate(detail.deletedAt)}
                </Typography>
              </Stack>
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2">
                  <strong>Last Error:</strong> {displayText(detail.last_error)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
}
