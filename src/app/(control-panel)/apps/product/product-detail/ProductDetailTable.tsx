"use client";
import { useParams } from "next/navigation";
import {
  Paper,
  Typography,
  Grid,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Tabs,
  Tab,
  Stack,
  Container,
} from "@mui/material";
import { getProduct } from "@/services/apiProduct";
import { useFetch } from "@/hooks/useFetch";
import FuseLoading from "@fuse/core/FuseLoading";
import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import parse from "html-react-parser";

// Add custom breadcrumb configuration
const getBreadcrumbItems = (productId: string | number) => [
  { label: "Home", link: "/" },
  { label: "Product", link: "/apps/product" },
  { label: "Product-Detail", link: "#", disabled: true },
];

// Component to add a red asterisk to required fields
const RequiredField = ({ children }: { children: React.ReactNode }) => (
  <span className="relative">
    {children}
    {/* <span className="text-red-600 absolute -right-3 top-0">*</span> */}
  </span>
);

interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface ProductAttributeTerm {
  id: number;
  attribute_id: number;
  term_id: number;
  is_visible_page: boolean;
  used_in_variation: boolean;
  attribute: {
    id: number;
    name: string;
    slug: string;
  };
  term: {
    id: number;
    name: string;
    slug: string;
  };
}

interface VariantAttribute {
  id: number;
  variant_id: number;
  attribute_id: number;
  term_id: number;
  is_visible: boolean;
  used_in_variation: boolean;
  term: {
    id: number;
    name: string;
    slug: string;
  };
  attribute: {
    id: number;
    name: string;
    type: string;
  };
}

interface Variant {
  id: number;
  product_id: number;
  slug: string;
  price: string;
  discount_price: string;
  purchase_price: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  description: string;
  barcode: string;
  stock: number;
  low_stock_threshold: number;
  stock_status: string;
  status: string;
  variantImages: ProductImage[];
  variantAttributes: VariantAttribute[];
}

export interface ProductType {
  id: number;
  name: string;
  description: string;
  price: string | null;
  discount_price: string;
  stock_quantity: number | null;
  slug: string;
  brand_id: number;
  category_id: number;
  createdAt: string;
  Category: {
    id: number;
    name: string;
    slug: string;
  };
  Brand: {
    id: number;
    name: string;
    slug: string;
  };
  ProductImages: ProductImage[];
  productAttributeTerms: ProductAttributeTerm[];
  variants: Variant[];
}

export default function ProductDetailTable() {
  const params = useParams();
  const idParam = params?.id;
  const [tabValue, setTabValue] = useState(0);

  // Ensure ID is properly cast as a number or set to `null` if invalid
  const id = Array.isArray(idParam)
    ? parseInt(idParam[0])
    : parseInt(idParam || "");
  const [productDetail, setProductDetail] = useState<ProductType | null>(null);

  if (!id || isNaN(Number(id))) {
    return <p className="text-center text-red-500">Invalid product ID</p>;
  }

  const { data, error, isLoading } = useFetch(["getProduct", id], () =>
    getProduct(id)
  );

  useEffect(() => {
    if (data?.data) {
      setProductDetail(data.data);
    }
  }, [data]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) return <FuseLoading />;
  if (error || !productDetail) {
    return <p className="text-center text-red-500 mt-28">Product not found!</p>;
  }

  return (
    <div className="mt-10">
      <div>
        <PageBreadcrumb className="mt-8" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight mb-4 mt-8">
          Product Details
        </Typography>
      </div>

      <Grid container spacing={3}>
        {/* Images Section */}
        <Grid item xs={12} md={5}>
          <Paper
            className="shadow-1 rounded-lg overflow-hidden p-4 h-full"
            elevation={1}
          >
            <Typography variant="h6" className="mb-4 font-bold">
              <RequiredField>Product Images</RequiredField>
              {/* ({productDetail.ProductImages.length}) */}
            </Typography>
            <Box
              sx={{
                maxHeight: "500px",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#bdbdbd",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                },
              }}
            >
              {productDetail.ProductImages?.length > 0 ? (
                <Grid container spacing={2}>
                  {productDetail.ProductImages.map((image) => (
                    <Grid item xs={12} sm={6} key={image.id}>
                      <Card className="h-full" elevation={2}>
                        <CardMedia
                          component="img"
                          image={image.image_url}
                          alt={productDetail.name}
                          sx={{ height: 200, objectFit: "contain" }}
                        />
                        <CardContent className="px-2 py-1">
                          <Chip
                            label={image.is_primary ? "Primary" : "Secondary"}
                            color={image.is_primary ? "primary" : "default"}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <div className="flex items-center justify-center mt-12">
                  <Typography variant="h6" className="">
                    No Image Found !
                  </Typography>
                </div>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Basic Details Section - No asterisk since it's not required */}
        <Grid item xs={12} md={7}>
          <Paper
            className="shadow-1 rounded-lg overflow-hidden p-4 h-full"
            elevation={1}
          >
            <Typography variant="h6" className="mb-4 font-bold">
              Basic Information
            </Typography>
            <Box
              sx={{
                maxHeight: "500px",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#bdbdbd",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                },
              }}
            >
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        component="th"
                        width="30%"
                        className="font-semibold"
                      >
                        <RequiredField>Name</RequiredField>
                      </TableCell>
                      <TableCell>{productDetail.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" className="font-semibold">
                        <RequiredField>Slug</RequiredField>
                      </TableCell>
                      <TableCell>{productDetail.slug}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" className="font-semibold">
                        Category
                      </TableCell>
                      <TableCell>
                        {productDetail.Category?.name || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" className="font-semibold">
                        Brand
                      </TableCell>
                      <TableCell>
                        {productDetail.Brand?.name || "N/A"}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell component="th" className="font-semibold">
                        Created At
                      </TableCell>
                      <TableCell>
                        {new Date(productDetail.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            // hour: '2-digit',
                            // minute: '2-digit'
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Description Section */}
        {/* <Grid item xs={12}>
          <Paper
            className="shadow-1 rounded-lg overflow-hidden p-4"
            elevation={1}
          >
            <Typography variant="h6" className="mb-2 font-bold">
              Description
            </Typography>
            <Divider className="mb-3" />
            <Box
              sx={{
                maxHeight: "300px",
                overflowY: "auto",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#bdbdbd",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                },
              }}
            >
              <div className="description-content">
                {productDetail.description
                  ? parse(productDetail.description)
                  : "No description available"}
              </div>
            </Box>
          </Paper>
        </Grid> */}

        {/* Attributes and Variants Tabs */}
        <Grid item xs={12}>
          <Paper
            className="shadow-1 rounded-lg overflow-hidden p-4"
            elevation={1}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="product tabs"
              sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            >
              <Tab
                label={
                  <span className="flex items-center">
                    Attributes
                    {/* <span className="text-red-600 ml-1">*</span> */}
                    <span className="ml-1">
                      ({productDetail.productAttributeTerms.length})
                    </span>
                  </span>
                }
                id="tab-0"
                aria-controls="tabpanel-0"
              />
              <Tab
                label={
                  <span className="flex items-center">
                    Variants
                    {/* <span className="text-red-600 ml-1">*</span> */}
                    <span className="ml-1">
                      ({productDetail.variants.length})
                    </span>
                  </span>
                }
                id="tab-1"
                aria-controls="tabpanel-1"
              />
            </Tabs>

            <div
              role="tabpanel"
              hidden={tabValue !== 0}
              id="tabpanel-0"
              aria-labelledby="tab-0"
            >
              {tabValue === 0 && (
                <div className="py-2">
                  <Box
                    sx={{
                      maxHeight: "500px",
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#bdbdbd",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                      },
                    }}
                  >
                    {productDetail.productAttributeTerms.length > 0 ? (
                      <TableContainer>
                        <Table stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell className="font-bold bg-gray-100">
                                <RequiredField>Attribute</RequiredField>
                              </TableCell>
                              <TableCell className="font-bold bg-gray-100">
                                <RequiredField>Term</RequiredField>
                              </TableCell>
                              <TableCell className="font-bold bg-gray-100">
                                Used in Variation
                              </TableCell>
                              <TableCell className="font-bold bg-gray-100">
                                Visible on Page
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {productDetail.productAttributeTerms.map(
                              (attributeTerm) => (
                                <TableRow key={attributeTerm.id}>
                                  <TableCell>
                                    {attributeTerm.attribute.name}
                                  </TableCell>
                                  <TableCell>
                                    {attributeTerm.term.name}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={
                                        attributeTerm.used_in_variation
                                          ? "Yes"
                                          : "No"
                                      }
                                      color={
                                        attributeTerm.used_in_variation
                                          ? "success"
                                          : "default"
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={
                                        attributeTerm.is_visible_page
                                          ? "Yes"
                                          : "No"
                                      }
                                      color={
                                        attributeTerm.is_visible_page
                                          ? "success"
                                          : "default"
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box className="text-center p-4">
                        <Typography color="textSecondary">
                          No attributes found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </div>
              )}
            </div>

            <div
              role="tabpanel"
              hidden={tabValue !== 1}
              id="tabpanel-1"
              aria-labelledby="tab-1"
            >
              {tabValue === 1 && (
                <div className="py-2">
                  <Box
                    sx={{
                      maxHeight: "600px",
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: "8px",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#bdbdbd",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                      },
                    }}
                  >
                    {productDetail.variants.length > 0 ? (
                      <Stack spacing={3}>
                        {productDetail.variants.map((variant) => (
                          <Card
                            key={variant.id}
                            elevation={2}
                            className="border border-gray-200"
                          >
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      mb: 2,
                                      p: 1,
                                      backgroundColor: "#f5f5f5",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      className="font-bold"
                                    >
                                      <RequiredField>
                                        Variant: {variant.slug}
                                      </RequiredField>
                                    </Typography>
                                    <Chip
                                      label={`ID: ${variant.id}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={variant.status}
                                      color={
                                        variant.status === "active"
                                          ? "success"
                                          : "default"
                                      }
                                      size="small"
                                      sx={{ ml: "auto" }}
                                    />
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <Typography
                                    variant="subtitle2"
                                    className="font-bold mb-2 pb-1 border-b"
                                  >
                                    Pricing & Inventory
                                  </Typography>
                                  <Box
                                    sx={{
                                      maxHeight: "300px",
                                      overflowY: "auto",
                                      pr: 1,
                                      "&::-webkit-scrollbar": {
                                        width: "6px",
                                      },
                                      "&::-webkit-scrollbar-thumb": {
                                        backgroundColor: "#bdbdbd",
                                        borderRadius: "3px",
                                      },
                                    }}
                                  >
                                    <TableContainer>
                                      <Table size="small">
                                        <TableBody>
                                          <TableRow>
                                            <TableCell
                                              className="font-semibold"
                                              width="40%"
                                            >
                                              Price
                                            </TableCell>
                                            <TableCell>
                                              ${variant.price}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Discount Price
                                            </TableCell>
                                            <TableCell>
                                              ${variant.discount_price}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Purchase Price
                                            </TableCell>
                                            <TableCell>
                                              ${variant.purchase_price}
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Stock
                                            </TableCell>
                                            <TableCell>
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                }}
                                              >
                                                {variant.stock}
                                                <Chip
                                                  label={variant.stock_status}
                                                  size="small"
                                                  color={
                                                    variant.stock_status ===
                                                    "in_stock"
                                                      ? "success"
                                                      : "error"
                                                  }
                                                />
                                              </Box>
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Low Stock Threshold
                                            </TableCell>
                                            <TableCell>
                                              {variant.low_stock_threshold}
                                            </TableCell>
                                          </TableRow>
                                          {/* <TableRow>
                                            <TableCell className="font-semibold">
                                              Dimensions
                                            </TableCell>
                                            <TableCell>
                                              {variant.length} × {variant.width}{" "}
                                              × {variant.height}
                                            </TableCell>
                                          </TableRow> */}
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Weight
                                            </TableCell>
                                            {variant.weight != null ? (
                                              <TableCell>
                                                {variant.weight} gm
                                              </TableCell>
                                            ) : (
                                              <p>N/A</p>
                                            )}
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Height
                                            </TableCell>
                                            {variant.height != null ? (
                                              <TableCell>
                                                {variant.height} cm
                                              </TableCell>
                                            ) : (
                                              <p>N/A</p>
                                            )}
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Length
                                            </TableCell>
                                            {variant.length != null ? (
                                              <TableCell>
                                                {variant.length} cm
                                              </TableCell>
                                            ) : (
                                              <p>N/A</p>
                                            )}
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Width
                                            </TableCell>
                                            {variant.width != null ? (
                                              <TableCell>
                                                {variant.width} cm
                                              </TableCell>
                                            ) : (
                                              <p>N/A</p>
                                            )}
                                          </TableRow>
                                          <TableRow>
                                            <TableCell className="font-semibold">
                                              Barcode
                                            </TableCell>
                                            <TableCell>
                                              {variant.barcode || "N/A"}
                                            </TableCell>
                                          </TableRow>
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                  <Typography
                                    variant="subtitle2"
                                    className="font-bold mb-2 pb-1 border-b"
                                  >
                                    Variant Attributes
                                  </Typography>
                                  <Box
                                    sx={{
                                      height:
                                        variant.variantAttributes.length > 0
                                          ? "150px"
                                          : "auto",
                                      overflowY: "auto",
                                      mb: 3,
                                      "&::-webkit-scrollbar": {
                                        width: "6px",
                                      },
                                      "&::-webkit-scrollbar-thumb": {
                                        backgroundColor: "#bdbdbd",
                                        borderRadius: "3px",
                                      },
                                    }}
                                  >
                                    {variant.variantAttributes.length > 0 ? (
                                      <TableContainer>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell className="font-semibold bg-gray-50">
                                                Attribute
                                              </TableCell>
                                              <TableCell className="font-semibold bg-gray-50">
                                                Term
                                              </TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {variant.variantAttributes.map(
                                              (attr) => (
                                                <TableRow key={attr.id}>
                                                  <TableCell>
                                                    {attr.attribute.name}
                                                  </TableCell>
                                                  <TableCell>
                                                    {attr.term.name}
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    ) : (
                                      <Typography className="text-center p-4 text-gray-500">
                                        No attributes for this variant
                                      </Typography>
                                    )}
                                  </Box>

                                  <Typography
                                    variant="subtitle2"
                                    className="font-bold mb-2 pb-1 border-b"
                                  >
                                    Variant Images
                                  </Typography>
                                  <Box
                                    sx={{
                                      height:
                                        variant.variantImages.length > 0
                                          ? "180px"
                                          : "auto",
                                      overflowY: "auto",
                                      "&::-webkit-scrollbar": {
                                        width: "6px",
                                      },
                                      "&::-webkit-scrollbar-thumb": {
                                        backgroundColor: "#bdbdbd",
                                        borderRadius: "3px",
                                      },
                                    }}
                                  >
                                    {variant.variantImages.length > 0 ? (
                                      <Grid container spacing={1}>
                                        {variant.variantImages.map((image) => (
                                          <Grid item xs={6} key={image.id}>
                                            <Card
                                              className="h-full"
                                              elevation={1}
                                            >
                                              <CardMedia
                                                component="img"
                                                image={image.image_url}
                                                alt={variant.slug}
                                                sx={{
                                                  height: 120,
                                                  objectFit: "contain",
                                                }}
                                              />
                                              <CardContent className="px-2 py-1">
                                                <Chip
                                                  label={
                                                    image.is_primary
                                                      ? "Primary"
                                                      : "Secondary"
                                                  }
                                                  color={
                                                    image.is_primary
                                                      ? "primary"
                                                      : "default"
                                                  }
                                                  size="small"
                                                />
                                              </CardContent>
                                            </Card>
                                          </Grid>
                                        ))}
                                      </Grid>
                                    ) : (
                                      <Typography className="text-center p-2 text-gray-500">
                                        No variant-specific images
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>

                                {/* {variant.description && (
                                  <Grid item xs={12}>
                                    <Typography
                                      variant="subtitle2"
                                      className="font-bold mt-2 pb-1 border-b"
                                    >
                                      Description
                                    </Typography>
                                    <Box
                                      className="border border-gray-200 rounded p-3 mt-1"
                                      sx={{
                                        maxHeight: "120px",
                                        overflowY: "auto",
                                        "&::-webkit-scrollbar": {
                                          width: "6px",
                                        },
                                        "&::-webkit-scrollbar-thumb": {
                                          backgroundColor: "#bdbdbd",
                                          borderRadius: "3px",
                                        },
                                      }}
                                    >
                                      {variant.description}
                                    </Box>
                                  </Grid>
                                )} */}
                              </Grid>
                            </CardContent>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Box className="text-center p-4">
                        <Typography color="textSecondary">
                          No variants found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </div>
              )}
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
