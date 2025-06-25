import { SeoHealth } from '@/services/apiSeo';
import { Box, Typography, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Paper, Grid } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface SeoHealthIndicatorProps {
  health: SeoHealth | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'green':
      return 'success.main';
    case 'orange':
      return 'warning.main';
    case 'red':
      return 'error.main';
    default:
      return 'grey.500';
  }
};

function SeoHealthIndicator({ health }: SeoHealthIndicatorProps) {
  if (!health) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>SEO Health Analysis</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={health.score}
              size={90}
              thickness={4}
              sx={{ color: getStatusColor(health.status) }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" component="div" color="text.secondary">
                {`${Math.round(health.score)}%`}
              </Typography>
            </Box>
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 1, textTransform: 'capitalize' }}>
            {health.status}
          </Typography>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>Issues:</Typography>
            <List dense>
              {health.details.issues.map((issue, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ErrorOutlineIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Recommendations:</Typography>
            <List dense>
              {health.details.recommendations.map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleOutlineIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={rec} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default SeoHealthIndicator; 