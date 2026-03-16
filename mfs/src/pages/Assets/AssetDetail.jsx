import React, { useState, useEffect, useRef } from 'react';
import logger from '../../utils/logger';
import { Typography, Box, Button, Grid, Avatar, Paper, Chip, Divider, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../../components/common/Modal';
import { deleteAsset, getAsset, updateAsset, uploadAssetImage } from '../../api/assets';
import { getWorkOrders } from '../../api/workOrders';
import MaintenanceTimeline from '../../components/assets/MaintenanceTimeline';
import AssetImage from '../../components/assets/AssetImage';
import { toast } from 'react-toastify';

const AssetDetail = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [relatedWOs, setRelatedWOs] = useState([]);

  // Edit Asset Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);
  const [editForm, setEditForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    type: '',
    manufacturer: '',
    model: '',
    serial: '',
    propertyLocation: '',
    status: 'active',
    lastMaintenanceDate: '',
    nextMaintenanceDate: ''
  });

  // Schedule & Parts editing state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleEditing, setScheduleEditing] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ title: '', frequency: '', last: '', next: '', status: '' });

  const [partModalOpen, setPartModalOpen] = useState(false);
  const [partEditing, setPartEditing] = useState(null);
  const [partForm, setPartForm] = useState({ name: '', inStock: 0, minLevel: 0, lastReplaced: '' });

  const openScheduleModal = (item) => {
    if (item) { setScheduleEditing(item); setScheduleForm({ ...item }); }
    else { setScheduleEditing(null); setScheduleForm({ title: '', frequency: '', last: '', next: '', status: '' }); }
    setScheduleModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !asset) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAssetImage(asset.id, formData);
      
      // Update the asset with the new image URL
      const updated = { ...asset, imageUrl: response.imageUrl || response.url };
      setAsset(updated);
      setSelectedImage(response.imageUrl || response.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      logger.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const openEditModal = () => {
    if (asset) {
      const scheduleItems = Array.isArray(asset.maintenanceSchedule) ? asset.maintenanceSchedule : [];
      const scheduleLastDates = scheduleItems
        .map((item) => item?.last)
        .filter(Boolean)
        .map((value) => new Date(value))
        .filter((d) => !Number.isNaN(d.getTime()));
      const scheduleNextDates = scheduleItems
        .map((item) => item?.next)
        .filter(Boolean)
        .map((value) => new Date(value))
        .filter((d) => !Number.isNaN(d.getTime()));
      const derivedLast = scheduleLastDates.length
        ? new Date(Math.max(...scheduleLastDates.map((d) => d.getTime()))).toISOString()
        : '';
      const derivedNext = scheduleNextDates.length
        ? new Date(Math.min(...scheduleNextDates.map((d) => d.getTime()))).toISOString()
        : '';

      setEditForm({
        name: asset.name || '',
        shortDescription: asset.shortDescription || '',
        description: asset.description || asset.shortDescription || '',
        category: asset.category || '',
        type: asset.type || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serial: asset.serial || '',
        propertyLocation: asset.propertyLocation || '',
        status: asset.status || 'active',
        lastMaintenanceDate: asset.lastMaintenance || asset.lastMaintenanceDate || derivedLast || '',
        nextMaintenanceDate: asset.nextService || asset.nextMaintenanceDate || derivedNext || ''
      });
      setEditModalOpen(true);
    }
  };

  const openPartModal = (item) => {
    if (item) { setPartEditing(item); setPartForm({ ...item }); }
    else { setPartEditing(null); setPartForm({ name: '', inStock: 0, minLevel: 0, lastReplaced: '' }); }
    setPartModalOpen(true);
  };

  const saveSchedule = async () => {
    const form = scheduleForm;
    if (!form.title) { toast.error('Title required'); return; }
    try {
      let newSchedule = asset.maintenanceSchedule ? [...asset.maintenanceSchedule] : [];
      let action = 'added';
      if (scheduleEditing && scheduleEditing.id) {
        newSchedule = newSchedule.map(s => (s.id === scheduleEditing.id ? { ...s, ...form } : s));
        action = 'updated';
      } else {
        const newItem = { id: `ms-${Date.now()}`, ...form };
        newSchedule.unshift(newItem);
        action = 'added';
      }

      const historyEntry = { id: `mh-${Date.now()}`, type: 'schedule_' + action, title: `Schedule ${action}: "${form.title}"`, timestamp: new Date().toISOString(), details: form };
      const updated = { ...asset, maintenanceSchedule: newSchedule, maintenanceHistory: [historyEntry, ...(asset.maintenanceHistory || [])] };
      await updateAsset(asset.id, updated);
      setAsset(updated);
      setScheduleModalOpen(false);
      toast.success('Schedule saved');
    } catch (err) { logger.error(err); toast.error('Failed to save schedule'); }
  };

  const saveAssetEdit = async () => {
    if (!editForm.name.trim()) { toast.error('Asset name is required'); return; }
    try {
      const updated = {
        ...asset,
        name: editForm.name,
        shortDescription: editForm.shortDescription,
        description: editForm.description,
        category: editForm.category,
        type: editForm.type,
        manufacturer: editForm.manufacturer,
        model: editForm.model,
        serial: editForm.serial,
        propertyLocation: editForm.propertyLocation,
        status: editForm.status,
        lastMaintenance: editForm.lastMaintenanceDate || null,
        nextService: editForm.nextMaintenanceDate || null
      };
      await updateAsset(asset.id, updated);
      setAsset(updated);
      setEditModalOpen(false);
      toast.success('Asset updated successfully');
    } catch (err) {
      logger.error('Error saving asset:', err);
      toast.error('Failed to save asset');
    }
  };

  const savePart = async () => {
    const form = partForm;
    if (!form.name) { toast.error('Name required'); return; }
    try {
      let newParts = asset.parts ? [...asset.parts] : [];
      let action = 'added';
      if (partEditing && partEditing.id) {
        newParts = newParts.map(p => (p.id === partEditing.id ? { ...p, ...form, inStock: Number(form.inStock), minLevel: Number(form.minLevel) } : p));
        action = 'updated';
      } else {
        const newItem = { id: `p-${Date.now()}`, ...form, inStock: Number(form.inStock), minLevel: Number(form.minLevel) };
        newParts.unshift(newItem);
        action = 'added';
      }

      const historyEntry = { id: `mh-${Date.now()}`, type: 'part_' + action, title: `Part ${action}: "${form.name}"`, timestamp: new Date().toISOString(), details: form };
      const updated = { ...asset, parts: newParts, maintenanceHistory: [historyEntry, ...(asset.maintenanceHistory || [])] };
      await updateAsset(asset.id, updated);
      setAsset(updated);
      setPartModalOpen(false);
      toast.success('Part saved');
    } catch (err) { logger.error(err); toast.error('Failed to save part'); }
  };

  // Delete confirmation for schedule/part
  const [deleteConfirmOpen2, setDeleteConfirmOpen2] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState(null);

  const confirmDeleteSchedule = (s) => { setDeleteTarget(s); setDeleteTargetType('schedule'); setDeleteConfirmOpen2(true); };
  const confirmDeletePart = (p) => { setDeleteTarget(p); setDeleteTargetType('part'); setDeleteConfirmOpen2(true); };

  const handleDeleteTarget = async () => {
    if (!deleteTarget || !deleteTargetType) return;
    try {
      let updated = { ...asset };
      if (deleteTargetType === 'schedule') {
        updated.maintenanceSchedule = (asset.maintenanceSchedule || []).filter(s => s.id !== deleteTarget.id);
        const entry = { id: `mh-${Date.now()}`, type: 'schedule_deleted', title: `Deleted schedule "${deleteTarget.title || deleteTarget.name}"`, timestamp: new Date().toISOString(), details: deleteTarget };
        updated.maintenanceHistory = [entry, ...(asset.maintenanceHistory || [])];
      } else if (deleteTargetType === 'part') {
        updated.parts = (asset.parts || []).filter(p => p.id !== deleteTarget.id);
        const entry = { id: `mh-${Date.now()}`, type: 'part_deleted', title: `Deleted part "${deleteTarget.name}"`, timestamp: new Date().toISOString(), details: deleteTarget };
        updated.maintenanceHistory = [entry, ...(asset.maintenanceHistory || [])];
      }
      await updateAsset(asset.id, updated);
      setAsset(updated);
      toast.success(`${deleteTargetType === 'schedule' ? 'Schedule' : 'Part'} deleted`);
    } catch (err) {
      logger.error(err);
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirmOpen2(false);
      setDeleteTarget(null);
      setDeleteTargetType(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getAsset(id);
        if (mounted) {
          setAsset(res);
          setSelectedImage((res && (res.imageUrls && res.imageUrls.length > 0) ? res.imageUrls[0] : res?.imageUrl) || '/placeholder-asset.svg');
        }

        // Load related work orders
        try {
          const wos = await getWorkOrders();
          if (mounted) {
            const filtered = (wos || []).filter(w => (w.asset && (String(w.asset.id) === String(id) || String(w.asset.name).toLowerCase().includes((res && res.name || '').toLowerCase()))));
            setRelatedWOs(filtered.slice(0,5));
          }
        } catch (err) {
          // ignore
        }
      } catch (err) {
        logger.error('Failed to load asset', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAsset(id);
      navigate('/assets');
    } catch (err) {
      logger.error('Failed to delete asset', err);
      alert('Failed to delete asset');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return <Typography>Loading asset...</Typography>;
  }

  if (!asset) {
    return <Typography>No asset found</Typography>;
  }

  const images = (asset.imageUrls && asset.imageUrls.length > 0) ? asset.imageUrls : [asset.imageUrl || '/placeholder-asset.svg'];

  return (
    <Box sx={{ bgcolor: isDark ? '#0b1120' : '#f8fafc', minHeight: '100vh', pb: 4 }}>
      {/* Professional Header Bar */}
      <Box sx={{ 
        bgcolor: isDark ? '#0f172a' : 'white', 
        borderBottom: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}`,
        py: 2,
        px: 3,
        mb: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <IconButton 
                onClick={() => navigate('/assets')} 
                sx={{ color: '#6366f1' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>Asset Details</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', ml: 5 }}>
              {asset.code || asset.id} • {asset.category}
            </Typography>
          </div>
          
          <Stack direction="row" spacing={1}>
            <Button 
              variant="contained"
              startIcon={<EditIcon />}
              onClick={openEditModal}
              sx={{ fontWeight: 600 }}
            >
              Edit
            </Button>
            <Button 
              variant="outlined"
              onClick={() => setConfirmOpen(true)}
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 3 }}>
        {/* Asset Title Card */}
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: isDark ? '#0f172a' : 'white',
          border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
          borderRadius: 2
        }}>
          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                bgcolor: isDark ? '#0b1220' : '#f1f5f9',
                border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0'
              }}>
                <AssetImage
                  src={selectedImage}
                  alt={asset.name}
                  onClick={() => setViewerOpen(true)}
                  style={{
                    width: '100%',
                    height: 240,
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  imgProps={{ sizes: '50vw' }}
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <div>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                  {asset.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {asset.shortDescription || asset.description}
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                  <Chip 
                    label={asset.status?.toUpperCase()} 
                    color={asset.status === 'active' ? 'success' : asset.status === 'maintenance' ? 'warning' : 'default'}
                    variant="filled"
                  />
                  <Chip 
                    label={asset.category}
                    variant="outlined"
                  />
                </Stack>

                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>MANUFACTURER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {asset.manufacturer || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>MODEL</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {asset.model || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>SERIAL NUMBER</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {asset.serial || '—'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>LOCATION</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {asset.propertyLocation || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </div>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 3 }}>
        <Grid container spacing={3}>
        {/* Left - Overview + Specs + History */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Equipment Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>CATEGORY</Typography><Typography sx={{ fontWeight: 500 }}>{asset.category || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>TYPE</Typography><Typography sx={{ fontWeight: 500 }}>{asset.type || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>MANUFACTURER</Typography><Typography sx={{ fontWeight: 500 }}>{asset.manufacturer || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>MODEL NUMBER</Typography><Typography sx={{ fontWeight: 500 }}>{asset.model || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>SERIAL NUMBER</Typography><Typography sx={{ fontWeight: 500 }}>{asset.serial || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>INSTALLATION DATE</Typography><Typography sx={{ fontWeight: 500 }}>{asset.installationDate || asset.purchaseDate || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>PROPERTY LOCATION</Typography><Typography sx={{ fontWeight: 500 }}>{asset.propertyLocation || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>BUILDING LOCATION</Typography><Typography sx={{ fontWeight: 500 }}>{asset.buildingLocation || '—'}</Typography></Grid>

              <Grid item xs={12}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>SERVICE AREA</Typography><Typography sx={{ fontWeight: 500 }}>{asset.serviceArea || '—'}</Typography></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Specifications & Technical Details</Typography>
            {(asset.specs?.notes || (typeof asset.specs === 'string' ? asset.specs : '') || asset.specifications) && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>SPECIFICATION NOTES</Typography>
                <Typography sx={{ fontWeight: 500, whiteSpace: 'pre-line' }}>
                  {asset.specs?.notes || (typeof asset.specs === 'string' ? asset.specs : '') || asset.specifications}
                </Typography>
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>COOLING CAPACITY</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.coolingCapacity || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>REFRIGERANT TYPE</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.refrigerantType || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>POWER CONSUMPTION</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.powerConsumption || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>SEER RATING</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.seerRating || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>DIMENSIONS</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.dimensions || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>WEIGHT</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.weight || '—'}</Typography></Grid>

              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>OPERATING TEMPERATURE</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.operatingTempRange || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>COMPLIANCE</Typography><Typography sx={{ fontWeight: 500 }}>{asset.specs?.compliance || '—'}</Typography></Grid>
            </Grid>
          </Paper>

          <Paper sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Warranty & Documentation</Typography>
            <Grid container spacing={2}>
              <Grid item xs={8}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b' }}>WARRANTY STATUS</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip label={`ACTIVE — Expires ${asset.warranty?.expires}`} color="success" />
                </Stack>
                <Typography sx={{ mt: 2 }}>{asset.warranty?.coverage}</Typography>
              </Grid>

              <Grid item xs={4}>
                <Typography color="text.secondary">Warranty Provider</Typography>
                <Typography>{asset.warranty?.provider}</Typography>
                <Typography color="text.secondary" sx={{ mt: 2 }}>Purchase Date</Typography>
                <Typography>{asset.warranty?.purchaseDate}</Typography>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                {asset.documents?.map(d => (
                  <Paper key={d.id} sx={{ p: 2, mb: 1 }} elevation={0}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Typography sx={{ fontWeight: 700 }}>{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{d.size || ''}</Typography>
                      </div>
                      <Button variant="outlined" size="small" onClick={() => window.open(d.url, '_blank')}>Download</Button>
                    </div>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ 
            p: 3, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>Maintenance History</Typography>
              {/* Future: filter controls */}
            </Box>

            <div style={{ marginTop: 8 }}>
              <MaintenanceTimeline items={asset.maintenanceHistory} />
            </div>
          </Paper>

          {/* Edit Schedule Modal & Parts Modal will be rendered below */}
        </Grid>

        {/* Right - Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>Maintenance Schedule</Typography>
              <Button startIcon={<AddIcon />} size="small" onClick={() => openScheduleModal(null)}>Add</Button>
            </Box>
            <Stack spacing={1}>
              {asset.maintenanceSchedule?.map(s => (
                <Paper key={s.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isDark ? '#0b1220' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }} elevation={0}>
                  <div>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.frequency} • Next: {s.next}</Typography>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Chip label={s.status === 'due_soon' ? 'DUE' : s.status === 'scheduled' ? 'SCHEDULED' : 'OK'} size="small" color={s.status === 'due_soon' ? 'warning' : 'default'} />
                    <IconButton size="small" onClick={() => openScheduleModal(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => confirmDeleteSchedule(s)}><DeleteIcon fontSize="small" /></IconButton>
                  </div>
                </Paper>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Performance Metrics</Typography>
            <div style={{ marginTop: 12 }}>
              <Typography variant="caption" color="text.secondary">Total Downtime</Typography>
              <Typography sx={{ fontWeight: 700 }}>{asset.performanceMetrics?.totalDowntimeHours} hours</Typography>

              <Divider sx={{ my: 1 }} />

              <Typography variant="caption" color="text.secondary">Maintenance Incidents</Typography>
              <Typography sx={{ fontWeight: 700 }}>{asset.performanceMetrics?.maintenanceIncidents?.preventive} Preventive • {asset.performanceMetrics?.maintenanceIncidents?.corrective} Corrective</Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" color="text.secondary">Avg Repair Time</Typography>
              <Typography sx={{ fontWeight: 700 }}>{asset.performanceMetrics?.avgRepairTimeHrs} hrs</Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" color="text.secondary">Total Maintenance Cost</Typography>
              <Typography sx={{ fontWeight: 700 }}>${asset.performanceMetrics?.totalMaintenanceCost}</Typography>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="caption" color="text.secondary">Reliability Score</Typography>
              <Typography sx={{ fontWeight: 700 }}>{asset.performanceMetrics?.reliabilityScore}%</Typography>
            </div>
          </Paper>

          <Paper sx={{ 
            p: 2, 
            mb: 3,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: isDark ? '#e2e8f0' : '#1e293b' }}>Related Work Orders</Typography>
            <Stack spacing={1}>
              {relatedWOs.length > 0 ? relatedWOs.map(wo => (
                <Paper key={wo.id} sx={{ p: 1.5, bgcolor: isDark ? '#0b1220' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }} elevation={0}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{wo.woNumber || wo.id}</Typography>
                  <Typography variant="caption" color="text.secondary">{wo.title || wo.description}</Typography>
                </Paper>
              )) : <Typography variant="body2" color="text.secondary">No related work orders</Typography>}
            </Stack>
          </Paper>

          <Paper sx={{ 
            p: 2,
            bgcolor: isDark ? '#0f172a' : 'white',
            border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0',
            borderRadius: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>Parts & Components</Typography>
              <Button startIcon={<AddIcon />} size="small" onClick={() => openPartModal(null)}>Add</Button>
            </Box>
            <Stack spacing={1}>
              {asset.parts?.map(p => (
                <Paper key={p.id} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: isDark ? '#0b1220' : '#f8fafc', border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0' }} elevation={0}>
                  <div>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Stock: {p.inStock} / Min: {p.minLevel}</Typography>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IconButton size="small" onClick={() => openPartModal(p)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => confirmDeletePart(p)}><DeleteIcon fontSize="small" /></IconButton>
                  </div>
                </Paper>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      </Box>

      {/* Edit Asset Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        fullWidth 
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.3rem', pb: 0.5 }}>Edit Asset Details</DialogTitle>
        <Box sx={{ px: 3, py: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '1.1rem' }}>
            {editForm.name || 'New Asset'}
          </Typography>
        </Box>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Image Upload Section */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: isDark ? '#0b1220' : '#f8fafc', textAlign: 'center', borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <AssetImage
                    src={selectedImage}
                    alt={editForm.name}
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: isDark ? '1px solid #1f2937' : '1px solid #e2e8f0'
                    }}
                    imgProps={{ sizes: '(max-width: 640px) 100vw, 33vw' }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  disabled={uploadingImage}
                  sx={{ mb: 1 }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input
                    ref={imageInputRef}
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleImageUpload}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  Recommended: 16:9 aspect ratio
                </Typography>
              </Paper>
            </Grid>

            {/* Form Fields Section */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField 
                    label="Asset Name" 
                    fullWidth 
                    value={editForm.name} 
                    onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                    variant="outlined"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.1rem',
                        fontWeight: 600
                      },
                      '& .MuiOutlinedInput-input': {
                        padding: '12px 14px'
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    label="Short Description" 
                    fullWidth 
                    value={editForm.shortDescription} 
                    onChange={(e) => setEditForm(f => ({ ...f, shortDescription: e.target.value }))}
                    variant="outlined"
                    placeholder="Brief summary of the asset"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    label="Detailed Description" 
                    fullWidth 
                    multiline 
                    rows={3}
                    value={editForm.description} 
                    onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Category" 
                    fullWidth 
                    value={editForm.category} 
                    onChange={(e) => setEditForm(f => ({ ...f, category: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Type/Model" 
                    fullWidth 
                    value={editForm.type} 
                    onChange={(e) => setEditForm(f => ({ ...f, type: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Manufacturer" 
                    fullWidth 
                    value={editForm.manufacturer} 
                    onChange={(e) => setEditForm(f => ({ ...f, manufacturer: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Model Number" 
                    fullWidth 
                    value={editForm.model} 
                    onChange={(e) => setEditForm(f => ({ ...f, model: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Serial Number" 
                    fullWidth 
                    value={editForm.serial} 
                    onChange={(e) => setEditForm(f => ({ ...f, serial: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Property Location" 
                    fullWidth 
                    value={editForm.propertyLocation} 
                    onChange={(e) => setEditForm(f => ({ ...f, propertyLocation: e.target.value }))}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField 
                    label="Status" 
                    fullWidth 
                    select
                    value={editForm.status} 
                    onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                    variant="outlined"
                  >
                    <MenuItem value="active">🟢 Active</MenuItem>
                    <MenuItem value="inactive">⚪ Inactive</MenuItem>
                    <MenuItem value="maintenance">🟡 Under Maintenance</MenuItem>
                    <MenuItem value="retired">⚫ Retired</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Maintenance Date"
                    type="date"
                    fullWidth
                    value={editForm.lastMaintenanceDate ? String(editForm.lastMaintenanceDate).split('T')[0] : ''}
                    onChange={(e) => setEditForm(f => ({ ...f, lastMaintenanceDate: e.target.value }))}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Next Service Date"
                    type="date"
                    fullWidth
                    value={editForm.nextMaintenanceDate ? String(editForm.nextMaintenanceDate).split('T')[0] : ''}
                    onChange={(e) => setEditForm(f => ({ ...f, nextMaintenanceDate: e.target.value }))}
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: isDark ? '#0b1220' : '#f8fafc' }}>
          <Button onClick={() => setEditModalOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={saveAssetEdit} variant="contained" sx={{ fontWeight: 700 }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Edit Dialog */}
      <Dialog open={Boolean(scheduleModalOpen)} onClose={() => setScheduleModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{scheduleEditing?.id ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth value={scheduleForm.title} onChange={(e) => setScheduleForm(s => ({ ...s, title: e.target.value }))} sx={{ mt: 1 }} />
          <TextField label="Frequency" fullWidth value={scheduleForm.frequency} onChange={(e) => setScheduleForm(s => ({ ...s, frequency: e.target.value }))} sx={{ mt: 2 }} />
          <TextField label="Last" fullWidth value={scheduleForm.last} onChange={(e) => setScheduleForm(s => ({ ...s, last: e.target.value }))} sx={{ mt: 2 }} />
          <TextField label="Next" fullWidth value={scheduleForm.next} onChange={(e) => setScheduleForm(s => ({ ...s, next: e.target.value }))} sx={{ mt: 2 }} />
          <TextField label="Status" fullWidth value={scheduleForm.status} onChange={(e) => setScheduleForm(s => ({ ...s, status: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
          <Button onClick={saveSchedule} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Part Edit Dialog */}
      <Dialog open={Boolean(partModalOpen)} onClose={() => setPartModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{partEditing?.id ? 'Edit Part' : 'Add Part'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth value={partForm.name} onChange={(e) => setPartForm(s => ({ ...s, name: e.target.value }))} sx={{ mt: 1 }} />
          <TextField label="In Stock" fullWidth value={partForm.inStock} onChange={(e) => setPartForm(s => ({ ...s, inStock: e.target.value }))} sx={{ mt: 2 }} />
          <TextField label="Min Level" fullWidth value={partForm.minLevel} onChange={(e) => setPartForm(s => ({ ...s, minLevel: e.target.value }))} sx={{ mt: 2 }} />
          <TextField label="Last Replaced" fullWidth value={partForm.lastReplaced} onChange={(e) => setPartForm(s => ({ ...s, lastReplaced: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartModalOpen(false)}>Cancel</Button>
          <Button onClick={savePart} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {deleteConfirmOpen2 && (
        <Modal>
          <div style={{ maxWidth: 480, padding: 16 }}>
            <h3>Confirm delete</h3>
            <p>Are you sure you want to delete this {deleteTargetType === 'schedule' ? 'schedule' : 'part'}? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="outlined" onClick={() => setDeleteConfirmOpen2(false)}>Cancel</Button>
              <Button color="error" variant="contained" onClick={handleDeleteTarget}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmOpen && (
        <Modal>
          <div style={{ maxWidth: 480, padding: 16 }}>
            <h3>Delete asset?</h3>
            <p>Are you sure you want to delete this asset? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="outlined" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button>
              <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {viewerOpen && (
        <Modal>
          <div style={{ maxWidth: 900, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => setViewerOpen(false)}>Close</Button>
            </div>
            <img src={selectedImage} alt="viewer" style={{ width: '100%', height: '70vh', objectFit: 'contain', marginTop: 8 }} />
          </div>
        </Modal>
      )}
    </Box>
  );
};

export default AssetDetail;




