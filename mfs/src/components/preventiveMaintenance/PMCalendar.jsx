import React, { useMemo, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  Button,
  Popover,
  Paper,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday,
  subMonths,
  addMonths,
} from 'date-fns';
import { useQuery, useQueryClient } from 'react-query';
import { getPreventiveMaintenances, updatePreventiveMaintenance } from '../../api/preventiveMaintenance';

/* =========================
   Constants
========================= */
const PRIORITY_COLOR = {
  critical: '#dc2626',
  high: '#fb923c',
  medium: '#f59e0b',
  low: '#10b981',
};

/* =========================
   Component
========================= */
export default function PMCalendar() {
  const navigate = useNavigate();
  const closeTimerRef = useRef(null);
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [popover, setPopover] = useState({ anchor: null, event: null });
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({
    id: '',
    dateTime: '',
    frequency: ''
  });
  const { data: maintenanceResponse = [], isLoading } = useQuery(
    ['preventiveMaintenances', { page: 1, limit: 300 }],
    () => getPreventiveMaintenances({ page: 1, limit: 300 }),
    { staleTime: 60000 }
  );

  const maintenances = useMemo(() => {
    if (Array.isArray(maintenanceResponse)) return maintenanceResponse;
    if (Array.isArray(maintenanceResponse?.maintenances)) return maintenanceResponse.maintenances;
    if (Array.isArray(maintenanceResponse?.data)) return maintenanceResponse.data;
    return [];
  }, [maintenanceResponse]);

  /* =========================
     Events
  ========================= */
  const events = useMemo(() => {
    return maintenances
      .map((m) => ({
        ...m,
        title: m.name,
        date: m.nextDueDate ? parseISO(m.nextDueDate) : null,
      }))
      .filter((m) => m.date);
  }, [maintenances]);

  /* =========================
     Memoized events by day (PERFORMANCE)
  ========================= */
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const key = format(e.date, 'yyyy-MM-dd');
      map[key] = map[key] || [];
      map[key].push(e);
    });
    return map;
  }, [events]);

  const eventsForDay = (date) =>
    eventsByDay[format(date, 'yyyy-MM-dd')] || [];

  const CalendarDay = (dayProps) => {
    const { day, outsideCurrentMonth, ...other } = dayProps;
    const key = format(day, 'yyyy-MM-dd');
    const count = eventsByDay[key]?.length || 0;

    return (
      <Badge
        overlap="circular"
        badgeContent={count}
        color="primary"
        invisible={count === 0}
        sx={{
          '& .MuiBadge-badge': {
            minWidth: 16,
            height: 16,
            fontSize: '0.6rem',
            fontWeight: 700
          }
        }}
      >
        <PickersDay day={day} outsideCurrentMonth={outsideCurrentMonth} {...other} />
      </Badge>
    );
  };

  /* =========================
     Month matrix
  ========================= */
  const monthMatrix = useMemo(() => {
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);
    const startDate = startOfWeek(startMonth);
    const endDate = endOfWeek(endMonth);

    const matrix = [];
    let row = [];
    let day = startDate;

    while (day <= endDate) {
      row.push(day);
      if (row.length === 7) {
        matrix.push(row);
        row = [];
      }
      day = addDays(day, 1);
    }
    return matrix;
  }, [currentMonth]);

  /* =========================
     Navigation
  ========================= */
  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  /* =========================
     Popover handlers
  ========================= */
  const openPopover = (anchorEl, ev) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setPopover({ anchor: anchorEl, event: ev });
  };

  const closePopover = () => {
    closeTimerRef.current = setTimeout(
      () => setPopover({ anchor: null, event: null }),
      150
    );
  };

  const handleView = () => {
    navigate('/preventive-maintenance');
    setPopover({ anchor: null, event: null });
  };

  const handleReschedule = (ev) => {
    const dateTime = ev.nextDueDate
      ? format(parseISO(ev.nextDueDate), "yyyy-MM-dd'T'HH:mm")
      : '';
    setRescheduleForm({
      id: ev.id || ev._id,
      dateTime,
      frequency: ev.frequency || ''
    });
    setRescheduleOpen(true);
    setPopover({ anchor: null, event: null });
  };

  const submitReschedule = async () => {
    if (!rescheduleForm.id || !rescheduleForm.dateTime) return;
    try {
      await updatePreventiveMaintenance(rescheduleForm.id, {
        nextDueDate: new Date(rescheduleForm.dateTime).toISOString(),
        frequency: rescheduleForm.frequency || undefined
      });
      await queryClient.invalidateQueries(['preventiveMaintenances']);
      await queryClient.invalidateQueries(['preventiveMaintenances', 'upcoming']);
      setRescheduleOpen(false);
    } catch {
      // handled by interceptor
    }
  };

  /* =========================
     Render
  ========================= */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
        }}
      >
        {/* ================= Calendar ================= */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <DateCalendar
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            slots={{ day: CalendarDay }}
            sx={{
              '& .MuiPickersCalendarHeader-root': {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              },
              '& .MuiDayCalendar-root': {
                width: '100%',
              },
            }}
          />
        </Paper>

      {/* ================= Details Panel ================= */}
      <Box
        sx={{
          width: { xs: '100%', md: 360 },
          position: { md: 'sticky' },
          top: { md: 16 },
          alignSelf: 'flex-start',
        }}
      >
        <Typography fontWeight={700}>
          {format(selectedDate, 'EEE, MMM d')}
        </Typography>
        <Typography variant="caption" color="#9ca3af">
          {isLoading ? 'Loading tasks…' : `${eventsForDay(selectedDate).length} tasks`}
        </Typography>
        <Divider sx={{ my: 1 }} />

        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          {!isLoading && eventsForDay(selectedDate).length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              p={2}
            >
              No scheduled preventive tasks
            </Typography>
          )}

          {isLoading && (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              p={2}
            >
              Loading scheduled tasks…
            </Typography>
          )}

          {eventsForDay(selectedDate).map((ev) => (
            <Box
              key={ev.id}
              sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}
            >
              <Typography fontWeight={700}>{ev.title}</Typography>
              <Typography variant="caption" color="#6b7280">
                {ev.asset?.name || 'Preventive Maintenance'} â€¢ {ev.frequency || 'schedule'}
              </Typography>
              <Box mt={1} display="flex" gap={1}>
                <Button size="small" variant="outlined" onClick={handleView}>
                  View
                </Button>
                <Button size="small" variant="contained" onClick={() => handleReschedule(ev)}>
                  Reschedule
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ================= Popover ================= */}
      <Popover
        open={Boolean(popover.anchor)}
        anchorEl={popover.anchor}
        onClose={() => setPopover({ anchor: null, event: null })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          onMouseEnter: () =>
            closeTimerRef.current &&
            clearTimeout(closeTimerRef.current),
          onMouseLeave: closePopover,
        }}
      >
        {popover.event && (
          <Box sx={{ p: 2, maxWidth: 320 }}>
            <Typography fontWeight={700}>
              {popover.event.title}
            </Typography>
            <Typography variant="caption" color="#6b7280">
              {popover.event.asset?.name || 'Preventive Maintenance'} â€¢ {popover.event.frequency || 'schedule'}
            </Typography>
            <Box mt={1} display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleView}
              >
                View
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => handleReschedule(popover.event)}
              >
                Reschedule
              </Button>
            </Box>
          </Box>
        )}
      </Popover>

      <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Reschedule Maintenance</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'grid', gap: 2 }}>
          <TextField
            label="Next Due Date & Time"
            type="datetime-local"
            value={rescheduleForm.dateTime}
            onChange={(e) => setRescheduleForm((prev) => ({ ...prev, dateTime: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            select
            label="Frequency"
            value={rescheduleForm.frequency}
            onChange={(e) => setRescheduleForm((prev) => ({ ...prev, frequency: e.target.value }))}
            fullWidth
          >
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="bi-weekly">Biweekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="quarterly">Quarterly</MenuItem>
            <MenuItem value="semi-annual">Semi-Annual</MenuItem>
            <MenuItem value="annual">Annually</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRescheduleOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitReschedule}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </LocalizationProvider>
  );
}
