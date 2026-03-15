import React, { useEffect, useState } from 'react';
import { Save, Clock, Calendar, Bell, Lock, Database, Download, Sun, Moon, Laptop } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getOrgSettings,
  updateOrgSettings,
  getOrgIntegrations,
  createOrgWebhook,
  deleteOrgWebhook,
  createOrgApiKey,
  revokeOrgApiKey
} from '../../api/org';
import {
  AdminSettings,
  FacilityManagerSettings,
  TechnicianSettings,
  VendorSettings,
  FinanceSettings,
  StaffSettings,
} from './RoleSpecificSettings';
import Help from '../Help/Help';
import OrgAdmin from '../Org/OrgAdmin';

const Settings = () => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // System Configuration State
  const [timeZone, setTimeZone] = useState('UTC-5 (Eastern Time)');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [autoAssignOrders, setAutoAssignOrders] = useState(false);
  const [maintenanceReminders, setMaintenanceReminders] = useState(false);

  // Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('2 hours');
  const [strongPassword, setStrongPassword] = useState(true);
  const [minPasswordLength, setMinPasswordLength] = useState('12');
  const [lockoutThreshold, setLockoutThreshold] = useState('5 attempts');
  const [allowedInviteDomains, setAllowedInviteDomains] = useState('');
  const [restrictInviteDomains, setRestrictInviteDomains] = useState(false);

  const [enforceMfa, setEnforceMfa] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(false);
  const [notifyWoCreated, setNotifyWoCreated] = useState(true);
  const [notifyWoAssigned, setNotifyWoAssigned] = useState(true);
  const [notifyWoOverdue, setNotifyWoOverdue] = useState(true);
  const [notifyPmDue, setNotifyPmDue] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('06:00');

  // Default Settings State
  const [defaultPriority, setDefaultPriority] = useState('Medium');
  const [defaultStatus, setDefaultStatus] = useState('Open');
  const [requireImages, setRequireImages] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState('Standard Maintenance');

  // Data Management State
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('Daily');
  const [dataRetention, setDataRetention] = useState('7 years');

  // Company Profile State
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyLogoDataUrl, setCompanyLogoDataUrl] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyContactEmail, setCompanyContactEmail] = useState('');
  const [companyContactPhone, setCompanyContactPhone] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [supportContactEmail, setSupportContactEmail] = useState('');
  const [supportContactPhone, setSupportContactPhone] = useState('');
  const [webhooks, setWebhooks] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookType, setNewWebhookType] = useState('generic');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const webhookEventOptions = [
    { id: 'workorder.created', label: 'Work Order Created' },
    { id: 'workorder.assigned', label: 'Work Order Assigned' },
    { id: 'workorder.status_changed', label: 'Status Changed' },
    { id: 'workorder.overdue', label: 'Work Order Overdue' },
    { id: 'pm.due', label: 'Preventive Maintenance Due' }
  ];

  const baseWebhookEvents = [
    'workorder.created',
    'workorder.assigned',
    'workorder.status_changed',
    'workorder.overdue',
    'pm.due'
  ];
  const webhookEventDefaults = {
    generic: baseWebhookEvents,
    slack: ['workorder.created', 'workorder.assigned', 'workorder.status_changed'],
    teams: ['workorder.created', 'workorder.assigned', 'workorder.status_changed'],
    zapier: baseWebhookEvents
  };
  const webhookEventOptionsByType = {
    generic: webhookEventOptions,
    slack: webhookEventOptions,
    teams: webhookEventOptions,
    zapier: webhookEventOptions
  };
  const [newWebhookEvents, setNewWebhookEvents] = useState(webhookEventDefaults.generic);
  const [newApiKeyScopes, setNewApiKeyScopes] = useState([
    'workorders:read',
    'assets:read',
    'vendors:read',
    'reports:read'
  ]);
  const [apiKeyExpiresAt, setApiKeyExpiresAt] = useState('');
  const [apiKeyRateWindowMs, setApiKeyRateWindowMs] = useState('60000');
  const [apiKeyRateMax, setApiKeyRateMax] = useState('60');
  const [createdApiKey, setCreatedApiKey] = useState('');
  const [createdWebhookSecret, setCreatedWebhookSecret] = useState('');
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);

  // Billing State
  const [billingPlan, setBillingPlan] = useState('starter');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [seatCount, setSeatCount] = useState(5);
  const [seatsIncluded, setSeatsIncluded] = useState(5);
  const [extraSeatPrice, setExtraSeatPrice] = useState(4);
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trialing');
  const [invoices] = useState([
    { id: 'inv_001', date: '2026-02-01', amount: 39, status: 'paid' },
    { id: 'inv_000', date: '2026-01-01', amount: 39, status: 'paid' }
  ]);

  const planPricing = {
    starter: { monthly: 19, seatsIncluded: 5 },
    pro: { monthly: 39, seatsIncluded: 10 },
    enterprise: { monthly: 0, seatsIncluded: 0 }
  };

  const annualDiscount = 0.2;
  const includedSeats = planPricing[billingPlan]?.seatsIncluded ?? seatsIncluded;
  const baseMonthly = planPricing[billingPlan]?.monthly ?? 0;
  const extraSeats = Math.max(0, Number(seatCount || 0) - includedSeats);
  const extraMonthly = extraSeats * Number(extraSeatPrice || 0);
  const totalMonthly = baseMonthly + extraMonthly;
  const totalAnnual = (baseMonthly * 12 * (1 - annualDiscount)) + (extraSeats * Number(extraSeatPrice || 0) * 12 * (1 - annualDiscount));

  const sessionTimeoutOptions = [
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 120 },
    { label: '4 hours', minutes: 240 },
  ];

  const lockoutOptions = [
    { label: '3 attempts', value: 3 },
    { label: '5 attempts', value: 5 },
    { label: '8 attempts', value: 8 },
    { label: '10 attempts', value: 10 },
  ];

  const getSessionTimeoutLabel = (minutes) => {
    const match = sessionTimeoutOptions.find((opt) => opt.minutes === minutes);
    return match ? match.label : '2 hours';
  };

  const getSessionTimeoutMinutes = (label) => {
    const match = sessionTimeoutOptions.find((opt) => opt.label === label);
    return match ? match.minutes : 120;
  };

  const getLockoutLabel = (value) => {
    const match = lockoutOptions.find((opt) => opt.value === value);
    return match ? match.label : '5 attempts';
  };

  const getLockoutValue = (label) => {
    const match = lockoutOptions.find((opt) => opt.label === label);
    return match ? match.value : 5;
  };

  const apiKeyScopeOptions = [
    { id: 'workorders:read', label: 'workorders:read' },
    { id: 'workorders:write', label: 'workorders:write' },
    { id: 'assets:read', label: 'assets:read' },
    { id: 'assets:write', label: 'assets:write' },
    { id: 'vendors:read', label: 'vendors:read' },
    { id: 'reports:read', label: 'reports:read' }
  ];

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'users', label: 'Users & Permissions', icon: '👥', roles: ['admin', 'facility_manager'] },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'integrations', label: 'Integrations', icon: '🔗', roles: ['admin'] },
    { id: 'company', label: 'Company Profile', icon: '🏢', roles: ['admin', 'facility_manager'] },
    { id: 'billing', label: 'Billing', icon: '💳', roles: ['admin'] },
    { id: 'role-specific', label: 'Role Settings', icon: '👤' },
    { id: 'help', label: 'Help & Support', icon: '🆘' },
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => !tab.roles || tab.roles.includes(user?.role));

  const handleToggle = (setter) => {
    setter(prev => {
      setHasChanges(true);
      return !prev;
    });
  };

  const handleChange = (setter) => (value) => {
    setter(value);
    setHasChanges(true);
  };

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const response = await getOrgSettings();
        const settings = response?.settings || response || {};

        const securityPolicy = settings.securityPolicy || {};
        setTwoFactorAuth(!!securityPolicy.twoFactorAuth);
        setEnforceMfa(!!securityPolicy.enforceMfa);
        setStrongPassword(
          typeof securityPolicy.strongPassword === 'boolean' ? securityPolicy.strongPassword : true
        );
        setMinPasswordLength(
          String(securityPolicy.minPasswordLength ?? 12)
        );
        setLockoutThreshold(
          getLockoutLabel(securityPolicy.lockoutThreshold ?? 5)
        );
        if (typeof securityPolicy.sessionTimeoutMinutes === 'number') {
          setSessionTimeout(getSessionTimeoutLabel(securityPolicy.sessionTimeoutMinutes));
        }
        setRestrictInviteDomains(!!securityPolicy.restrictInviteDomains);
        setAllowedInviteDomains((securityPolicy.allowedInviteDomains || []).join(', '));

        const notifications = settings.notifications || {};
        setNotifyWoCreated(!!notifications.notifyWoCreated);
        setNotifyWoAssigned(!!notifications.notifyWoAssigned);
        setNotifyWoOverdue(!!notifications.notifyWoOverdue);
        setNotifyPmDue(!!notifications.notifyPmDue);
        setNotifyEmail(
          typeof notifications.notifyEmail === 'boolean' ? notifications.notifyEmail : true
        );
        setNotifyInApp(
          typeof notifications.notifyInApp === 'boolean' ? notifications.notifyInApp : true
        );
        setQuietHoursEnabled(!!notifications.quietHoursEnabled);
        if (typeof notifications.quietHoursStart === 'string') setQuietHoursStart(notifications.quietHoursStart);
        if (typeof notifications.quietHoursEnd === 'string') setQuietHoursEnd(notifications.quietHoursEnd);

        const companyProfile = settings.companyProfile || {};
        if (typeof companyProfile.companyName === 'string') setCompanyName(companyProfile.companyName);
        if (typeof companyProfile.logoUrl === 'string') setCompanyLogoUrl(companyProfile.logoUrl);
        if (typeof companyProfile.logoDataUrl === 'string') setCompanyLogoDataUrl(companyProfile.logoDataUrl);
        if (typeof companyProfile.address === 'string') setCompanyAddress(companyProfile.address);
        if (typeof companyProfile.contactEmail === 'string') setCompanyContactEmail(companyProfile.contactEmail);
        if (typeof companyProfile.contactPhone === 'string') setCompanyContactPhone(companyProfile.contactPhone);
        if (typeof companyProfile.industry === 'string') setCompanyIndustry(companyProfile.industry);
        if (typeof companyProfile.supportEmail === 'string') setSupportContactEmail(companyProfile.supportEmail);
        if (typeof companyProfile.supportPhone === 'string') setSupportContactPhone(companyProfile.supportPhone);

        const billing = settings.billing || {};
        const planFromSettings = billing.plan || 'starter';
        setBillingPlan(planFromSettings);
        setBillingCycle(billing.billingCycle || 'monthly');
        setSeatsIncluded(billing.seatsIncluded ?? (planPricing[planFromSettings]?.seatsIncluded || 5));
        setExtraSeatPrice(billing.extraSeatPrice ?? 4);
        setSeatCount(billing.seatCount ?? (planPricing[planFromSettings]?.seatsIncluded || 5));
        setTrialEndsAt(billing.trialEndsAt || null);
        setSubscriptionStatus(billing.status || 'trialing');
      } catch (error) {
        toast.error('Failed to load organization settings.');
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const loadIntegrations = async () => {
      if (user?.role !== 'admin') return;
      setLoadingIntegrations(true);
      try {
        const data = await getOrgIntegrations();
        setWebhooks(data?.webhooks || []);
        setApiKeys(data?.apiKeys || []);
      } catch (error) {
        toast.error('Failed to load integrations.');
      } finally {
        setLoadingIntegrations(false);
      }
    };
    loadIntegrations();
  }, [user?.role]);

  const handleSaveChanges = async () => {
    try {
      await updateOrgSettings({
        securityPolicy: {
          twoFactorAuth,
          enforceMfa,
          sessionTimeoutMinutes: getSessionTimeoutMinutes(sessionTimeout),
          strongPassword,
          minPasswordLength: Number(minPasswordLength),
          lockoutThreshold: getLockoutValue(lockoutThreshold),
          restrictInviteDomains,
          allowedInviteDomains: allowedInviteDomains
            .split(',')
            .map((d) => d.trim().toLowerCase())
            .filter(Boolean),
        },
        notifications: {
          notifyWoCreated,
          notifyWoAssigned,
          notifyWoOverdue,
          notifyPmDue,
          notifyEmail,
          notifyInApp,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
        },
        companyProfile: {
          companyName: companyName.trim(),
          logoUrl: companyLogoUrl.trim(),
          logoDataUrl: companyLogoDataUrl,
          address: companyAddress.trim(),
          contactEmail: companyContactEmail.trim(),
          contactPhone: companyContactPhone.trim(),
          industry: companyIndustry.trim(),
          supportEmail: supportContactEmail.trim(),
          supportPhone: supportContactPhone.trim(),
        },
        billing: {
          plan: billingPlan,
          billingCycle,
          seatsIncluded: Number(seatsIncluded || includedSeats),
          seatCount: Number(seatCount || includedSeats),
          extraSeatPrice: Number(extraSeatPrice || 0),
          trialEndsAt: trialEndsAt || null,
          status: subscriptionStatus
        }
      });
      toast.success('Settings saved successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings.');
    }
  };

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setCompanyLogoDataUrl(result);
      setCompanyLogoUrl('');
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const handleExportData = () => {
    toast.info('Exporting all data...');
    // Implement actual export logic
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error('Webhook name and URL are required.');
      return;
    }
    if (!newWebhookEvents.length) {
      toast.error('Select at least one webhook event.');
      return;
    }
    try {
      const result = await createOrgWebhook({
        name: newWebhookName.trim(),
        url: newWebhookUrl.trim(),
        type: newWebhookType,
        events: newWebhookEvents,
        active: true
      });
      if (result?.webhook) {
        setWebhooks((prev) => [result.webhook, ...prev]);
      }
      if (result?.secret) {
        setCreatedWebhookSecret(result.secret);
      }
      setNewWebhookName('');
      setNewWebhookUrl('');
      toast.success('Webhook created.');
    } catch (error) {
      toast.error('Failed to create webhook.');
    }
  };

  const applyIntegrationPreset = (type) => {
    if (type === 'slack') {
      setNewWebhookType('slack');
      setNewWebhookName('Slack Notifications');
      setNewWebhookUrl('');
      setNewWebhookEvents(webhookEventDefaults.slack);
      toast.info('Slack preset applied. Paste your Slack incoming webhook URL.');
      return;
    }

    if (type === 'teams') {
      setNewWebhookType('teams');
      setNewWebhookName('Teams Notifications');
      setNewWebhookUrl('');
      setNewWebhookEvents(webhookEventDefaults.teams);
      toast.info('Teams preset applied. Paste your Teams incoming webhook URL.');
      return;
    }

    if (type === 'zapier') {
      setNewWebhookType('zapier');
      setNewWebhookName('Zapier / Make');
      setNewWebhookUrl('');
      setNewWebhookEvents(webhookEventDefaults.zapier);
      toast.info('Zapier/Make preset applied. Paste the webhook URL.');
      return;
    }
  };

  const handleWebhookTypeChange = (value) => {
    const nextType = value || 'generic';
    setNewWebhookType(nextType);
    setNewWebhookEvents(webhookEventDefaults[nextType] || baseWebhookEvents);
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await deleteOrgWebhook(id);
      setWebhooks((prev) => prev.filter((hook) => hook.id !== id));
      toast.success('Webhook deleted.');
    } catch (error) {
      toast.error('Failed to delete webhook.');
    }
  };

  const handleCreateApiKey = async () => {
    if (!newApiKeyName.trim()) {
      toast.error('API key name is required.');
      return;
    }
    if (!newApiKeyScopes.length) {
      toast.error('Select at least one scope.');
      return;
    }
    try {
      const rateWindow = Number(apiKeyRateWindowMs);
      const rateMax = Number(apiKeyRateMax);
      const result = await createOrgApiKey({
        name: newApiKeyName.trim(),
        scopes: newApiKeyScopes,
        expiresAt: apiKeyExpiresAt ? new Date(apiKeyExpiresAt).toISOString() : undefined,
        rateLimit: {
          windowMs: Number.isFinite(rateWindow) ? rateWindow : 60000,
          max: Number.isFinite(rateMax) ? rateMax : 60
        }
      });
      if (result?.apiKey) {
        setApiKeys((prev) => [result.apiKey, ...prev]);
      }
      if (result?.key) {
        setCreatedApiKey(result.key);
      }
      setNewApiKeyName('');
      toast.success('API key created.');
    } catch (error) {
      toast.error('Failed to create API key.');
    }
  };

  const handleRevokeApiKey = async (id) => {
    try {
      await revokeOrgApiKey(id);
      setApiKeys((prev) =>
        prev.map((key) => (key.id === id ? { ...key, revokedAt: new Date().toISOString() } : key))
      );
      toast.success('API key revoked.');
    } catch (error) {
      toast.error('Failed to revoke API key.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Settings</h1>
        <p className="text-indigo-700 dark:text-indigo-300 mt-1">
          Manage system configuration and preferences
        </p>
      </div>

      {/* Tabs */}
      <Card className="border-0 shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-b-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-b-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="p-8">
          {loadingSettings && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Loading settings...
            </div>
          )}

          {/* General Tab */}
          {!loadingSettings && activeTab === 'general' && (
            <div className="space-y-8">
              {/* Role Badge */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <span className="text-sm text-gray-600 dark:text-gray-300">Your Role:</span>
                <Badge className="bg-blue-700 text-white capitalize">{user?.role?.replace(/_/g, ' ')}</Badge>
              </div>

              {/* System Configuration - Admin & Facility Manager Only */}
              {['admin', 'facility_manager'].includes(user?.role) && (
                <>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Configuration</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
                    <select
                      value={timeZone}
                      onChange={(e) => handleChange(setTimeZone)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => handleChange(setDateFormat)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Auto assign Work Orders</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically assign work orders based on availability</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setAutoAssignOrders)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        autoAssignOrders ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          autoAssignOrders ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance Reminders</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Send automatic reminders for scheduled maintenance</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setMaintenanceReminders)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        maintenanceReminders ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          maintenanceReminders ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="dark:border-gray-700" />

              {/* Security */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-50 dark:bg-green-900 rounded-lg">
                    <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Two Factor Authentication</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setTwoFactorAuth)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        twoFactorAuth ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enforce MFA for All Users</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Require MFA for every user in this organization</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setEnforceMfa)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        enforceMfa ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          enforceMfa ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout</label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => handleChange(setSessionTimeout)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      {sessionTimeoutOptions.map((option) => (
                        <option key={option.label}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strong Password Requirements</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Require complex passwords for all users</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setStrongPassword)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        strongPassword ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          strongPassword ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Login Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notify when new login are detected</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setLoginNotifications)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        loginNotifications ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          loginNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="dark:border-gray-700" />

              {/* Default Settings */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                    <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Default Settings</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Work Order Priority</label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => handleChange(setDefaultPriority)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Work Order Status</label>
                    <select
                      value={defaultStatus}
                      onChange={(e) => handleChange(setDefaultStatus)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>On Hold</option>
                      <option>Completed</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Require Asset Images</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mandate photo uploads for new asset registrations</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setRequireImages)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        requireImages ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          requireImages ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Work Order Template</label>
                    <select
                      value={defaultTemplate}
                      onChange={(e) => handleChange(setDefaultTemplate)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>Standard Maintenance</option>
                      <option>Emergency Repair</option>
                      <option>Preventive Maintenance</option>
                      <option>Inspection</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr className="dark:border-gray-700" />
                </>
              )}

              {/* Data Management - Admin Only */}
              {user?.role === 'admin' && (
                <>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-900 rounded-lg">
                    <Database className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Management</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Automatic Backups</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enable automatic daily backups</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setAutoBackup)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        autoBackup ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          autoBackup ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Frequency</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => handleChange(setBackupFrequency)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data Retention Period</label>
                    <select
                      value={dataRetention}
                      onChange={(e) => handleChange(setDataRetention)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>1 year</option>
                      <option>3 years</option>
                      <option>7 years</option>
                      <option>Indefinite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export Data</label>
                    <button
                      onClick={handleExportData}
                      className="w-full px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900 cursor-pointer transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="h-5 w-5" />
                      Export All Data
                    </button>
                  </div>
                </div>
              </div>
                </>
              )}

              {/* Personal Preferences - All Users */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Preferences</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Receive email updates about your work</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setLoginNotifications)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        loginNotifications ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          loginNotifications ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Zone</label>
                    <select
                      value={timeZone}
                      onChange={(e) => handleChange(setTimeZone)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => handleChange(setDateFormat)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>MM/DD/YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          theme === 'light'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <Sun className="h-4 w-4" />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          theme === 'dark'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <Moon className="h-4 w-4" />
                        Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          theme === 'system'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <Laptop className="h-4 w-4" />
                        System {theme === 'system' && resolvedTheme ? `(${resolvedTheme})` : ''}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Choose light or dark, or follow your system setting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-50 dark:bg-red-900 rounded-lg">
                    <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Settings</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Two Factor Authentication</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setTwoFactorAuth)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        twoFactorAuth ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          twoFactorAuth ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Timeout</label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => handleChange(setSessionTimeout)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      {sessionTimeoutOptions.map((option) => (
                        <option key={option.label}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strong Password Requirements</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Require complex passwords</p>
                    </div>
                    <button
                      onClick={() => handleToggle(setStrongPassword)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        strongPassword ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          strongPassword ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Password Length</label>
                    <select
                      value={minPasswordLength}
                      onChange={(e) => handleChange(setMinPasswordLength)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      <option>10</option>
                      <option>12</option>
                      <option>14</option>
                      <option>16</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lockout Threshold</label>
                    <select
                      value={lockoutThreshold}
                      onChange={(e) => handleChange(setLockoutThreshold)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                    >
                      {lockoutOptions.map((option) => (
                        <option key={option.label}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Restrict Invite Domains</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When enabled, only approved domains can be invited</p>
                      {!restrictInviteDomains && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Default: allow any email domain.</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(setRestrictInviteDomains)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                        restrictInviteDomains ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          restrictInviteDomains ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allowed Invite Domains</label>
                    <input
                      type="text"
                      value={allowedInviteDomains}
                      onChange={(e) => handleChange(setAllowedInviteDomains)(e.target.value)}
                      disabled={!restrictInviteDomains}
                      className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        restrictInviteDomains ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                      }`}
                      placeholder="example.com, partner.com"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {restrictInviteDomains
                        ? 'Comma-separated domains allowed for invites.'
                        : 'Default: allow any email domain.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users & Permissions Tab */}
          {!loadingSettings && activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900 rounded-lg">
                    <span className="text-emerald-600 dark:text-emerald-400">👥</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Users & Permissions</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage members, roles, access, and invitation links for your organization.
                </p>
              </div>
              <OrgAdmin />
            </div>
          )}

          {/* Company Profile Tab */}
          {activeTab === 'company' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <Database className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Profile</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => handleChange(setCompanyName)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={companyLogoUrl}
                          onChange={(e) => handleChange(setCompanyLogoUrl)(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Or paste logo URL"
                        />
                        <div className="flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[72px]">
                          {companyLogoDataUrl || companyLogoUrl ? (
                            <img
                              src={companyLogoDataUrl || companyLogoUrl}
                              alt="Company logo preview"
                              className="max-h-14 object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">Logo preview</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload an image or provide a URL. Uploaded files are stored locally in this browser.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                    <textarea
                      value={companyAddress}
                      onChange={(e) => handleChange(setCompanyAddress)(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Street, City, State, ZIP, Country"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={companyContactEmail}
                        onChange={(e) => handleChange(setCompanyContactEmail)(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={companyContactPhone}
                        onChange={(e) => handleChange(setCompanyContactPhone)(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+1 (555) 555-5555"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Industry</label>
                    <input
                      type="text"
                      value={companyIndustry}
                      onChange={(e) => handleChange(setCompanyIndustry)(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Industry"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Support Email</label>
                      <input
                        type="email"
                        value={supportContactEmail}
                        onChange={(e) => handleChange(setSupportContactEmail)(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="support@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Support Phone</label>
                      <input
                        type="tel"
                        value={supportContactPhone}
                        onChange={(e) => handleChange(setSupportContactPhone)(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="+1 (555) 555-5555"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                </div>

                <div className="space-y-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Notification Triggers</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Order Created</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notify when a new work order is created</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyWoCreated)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyWoCreated ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyWoCreated ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Order Assigned</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notify when a work order is assigned</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyWoAssigned)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyWoAssigned ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyWoAssigned ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Work Order Overdue</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notify when a work order becomes overdue</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyWoOverdue)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyWoOverdue ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyWoOverdue ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preventive Maintenance Due</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notify when PM is due</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyPmDue)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyPmDue ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyPmDue ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Channels</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Send notifications by email</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyEmail)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyEmail ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyEmail ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">In-app</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Show notifications in the app</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setNotifyInApp)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            notifyInApp ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              notifyInApp ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quiet Hours</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enable Quiet Hours</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pause notifications during set hours</p>
                        </div>
                        <button
                          onClick={() => handleToggle(setQuietHoursEnabled)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                            quietHoursEnabled ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              quietHoursEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={quietHoursStart}
                            onChange={(e) => handleChange(setQuietHoursStart)(e.target.value)}
                            disabled={!quietHoursEnabled}
                            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                              quietHoursEnabled ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Time</label>
                          <input
                            type="time"
                            value={quietHoursEnd}
                            onChange={(e) => handleChange(setQuietHoursEnd)(e.target.value)}
                            disabled={!quietHoursEnabled}
                            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                              quietHoursEnabled ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {!loadingSettings && activeTab === 'integrations' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sky-50 dark:bg-sky-900 rounded-lg">
                    <Database className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Integrations</h3>
                </div>

                {loadingIntegrations && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading integrations...</p>
                )}

                <div className="space-y-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Connect (MVP)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Slack Notifications</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uses Slack incoming webhook URL.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => applyIntegrationPreset('slack')}>
                            Use Preset
                          </Button>
                        </div>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Teams Notifications</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uses Microsoft Teams incoming webhook URL.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => applyIntegrationPreset('teams')}>
                            Use Preset
                          </Button>
                        </div>
                      </div>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Zapier / Make</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Connect to Zapier or Make with a webhook URL.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => applyIntegrationPreset('zapier')}>
                            Use Preset
                          </Button>
                        </div>
                      </div>
                      <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Accounting (QuickBooks / Xero)</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Coming soon in a future release.</p>
                          </div>
                          <Button variant="outline" size="sm" disabled>
                            Coming Soon
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Webhooks</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select
                        value={newWebhookType}
                        onChange={(e) => handleWebhookTypeChange(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="generic">Generic Webhook</option>
                        <option value="slack">Slack</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="zapier">Zapier / Make</option>
                      </select>
                      <input
                        type="text"
                        value={newWebhookName}
                        onChange={(e) => setNewWebhookName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Webhook name"
                      />
                      <input
                        type="url"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="https://example.com/webhook"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                      {(webhookEventOptionsByType[newWebhookType] || webhookEventOptions).map((event) => (
                        <label key={event.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newWebhookEvents.includes(event.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWebhookEvents((prev) => [...prev, event.id]);
                              } else {
                                setNewWebhookEvents((prev) => prev.filter((item) => item !== event.id));
                              }
                            }}
                          />
                          {event.label}
                        </label>
                      ))}
                    </div>
                    <Button
                      onClick={handleCreateWebhook}
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      Add Webhook
                    </Button>

                    {createdWebhookSecret && (
                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
                        <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Webhook secret (shown once)
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-xs bg-white/70 dark:bg-black/20 px-2 py-1 rounded">
                            {createdWebhookSecret}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard?.writeText) {
                                navigator.clipboard.writeText(createdWebhookSecret);
                                toast.info('Webhook secret copied');
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {webhooks.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No webhooks created yet.</p>
                      )}
                      {webhooks.map((hook) => (
                        <div
                          key={hook.id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{hook.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Type: {hook.type || 'generic'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{hook.url}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Events: {(hook.events || []).join(', ') || 'None'}
                            </div>
                            {hook.deliveryLogs?.length ? (
                              <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {hook.deliveryLogs.slice(-5).reverse().map((log, idx) => (
                                  <div key={`${hook.id}-log-${idx}`}>
                                    {log.event} • {log.success ? 'success' : 'failed'} • {new Date(log.createdAt).toLocaleString()}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteWebhook(hook.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">API Keys</h4>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        value={newApiKeyName}
                        onChange={(e) => setNewApiKeyName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="API key name"
                      />
                      <Button
                        onClick={handleCreateApiKey}
                        className="bg-blue-700 hover:bg-blue-800 text-white"
                      >
                        Create Key
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
                      {apiKeyScopeOptions.map((scope) => (
                        <label key={scope.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newApiKeyScopes.includes(scope.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewApiKeyScopes((prev) => [...prev, scope.id]);
                              } else {
                                setNewApiKeyScopes((prev) => prev.filter((item) => item !== scope.id));
                              }
                            }}
                          />
                          {scope.label}
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Expiration (optional)</label>
                        <input
                          type="date"
                          value={apiKeyExpiresAt}
                          onChange={(e) => setApiKeyExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rate window (ms)</label>
                        <input
                          type="number"
                          min="1000"
                          value={apiKeyRateWindowMs}
                          onChange={(e) => setApiKeyRateWindowMs(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max requests</label>
                        <input
                          type="number"
                          min="1"
                          value={apiKeyRateMax}
                          onChange={(e) => setApiKeyRateMax(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    {createdApiKey && (
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                        <div className="text-sm font-medium text-green-800 dark:text-green-200">
                          API key (shown once)
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-xs bg-white/70 dark:bg-black/20 px-2 py-1 rounded">
                            {createdApiKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard?.writeText) {
                                navigator.clipboard.writeText(createdApiKey);
                                toast.info('API key copied');
                              }
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {apiKeys.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No API keys created yet.</p>
                      )}
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{key.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {key.prefix}••••{key.last4}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Scopes: {(key.scopes || []).join(', ') || 'None'}
                            </div>
                            {key.expiresAt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Expires: {new Date(key.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                            {key.lastUsedAt && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last used: {new Date(key.lastUsedAt).toLocaleString()}
                              </div>
                            )}
                            {key.rateLimit && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Rate limit: {key.rateLimit.max} / {Math.round((key.rateLimit.windowMs || 60000) / 1000)}s
                              </div>
                            )}
                          </div>
                          {key.revokedAt ? (
                            <span className="text-xs text-red-600">Revoked</span>
                          ) : (
                            <Button
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleRevokeApiKey(key.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {!loadingSettings && activeTab === 'billing' && (
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
                    <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Billing</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
                        <p className="text-lg font-semibold capitalize">{billingPlan}</p>
                      </div>
                      <Badge className={`capitalize ${subscriptionStatus === 'active' ? 'bg-emerald-600 text-white' : subscriptionStatus === 'past_due' ? 'bg-amber-500 text-white' : subscriptionStatus === 'canceled' ? 'bg-rose-600 text-white' : 'bg-blue-700 text-white'}`}>
                        {subscriptionStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Cycle</label>
                        <select
                          value={billingCycle}
                          onChange={(e) => handleChange(setBillingCycle)(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual (20% off)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seats</label>
                        <input
                          type="number"
                          min="1"
                          value={seatCount}
                          onChange={(e) => handleChange(setSeatCount)(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {includedSeats} seats included, ${extraSeatPrice}/seat for extras
                        </p>
                      </div>
                    </div>

                    {trialEndsAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Trial ends on {new Date(trialEndsAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Estimated Total</h4>
                    {billingCycle === 'monthly' ? (
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          ${totalMonthly.toFixed(2)}/mo
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Base ${baseMonthly}/mo + ${extraSeatPrice}/seat for {extraSeats} extra seat{extraSeats === 1 ? '' : 's'}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          ${totalAnnual.toFixed(2)}/yr
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          20% annual discount applied
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline">Manage Billing</Button>
                      <Button className="bg-blue-700 hover:bg-blue-800 text-white">Upgrade Plan</Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">TODO: connect payment provider</p>
                  </div>
                </div>

                <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invoices</h4>
                    <Badge className="bg-slate-200 text-slate-700">Last 3</Badge>
                  </div>
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{invoice.id}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(invoice.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">${invoice.amount.toFixed(2)}</div>
                          <Badge className={`mt-1 capitalize ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : invoice.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">TODO: load invoices from billing provider</p>
                </div>
              </div>
            </div>
          )}

          {/* Role-Specific Tab */}
          {!loadingSettings && activeTab === 'role-specific' && (
            <div className="space-y-8">
              {user?.role === 'admin' && <AdminSettings />}
              {user?.role === 'facility_manager' && <FacilityManagerSettings />}
              {user?.role === 'technician' && <TechnicianSettings />}
              {user?.role === 'vendor' && <VendorSettings />}
              {user?.role === 'finance' && <FinanceSettings />}
              {user?.role === 'staff' && <StaffSettings />}
            </div>
          )}

          {/* Help & Support Tab */}
          {!loadingSettings && activeTab === 'help' && (
            <div className="space-y-8">
              <Help variant="compact" />
            </div>
          )}

          {/* Other tabs placeholder removed */}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSaveChanges}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 flex items-center gap-2"
          >
            <Save className="h-5 w-5" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default Settings;



