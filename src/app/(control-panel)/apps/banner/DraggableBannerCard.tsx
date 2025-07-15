'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Link from 'next/link';
import { type BannerItem } from '@/services/apiBanner';

interface DraggableBannerCardProps {
  banner: BannerItem;
  onDelete: (banner: BannerItem) => void;
  onRestore?: (banner: BannerItem) => void;
}

const DraggableBannerCard: React.FC<DraggableBannerCardProps> = ({
  banner,
  onDelete,
  onRestore,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    boxShadow: isDragging ? '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)' : 'none',
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <Box sx={{ display: 'flex', width: '100%' }} ref={setNodeRef} style={style}>
      <Card 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          width: '100%',
          position: 'relative',
          cursor: banner.deletedAt ? 'default' : 'pointer',
          '&:hover': {
            boxShadow: '0px 5px 15px rgba(0,0,0,0.1)'
          }
        }}
      >
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

        {banner.deletedAt ? (
            <Box sx={{ height: '100%' }}>
              {banner.image_url && (
                <CardMedia
                  component="img"
                  sx={{ height: 160, objectFit: 'cover', borderBottom: '1px solid #eee' }}
                  image={banner.image_url_low || banner.image_url}
                  alt={banner.title}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src === banner.image_url_low && banner.image_url) {
                      target.src = banner.image_url;
                    } else {
                      target.src = '/assets/images/placeholder/16x9.svg';
                      target.style.objectFit = 'contain';
                    }
                  }}
                />
              )}
              {!banner.image_url && (
                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderBottom: '1px solid #eee' }}>
                  <Typography variant="caption" color="textSecondary">No Image</Typography>
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap title={banner.title}>
                  {banner.title}
                </Typography>
              </CardContent>
            </Box>
        ) : (
          <Link 
            href={`/apps/banner/${banner.id}`} 
            passHref 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box sx={{ height: '100%' }}>
              {banner.image_url && (
                <CardMedia
                  component="img"
                  sx={{ height: 160, objectFit: 'cover', borderBottom: '1px solid #eee' }}
                  image={banner.image_url_low || banner.image_url}
                  alt={banner.title}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src === banner.image_url_low && banner.image_url) {
                      target.src = banner.image_url;
                    } else {
                      target.src = '/assets/images/placeholder/16x9.svg';
                      target.style.objectFit = 'contain';
                    }
                  }}
                />
              )}
              {!banner.image_url && (
                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderBottom: '1px solid #eee' }}>
                  <Typography variant="caption" color="textSecondary">No Image</Typography>
                </Box>
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap title={banner.title}>
                  {banner.title}
                </Typography>
                {/* {banner.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '40px' }} title={banner.description}>
                    {banner.description}
                  </Typography>
                )} */}
              </CardContent>
            </Box>
          </Link>
        )}

        <Stack 
          direction="row" 
          spacing={0.5} 
          justifyContent="flex-end" 
          sx={{ p: 1, borderTop: '1px solid #eee' }}
          onClick={(e) => e.stopPropagation()}
        >
          {banner.deletedAt ? 
            ( onRestore &&
              <Tooltip title="Restore Banner">
                <IconButton size="small" onClick={() => onRestore(banner)}>
                  <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Edit Banner">
                  <IconButton size="small" component={Link} href={`/apps/banner/edit/${banner.id}`}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Banner">
                  <IconButton size="small" onClick={() => onDelete(banner)}>
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

export default DraggableBannerCard; 