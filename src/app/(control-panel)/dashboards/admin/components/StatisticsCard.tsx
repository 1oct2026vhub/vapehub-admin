"use client";

import { Card, CardContent, Typography, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';

interface StatisticsCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}

const StatisticsCard = ({ title, value, icon, color, subtitle }: StatisticsCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case 'sales':
        return <AttachMoneyIcon />;
      case 'orders':
        return <ShoppingCartIcon />;
      case 'users':
        return <PersonIcon />;
      case 'products':
        return <InventoryIcon />;
      case 'lowStock':
        return <WarningAmberIcon />;
      case 'outOfStock':
        return <RemoveShoppingCartIcon />;
      default:
        return <AttachMoneyIcon />;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}20`,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ color }}>
              {getIcon()}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard; 