import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { toast } from 'react-toastify';
import { fetchMembers, fetchInvites, disableOrg, enableOrg, setUserActive, revokeInvite, createInvite } from '@/api/org';
import { useAuth } from '@/contexts/AuthContext';

const OrgAdmin = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviteExpiresDays, setInviteExpiresDays] = useState('7');
  const [showRoleDescriptions, setShowRoleDescriptions] = useState(false);

  const orgCode = useMemo(
    () => localStorage.getItem('orgCode') || sessionStorage.getItem('orgCode') || '',
    []
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        fetchMembers({ page: 1, limit: 50, ...(role ? { role } : {}), ...(search ? { search } : {}) }),
        fetchInvites(),
      ]);
      setMembers(membersData?.members || []);
      setInvites(invitesData?.invites || []);
    } catch (error) {
      // handled by global interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleUser = async (user) => {
    try {
      const updated = await setUserActive(user.id || user._id, !user.active);
      setMembers((prev) =>
        prev.map((m) => (m._id === updated._id ? { ...m, active: updated.active } : m))
      );
      toast.success(`User ${updated.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleDisableOrg = async () => {
    try {
      await disableOrg();
      toast.success('Organization disabled');
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleRevokeInvite = async (code) => {
    try {
      await revokeInvite(code);
      setInvites((prev) => prev.filter((invite) => invite.code !== code));
      toast.success('Invite revoked');
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleEnableOrg = async () => {
    try {
      await enableOrg();
      toast.success('Organization enabled');
      await loadData();
    } catch (error) {
      // handled by interceptor
    }
  };

  const handleCreateInvite = async () => {
    try {
      const days = Number(inviteExpiresDays);
      const expiresAt = Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      const created = await createInvite({ role: inviteRole, expiresAt });
      setInvites((prev) => [{ ...created, createdBy: 'You' }, ...prev]);
      if (created?.code && navigator?.clipboard?.writeText) {
        const inviteLink = `${window.location.origin}/register?invite=${created.code}`;
        navigator.clipboard.writeText(inviteLink);
        toast.success('Invite created. Link copied to clipboard.');
      } else {
        toast.success('Invite created.');
      }
    } catch (error) {
      // handled by interceptor
    }
  };

  const copyOrgCode = () => {
    if (!orgCode) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(orgCode);
      toast.info('Org code copied');
    }
  };

  const roleDescriptions = [
    { role: 'Admin', description: 'Full access to organization settings, billing, and integrations.' },
    { role: 'Facility Manager', description: 'Manage work orders, assets, teams, and operations.' },
    { role: 'Technician', description: 'View and complete assigned work orders.' },
    { role: 'Staff', description: 'Create requests and assist with operations.' },
    { role: 'Vendor', description: 'Handle assigned vendor work orders and updates.' },
    { role: 'Finance', description: 'View financial reports and cost tracking.' },
    { role: 'Procurement', description: 'Manage purchasing and vendor sourcing.' },
  ];


  return (
    <Box sx={{ backgroundColor: isDark ? '#0b1120' : 'transparent' }}>
      <Box mb={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Organization Admin</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage members, invites, and org status
          </Typography>
        </Box>
        {isAdmin && (
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button variant="outlined" onClick={handleEnableOrg} sx={{ color: isDark ? '#e2e8f0' : undefined }}>
              Enable Org
            </Button>
            <Button variant="contained" color="error" onClick={() => setDisableConfirmOpen(true)}>
              Disable Org
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3, backgroundColor: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} color="text.primary">Organization Code</Typography>
            <Typography variant="body2" color="text.secondary">Share this with members to join.</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={orgCode || 'N/A'} color="primary" variant="outlined" />
            <Button size="small" variant="outlined" onClick={copyOrgCode} disabled={!orgCode} sx={{ color: isDark ? '#e2e8f0' : undefined }}>
              Copy
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3, backgroundColor: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">Members</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search members"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: isDark ? '#0f172a' : '#fff',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  '& fieldset': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                sx={{
                  background: isDark ? '#0f172a' : '#fff',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="technician">Technician</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" onClick={loadData} sx={{ color: isDark ? '#e2e8f0' : undefined }}>
              Apply
            </Button>
          </Box>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: isDark ? '#111827' : '#f8fafc' }}>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Name</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Email</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Role</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Status</TableCell>
              <TableCell align="right" sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member._id} sx={{ '& td': { color: isDark ? '#e2e8f0' : '#0f172a' } }}>
                <TableCell>{member.firstName} {member.lastName}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={member.active ? 'Active' : 'Inactive'}
                    color={member.active ? 'success' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleToggleUser(member)}
                    disabled={loading}
                    sx={{ color: isDark ? '#e2e8f0' : undefined }}
                  >
                    {member.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No members found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, backgroundColor: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">Invites</Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                sx={{
                  background: isDark ? '#0f172a' : '#fff',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
                }}
              >
                <MenuItem value="facility_manager">Facility Manager</MenuItem>
                <MenuItem value="technician">Technician</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="vendor">Vendor</MenuItem>
                <MenuItem value="finance">Finance</MenuItem>
                <MenuItem value="procurement">Procurement</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Expires (days)"
              type="number"
              value={inviteExpiresDays}
              onChange={(e) => setInviteExpiresDays(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{
                width: 140,
                '& .MuiOutlinedInput-root': {
                  background: isDark ? '#0f172a' : '#fff',
                  color: isDark ? '#e2e8f0' : '#0f172a',
                  '& fieldset': { borderColor: isDark ? '#1f2937' : '#e2e8f0' },
                },
              }}
            />
            <Button size="small" variant="contained" onClick={handleCreateInvite}>
              Create Invite
            </Button>
          </Box>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: isDark ? '#111827' : '#f8fafc' }}>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Code</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Role</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Created By</TableCell>
              <TableCell sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Expires</TableCell>
              <TableCell align="right" sx={{ color: isDark ? '#e2e8f0' : '#0f172a' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.code} sx={{ '& td': { color: isDark ? '#e2e8f0' : '#0f172a' } }}>
                <TableCell>{invite.code}</TableCell>
                <TableCell>{invite.role}</TableCell>
                <TableCell>{invite.createdBy || '—'}</TableCell>
                <TableCell>{invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell align="right">
                  <Box display="flex" justifyContent="flex-end" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        if (navigator?.clipboard?.writeText) {
                          const inviteLink = `${window.location.origin}/register?invite=${invite.code}`;
                          navigator.clipboard.writeText(inviteLink);
                          toast.info('Invite link copied');
                        }
                      }}
                    >
                      Copy
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleRevokeInvite(invite.code)}
                    >
                      Revoke
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!loading && invites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">
                    No active invites found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 2, mt: 3, backgroundColor: isDark ? '#0f172a' : '#fff', border: `1px solid ${isDark ? '#1f2937' : '#e2e8f0'}` }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={showRoleDescriptions ? 1 : 0}>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary">Role Descriptions</Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowRoleDescriptions((prev) => !prev)}
            sx={{ color: isDark ? '#e2e8f0' : undefined }}
          >
            {showRoleDescriptions ? 'Hide' : 'Show'}
          </Button>
        </Box>
        {showRoleDescriptions && (
          <Box display="grid" gap={1}>
            {roleDescriptions.map((item) => (
              <Box key={item.role} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="body2" fontWeight={600} color="text.primary">{item.role}</Typography>
                <Typography variant="body2" color="text.secondary">{item.description}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      <Dialog open={disableConfirmOpen} onClose={() => setDisableConfirmOpen(false)}>
        <DialogTitle>Disable organization?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Disabling the organization will deactivate all users and block access until re-enabled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableConfirmOpen(false)}>Cancel</Button>
          {isAdmin && (
            <Button
              color="error"
              variant="contained"
              onClick={async () => {
                setDisableConfirmOpen(false);
                await handleDisableOrg();
              }}
            >
              Disable
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrgAdmin;
