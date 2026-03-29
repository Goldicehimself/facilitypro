import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  getSuperAdminOverview,
  listSuperAdminOrganizations,
  createSuperAdminOrganization,
  updateSuperAdminOrganizationStatus,
  updateSuperAdminFeatureFlags,
  updateSuperAdminLicensing,
  updateSuperAdminBilling,
  assignSuperAdminOrgAdmin,
  getSuperAdminIntegrations,
  revokeSuperAdminApiKey,
  listSuperAdminUsers,
  updateSuperAdminUserStatus,
  updateSuperAdminUserRole,
  forceSuperAdminPasswordReset,
  revokeSuperAdminSessions,
  impersonateSuperAdminUser,
  listSuperAdminAuditLogs
} from '../../api/superAdmin';
import { getHomeRoute } from '../../utils/roleHome';

const SuperAdmin = () => {
  const [overview, setOverview] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatus, setOrgStatus] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [integrations, setIntegrations] = useState({ webhooks: [], apiKeys: [] });
  const [orgUsers, setOrgUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [impersonationSession, setImpersonationSession] = useState(null);
  const [healthStatus, setHealthStatus] = useState('Unknown');

  const [createOrg, setCreateOrg] = useState({
    name: '',
    orgEmail: '',
    industry: '',
    plan: 'starter',
    billingCycle: 'monthly',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    isSystem: false
  });

  const [featureFlagsInput, setFeatureFlagsInput] = useState('{}');
  const [licensing, setLicensing] = useState({ planOverride: '', seatCap: '', notes: '' });
  const [billing, setBilling] = useState({ plan: 'starter', billingCycle: 'monthly', seatCount: 5, status: 'trialing' });
  const [assignAdminId, setAssignAdminId] = useState('');

  const orgStatusLabel = (status) => {
    if (status === 'active') return 'Active';
    if (status === 'disabled') return 'Disabled';
    return 'Pending';
  };

  const loadOverview = async () => {
    try {
      const data = await getSuperAdminOverview();
      setOverview(data || null);
    } catch (error) {
      toast.error('Failed to load overview.');
    }
  };

  const loadOrgs = async () => {
    try {
      const data = await listSuperAdminOrganizations({
        search: orgSearch || undefined,
        status: orgStatus === 'all' ? undefined : orgStatus,
        page: 1,
        limit: 50
      });
      setOrgs(data?.organizations || []);
    } catch (error) {
      toast.error('Failed to load organizations.');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await listSuperAdminUsers({
        search: userSearch || undefined,
        page: 1,
        limit: 50
      });
      setUsers(data?.users || []);
    } catch (error) {
      toast.error('Failed to load users.');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await listSuperAdminAuditLogs({ page: 1, limit: 50 });
      setAuditLogs(data?.logs || []);
    } catch (error) {
      toast.error('Failed to load audit logs.');
    }
  };

  const loadHealth = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
      const response = await fetch(`${apiBase.replace(/\/$/, '')}/health`);
      const payload = await response.json();
      setHealthStatus(payload?.status || 'Unknown');
    } catch (error) {
      setHealthStatus('Unavailable');
    }
  };

  useEffect(() => {
    loadOverview();
    loadOrgs();
    loadUsers();
    loadAuditLogs();
    loadHealth();
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [orgSearch, orgStatus]);

  useEffect(() => {
    loadUsers();
  }, [userSearch]);

  useEffect(() => {
    if (!selectedOrg?._id) return;
    getSuperAdminIntegrations(selectedOrg._id)
      .then((data) => setIntegrations(data || { webhooks: [], apiKeys: [] }))
      .catch(() => setIntegrations({ webhooks: [], apiKeys: [] }));

    listSuperAdminUsers({ orgId: selectedOrg._id, page: 1, limit: 50 })
      .then((data) => setOrgUsers(data?.users || []))
      .catch(() => setOrgUsers([]));

    const flags = selectedOrg?.settings?.featureFlags?.flags || {};
    setFeatureFlagsInput(JSON.stringify(flags, null, 2));
    const licensingData = selectedOrg?.settings?.licensing || {};
    setLicensing({
      planOverride: licensingData.planOverride || '',
      seatCap: licensingData.seatCap || '',
      notes: licensingData.notes || ''
    });
    const billingData = selectedOrg?.settings?.billing || {};
    setBilling({
      plan: billingData.plan || 'starter',
      billingCycle: billingData.billingCycle || 'monthly',
      seatCount: billingData.seatCount || 5,
      status: billingData.status || 'trialing'
    });
  }, [selectedOrg]);

  const handleCreateOrg = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: createOrg.name.trim(),
        orgEmail: createOrg.orgEmail.trim(),
        industry: createOrg.industry.trim(),
        isSystem: !!createOrg.isSystem,
        billing: {
          plan: createOrg.plan,
          billingCycle: createOrg.billingCycle
        },
        admin: {
          firstName: createOrg.adminFirstName.trim(),
          lastName: createOrg.adminLastName.trim(),
          email: createOrg.adminEmail.trim(),
          password: createOrg.adminPassword
        }
      };
      const result = await createSuperAdminOrganization(payload);
      toast.success('Organization created.');
      setCreateOrg({
        name: '',
        orgEmail: '',
        industry: '',
        plan: 'starter',
        billingCycle: 'monthly',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        adminPassword: '',
        isSystem: false
      });
      await loadOrgs();
      if (result?.organization) setSelectedOrg(result.organization);
    } catch (error) {
      toast.error('Failed to create organization.');
    }
  };

  const handleOrgStatus = async (org) => {
    try {
      const nextStatus = org.status === 'active' ? 'disabled' : 'active';
      const confirmed = window.confirm(
        nextStatus === 'disabled'
          ? `Disable ${org.name}? This will block all org access.`
          : `Enable ${org.name}?`
      );
      if (!confirmed) return;
      await updateSuperAdminOrganizationStatus(org._id, nextStatus);
      toast.success(`Organization ${nextStatus === 'active' ? 'enabled' : 'disabled'}.`);
      await loadOrgs();
    } catch (error) {
      toast.error('Failed to update organization.');
    }
  };

  const handleSaveFlags = async () => {
    try {
      const parsed = JSON.parse(featureFlagsInput || '{}');
      await updateSuperAdminFeatureFlags(selectedOrg._id, parsed);
      toast.success('Feature flags updated.');
    } catch (error) {
      toast.error('Invalid JSON for feature flags.');
    }
  };

  const handleSaveLicensing = async () => {
    try {
      await updateSuperAdminLicensing(selectedOrg._id, {
        planOverride: licensing.planOverride || null,
        seatCap: licensing.seatCap ? Number(licensing.seatCap) : null,
        notes: licensing.notes || null
      });
      toast.success('Licensing updated.');
    } catch (error) {
      toast.error('Failed to update licensing.');
    }
  };

  const handleSaveBilling = async () => {
    try {
      await updateSuperAdminBilling(selectedOrg._id, {
        plan: billing.plan,
        billingCycle: billing.billingCycle,
        seatCount: Number(billing.seatCount) || 1,
        status: billing.status
      });
      toast.success('Billing updated.');
    } catch (error) {
      toast.error('Failed to update billing.');
    }
  };

  const handleAssignAdmin = async () => {
    if (!assignAdminId) return;
    try {
      await assignSuperAdminOrgAdmin(selectedOrg._id, assignAdminId);
      toast.success('Admin assigned.');
      await loadOrgs();
    } catch (error) {
      toast.error('Failed to assign admin.');
    }
  };

  const handleUserStatus = async (user) => {
    try {
      const confirmed = window.confirm(
        user.active
          ? `Suspend ${user.email}? They will lose access immediately.`
          : `Reactivate ${user.email}?`
      );
      if (!confirmed) return;
      await updateSuperAdminUserStatus(user._id, !user.active);
      toast.success(`User ${user.active ? 'suspended' : 'reactivated'}.`);
      await loadUsers();
    } catch (error) {
      toast.error('Failed to update user.');
    }
  };

  const handleUserRole = async (userId, role) => {
    try {
      await updateSuperAdminUserRole(userId, role);
      toast.success('Role updated.');
      await loadUsers();
    } catch (error) {
      toast.error('Failed to update role.');
    }
  };

  const handleForceReset = async (userId) => {
    try {
      const confirmed = window.confirm('Force a password reset and revoke active sessions?');
      if (!confirmed) return;
      await forceSuperAdminPasswordReset(userId);
      toast.success('Password reset forced.');
    } catch (error) {
      toast.error('Failed to force password reset.');
    }
  };

  const handleRevokeSessions = async (userId) => {
    try {
      const confirmed = window.confirm('Revoke all active sessions for this user?');
      if (!confirmed) return;
      await revokeSuperAdminSessions(userId);
      toast.success('Sessions revoked.');
    } catch (error) {
      toast.error('Failed to revoke sessions.');
    }
  };

  const handleImpersonate = async (userId) => {
    try {
      const data = await impersonateSuperAdminUser(userId);
      if (data?.token) {
        setImpersonationSession({ token: data.token, user: data.user || null });
      }
      toast.success('Read-only impersonation token created.');
    } catch (error) {
      toast.error('Failed to create impersonation token.');
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    try {
      const confirmed = window.confirm('Revoke this API key? This action cannot be undone.');
      if (!confirmed) return;
      await revokeSuperAdminApiKey(selectedOrg._id, keyId);
      const data = await getSuperAdminIntegrations(selectedOrg._id);
      setIntegrations(data || { webhooks: [], apiKeys: [] });
      toast.success('API key revoked.');
    } catch (error) {
      toast.error('Failed to revoke API key.');
    }
  };

  const orgUserOptions = useMemo(() => {
    return orgUsers.map((user) => ({
      id: user._id,
      label: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    }));
  }, [orgUsers]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_55%),radial-gradient(circle_at_85%_0,_rgba(14,165,233,0.18),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_65%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.85),_transparent_60%),radial-gradient(circle_at_80%_10%,_rgba(30,41,59,0.7),_transparent_55%),linear-gradient(180deg,#0b1120_0%,#0f172a_70%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">System Control</p>
              <h1 className="text-3xl font-semibold text-slate-900 mt-2 dark:text-slate-100">Super Admin Console</h1>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                Global visibility across tenants, users, and platform operations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Health: {healthStatus}</span>
              <span className="rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">Audit enabled</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Organizations</p>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{overview?.organizations?.total || 0}</div>
            <p className="text-xs text-slate-500 mt-1">{overview?.organizations?.active || 0} active</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">Users</p>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{overview?.users?.total || 0}</div>
            <p className="text-xs text-slate-500 mt-1">{overview?.users?.suspended || 0} suspended</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs text-slate-500">System Status</p>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{healthStatus}</div>
            <p className="text-xs text-slate-500 mt-1">Global monitoring online</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Organization</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Provision a tenant and its primary admin.</p>
            <form className="mt-4 grid gap-3" onSubmit={handleCreateOrg}>
              <input
                type="text"
                placeholder="Organization name"
                value={createOrg.name}
                onChange={(e) => setCreateOrg((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="email"
                placeholder="Organization email"
                value={createOrg.orgEmail}
                onChange={(e) => setCreateOrg((prev) => ({ ...prev, orgEmail: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="text"
                placeholder="Industry"
                value={createOrg.industry}
                onChange={(e) => setCreateOrg((prev) => ({ ...prev, industry: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={createOrg.plan}
                  onChange={(e) => setCreateOrg((prev) => ({ ...prev, plan: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  disabled={createOrg.isSystem}
                >
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={createOrg.billingCycle}
                  onChange={(e) => setCreateOrg((prev) => ({ ...prev, billingCycle: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  disabled={createOrg.isSystem}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={createOrg.isSystem}
                  onChange={(e) => setCreateOrg((prev) => ({ ...prev, isSystem: e.target.checked }))}
                />
                System org (no billing/trial)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Admin first name"
                  value={createOrg.adminFirstName}
                  onChange={(e) => setCreateOrg((prev) => ({ ...prev, adminFirstName: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required
                />
                <input
                  type="text"
                  placeholder="Admin last name"
                  value={createOrg.adminLastName}
                  onChange={(e) => setCreateOrg((prev) => ({ ...prev, adminLastName: e.target.value }))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Admin email"
                value={createOrg.adminEmail}
                onChange={(e) => setCreateOrg((prev) => ({ ...prev, adminEmail: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <input
                type="password"
                placeholder="Admin temporary password"
                value={createOrg.adminPassword}
                onChange={(e) => setCreateOrg((prev) => ({ ...prev, adminPassword: e.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                required
              />
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Create Organization
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Organizations</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage tenant access and admin assignments.</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Search orgs"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
              <select
                value={orgStatus}
                onChange={(e) => setOrgStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto">
              {orgs.map((org) => (
                <button
                  type="button"
                  key={org._id}
                  onClick={() => setSelectedOrg(org)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${selectedOrg?._id === org._id ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{org.name}</div>
                      <div className="text-xs text-slate-500">{org.orgCode} - {orgStatusLabel(org.status)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOrgStatus(org);
                      }}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      {org.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  {org.admin?.email && (
                    <div className="text-xs text-slate-500 mt-2">Admin: {org.admin.email}</div>
                  )}
                </button>
              ))}
              {orgs.length === 0 && (
                <p className="text-sm text-slate-500">No organizations found.</p>
              )}
            </div>
          </div>
        </div>

        {selectedOrg && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedOrg.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Org code: {selectedOrg.orgCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Assign Admin</h3>
                <select
                  value={assignAdminId}
                  onChange={(e) => setAssignAdminId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">Select user</option>
                  {orgUserOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignAdmin}
                  className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Assign Admin
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Billing</h3>
                <div className="mt-2 space-y-2">
                  <select
                    value={billing.plan}
                    onChange={(e) => setBilling((prev) => ({ ...prev, plan: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <select
                    value={billing.billingCycle}
                    onChange={(e) => setBilling((prev) => ({ ...prev, billingCycle: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={billing.seatCount}
                    onChange={(e) => setBilling((prev) => ({ ...prev, seatCount: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    placeholder="Seat count"
                  />
                  <select
                    value={billing.status}
                    onChange={(e) => setBilling((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="trialing">Trialing</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past due</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSaveBilling}
                    className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Save Billing
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Licensing</h3>
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    placeholder="Plan override"
                    value={licensing.planOverride}
                    onChange={(e) => setLicensing((prev) => ({ ...prev, planOverride: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Seat cap"
                    value={licensing.seatCap}
                    onChange={(e) => setLicensing((prev) => ({ ...prev, seatCap: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <textarea
                    rows="2"
                    placeholder="Notes"
                    value={licensing.notes}
                    onChange={(e) => setLicensing((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <button
                    type="button"
                    onClick={handleSaveLicensing}
                    className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                  >
                    Save Licensing
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Feature Flags</h3>
                <textarea
                  rows="6"
                  value={featureFlagsInput}
                  onChange={(e) => setFeatureFlagsInput(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={handleSaveFlags}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save Feature Flags
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">API Keys</h3>
                <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto">
                  {integrations.apiKeys?.length ? (
                    integrations.apiKeys.map((key) => (
                      <div key={key.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{key.name}</div>
                            <div className="text-slate-500">{key.prefix}****{key.last4}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRevokeApiKey(key.id)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No API keys yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Security & Monitoring</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Operational visibility across the platform.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Incident Logs</div>
              <p className="text-xs text-slate-500 mt-2">No incidents reported.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Sensitive Access Logs</div>
              <p className="text-xs text-slate-500 mt-2">No sensitive access events.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-800">
              <div className="font-semibold text-slate-900 dark:text-slate-100">Backup Visibility</div>
              <p className="text-xs text-slate-500 mt-2">
                Last backup: {selectedOrg?.settings?.backups?.lastBackupAt ? new Date(selectedOrg.settings.backups.lastBackupAt).toLocaleString() : 'Not reported'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Status: {selectedOrg?.settings?.backups?.status || 'unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Global Users</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Search, suspend, and manage accounts.</p>
            </div>
            <input
              type="text"
              placeholder="Search users"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div className="mt-4 space-y-3">
            {users.map((user) => (
              <div key={user._id} className="rounded-lg border border-slate-200 px-3 py-3 text-sm dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-slate-500">{user.email} - {user.organization?.name || 'Unknown org'}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleUserRole(user._id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="facility_manager">Facility Manager</option>
                      <option value="technician">Technician</option>
                      <option value="staff">Staff</option>
                      <option value="vendor">Vendor</option>
                      <option value="finance">Finance</option>
                      <option value="procurement">Procurement</option>
                      <option value="user">User</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUserStatus(user)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      {user.active ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleForceReset(user._id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Force Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeSessions(user._id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Revoke Sessions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleImpersonate(user._id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      Impersonate (RO)
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-sm text-slate-500">No users found.</p>
            )}
          </div>

          {impersonationSession?.token && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              <div className="font-semibold">Impersonation token (read-only)</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="break-all rounded bg-white/70 px-2 py-1 text-[11px] dark:bg-black/40">{impersonationSession.token}</code>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(impersonationSession.token);
                      toast.info('Token copied.');
                    }
                  }}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm('Start read-only impersonation in this session? You will be signed in as the target user.');
                    if (!confirmed) return;
                    if (!impersonationSession.user) return;
                    sessionStorage.setItem('token', impersonationSession.token);
                    sessionStorage.setItem('user', JSON.stringify(impersonationSession.user));
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('orgCode');
                    window.location.href = getHomeRoute(impersonationSession.user.role);
                  }}
                  className="rounded-full border border-emerald-200 px-3 py-1 text-[11px] text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200"
                >
                  Start Session
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Super Admin Audit Trail</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every action is logged for compliance.</p>
          <div className="mt-4 space-y-2">
            {auditLogs.map((log) => (
              <div key={log._id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{log.action}</div>
                <div className="text-slate-500">
                  {log.organization?.name || 'System'} - {log.actor?.email || 'Unknown'} - {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-sm text-slate-500">No audit logs yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
