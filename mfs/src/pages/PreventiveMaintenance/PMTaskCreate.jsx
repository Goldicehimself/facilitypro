import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../../contexts/ActivityContext';
import { getAssets } from '../../api/assets';
import { fetchMembers } from '../../api/org';
import { createPreventiveMaintenance } from '../../api/preventiveMaintenance';
import { useAuth } from '../../contexts/AuthContext';
import { FormControlLabel, Checkbox } from '@mui/material';

const PMTaskCreate = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { addActivity } = useActivity();
  const { user } = useAuth();
  const canFlagHighRisk = ['admin', 'facility_manager'].includes(user?.role);
  const [assets, setAssets] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    title: '',
    asset: '',
    frequency: '',
    dueDate: '',
    priority: 'medium',
    assignee: '',
    estimatedHours: '',
    description: '',
    requiresCertification: false,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.asset.trim()) nextErrors.asset = 'Asset is required';
    if (!form.frequency) nextErrors.frequency = 'Frequency is required';
    if (!form.dueDate) nextErrors.dueDate = 'Due date is required';
    if (form.estimatedHours && Number(form.estimatedHours) <= 0) {
      nextErrors.estimatedHours = 'Enter a valid number of hours';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const assetRes = await getAssets({ page: 1, limit: 200 });
        if (active) setAssets(assetRes?.data || []);
      } catch (error) {
        if (active) setAssets([]);
      }
      try {
        const memberRes = await fetchMembers();
        const list = Array.isArray(memberRes) ? memberRes : (memberRes?.members || memberRes?.data || []);
        if (active) setMembers(list);
      } catch (error) {
        if (active) setMembers([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const selectedAsset = assets.find((asset) => asset.id === form.asset);
    const assetLabel = selectedAsset?.name || 'Asset';
    const payload = {
      name: form.title,
      asset: form.asset,
      frequency: form.frequency,
      nextDueDate: form.dueDate,
      priority: form.priority,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      description: form.description || undefined,
      assignedTo: form.assignee || undefined,
      requiresCertification: !!form.requiresCertification
    };

    addActivity({
      type: 'pm_scheduled',
      action: 'created',
      title: `PM Task Created: ${form.title}`,
      description: `${assetLabel} - ${form.frequency}`,
      user: 'Current User',
      status: 'pending',
    });
    try {
      await createPreventiveMaintenance(payload);
      alert('PM task created successfully.');
      navigate('/preventive-maintenance');
    } catch (error) {
      alert('Failed to create PM task. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, background: isDark ? '#0b1120' : 'transparent' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Create PM Task
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
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3, borderRadius: 2, border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, backgroundColor: isDark ? '#0f172a' : '#fff' }}
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Task Title"
              value={form.title}
              onChange={handleChange('title')}
              error={Boolean(errors.title)}
              helperText={errors.title}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.asset)}>
              <InputLabel>Asset</InputLabel>
              <Select
                label="Asset"
                value={form.asset}
                onChange={handleChange('asset')}
              >
                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.name} {asset.assetNumber ? `(${asset.assetNumber})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={Boolean(errors.frequency)}>
              <InputLabel>Frequency</InputLabel>
              <Select
                label="Frequency"
                value={form.frequency}
                onChange={handleChange('frequency')}
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="bi-weekly">Biweekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="semi-annual">Semi-Annual</MenuItem>
                <MenuItem value="annual">Annually</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Due Date & Time"
              type="datetime-local"
              value={form.dueDate}
              onChange={handleChange('dueDate')}
              error={Boolean(errors.dueDate)}
              helperText={errors.dueDate}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                label="Priority"
                value={form.priority}
                onChange={handleChange('priority')}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                label="Assignee"
                value={form.assignee}
                onChange={handleChange('assignee')}
              >
                <MenuItem value="">
                  Unassigned
                </MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.id || member._id} value={member.id || member._id}>
                    {member.name || [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Estimated Hours"
              type="number"
              value={form.estimatedHours}
              onChange={handleChange('estimatedHours')}
              error={Boolean(errors.estimatedHours)}
              helperText={errors.estimatedHours}
              fullWidth
            />
          </Grid>
          {canFlagHighRisk && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(form.requiresCertification)}
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      requiresCertification: event.target.checked
                    }))}
                  />
                }
                label="Requires certification (high-risk)"
              />
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={form.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              minRows={3}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/preventive-maintenance')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Create Task
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default PMTaskCreate;
