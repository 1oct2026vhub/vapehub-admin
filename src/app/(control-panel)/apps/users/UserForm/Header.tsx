import Typography from "@mui/material/Typography";
import { motion } from "motion/react";
import useThemeMediaQuery from "@fuse/hooks/useThemeMediaQuery";
import PageBreadcrumb from "src/components/PageBreadcrumb";

function Header() {
  const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down("lg"));

  return (
    <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        <div>
          <PageBreadcrumb className="mb-2" />
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            New User
          </Typography>
        </div>
      </motion.span>
    </div>
  );
}

export default Header;
