import React, { useMemo } from 'react';
import { Container, Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import ComplianceChart from '../../components/preventiveMaintenance/ComplianceChart';
import { getPreventiveMaintenances } from '../../api/preventiveMaintenance';

const PMCompliance = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { data: maintData } = useQuery(['preventiveMaintenances', 'compliance'], () =>
    getPreventiveMaintenances({ page: 1, limit: 200 })
  );
  const summary = useMemo(() => {
    const list = Array.isArray(maintData)
      ? maintData
      : (maintData?.maintenances || maintData?.data || []);
    const total = list.length || 1;
    const today = new Date();
    const overdue = list.filter((m) => m.nextDueDate && new Date(m.nextDueDate) < today).length;
    const dueSoon = list.filter((m) => {
      if (!m.nextDueDate) return false;
      const due = new Date(m.nextDueDate);
      const days = (due - today) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 30;
    }).length;
    const onTime = Math.max(0, total - overdue - dueSoon);
    const compliance = Math.round(((total - overdue) / total) * 1000) / 10;
    return [
      { label: 'Overall Compliance', value: `${compliance}%` },
      { label: 'On Time', value: `${Math.round((onTime / total) * 1000) / 10}%` },
      { label: 'Due Soon', value: `${Math.round((dueSoon / total) * 1000) / 10}%` },
      { label: 'Overdue', value: `${Math.round((overdue / total) * 1000) / 10}%` },
    ];
  }, [maintData]);

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: isDark ? '#0b1120' : 'transparent' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Compliance Report
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
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Compliance Trends
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => alert('Exporting compliance report...')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Export Report
                </Button>
              </Box>
              <ComplianceChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {summary.map((item) => (
                  <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PMCompliance;
