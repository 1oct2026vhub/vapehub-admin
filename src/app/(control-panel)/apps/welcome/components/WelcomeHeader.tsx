'use client';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import AppButton from '@/components/Shared/AppButton';
interface WelcomeHeaderProps {
  onAddClick: () => void;
}

function WelcomeHeader() {

  return (
    <div className="flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 py-6 sm:py-8 p-4 sm:p-6">
      <motion.span
        initial={{ x: -20 }}
        animate={{ x: 0, transition: { delay: 0.2 } }}
      >
        <div>
          <PageBreadcrumb className="mb-2" />
          <Typography className="text-4xl font-extrabold leading-none tracking-tight">
            Welcome
          </Typography>
        </div>
      </motion.span>
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
      >
        {/* <AppButton
          label="Add Welcome Content"
          variant="contained"
          startIcon={<FuseSvgIcon>heroicons-outline:plus</FuseSvgIcon>}
          onClick={onAddClick}
        /> */}
      </motion.div>
    </div>
  );
}

export default WelcomeHeader;

