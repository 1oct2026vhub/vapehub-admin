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
import { Carousel } from '@/types/carousel';

interface DraggableCarouselCardProps {
  carousel: Carousel;
  onDelete: (carousel: Carousel) => void;
  onRestore?: (carousel: Carousel) => void;
}

const DraggableCarouselCard: React.FC<DraggableCarouselCardProps> = ({
  carousel,
  onDelete,
  onRestore,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: carousel.id.toString(),
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
          cursor: 'pointer',
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

        <Link 
          href={`/apps/carousel/${carousel.id}`} 
          passHref 
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box sx={{ height: '100%' }}>
            {carousel.image_url && (
              <CardMedia
                component="img"
                sx={{ height: 160, objectFit: 'cover', borderBottom: '1px solid #eee' }}
                image={carousel.image_url_low || carousel.image_url}
                alt={carousel.title}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src === carousel.image_url_low && carousel.image_url) {
                    target.src = carousel.image_url;
                  } else {
                    target.src = '/assets/images/placeholder/16x9.svg';
                    target.style.objectFit = 'contain';
                  }
                }}
              />
            )}
            {!carousel.image_url && (
              <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderBottom: '1px solid #eee' }}>
                <Typography variant="caption" color="textSecondary">No Image</Typography>
              </Box>
            )}
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography gutterBottom variant="h6" component="div" noWrap title={carousel.title}>
                {carousel.title}
              </Typography>
              {/* {carousel.description && (
                <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '40px' }} title={carousel.description}>
                  {carousel.description}
                </Typography>
              )} */}
            </CardContent>
          </Box>
        </Link>

        <Stack 
          direction="row" 
          spacing={0.5} 
          justifyContent="flex-end" 
          sx={{ p: 1, borderTop: '1px solid #eee' }}
          onClick={(e) => e.stopPropagation()}
        >
          {carousel.deletedAt && onRestore ? (
            <Tooltip title="Restore Carousel">
              <IconButton size="small" onClick={() => onRestore(carousel)}>
                <RestoreFromTrashIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Edit Carousel">
                <IconButton size="small" component={Link} href={`/apps/carousel/${carousel.id}/edit`}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Carousel">
                <IconButton size="small" onClick={() => onDelete(carousel)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </Card>
    </Box>
  );
};

export default DraggableCarouselCard; 