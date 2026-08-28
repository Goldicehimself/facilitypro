import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
} from '@mui/material';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KPICard = ({ title, value, change, trend, icon, color, link }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <Card
      className="bg-card"
      sx={{
        height: '100%',
        borderRadius: '18px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 16px 45px -36px rgba(15,23,42,.7)',
        overflow: 'hidden',
        position: 'relative',
        cursor: link ? 'pointer' : 'default',
        transition: 'transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease, border-color .3s ease',
        '&:hover': link ? {
          transform: 'translateY(-6px)',
          boxShadow: '0 22px 55px -34px rgba(37,99,235,.45)',
          borderColor: 'rgba(37,99,235,.28)',
          '& .kpi-icon': { transform: 'scale(1.08) rotate(-4deg)' },
        } : {},
        p: 0,
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box className="kpi-icon" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}.light`, color: `${color}.main`, borderRadius: 3, width: 48, height: 48, transition: 'transform .3s ease' }}>
          {icon}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>

        {trend && (
          <Chip
            icon={trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            label={change}
            size="small"
            color={trend === 'up' ? 'success' : 'error'}
            sx={{ height: 28, borderRadius: '999px' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
