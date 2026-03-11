import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Delete, ArrowLeft, Upload } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createWorkOrder } from '../../api/workOrders';
import { fetchMembers } from '../../api/org';
import { useQuery, useQueryClient } from 'react-query';
import { getAssets } from '../../api/assets';
import { fetchVendors } from '../../api/vendors';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function WorkOrderForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      priority: 'medium',
      serviceCategory: '',
      asset: '',
      location: '',
      description: '',
      instructions: '',
      parts: [],
      requestedBy: user?.name || '',
      assignedTo: '',
      vendor: '',
      dueDate: '',
      estimatedDuration: '',
      recurring: false,
      requiresCertification: false,
    },
  });

  const [parts, setParts] = useState([]);
  const [fileItems, setFileItems] = useState([]);
  const [assetQuery, setAssetQuery] = useState('');
  const selectedAsset = watch('asset');
  const selectedAssignee = watch('assignedTo');
  const selectedVendor = watch('vendor');

  const { data: assets = [], isLoading: assetsLoading } = useQuery(
    ['assets', assetQuery],
    async () => {
      try {
        const res = await getAssets({ search: assetQuery });
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.assets)) return res.assets;
        return [];
      } catch (err) {
        return [];
      }
    },
    { keepPreviousData: true, staleTime: 1000 * 60 * 5 }
  );

  const { data: vendorsResponse = [] } = useQuery('vendors', fetchVendors, {
    staleTime: 1000 * 60 * 5
  });
  const canFlagHighRisk = ['admin', 'facility_manager'].includes(user?.role);

  const vendors = useMemo(() => {
    if (Array.isArray(vendorsResponse)) return vendorsResponse;
    if (Array.isArray(vendorsResponse?.vendors)) return vendorsResponse.vendors;
    return [];
  }, [vendorsResponse]);

  const onSubmit = async (data) => {
    const attachments = fileItems.map((item) => item.name);
    const photos = fileItems.filter((item) => item.isImage).map((item) => item.name);
    const payload = {
      ...data,
      asset: data.asset?.id || data.asset || undefined,
      assignedTo: data.assignedTo?.id || data.assignedTo || undefined,
      vendor: data.vendor?.id || data.vendor || undefined,
      parts,
      attachments,
      photos,
    };
    try {
      await createWorkOrder(payload);
      queryClient.invalidateQueries('workOrders');
      toast.success('Work order created successfully');
      navigate('/work-orders');
    } catch (err) {
      toast.error('Failed to create work order');
    }
  };

  const addPart = () => {
    setParts((p) => [...p, { name: '', qty: '' }]);
  };

  const updatePart = (index, key, value) => {
    setParts((p) => p.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const removePart = (index) => {
    setParts((p) => p.filter((_, i) => i !== index));
  };

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const onFilesChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    const mapped = await Promise.all(selected.map(async (file) => {
      const isImage = file.type.startsWith('image/');
      let previewUrl = '';
      if (isImage) {
        try {
          previewUrl = await fileToDataUrl(file);
        } catch (err) {
          previewUrl = '';
        }
      }
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        isImage,
        previewUrl,
      };
    }));
    setFileItems((prev) => [...prev, ...mapped]);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFileItems((prev) => prev.filter((item) => item.id !== id));
  };

  const [orgMembers, setOrgMembers] = useState([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadMembers = async () => {
      setAssigneesLoading(true);
      try {
        const data = await fetchMembers({ role: 'technician', limit: 200 });
        const members = Array.isArray(data?.members)
          ? data.members
          : Array.isArray(data)
          ? data
          : [];
        if (active) setOrgMembers(members);
      } catch (err) {
        if (active) setOrgMembers([]);
      } finally {
        if (active) setAssigneesLoading(false);
      }
    };
    loadMembers();
    return () => {
      active = false;
    };
  }, []);

  const assignees = useMemo(() => {
    const normalizeMember = (member) => ({
      ...member,
      id: member.id || member._id,
      name:
        member.name ||
        [member.firstName, member.lastName].filter(Boolean).join(' ') ||
        member.email ||
        'Unknown',
    });

    const technicians = orgMembers
      .filter((member) => member.role === 'technician')
      .map(normalizeMember)
      .filter((member) => member.id);

    if (technicians.length > 0) return technicians;

    const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
    const localTechnicians = localUsers
      .filter((u) => u.role === 'technician')
      .map(normalizeMember)
      .filter((member) => member.id);
    if (localTechnicians.length > 0) return localTechnicians;

    return [];
  }, [orgMembers]);
  const imageItems = fileItems.filter((item) => item.isImage && item.previewUrl);
  const otherItems = fileItems.filter((item) => !item.isImage || !item.previewUrl);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <button 
              type="button"
              onClick={() => navigate('/work-orders')}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mb-3"
            >
              <ArrowLeft size={18} /> Back to Work Orders
            </button>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Create Work Order</h1>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">Fill in the details to create a new maintenance work order</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Basic Information</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Work Order Title *</label>
                <Controller
                  name="title"
                  control={control}
                  rules={{ required: 'Title is required' }}
                  render={({ field }) => (
                    <input 
                      {...field}
                      placeholder="e.g., Fix HVAC unit in Building A"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Priority Level *</label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <select {...field} className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="low">🟢 Low</option>
                        <option value="medium">🔵 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Service Category *</label>
                  <Controller
                    name="serviceCategory"
                    control={control}
                    rules={{ required: 'Service category is required' }}
                    render={({ field }) => (
                      <select {...field} className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select category...</option>
                        <option value="electrical">⚡ Electrical</option>
                        <option value="plumbing">💧 Plumbing</option>
                        <option value="hvac">❄️ HVAC</option>
                        <option value="general">🔧 General</option>
                      </select>
                    )}
                  />
                </div>
              </div>
              {errors.serviceCategory && (
                <p className="text-xs text-red-600 mt-1">{errors.serviceCategory.message}</p>
              )}
              {canFlagHighRisk && (
                <div className="mt-4">
                  <label className="flex items-center gap-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <Controller
                      name="requiresCertification"
                      control={control}
                      render={({ field }) => (
                        <input {...field} type="checkbox" className="h-4 w-4 rounded border-gray-200 accent-indigo-600" />
                      )}
                    />
                    Requires certification (high-risk)
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Only certified technicians can start or complete these tasks.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset & Location */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Asset & Location</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Select Asset</label>
                <input
                  type="text"
                  value={assetQuery}
                  placeholder="Search for asset..."
                  onChange={(e) => setAssetQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {assetsLoading && assetQuery.trim() && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Searching assets...</p>
                )}
                {!assetsLoading && assetQuery.trim() && assets.length === 0 && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">No assets found for "{assetQuery}"</p>
                )}
                {assets.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {assets.map(asset => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => {
                          setValue('asset', asset, { shouldDirty: true, shouldTouch: true });
                          setAssetQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{asset.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{asset.category || asset.model}</p>
                      </button>
                    ))}
                  </div>
                )}
                {!!selectedAsset && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{selectedAsset.name}</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">{selectedAsset.category || selectedAsset.model || 'Selected asset'}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-zinc-700 dark:text-zinc-200"
                      onClick={() => {
                        setValue('asset', '', { shouldDirty: true, shouldTouch: true });
                        setAssetQuery('');
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Location Details</label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <input 
                      {...field}
                      placeholder="Building, Floor, Room (e.g., Building A, 3rd Floor, Room 301)"
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Problem Description */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Problem Description</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Describe the Issue *</label>
                <Controller
                  name="description"
                  control={control}
                  rules={{ required: 'Description is required' }}
                  render={({ field }) => (
                    <textarea 
                      {...field}
                      rows={4}
                      placeholder="Provide detailed information about the problem..."
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Special Instructions</label>
                <Controller
                  name="instructions"
                  control={control}
                  render={({ field }) => (
                    <textarea 
                      {...field}
                      rows={2}
                      placeholder="Any special notes or safety instructions..."
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Parts */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Required Parts & Materials</h2>
              <Button type="button" size="sm" onClick={addPart} className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1">
                <Plus size={14} /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {parts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">No items added yet</p>
              ) : (
                <div className="space-y-3">
                  {parts.map((part, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input 
                        placeholder="Part name" 
                        value={part.name} 
                        onChange={(e) => updatePart(idx, 'name', e.target.value)} 
                        className="flex-1 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      />
                      <input 
                        placeholder="Qty" 
                        value={part.qty} 
                        onChange={(e) => updatePart(idx, 'qty', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                      />
                      <button type="button" onClick={() => removePart(idx)} className="text-red-600 hover:text-red-700 p-2">
                        <Delete size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Attachments</h2>
            </CardHeader>
            <CardContent className="p-6">
              <label className="block">
                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-zinc-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Drop files here or click to browse</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports: JPG, PNG, PDF (Max 10MB each)</p>
                  <input type="file" multiple onChange={onFilesChange} className="hidden" />
                </div>
              </label>
              {fileItems.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">No attachments yet</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {imageItems.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {imageItems.map((item) => (
                        <div key={item.id} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                          <img src={item.previewUrl} alt={item.name} className="h-28 w-full object-cover" />
                          <div className="px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 truncate">{item.name}</div>
                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            className="absolute top-2 right-2 bg-white/90 dark:bg-zinc-900/90 text-red-600 hover:text-red-700 rounded-full p-1 shadow"
                          >
                            <Delete size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {otherItems.length > 0 && (
                    <div className="space-y-2">
                      {otherItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                          <span className="text-sm text-zinc-900 dark:text-zinc-100">{item.name}</span>
                          <button type="button" onClick={() => removeFile(item.id)} className="text-red-600 hover:text-red-700">
                            <Delete size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-sm lg:sticky lg:top-24">
            <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Assignment</h2>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Requested By</label>
                <Controller
                  name="requestedBy"
                  control={control}
                  render={({ field }) => (
                    <input 
                      {...field}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Assign to Technician</label>
                <Controller
                  name="assignedTo"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (value && !value.id) return 'Please select a technician';
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value?.id || ''}
                      onChange={(e) => {
                        const next = assignees.find(a => a.id === e.target.value) || '';
                        field.onChange(next);
                      }}
                      disabled={assigneesLoading}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {assigneesLoading && (
                        <option value="" disabled>Loading technicians...</option>
                      )}
                      {!assigneesLoading && assignees.length === 0 && (
                        <option value="" disabled>No technicians found</option>
                      )}
                      {!assigneesLoading && assignees.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                />
                {!!selectedAssignee && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Assigned to: <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedAssignee.name}</span>
                  </p>
                )}
                {errors.assignedTo && (
                  <p className="text-xs text-red-600 mt-1">{errors.assignedTo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Assign Vendor (optional)</label>
                <Controller
                  name="vendor"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      value={field.value?.id || ''}
                      onChange={(e) => {
                        const next = vendors.find(v => v.id === e.target.value) || '';
                        field.onChange(next);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">No vendor</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  )}
                />
                {!!selectedVendor && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Vendor: <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedVendor.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Due Date</label>
                <Controller
                  name="dueDate"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (selectedAssignee && !value) return 'Due date is required when assigned';
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <input {...field} type="date" className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                />
                {errors.dueDate && (
                  <p className="text-xs text-red-600 mt-1">{errors.dueDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">Estimated Duration</label>
                <Controller
                  name="estimatedDuration"
                  control={control}
                  rules={{
                    validate: (value) => {
                      if (!value) return true;
                      return /\d/.test(value) || 'Include a numeric duration (e.g., 2 hours)';
                    },
                  }}
                  render={({ field }) => (
                    <input {...field} placeholder="e.g., 2 hours" className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  )}
                />
                {errors.estimatedDuration && (
                  <p className="text-xs text-red-600 mt-1">{errors.estimatedDuration.message}</p>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                <label className="flex items-center gap-3">
                  <Controller
                    name="recurring"
                    control={control}
                    render={({ field }) => (
                      <input {...field} type="checkbox" className="w-4 h-4 rounded border-gray-200 accent-indigo-600" />
                    )}
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Recurring Maintenance</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-blue-700 hover:bg-blue-800 text-white">
                  Create Order
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/work-orders')} className="flex-1 text-zinc-700 dark:text-zinc-200">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

