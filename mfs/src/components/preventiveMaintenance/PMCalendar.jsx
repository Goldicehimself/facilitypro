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
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
import { useQuery } from 'react-query';
import { getWorkOrders } from '../../api/workOrders';

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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [popover, setPopover] = useState({ anchor: null, event: null });
  const { data: workOrdersResponse = [], isLoading } = useQuery(
    ['pm-work-orders'],
    () => getWorkOrders({}),
    { staleTime: 60000 }
  );

  const workOrders = useMemo(() => {
    if (Array.isArray(workOrdersResponse)) return workOrdersResponse;
    if (Array.isArray(workOrdersResponse?.workOrders)) return workOrdersResponse.workOrders;
    if (Array.isArray(workOrdersResponse?.data)) return workOrdersResponse.data;
    return [];
  }, [workOrdersResponse]);

  /* =========================
     Events
  ========================= */
  const events = useMemo(() => {
    return workOrders
      .filter(
        (w) =>
          ['Maintenance', 'Inspection', 'Calibration'].includes(
            w.serviceType
          ) || /preventive/i.test(w.title)
      )
      .map((w) => ({
        ...w,
        date: w.dueDate ? parseISO(w.dueDate) : null,
      }))
      .filter((w) => w.date);
  }, [workOrders]);

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

  const handleView = (ev) => {
    navigate(`/work-orders/${ev.id}`);
    setPopover({ anchor: null, event: null });
  };

  const handleReschedule = (ev) => {
    alert(`Reschedule: ${ev.title}`);
    setPopover({ anchor: null, event: null });
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
                {ev.location?.name || ev.asset?.name || ev.category}
              </Typography>
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
              {popover.event.location?.name ||
                popover.event.asset?.name ||
                popover.event.category}
            </Typography>
            <Box mt={1} display="flex" gap={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleView(popover.event)}
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
    </Box>
    </LocalizationProvider>
  );
}
