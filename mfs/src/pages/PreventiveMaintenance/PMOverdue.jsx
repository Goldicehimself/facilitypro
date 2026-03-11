import React, { useMemo } from 'react';
import { Container, Box, Typography, Button, Card, CardContent, Chip, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { getPreventiveMaintenances } from '../../api/preventiveMaintenance';

const PMOverdue = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { data: maintData, isLoading } = useQuery(['preventiveMaintenances', 'overdue'], () =>
    getPreventiveMaintenances({ page: 1, limit: 200 })
  );
  const overdueTasks = useMemo(() => {
    const list = Array.isArray(maintData)
      ? maintData
      : (maintData?.maintenances || maintData?.data || []);
    const today = new Date();
    return list.filter((task) => task.nextDueDate && new Date(task.nextDueDate) < today);
  }, [maintData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: isDark ? '#0b1120' : 'transparent' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Overdue PM Tasks
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/preventive-maintenance')}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Back to Preventive Maintenance
        </Button>
      </Box>
      <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 2.5 }}>
          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading overdue tasks...
            </Typography>
          ) : overdueTasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No overdue PM tasks.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {overdueTasks.map((task) => (
                <Box
                  key={task.id || task._id}
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 1, bgcolor: isDark ? '#0f172a' : '#f9fafb' }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#111827', fontSize: '0.9rem' }}>
                      {task.name}
                    </Typography>
                    <Typography variant="caption" color="#6b7280" sx={{ fontWeight: 500, color: isDark ? '#94a3b8' : '#6b7280' }}>
                      {task.asset?.name || 'Unknown Asset'} • Due {task.nextDueDate ? new Date(task.nextDueDate).toLocaleDateString() : 'TBD'}
                    </Typography>
                  </Box>
                  <Chip
                    label={(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                    size="small"
                    color={task.priority === 'critical' || task.priority === 'high' ? 'error' : 'warning'}
                    variant="filled"
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PMOverdue;
