import React, { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  CheckCircle2,
  Circle,
  Building2,
  KeyRound,
  Users,
  Wrench,
  Bug,
  Lightbulb,
  ClipboardList,
  Copy,
  Check,
  Monitor,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getOrgSettings } from '@/api/org';

const Help = ({ variant = 'full' }) => {
  const isCompact = variant === 'compact';
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [orgName, setOrgName] = useState(user?.organizationName || 'N/A');
  const orgCode = useMemo(() => {
    if (user?.role !== 'admin') return '';
    return localStorage.getItem('orgCode') || sessionStorage.getItem('orgCode') || '';
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    let mounted = true;
    const loadOrgName = async () => {
      try {
        const data = await getOrgSettings();
        const companyName = data?.settings?.companyProfile?.companyName;
        if (mounted && companyName) {
          setOrgName(companyName);
        }
      } catch (e) {
        // ignore org settings fetch failure
      }
    };
    loadOrgName();
    return () => {
      mounted = false;
    };
  }, [user?.role]);

  const systemInfo = useMemo(() => {
    const browser = navigator.userAgent || 'Unknown';
    return {
      organizationName: orgName || 'N/A',
      orgId: user?.orgId || user?.organizationId || user?.organization || 'N/A',
      orgCode: orgCode || 'N/A',
      role: user?.role || 'N/A',
      appVersion: import.meta.env.VITE_APP_VERSION || 'MVP',
      browser,
    };
  }, [orgCode, orgName, user]);

  const handleCopyOrgCode = async () => {
    if (!orgCode) return;
    try {
      await navigator.clipboard.writeText(orgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // ignore clipboard failure
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-lg border ${isCompact ? 'p-4 bg-white border-slate-200' : 'p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 border-indigo-200 dark:border-indigo-800'}`}>
        <h1 className={`${isCompact ? 'text-2xl' : 'text-3xl'} font-bold text-indigo-900 dark:text-indigo-100`}>Help & Support</h1>
        <p className="text-indigo-700 dark:text-indigo-300 mt-1">
          Find answers, learn how to use the system, or contact support.
        </p>

        {!isCompact && (
          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search help articles (coming soon)"
                disabled
                className="w-full h-10 rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 opacity-70"
                aria-label="Help search"
              />
            </div>
          </div>
        )}
      </div>

      {/* Getting Started */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <ClipboardList size={18} />
            <h2 className="text-xl font-semibold text-slate-900">🚀 Getting Started</h2>
          </div>
          <p className="text-sm text-slate-600">
            Use this checklist to get your organisation fully set up.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Register organisation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Verify your email</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Share organisation code with team</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span>Add technicians</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span>Add assets</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span>Create your first work order</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-slate-400" />
              <span>Configure notifications</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join an Organisation */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Building2 size={18} />
            <h2 className="text-xl font-semibold text-slate-900">🏢 Joining a Company</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <p className="font-semibold text-slate-900">Join with Organisation Code</p>
              <p className="text-slate-600">Use this if your company shared a code.</p>
              <div className="space-y-1 text-slate-700">
                <div>1. Create an account</div>
                <div>2. Enter the organisation code</div>
                <div>3. You will join as a Staff member</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <p className="font-semibold text-slate-900">Join via Invite Link</p>
              <p className="text-slate-600">Use this if you received an invite.</p>
              <div className="space-y-1 text-slate-700">
                <div>1. Click invite link</div>
                <div>2. Create your account</div>
                <div>3. You will join with assigned role</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organisation Code Help */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <KeyRound size={18} />
            <h2 className="text-xl font-semibold text-slate-900">🔑 Organisation Code</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="space-y-2">
              <div>Where to find it: Settings → Company Profile</div>
              <div>Who can see it: Admins</div>
              <div>If shared publicly: Regenerate the code</div>
              <div>How to regenerate: Settings → Company Profile → Regenerate</div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Your organisation code</p>
              <p className="text-base font-semibold text-slate-900">
                {user?.role === 'admin' ? (orgCode || 'Not available') : 'Admins only'}
              </p>
              </div>
              <Button
                variant="outline"
                onClick={handleCopyOrgCode}
                disabled={!orgCode || user?.role !== 'admin'}
                className="flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Organisation Code'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Users size={18} />
            <h2 className="text-xl font-semibold text-slate-900">👥 User Roles</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 border-b border-slate-200">Role</th>
                  <th className="text-left px-4 py-2 border-b border-slate-200">What they can do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-2 font-semibold">Admin</td>
                  <td className="px-4 py-2">Manage users, settings, work orders</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">Technician</td>
                  <td className="px-4 py-2">View and complete assigned work</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">Staff</td>
                  <td className="px-4 py-2">Create requests</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">Vendor</td>
                  <td className="px-4 py-2">Limited access</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wrench size={18} />
            <h2 className="text-xl font-semibold text-slate-900">🛠 Common Issues</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-semibold">I can’t join with org code</p>
              <p>Check for typos and ensure the code is still active.</p>
            </div>
            <div>
              <p className="font-semibold">Invite link expired</p>
              <p>Request a new invite from your admin.</p>
            </div>
            <div>
              <p className="font-semibold">I can’t see work orders</p>
              <p>Confirm your role and permissions with an admin.</p>
            </div>
            <div>
              <p className="font-semibold">Notifications not coming</p>
              <p>Check your notification settings and browser permissions.</p>
            </div>
            <div>
              <p className="font-semibold">Wrong role assigned</p>
              <p>An admin can update your role in Settings.</p>
            </div>
            <div>
              <p className="font-semibold">Forgot password</p>
              <p>Use the “Forgot password” link on the sign-in page.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2 text-indigo-600">
            <Mail size={18} />
            <h2 className="text-xl font-semibold text-slate-900">📩 Contact Support</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={16} />
                <span className="font-semibold">Email support</span>
              </div>
              <p className="text-slate-600">support@facilitypro.com</p>
              <p className="text-xs text-slate-500">TODO: replace with your support email</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone size={16} />
                <span className="font-semibold">Phone</span>
              </div>
              <p className="text-slate-600">(555) 123-4567</p>
              <p className="text-xs text-slate-500">TODO: replace with your support phone</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <MessageCircle size={16} />
                <span className="font-semibold">Live chat</span>
              </div>
              <button className="inline-flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-800">
                Start chat <ExternalLink size={14} />
              </button>
              <p className="text-xs text-slate-500">TODO: wire to chat provider</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4 space-y-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Bug size={16} />
              <span className="font-semibold">Report a bug</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Title</label>
                <input className="w-full px-3 py-2 border border-slate-200 rounded-md" placeholder="Short summary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600">Priority</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-md">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Description</label>
                <textarea className="w-full px-3 py-2 border border-slate-200 rounded-md" rows={4} placeholder="Steps to reproduce and expected behavior" />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Screenshot (optional)</label>
                <input type="file" className="w-full text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Bug size={16} />
                Submit bug report
              </Button>
              <Button variant="ghost" className="flex items-center gap-2 text-indigo-700">
                <Lightbulb size={16} />
                Request feature
              </Button>
              <span className="text-xs text-slate-500">TODO: wire to email in MVP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Monitor size={18} />
            <h2 className="text-xl font-semibold text-slate-900">🖥 System Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Organisation name</p>
              <p className="font-semibold text-slate-900">{systemInfo.organizationName}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Org ID</p>
              <p className="font-semibold text-slate-900">{systemInfo.orgId}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Organisation code</p>
              <p className="font-semibold text-slate-900">{systemInfo.orgCode}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">User role</p>
              <p className="font-semibold text-slate-900">{systemInfo.role}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">App version</p>
              <p className="font-semibold text-slate-900">{systemInfo.appVersion}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">Browser</p>
              <p className="font-semibold text-slate-900 break-all">{systemInfo.browser}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
