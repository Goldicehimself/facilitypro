import React from 'react';
import { Lock, Database, Users, Settings as SettingsIcon, Mail, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInvitations } from '../../contexts/InvitationContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { isEmailAllowedByPolicy } from '../../utils/securityPolicy';
import { getOrgSettings } from '../../api/org';

export const AdminSettings = () => {
  const { invitations, sendAdminInvitation, revokeInvitation, sendInvitationAgain } = useInvitations();
  const { user } = useAuth();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityPolicy, setSecurityPolicy] = useState({ restrictInviteDomains: false, allowedInviteDomains: [] });

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const response = await getOrgSettings();
        const settings = response?.settings || response || {};
        setSecurityPolicy(settings.securityPolicy || { restrictInviteDomains: false, allowedInviteDomains: [] });
      } catch {
        setSecurityPolicy({ restrictInviteDomains: false, allowedInviteDomains: [] });
      }
    };
    loadPolicy();
  }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!isEmailAllowedByPolicy(inviteEmail, securityPolicy)) {
      toast.error('Invites are restricted to approved domains for this organization.');
      return;
    }
    if (!user?.email) {
      toast.error('You must be logged in to send invitations');
      return;
    }
    if (user?.role !== 'admin') {
      toast.error('Only admins can send invitations');
      return;
    }

    setIsSubmitting(true);
    try {
      const invitation = sendAdminInvitation(inviteEmail, user.email);
      const inviteLink = `${window.location.origin}/register?invite=${invitation.token}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(inviteLink);
      
      toast.success(`Invite sent to ${inviteEmail}. Link copied to clipboard!`);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInviteAgain = (id) => {
    sendInvitationAgain(id);
    toast.success('Invitation sent again');
  };

  const handleRevokeInvite = (id) => {
    revokeInvitation(id);
    toast.info('Invitation revoked');
  };

  return (
    <div className="space-y-8">
      {/* System Configuration */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <SettingsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Controls</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">System-wide configurations and administrative settings</p>
      </div>

      {/* Users & Permissions Management */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 dark:bg-green-900 rounded-lg">
            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">User Management</h3>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      {/* Admin Invitations */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Admin Invitations</h3>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Invite other users to become administrators</p>
          
          {!showInviteForm ? (
            <Button
              onClick={() => setShowInviteForm(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              Invite New Admin
            </Button>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendInvite}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                >
                  Send Invitation
                </Button>
                <Button
                  onClick={() => setShowInviteForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pending Invitations</h4>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{inv.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {inv.status === 'pending' && `Sent ${new Date(inv.sentAt).toLocaleDateString()}`}
                    {inv.status === 'accepted' && `Accepted ${new Date(inv.acceptedAt).toLocaleDateString()}`}
                    {inv.status === 'revoked' && 'Revoked'}
                  </p>
                </div>
                {inv.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendInviteAgain(inv.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded cursor-pointer"
                      title="Send invitation again"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded cursor-pointer"
                      title="Revoke invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Management */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 dark:bg-red-900 rounded-lg">
            <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security Settings</h3>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Configure system security, backups, and data retention</p>
        </div>
      </div>
    </div>
  );
};

export const FacilityManagerSettings = () => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-50 dark:bg-amber-900 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Facility Management</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Configure facilities, departments, and operational settings</p>
    </div>
  </div>
);

export const TechnicianSettings = () => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Work Preferences</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Customize your work experience and notifications</p>
    </div>
  </div>
);

export const VendorSettings = () => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vendor Profile</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Manage your vendor profile and service offerings</p>
    </div>
  </div>
);

export const FinanceSettings = () => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-50 dark:bg-green-900 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Finance Settings</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Configure financial reporting and cost tracking preferences</p>
    </div>
  </div>
);

export const StaffSettings = () => (
  <div className="space-y-8">
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
          <SettingsIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Staff Settings</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Customize your work experience and communication preferences</p>
    </div>
  </div>
);

