import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useActivity } from '../../contexts/ActivityContext';

const RecentActivity = ({ activities: propActivities = null }) => {
  const { activities: contextActivities } = useActivity();
  const normalizeActivities = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.activities)) return value.activities;
    return [];
  };
  const propList = normalizeActivities(propActivities);
  const activities = propList.length ? propList : normalizeActivities(contextActivities);

  if (!activities || activities.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No recent activity
        </Typography>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'in_progress':
        return '#3b82f6';
      case 'overdue':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <Box>
      {activities.slice(0, 10).map((activity, index) => (
        <React.Fragment key={activity.id || index}>
          <ListItem alignItems="flex-start" sx={{ pb: 2, pt: 2 }}>
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: getStatusColor(activity.status) + '20',
                  color: getStatusColor(activity.status),
                  fontSize: '1.2rem',
                }}
              >
                {activity.icon}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {activity.title}
                  </Typography>
                  {activity.status && (
                    <Chip
                      label={activity.status.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: getStatusColor(activity.status) + '30',
                        color: getStatusColor(activity.status),
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box component="span">
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {activity.description}
                  </Typography>
                  <Box component="span" sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    {activity.user && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        User: {activity.user}
                      </Typography>
                    )}
                    {activity.timestamp && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        Time: {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </Typography>
                    )}
                  </Box>
                </Box>
              }
            />
          </ListItem>
          {index < Math.min(10, activities.length) - 1 && <Divider sx={{ my: 1 }} />}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default RecentActivity;




