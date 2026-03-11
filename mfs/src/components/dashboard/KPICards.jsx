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
        cursor: link ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': link ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
        p: 0,
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}.light`, color: `${color}.main`, borderRadius: 1.5, width: 44, height: 44 }}>
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
