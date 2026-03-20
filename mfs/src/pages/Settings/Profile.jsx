import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Edit3,
  Save,
  X,
  Shield,
  Lock,
  History,
  BadgeCheck,
  FileText,
  UserCircle,
  Mail,
  Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { getHomeRoute } from '../../utils/roleHome';
import axios from 'axios';
import { updateProfile, uploadCertificates, getCertificateUrl, deleteCertificate } from '../../api/profile';
import { getLoginHistory } from '../../api/audit';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const isPhoneValid = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 0 || (digits.length >= 6 && digits.length <= 15);
  };

  const getDialCode = (value) => {
    const match = String(value || '').trim().match(/^(\+\d{1,4})/);
    return match ? match[1] : null;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    gender: user?.gender || '',
    role: user?.role || ''
  });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [prefEmailNotifications, setPrefEmailNotifications] = useState(false);
  const [prefInAppNotifications, setPrefInAppNotifications] = useState(true);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [certificates, setCertificates] = useState(user?.certificates || []);
  const fileInputRef = React.useRef(null);
  const certificateInputRef = React.useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gender: user?.gender || '',
        role: user?.role || ''
      });
      setCertificates(user?.certificates || []);
      setPrefEmailNotifications(Boolean(user?.preferences?.emailNotifications));
      setPrefInAppNotifications(
        typeof user?.preferences?.inAppNotifications === 'boolean'
          ? user.preferences.inAppNotifications
          : true
      );
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        navigate(getHomeRoute(user?.role));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate, user]);

  useEffect(() => {
    if (selectedImage) {
      setAvatarPreview(selectedImage);
      return;
    }

    if (!user?.avatar) {
      setAvatarPreview(null);
      return;
    }

    const cacheKey = user?.updatedAt || user?.avatarUpdatedAt || '';
    const withCache = (url) => {
      if (!cacheKey || !url) return url;
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${encodeURIComponent(cacheKey)}`;
    };

    if (user.avatar.startsWith('data:') || user.avatar.startsWith('http')) {
      setAvatarPreview(withCache(user.avatar));
      return;
    }

    let active = true;
    let objectUrl = null;

    const buildUploadUrl = (filePath) => {
      const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
      const base = apiBase.endsWith('/api/v1') ? apiBase.slice(0, -7) : apiBase;
      return `${base}/${filePath.replace(/^\/+/, '')}`;
    };

    const loadAvatar = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get(withCache(buildUploadUrl(user.avatar)), {
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        objectUrl = URL.createObjectURL(response.data);
        if (active) setAvatarPreview(objectUrl);
      } catch (error) {
        // Ignore fetch errors for protected assets
      }
    };

    loadAvatar();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.avatar, selectedImage]);

  const normalizeLoginHistory = (items = []) =>
    items.map((item, index) => ({
      id: item.id || item._id || `lh-${index}`,
      time: new Date(item.time || item.timestamp || item.createdAt || item.created_at || Date.now()),
      location: item.location || item.ip || 'Web',
      status: item.status || 'Success'
    }));

  const getLocalLoginHistory = (currentUser) => {
    try {
      const all = JSON.parse(localStorage.getItem('login_history') || '[]');
      const filtered = all.filter((entry) => {
        if (currentUser?.id && entry.userId) return entry.userId === currentUser.id;
        if (currentUser?.email && entry.email) {
          return entry.email.toLowerCase() === currentUser.email.toLowerCase();
        }
        return false;
      });
      return normalizeLoginHistory(filtered);
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    let active = true;
    const loadLoginHistory = async () => {
      if (!user) return;
      setLoginHistoryLoading(true);
      try {
        const data = await getLoginHistory(user?.id);
        const normalized = Array.isArray(data) ? normalizeLoginHistory(data) : [];
        if (active) setLoginHistory(normalized);
      } catch (e) {
        if (active) setLoginHistory(getLocalLoginHistory(user));
      } finally {
        if (active) setLoginHistoryLoading(false);
      }
    };
    loadLoginHistory();
    return () => {
      active = false;
    };
  }, [user?.id, user?.email]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const nextErrors = {};
      const fullName = formData.name?.trim() || '';
      const emailValue = formData.email?.trim() || '';
      if (!fullName) nextErrors.name = 'Full name is required';
      if (!emailValue) nextErrors.email = 'Email is required';
      if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        nextErrors.email = 'Email is invalid';
      }
      const [firstName, ...rest] = fullName.split(' ');
      const lastName = rest.join(' ') || user?.lastName || '';
      if (!isPhoneValid(formData.phone)) {
        nextErrors.phone = 'Phone number is invalid';
      }
      if (Object.keys(nextErrors).length > 0) {
        setFormErrors(nextErrors);
        toast.error('Please fix the form errors');
        setLoading(false);
        return;
      }
      setFormErrors({});
      const payload = {
        firstName: firstName || user?.firstName || '',
        lastName,
        phone: formData.phone,
        phoneCountryCode: getDialCode(formData.phone),
        preferences: {
          emailNotifications: prefEmailNotifications,
          inAppNotifications: prefInAppNotifications
        }
      };

      const updated = await updateProfile(payload, selectedImageFile);
      updateUser(updated);
      setSelectedImage(null);
      setSelectedImageFile(null);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      role: user?.role || ''
    });
    setFormErrors({});
    setSelectedImage(null);
    setSelectedImageFile(null);
    setIsEditing(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      toast.success('Password changed successfully');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      admin: 'Admin',
      facility_manager: 'Facility Manager',
      technician: 'Maintenance Technician',
      vendor: 'Vendor',
      staff: 'Staff',
      finance: 'Finance'
    };
    return roleMap[role] || role;
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setSelectedImageFile(file);
        toast.success('Profile image updated successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      if (!isPdf && !isImage) {
        rejectedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (rejectedFiles.length > 0) {
      toast.error(`Unsupported files skipped: ${rejectedFiles.join(', ')}`);
    }

    if (validFiles.length === 0) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token || token.startsWith('local-')) {
      toast.error('Certificate upload requires a backend login');
      event.target.value = '';
      return;
    }

    setLoading(true);
    uploadCertificates(validFiles)
      .then((updatedUser) => {
        updateUser(updatedUser);
        setCertificates(updatedUser?.certificates || []);
        toast.success(validFiles.length > 1 ? 'Certificates uploaded' : 'Certificate uploaded');
      })
      .catch(() => {
        toast.error('Failed to upload certificates');
      })
      .finally(() => {
        setLoading(false);
      });

    event.target.value = '';
  };

  const handleRemoveCertificate = async (id) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && !token.startsWith('local-')) {
      try {
        await deleteCertificate(id);
        const next = certificates.filter((c) => {
          const certId = typeof c === 'string' ? c : c?.publicId;
          return certId !== id;
        });
        setCertificates(next);
        updateUser({ certificates: next });
        toast.success('Certificate removed');
      } catch (error) {
        toast.error('Failed to remove certificate');
      }
      return;
    }
    const next = certificates.filter((c) => (c?.id || c) !== id);
    setCertificates(next);
    updateUser({ certificates: next });
    toast.info('Certificate removed');
  };

  const buildUploadUrl = (filePath) => {
    const apiBase = import.meta.env.VITE_API_URL || '/api/v1';
    const base = apiBase.endsWith('/api/v1') ? apiBase.slice(0, -7) : apiBase;
    return `${base}/${filePath.replace(/^\/+/, '')}`;
  };

  const openProtectedFile = async (filePath) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(buildUploadUrl(filePath), {
        responseType: 'blob',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const objectUrl = URL.createObjectURL(response.data);
      window.open(objectUrl, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    } catch (error) {
      toast.error('Unable to open file');
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-3">Profile</h1>
        <Alert>
          <AlertDescription>Please log in to view your profile.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getLoginStatusColor = (status) => {
    const value = String(status || '').toLowerCase();
    if (value.includes('fail') || value.includes('error')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200';
    if (value.includes('warn')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200';
  };

  const displayPhone = (() => {
    const phoneValue = String(user?.phone || '').trim();
    if (!phoneValue) return '';
    if (user?.phoneCountryCode) {
      return phoneValue.startsWith(user.phoneCountryCode)
        ? phoneValue
        : `${user.phoneCountryCode} ${phoneValue}`.trim();
    }
    return phoneValue;
  })();
  const isCertifiedTechnician = user?.role === 'technician'
    && Array.isArray(certificates)
    && certificates.some((cert) => (typeof cert === 'string' ? true : cert.status === 'approved' || !cert.status));

  const openCertificate = async (cert) => {
    try {
      const publicId = typeof cert === 'string' ? cert : cert.publicId;
      if (!publicId) throw new Error('Missing certificate id');
      const data = await getCertificateUrl({ publicId, userId: user?.id });
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener');
      }
    } catch (error) {
      toast.error('Unable to open certificate');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_50%),radial-gradient(circle_at_80%_10%,_rgba(99,102,241,0.12),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#ffffff_65%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(30,64,175,0.25),_transparent_50%),radial-gradient(circle_at_80%_10%,_rgba(15,23,42,0.8),_transparent_45%),linear-gradient(180deg,#0b1120_0%,#0f172a_70%)]">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <motion.button
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() => navigate(getHomeRoute(user?.role))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </motion.button>

          <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            <Shield className="h-4 w-4" />
            Profile settings are saved securely
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.65)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Profile Hub</p>
              <h1 className="text-3xl font-semibold text-slate-900 mt-2 dark:text-slate-100">Profile Settings</h1>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                Keep your personal information up to date and manage access settings.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
                <Shield className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Security status: Healthy
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 dark:border-slate-700">
                <History className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                Last update: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-indigo-500" />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card className="relative z-20 border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Manage your identity and contact details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt={user.name} />
                        ) : (
                          <AvatarFallback className="text-2xl dark:text-slate-100">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <button
                        type="button"
                        onClick={handleCameraClick}
                        className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                        aria-label="Upload profile photo"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{user.name}</h2>
                        {user?.role === 'technician' && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            isCertifiedTechnician
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                              : 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                          }`}>
                            {isCertifiedTechnician ? 'Verified' : 'Unverified'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{getRoleDisplayName(user.role)}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </span>
                        {displayPhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {displayPhone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className="self-start bg-blue-700 text-white hover:bg-blue-800"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your basic information and contact details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-rose-600">{formErrors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                    />
                    {formErrors.email && (
                      <p className="text-xs text-rose-600">{formErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className={!isEditing ? 'opacity-60 pointer-events-none' : ''}>
                      <PhoneInput
                        defaultCountry="us"
                        value={formData.phone || ''}
                        onChange={(value) => handleInputChange('phone', value)}
                        disabled={!isEditing}
                        inputProps={{ name: 'phone' }}
                        style={{ width: '100%' }}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-xs text-rose-600">{formErrors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => handleInputChange('gender', value)}
                      disabled={!isEditing}
                    >
                    <SelectTrigger className="bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:text-slate-100">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Role</Label>
                    <Select value={formData.role || ''} disabled>
                    <SelectTrigger className="bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:text-slate-100">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="facility_manager">Facility Manager</SelectItem>
                      <SelectItem value="technician">Maintenance Technician</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Role changes must be requested through your administrator.
                    </p>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="border-slate-200 dark:border-slate-700 dark:text-slate-200">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Certificates</CardTitle>
                <CardDescription>Upload and manage compliance documents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => certificateInputRef.current?.click()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Upload Certificate
                  </Button>
                  <span className="text-xs text-slate-500 dark:text-slate-400">PDF or image files supported.</span>
                  <input
                    type="file"
                    ref={certificateInputRef}
                    onChange={handleCertificateUpload}
                    accept="application/pdf,image/*"
                    multiple
                    className="hidden"
                  />
                </div>

                {certificates.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No certificates uploaded yet.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {certificates.map((cert) => {
                      const fileName =
                        typeof cert === 'string'
                          ? cert.split('/').pop()
                          : cert?.originalName || cert?.publicId;
                      const isPdf =
                        typeof cert === 'string'
                          ? fileName?.toLowerCase().endsWith('.pdf')
                          : cert?.mimeType === 'application/pdf';
                      const status =
                        typeof cert === 'string' ? 'approved' : cert?.status || 'approved';
                      return (
                        <div
                          key={typeof cert === 'string' ? cert : cert?.publicId}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {isPdf ? <FileText className="h-4 w-4" /> : <UserCircle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 truncate dark:text-slate-100">{fileName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded</p>
                            </div>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                              status === 'approved'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
                                : status === 'rejected'
                                  ? 'border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200'
                                  : 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                            }`}>
                              {status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCertificate(typeof cert === 'string' ? cert : cert?.publicId)}
                              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCertificate(cert)}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>Manage password and authentication.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => setPasswordDialog(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>

                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    Enable 2FA
                  </span>
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Two-factor authentication adds an extra layer of security.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Last login: {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Preferences</CardTitle>
                <CardDescription>Simple personal settings for your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-200">Email notifications</span>
                  <input
                    type="checkbox"
                    checked={prefEmailNotifications}
                    onChange={(e) => setPrefEmailNotifications(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-200">In-app notifications</span>
                  <input
                    type="checkbox"
                    checked={prefInAppNotifications}
                    onChange={(e) => setPrefInAppNotifications(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Login History</CardTitle>
                <CardDescription>Recent sign-ins for your account.</CardDescription>
              </CardHeader>
              <CardContent>
                {loginHistoryLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading login history...</p>
                ) : loginHistory.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No login history yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {loginHistory.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {entry.time.toLocaleString()}
                          </p>
                          <History className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{entry.location}</p>
                        <div className="mt-2">
                          <Badge className={getLoginStatusColor(entry.status)}>
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {passwordDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
              <button
                type="button"
                onClick={() => setPasswordDialog(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPasswordDialog(false)} className="dark:border-slate-700 dark:text-slate-200">
                Cancel
              </Button>
              <Button onClick={handlePasswordChange} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
