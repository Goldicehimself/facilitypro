import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAsset, updateAsset, getAsset, uploadAssetImage } from '../../api/assets';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssetForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    assetId: '',
    category: '',
    type: '',
    description: '',

    // Location & Details
    location: '',
    building: '',
    floor: '',
    room: '',

    // Technical Specifications
    manufacturer: '',
    model: '',
    serialNumber: '',
    specifications: '',

    // Installation & Warranty
    installDate: '',
    warrantyExpiry: '',
    warrantyProvider: '',

    // Maintenance
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    maintenanceFrequency: 'monthly',
    maintenanceProvider: '',

    // Cost & Financial
    purchasePrice: '',
    purchaseDate: '',
    depreciationRate: '',

    // Status & Notes
    status: 'active',
    notes: '',
    imageUrl: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchAsset();
    }
  }, [id]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const asset = await getAsset(id);
      setFormData({
        name: asset.name || '',
        assetId: asset.assetTag || '',
        category: asset.category || '',
        type: asset.type || '',
        description: asset.description || asset.shortDescription || '',
        location: asset.location || '',
        building: asset.building || '',
        floor: asset.floor || '',
        room: asset.room || '',
        manufacturer: asset.manufacturer || '',
        model: asset.model || '',
        serialNumber: asset.serial || '',
        specifications: asset.specs ? JSON.stringify(asset.specs) : asset.specifications || '',
        installDate: asset.installationDate?.split('T')[0] || asset.installDate?.split('T')[0] || '',
        warrantyExpiry: (asset.warranty && asset.warranty.expires) ? asset.warranty.expires.split('T')[0] : '',
        warrantyProvider: (asset.warranty && asset.warranty.provider) ? asset.warranty.provider : asset.warrantyProvider || '',
        lastMaintenanceDate: asset.lastMaintenance || asset.lastMaintenanceDate || '',
        nextMaintenanceDate: asset.nextService || asset.nextMaintenanceDate || '',
        maintenanceFrequency: asset.maintenanceFrequency || 'monthly',
        maintenanceProvider: asset.maintenanceProvider || '',
        purchasePrice: asset.purchasePrice || '',
        purchaseDate: asset.purchaseDate?.split('T')[0] || '',
        depreciationRate: asset.depreciationRate || '',
        status: asset.status || 'active',
        notes: asset.notes || '',
        imageUrl: asset.imageUrl || (asset.imageUrls && asset.imageUrls[0]) || ''
      });

      if (asset.imageUrl) {
        setImagePreview(asset.imageUrl);
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Asset name is required';
    if (!formData.assetId.trim()) newErrors.assetId = 'Asset ID is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial number is required';
    if (!formData.installDate) newErrors.installDate = 'Install date is required';

    // Numeric validation
    if (formData.purchasePrice && Number(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = 'Purchase price must be 0 or greater';
    }

    if (formData.depreciationRate && (Number(formData.depreciationRate) < 0 || Number(formData.depreciationRate) > 100)) {
      newErrors.depreciationRate = 'Depreciation must be between 0 and 100';
    }

    // Date validation
    if (formData.installDate && formData.warrantyExpiry) {
      const install = new Date(formData.installDate);
      const warranty = new Date(formData.warrantyExpiry);
      if (warranty < install) newErrors.warrantyExpiry = 'Warranty expiry cannot be before installation date';
    }

    if (formData.lastMaintenanceDate && formData.nextMaintenanceDate) {
      const last = new Date(formData.lastMaintenanceDate);
      const next = new Date(formData.nextMaintenanceDate);
      if (next < last) newErrors.nextMaintenanceDate = 'Next maintenance must be after last maintenance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    processFile(file);
  };

  const processFile = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, imageUrl: 'Only image files are allowed' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, imageUrl: 'Image must be smaller than 5MB' }));
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (errors.imageUrl) setErrors(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      let saved;
      const payload = {
        name: formData.name,
        assetTag: formData.assetId,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        shortDescription: formData.description,
        location: formData.location,
        building: formData.building,
        floor: formData.floor,
        room: formData.room,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serial: formData.serialNumber,
        specs: (() => {
          try { return formData.specifications ? JSON.parse(formData.specifications) : undefined; } catch (e) { return { notes: formData.specifications }; }
        })(),
        installationDate: formData.installDate || undefined,
        warranty: { expires: formData.warrantyExpiry || undefined, provider: formData.warrantyProvider || undefined, purchaseDate: formData.purchaseDate || undefined },
        purchaseDate: formData.purchaseDate || undefined,
        lastMaintenance: formData.lastMaintenanceDate || undefined,
        nextService: formData.nextMaintenanceDate || undefined,
        maintenanceFrequency: formData.maintenanceFrequency || undefined,
        maintenanceProvider: formData.maintenanceProvider || undefined,
        purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
        depreciationRate: formData.depreciationRate ? Number(formData.depreciationRate) : undefined,
        status: formData.status,
        notes: formData.notes,
        imageUrl: formData.imageUrl || imagePreview || undefined
      };

      if (isEditMode) {
        saved = await updateAsset(id, payload);
      } else {
        saved = await createAsset(payload);
      }

      try {
        if (imageFile) {
          const assetId = isEditMode ? id : (saved?.id || saved?.data?.id);
          if (assetId) {
            const res = await uploadAssetImage(assetId, imageFile);
            if (res && res.imageUrl) {
              setImagePreview(res.imageUrl);
              setFormData(fd => ({ ...fd, imageUrl: res.imageUrl }));
            }
          }
        }
      } catch (imgErr) {
        console.warn('Image upload failed but asset saved:', imgErr);
      }

      await new Promise(r => setTimeout(r, 150));
      navigate('/assets');
    } catch (error) {
      console.error('Error saving asset:', error);
      setErrors({ submit: error.message || 'Failed to save asset' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="min-h-[50vh] md:min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-3">Loading asset...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <button className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
            {isEditMode ? 'Edit Asset' : 'Create New Asset'}
          </h1>
          <p className="text-indigo-700 dark:text-indigo-300 mt-1">
            {isEditMode ? `Updating ${formData.name}` : 'Add a new facility asset or equipment to your inventory'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📋 Basic Information</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Asset Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={errors.name}
                    placeholder="e.g., Rooftop Chiller Unit"
                    required
                  />
                  <InputField
                    label="Asset ID"
                    name="assetId"
                    value={formData.assetId}
                    onChange={handleInputChange}
                    error={errors.assetId}
                    placeholder="e.g., AC-001"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    error={errors.category}
                    options={[
                      { value: '', label: 'Select a category' },
                      { value: 'HVAC', label: '❄️ HVAC' },
                      { value: 'ELECTRICAL', label: '⚡ Electrical' },
                      { value: 'PLUMBING', label: '💧 Plumbing' },
                      { value: 'SECURITY', label: '🔒 Security' },
                      { value: 'FIRE_SAFETY', label: '🚒 Fire Safety' },
                      { value: 'ELEVATOR', label: '⬆️ Elevator' },
                      { value: 'LIGHTING', label: '💡 Lighting' },
                      { value: 'OTHER', label: 'Other' }
                    ]}
                    required
                  />
                  <InputField
                    label="Type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Chiller"
                  />
                </div>

                <TextAreaField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide details about this asset"
                  rows="3"
                />
              </CardContent>
            </Card>

            {/* Location & Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📍 Location & Details</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    error={errors.location}
                    options={[
                      { value: '', label: 'Select location' },
                      { value: 'BUILDING_A', label: 'Building A' },
                      { value: 'BUILDING_B', label: 'Building B' },
                      { value: 'BUILDING_C', label: 'Building C' },
                      { value: 'PARKING', label: 'Parking Structure' },
                      { value: 'OUTDOOR', label: 'Outdoor' }
                    ]}
                    required
                  />
                  <InputField
                    label="Building"
                    name="building"
                    value={formData.building}
                    onChange={handleInputChange}
                    placeholder="e.g., Main Building"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="e.g., Roof"
                  />
                  <InputField
                    label="Room/Space"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    placeholder="e.g., Mechanical Room A"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Specifications */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🔧 Technical Specifications</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    error={errors.manufacturer}
                    placeholder="e.g., Carrier"
                    required
                  />
                  <InputField
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    error={errors.model}
                    placeholder="e.g., X200"
                    required
                  />
                </div>

                <InputField
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  error={errors.serialNumber}
                  placeholder="e.g., SN123456"
                  required
                />

                <TextAreaField
                  label="Specifications"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  placeholder="Technical specifications, capacity, power requirements, etc."
                  rows="3"
                />
              </CardContent>
            </Card>

            {/* Installation & Warranty */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📅 Installation & Warranty</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    type="date"
                    label="Installation Date"
                    name="installDate"
                    value={formData.installDate}
                    onChange={handleInputChange}
                    error={errors.installDate}
                    required
                  />
                  <InputField
                    type="date"
                    label="Warranty Expiry Date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleInputChange}
                    error={errors.warrantyExpiry}
                  />
                </div>

                <InputField
                  label="Warranty Provider"
                  name="warrantyProvider"
                  value={formData.warrantyProvider}
                  onChange={handleInputChange}
                  placeholder="e.g., Carrier Warranty"
                />
              </CardContent>
            </Card>

            {/* Maintenance Schedule */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">⚙️ Maintenance Schedule</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    type="date"
                    label="Last Maintenance Date"
                    name="lastMaintenanceDate"
                    value={formData.lastMaintenanceDate}
                    onChange={handleInputChange}
                  />
                  <InputField
                    type="date"
                    label="Next Maintenance Date"
                    name="nextMaintenanceDate"
                    value={formData.nextMaintenanceDate}
                    onChange={handleInputChange}
                    error={errors.nextMaintenanceDate}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Maintenance Frequency"
                    name="maintenanceFrequency"
                    value={formData.maintenanceFrequency}
                    onChange={handleInputChange}
                    options={[
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'quarterly', label: 'Quarterly' },
                      { value: 'semi_annual', label: 'Semi-Annual' },
                      { value: 'annual', label: 'Annual' },
                      { value: 'as_needed', label: 'As Needed' }
                    ]}
                  />
                  <InputField
                    label="Maintenance Provider"
                    name="maintenanceProvider"
                    value={formData.maintenanceProvider}
                    onChange={handleInputChange}
                    placeholder="e.g., ABC Maintenance Co."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">💰 Financial Information</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    type="number"
                    label="Purchase Price"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    error={errors.purchasePrice}
                    placeholder="0.00"
                    step="0.01"
                  />
                  <InputField
                    type="date"
                    label="Purchase Date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                  />
                </div>

                <InputField
                  type="number"
                  label="Depreciation Rate (%)"
                  name="depreciationRate"
                  value={formData.depreciationRate}
                  onChange={handleInputChange}
                  error={errors.depreciationRate}
                  placeholder="10"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </CardContent>
            </Card>

            {/* Status & Notes */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">📝 Status & Notes</h2>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-4">
                <SelectField
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  options={[
                    { value: 'active', label: '🟢 Active' },
                    { value: 'inactive', label: '⚪ Inactive' },
                    { value: 'maintenance', label: '🔧 Under Maintenance' },
                    { value: 'retired', label: '🔴 Retired' }
                  ]}
                />

                <TextAreaField
                  label="Additional Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes and comments about this asset"
                  rows="3"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="border-0 shadow-sm lg:sticky lg:top-24">
              <CardHeader className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">🖼️ Asset Image</h2>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img src={imagePreview} alt="Asset preview" className="w-full rounded-lg object-cover aspect-square max-h-60 md:max-h-[32rem]" />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-sm"
                      onClick={() => document.getElementById('imageInput').click()}
                    >
                      <Upload className="h-4 w-4 mr-2" /> Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-gray-300 dark:border-zinc-700 hover:border-indigo-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('imageInput').click()}
                  >
                    <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Drag image here</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">or click to select</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">PNG, JPG (max 5MB)</p>
                  </div>
                )}

                <input
                  type="file"
                  id="imageInput"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {errors.imageUrl && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.imageUrl}</p>
                )}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="space-y-2 lg:sticky lg:top-96">
              <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : isEditMode ? 'Update Asset' : 'Create Asset'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/assets')} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function InputField({ type = 'text', label, name, value, onChange, error, placeholder, required, step, min, max }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-200 dark:border-zinc-700 focus:ring-indigo-500'
        } focus:outline-none focus:ring-2`}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, error, options, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 border rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-200 dark:border-zinc-700 focus:ring-indigo-500'
        } focus:outline-none focus:ring-2`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.value === '' && required}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function TextAreaField({ label, name, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
      />
    </div>
  );
}
