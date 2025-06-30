import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";

const navigationConfig: FuseNavItemType[] = [
  {
    id: "example-component",
    title: "Dashboard",
    // translate: 'EXAMPLE',
    type: "item",
    icon: "heroicons-outline:squares-2x2",
    url: "/dashboards/admin",
    // url: "/dashboards/project",
  },
  {
    id: "analytics",
    title: "Analytics",
    // translate: 'EXAMPLE',
    type: "collapse",
    icon: "heroicons-outline:chart-bar",
    children: [
      {
        id: "analytics.overview",
        title: "Realtime Overview",
        type: "item",
        url: "/apps/analytics",
      },
    ],
  },
  {
    id: "attributes",
    title: "Attributes",
    type: "item",
    icon: "heroicons-outline:star", // Clipboard List Icon for Orders
    url: "/apps/attribute",
  },
  {
    id: "terms",
    title: "Attribute Terms",
    type: "item",
    icon: "heroicons-outline:sun", // Clipboard List Icon for Orders
    url: "/apps/attribute-terms",
  },
  {
    id: "apps.ecommerce",
    title: "Products",
    type: "collapse",
    icon: "heroicons-outline:shopping-bag",
    children: [
      {
        id: "product",
        title: "Product",
        type: "item",
        url: "/apps/product",
        end: true,
      },
      {
        id: "brand",
        title: "Product Brand",
        type: "item",
        url: "/apps/product-brand",
        end: true,
      },
      {
        id: "category",
        title: "Product Category",
        type: "item",
        url: "/apps/product-category",
      },
      {
        id: "variants",
        title: "Product Variants",
        type: "item",
        url: "/apps/product-variant",
      },
    ],
  },
  {
    id: "blog",
    title: "Blog",
    type: "collapse",
    icon: "heroicons-outline:pencil-square",
    children: [
      {
        id: "blog.posts",
        title: "Posts",
        type: "item",
        url: "/apps/blog/posts",
        end: true,
      },
      {
        id: "blog.categories",
        title: "Categories",
        type: "item",
        url: "/apps/blog/categories",
        end: true,
      },
      {
        id: "blog.tags",
        title: "Tags",
        type: "item",
        url: "/apps/blog/tags",
        end: true,
      },
    ],
  },
  {
    id: "user",
    title: "Users",
    type: "item",
    icon: "heroicons-outline:user-group", // Clipboard List Icon for Orders
    url: "/apps/users",
  },
  {
    id: "customer",
    title: "Customers",
    type: "item",
    icon: "heroicons-outline:users", // Clipboard List Icon for Orders
    url: "/apps/customer",
  },
  {
    id: "order",
    title: "Order Report",
    type: "item",
    icon: "heroicons-outline:shopping-cart", // Clipboard List Icon for Orders
    url: "/apps/order/list",
  },
  {
    id: "seo",
    title: "SEO",
    type: "collapse",
    icon: "heroicons-outline:globe-alt",
    children: [
      {
        id: "seo.list",
        title: "SEO List",
        type: "item",
        url: "/apps/seo",
      },
    ],
  },
  {
    id: "transaction",
    title: "Transaction",
    // translate: 'EXAMPLE',
    type: "item",
    icon: "heroicons-outline:credit-card",
    url: "/apps/transaction/list",
  },
  {
    id: "website",
    title: "Website",
    type: "collapse",
    icon: "heroicons-outline:globe-alt",
    children: [
      {
        id: "footer",
        title: "Footer Management",
        type: "item",
        url: "/apps/footer",
        end: true,
      },
    ],
  },
    {
    id: "banner",
    title: "Banner",
    type: "item",
    icon: "heroicons-outline:photo", // Changed icon to something more relevant for banners
    url: "/apps/banner",
  },
  {
    id: "carousel",
    title: "Carousel",
    type: "item",
    icon: "heroicons-outline:view-columns",
    url: "/apps/carousel",
  },
  {
    id: "coupon",
    title: "Coupons",
    type: "item",
    icon: "heroicons-outline:ticket",
    url: "/apps/coupon",
  },
  {
    id: "flash-news",
    title: "Flash News",
    type: "item",
    icon: "heroicons-outline:megaphone",
    url: "/apps/flash-news"
  },
  {
    id: "refferal-methods",
    title: "Refferal Methods",
    type: "item",
    icon: "heroicons-outline:gift",
    url: "/apps/refferal-methods"
  },
  {
    id: "menu",
    title: "Menu",
    type: "item",
    icon: "heroicons-outline:bars-3",
    url: "/apps/menu",
  },
  
];

export default navigationConfig;
