import React, { useState } from 'react';
import logger from '../../utils/logger';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ArrowBack,
  Save,
  PriorityHigh,
  LocationOn,
  Description,
  Category,
  Person,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const ServiceRequestForm = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    location: '',
    asset: '',
    urgency: 'normal',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      // In a real app, this would call an API to create the service request
      logger.info('Creating service request:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Service request submitted successfully!');
      navigate('/service-requests');
    } catch (error) {
      toast.error('Failed to submit service request');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'HVAC',
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Painting',
    'Cleaning',
    'IT/Technology',
    'Security',
    'Elevator',
    'Other'
  ];

  const locations = [
    'Office Area',
    'Conference Room A',
    'Conference Room B',
    'Restroom - Floor 1',
    'Restroom - Floor 2',
    'Kitchen',
    'Parking Lot',
    'Loading Dock',
    'Warehouse',
    'Other'
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: '#dcfce7', textColor: '#166534' },
    { value: 'medium', label: 'Medium', color: '#fef3c7', textColor: '#92400e' },
    { value: 'high', label: 'High', color: '#fee2e2', textColor: '#991b1b' },
    { value: 'urgent', label: 'Urgent', color: '#fee2e2', textColor: '#7f1d1d' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, background: isDark ? '#0b1120' : '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <IconButton
            onClick={() => navigate('/service-requests')}
            sx={{
              backgroundColor: isDark ? '#0f172a' : 'white',
              border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
              '&:hover': {
                backgroundColor: isDark ? '#111827' : '#f8fafc',
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: isDark ? '#f8fafc' : '#0f172a',
              fontSize: { xs: '28px', md: '32px' },
            }}
          >
            New Service Request
          </Typography>
        </Box>
        <Typography variant="body2" color="#64748b" sx={{ fontSize: '15px', color: isDark ? '#94a3b8' : '#64748b' }}>
          Submit a maintenance request for your facility
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Card
            elevation={0}
            sx={{
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
              borderRadius: '14px',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Title */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Request Title"
                      placeholder="Brief description of the issue"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <Description sx={{ color: '#94a3b8', mr: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        }
                      }}
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Detailed Description"
                      placeholder="Provide more details about the issue, including when it started, what you've observed, etc."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      multiline
                      rows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        }
                      }}
                    />
                  </Grid>

                  {/* Category and Priority */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        label="Category"
                        sx={{
                          borderRadius: '8px',
                        }}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category} value={category}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Category sx={{ fontSize: 18, color: '#94a3b8' }} />
                              {category}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        label="Priority"
                        sx={{
                          borderRadius: '8px',
                        }}
                      >
                        {priorityOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PriorityHigh sx={{ fontSize: 18, color: option.textColor }} />
                              <Chip
                                label={option.label}
                                size="small"
                                sx={{
                                  backgroundColor: option.color,
                                  color: option.textColor,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                }}
                              />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Location */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        label="Location"
                        sx={{
                          borderRadius: '8px',
                        }}
                      >
                        {locations.map((location) => (
                          <MenuItem key={location} value={location}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn sx={{ fontSize: 18, color: '#94a3b8' }} />
                              {location}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Asset (Optional) */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Asset/Equipment (Optional)"
                      placeholder="Specific asset or equipment involved"
                      value={formData.asset}
                      onChange={(e) => handleInputChange('asset', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ color: '#94a3b8', mr: 1 }} />
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        }
                      }}
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<Save />}
                        disabled={loading}
                        sx={{
                          background: '#3b82f6',
                          color: '#fff',
                          borderRadius: '8px',
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 4,
                          py: 1.5,
                          '&:hover': {
                            background: '#2563eb',
                          },
                          '&:disabled': {
                            background: '#94a3b8',
                          }
                        }}
                      >
                        {loading ? 'Submitting...' : 'Submit Request'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/service-requests')}
                        sx={{
                          borderRadius: '8px',
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 4,
                          py: 1.5,
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Sidebar */}
        <Grid item xs={12} lg={4}>
          <Card
            elevation={0}
            sx={{
              background: isDark ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
              borderRadius: '14px',
              height: 'fit-content',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: isDark ? '#e2e8f0' : '#0f172a' }}>
                Request Guidelines
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: isDark ? '#cbd5f5' : '#374151' }}>
                  What to Include:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <li style={{ marginBottom: '8px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '14px' }}>
                    Clear description of the issue
                  </li>
                  <li style={{ marginBottom: '8px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '14px' }}>
                    When the problem started
                  </li>
                  <li style={{ marginBottom: '8px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '14px' }}>
                    Location details
                  </li>
                  <li style={{ marginBottom: '8px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '14px' }}>
                    Any safety concerns
                  </li>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: isDark ? '#cbd5f5' : '#374151' }}>
                  Response Times:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label="Urgent" size="small" sx={{ backgroundColor: '#fee2e2', color: '#991b1b' }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Within 1 hour</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label="High" size="small" sx={{ backgroundColor: '#fee2e2', color: '#991b1b' }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Within 4 hours</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label="Medium" size="small" sx={{ backgroundColor: '#fef3c7', color: '#92400e' }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Within 24 hours</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label="Low" size="small" sx={{ backgroundColor: '#dcfce7', color: '#166534' }} />
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Within 48 hours</Typography>
                  </Box>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Your request will be reviewed and assigned to the appropriate maintenance team.
                  You'll receive email updates on the progress.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceRequestForm;
