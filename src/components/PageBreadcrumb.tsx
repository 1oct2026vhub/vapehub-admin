"use client";

import Breadcrumbs, { BreadcrumbsProps } from "@mui/material/Breadcrumbs";
import { FuseNavItemType } from "@fuse/core/FuseNavigation/types/FuseNavItemType";
import usePathname from "@fuse/hooks/usePathname";

import Typography from "@mui/material/Typography";
import clsx from "clsx";
import Link from "@fuse/core/Link";
import useNavigation from "./theme-layouts/components/navigation/hooks/useNavigation";

type PageBreadcrumbProps = BreadcrumbsProps & {
  className?: string;
  skipHome?: boolean;
  isDetailPage?: boolean;
};

// Function to get the navigation item based on URL
function getNavigationItem(
  url: string,
  navigationItems: FuseNavItemType[]
): FuseNavItemType {
  for (const item of navigationItems) {
    if (item.url === url) {
      return item;
    }

    if (item.children) {
      const childItem = getNavigationItem(url, item.children);

      if (childItem) {
        return childItem;
      }
    }
  }
  return null;
}

function PageBreadcrumb(props: PageBreadcrumbProps) {
  const { className, skipHome = false, ...rest } = props;
  const pathname = usePathname();
  const { navigation } = useNavigation();

  // Split the path and filter out empty parts
  const pathParts = pathname.split("/").filter(Boolean);

  // Create breadcrumbs without "apps" in the titles
  const crumbs = pathParts.reduce(
    (
      acc: { title: string; url: string; isDetailPage: boolean }[],
      part,
      index
    ) => {
      // Skip "apps" in the breadcrumb display
      if (part === "apps") {
        return acc;
      }

      // Build the current URL including all parts up to this one
      // This ensures correct navigation even though we're not showing "apps"
      const urlParts = pathParts.slice(0, index + 1);
      const url = `/${urlParts.join("/")}`;

      // Get the nav item for proper title
      const navItem = getNavigationItem(url, navigation);
      const title = navItem?.title || part;

      // Check if this is a detail page or has an ID
      const isDetailPage = part.includes('-detail') || part.includes('-edit') || Boolean(part.match(/^\d+$/));
      
      // For detail pages, the breadcrumb should navigate to the parent list page
      let crumbUrl = url;
      if (isDetailPage) {
        // Handle specific cases for proper navigation
        if (part === 'coupon-edit') {
          crumbUrl = '/apps/coupon';
        } else if (part.includes('-edit')) {
          // For other edit pages, navigate to the parent section
          const parentPart = part.replace('-edit', '');
          crumbUrl = `/apps/${parentPart}`;
        } else if (part.includes('-detail')) {
          // For detail pages, navigate to the parent section
          const parentPart = part.replace('-detail', '');
          crumbUrl = `/apps/${parentPart}`;
        } else {
          // For ID-based pages, navigate to the parent section
          const parentIndex = index - 1;
          if (parentIndex >= 0) {
            const parentUrlParts = pathParts.slice(0, parentIndex + 1);
            crumbUrl = `/${parentUrlParts.join("/")}`;
          }
        }
      }

      acc.push({
        title,
        url: crumbUrl,
        isDetailPage,
      });
      return acc;
    },
    skipHome ? [] : [{ title: "Dashboard", url: "/", isDetailPage: false }]
  );

  return (
    <Breadcrumbs
      classes={{ ol: "list-none m-0 p-0" }}
      className={clsx("flex w-full", className)}
      aria-label="breadcrumb"
      color="primary"
      {...rest}
    >
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1;
        const isClickable = !item.isDetailPage && !isLast;

        return (
          <Typography
            component={isClickable ? Link : "span"}
            to={isClickable ? item.url : undefined}
            key={index}
            className={clsx(
              "block font-medium tracking-tight capitalize max-w-32 truncate",
              !isClickable && "cursor-default"
            )}
            role={isClickable ? "button" : "none"}
            onClick={!isClickable ? (e) => e.preventDefault() : undefined}
          >
            {item.title}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
}

export default PageBreadcrumb;
