'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Box,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';
import { type ShippingMethod } from '@/services/apiShippingMethod';

interface DraggableShippingMethodCardProps {
  shippingMethod: ShippingMethod;
  onDelete: (shippingMethod: ShippingMethod) => void;
  onRestore?: (shippingMethod: ShippingMethod) => void;
  onView?: (shippingMethod: ShippingMethod) => void;
  showDeleted?: boolean;
}

const DraggableShippingMethodCard: React.FC<DraggableShippingMethodCardProps> = ({
  shippingMethod,
  onDelete,
  onRestore,
  onView,
  showDeleted = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: shippingMethod.id.toString(),
    disabled: showDeleted || !!shippingMethod.deletedAt,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)' : 'none',
    zIndex: isDragging ? 10 : 'auto',
  };

  const isDeleted = showDeleted || !!shippingMethod.deletedAt;

  return (
    <Box sx={{ display: 'flex', width: '100%' }} ref={setNodeRef} style={style}>
      <Card 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          width: '100%',
          position: 'relative',
          cursor: isDeleted ? 'default' : 'pointer',
          opacity: isDeleted ? 0.7 : 1,
          '&:hover': {
            boxShadow: '0px 5px 15px rgba(0,0,0,0.1)'
          }
        }}
      >
        {!isDeleted && (
          <Box
            {...attributes}
            {...listeners}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              cursor: 'grab',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              padding: '4px',
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }
            }}
          >
            <DragIndicatorIcon fontSize="small" />
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1, pt: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom variant="h6" component="div" noWrap title={shippingMethod.shipping_method}>
              {shippingMethod.shipping_method}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              minHeight: '40px'
            }} title={shippingMethod.description}>
              {shippingMethod.description}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" component="div">
              <strong>Display:</strong> <span dangerouslySetInnerHTML={{ __html: shippingMethod.display_text || '' }} />
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={`£${shippingMethod.shipping_cost}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Order: ${shippingMethod.method_order}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={shippingMethod.is_enabled ? "Enabled" : "Disabled"}
              size="small"
              color={shippingMethod.is_enabled ? "success" : "default"}
            />
          </Stack>

          {shippingMethod.carrier_code && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Carrier:</strong> {shippingMethod.carrier_code}
              </Typography>
            </Box>
          )}

          {shippingMethod.service_code && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Service:</strong> {shippingMethod.service_code}
              </Typography>
            </Box>
          )}
        </CardContent>

        <Stack 
          direction="row" 
          spacing={0.5} 
          justifyContent="flex-end" 
          sx={{ p: 1, borderTop: '1px solid #eee' }}
          onClick={(e) => e.stopPropagation()}
        >
          {isDeleted ? 
            ( onRestore &&
              <Tooltip title="Restore Shipping Method">
                <IconButton size="small" onClick={() => onRestore(shippingMethod)}>
                  <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                {onView && (
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => onView(shippingMethod)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Edit Shipping Method">
                  <IconButton size="small" component={Link} href={`/apps/shipping-methods/edit/${shippingMethod.id}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Shipping Method">
                  <IconButton size="small" onClick={() => onDelete(shippingMethod)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )
          }
        </Stack>
      </Card>
    </Box>
  );
};

export default DraggableShippingMethodCard;
