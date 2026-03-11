import React from 'react';
import { Box, Typography, Chip } from '@mui/material';

const TimelineItem = ({ item, isLast }) => {
  const statusColor = (s) => {
    if (!s) return 'default';
    const st = s.toLowerCase();
    if (st.includes('urgent') || st.includes('corrective')) return 'error';
    if (st.includes('normal') || st.includes('preventive')) return 'success';
    return 'default';
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Box sx={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#2c5aa0', mt: '6px' }} />
        {!isLast && <Box sx={{ width: 2, flex: 1, backgroundColor: '#e6eef8', mt: 1 }} />}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>{item.woNumber || item.title}</Typography>
          <Typography variant="caption" color="text.secondary">{item.date}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {item.type && <Chip size="small" label={item.type} />}
          {item.status && <Chip size="small" label={item.status} color={statusColor(item.status)} />}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Technician: {item.technician} • {item.timeHours || 0} hrs • ${item.cost || 0}</Typography>
      </Box>
    </Box>
  );
};

const MaintenanceTimeline = ({ items = [] }) => {
  if (!items || items.length === 0) return <Typography variant="body2" color="text.secondary">No maintenance history found</Typography>;
  return (
    <Box>
      {items.map((it, idx) => (
        <TimelineItem key={it.id} item={it} isLast={idx === items.length - 1} />
      ))}
    </Box>
  );
};

export default MaintenanceTimeline;