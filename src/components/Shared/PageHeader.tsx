import Typography from '@mui/material/Typography';
import PageBreadcrumb from 'src/components/PageBreadcrumb';
import AppButton from '@/components/Shared/AppButton';
import Link from 'next/link';
import React from 'react';

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, actionLabel, actionHref, onActionClick, className }) => {
  return (
    <div className={`flex grow-0 flex-1 w-full items-center justify-between space-y-2 sm:space-y-0 ${className ?? ''}`}>
      <div>
        <PageBreadcrumb className="mb-2" />
        <Typography className="text-4xl font-extrabold leading-none tracking-tight">
          {title}
        </Typography>
      </div>
      {actionLabel && (
        actionHref ? (
          <AppButton label={actionLabel} component={Link} href={actionHref} />
        ) : (
          <AppButton label={actionLabel} onClick={onActionClick} />
        )
      )}
    </div>
  );
};

export default PageHeader;
