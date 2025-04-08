import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
  {
    id: "example-component",
    title: "Dashboard",
    // translate: 'EXAMPLE',
    type: "item",
    icon: "heroicons-outline:squares-2x2",
    url: "/dashboards/project",
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
  // {
  //   id: "order",
  //   title: "Order Report",
  //   type: "collapse",
  //   icon: "heroicons-outline:shopping-cart",
  //   children: [
  //     {
  //       id: "statics",
  //       title: "Order Statistics",
  //       type: "item",
  //       url: "/apps/order/list",
  //       end: true,
  //     },
  //     {
  //       id: "list",
  //       title: "Order List",
  //       type: "item",
  //       url: "",
  //       end: true,
  //     },
  //   ],
  // },
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
      }
    ],
  },
  // {
  //   id: "order",
  //   title: "Order List",
  //   type: "item",
  //   icon: "heroicons-outline:shopping-cart", // Clipboard List Icon for Orders
  //   url: "",
  // },
  // {
  // 	id: 'apps.forgotPassword',
  // 	title: 'Authentication',
  // 	type: 'collapse',
  // 	icon: 'heroicons-outline:lock-closed',
  // 	children: [
  // 		{
  // 			id: 'forgotPassword',
  // 			title: 'Forgot Password',
  // 			type: 'item',
  // 			url: '/pages/authentication/forgot-password',
  // 			end: true
  // 		}
  // 	]
  // }
];

export default navigationConfig;
