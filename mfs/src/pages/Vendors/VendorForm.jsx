import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createVendor, getVendorById, updateVendor } from '@/api/vendors';
import { useAuth } from '@/contexts/AuthContext';

const VendorForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useAuth();
  const canManage = ['admin', 'facility_manager'].includes(user?.role);
  const isEdit = !!id;
  const isView = (isEdit && !location.pathname.endsWith('/edit')) || !canManage;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactPerson: '',
    contractStartDate: '',
    contractEndDate: '',
    rating: 0,
    monthlySpend: 0,
    status: 'active',
    notes: '',
  });

  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');

  const categories = [
    'HVAC',
    'Electrical',
    'Plumbing',
    'Cleaning',
    'Landscaping',
    'Security',
    'IT Support',
    'Other',
  ];

  const statuses = ['active', 'inactive', 'suspended'];

  useEffect(() => {
    if (!canManage && !isEdit) {
      toast.error('You do not have permission to create vendors');
      navigate('/vendors');
      return;
    }
    if (!isEdit) return;

    let isActive = true;
    const loadVendor = async () => {
      try {
        const vendor = await getVendorById(id);
        if (!vendor || !isActive) return;
        setFormData((prev) => ({
          ...prev,
          name: vendor.name || '',
          category: vendor.category || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          zipCode: vendor.zipCode || '',
          contactPerson: vendor.contactPerson || '',
          contractStartDate: vendor.contractStartDate || '',
          contractEndDate: vendor.contractEndDate || '',
          rating: typeof vendor.rating === 'number' ? vendor.rating : 0,
          monthlySpend: typeof vendor.monthlySpend === 'number' ? vendor.monthlySpend : 0,
          status: vendor.status || 'active',
          notes: vendor.notes || '',
        }));
        setServices(Array.isArray(vendor.services) ? vendor.services : []);
      } catch (error) {
        toast.error('Failed to load vendor details.');
      }
    };

    loadVendor();
    return () => {
      isActive = false;
    };
  }, [id, isEdit]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddService = () => {
    if (newService.trim()) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView) return;

    try {
      // Validate form
      if (!formData.name.trim()) {
        toast.error('Vendor name is required');
        return;
      }
      if (!formData.category) {
        toast.error('Category is required');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
      }

      setLoading(true);
      const payload = { ...formData, services };
      if (isEdit) {
        await updateVendor(id, payload);
      } else {
        await createVendor(payload);
      }

      toast.success(`Vendor ${isEdit ? 'updated' : 'created'} successfully!`);
      navigate('/vendors');
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} vendor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return value;
  };

  const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : 'N/A');
  const formatCurrency = (value) => (Number.isFinite(value) ? `$${value.toLocaleString()}` : 'N/A');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendors')}
          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors"
          title="Back to vendors"
        >
          <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isView ? 'Vendor Details' : isEdit ? 'Edit Vendor' : 'Add New Vendor'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isView
              ? 'Review vendor information and performance details'
              : isEdit
              ? 'Update vendor information and settings'
              : 'Create a new vendor in the system'}
          </p>
        </div>
      </div>

      {isView ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Name</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{displayValue(formData.name)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{displayValue(formData.category)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white">{displayValue(formData.email)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-gray-900 dark:text-white">{displayValue(formData.phone)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contact Person</p>
                <p className="text-gray-900 dark:text-white">{displayValue(formData.contactPerson)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  {displayValue(formData.status)}
                </span>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Address</h3>
              <p className="text-gray-900 dark:text-white">
                {displayValue(formData.address)}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {displayValue(formData.city)}{formData.city && formData.state ? ', ' : ''}{displayValue(formData.state)} {displayValue(formData.zipCode)}
              </p>
            </div>

            <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contract Start</p>
                <p className="text-gray-900 dark:text-white">{formatDate(formData.contractStartDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contract End</p>
                <p className="text-gray-900 dark:text-white">{formatDate(formData.contractEndDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Spend</p>
                <p className="text-gray-900 dark:text-white">{formatCurrency(formData.monthlySpend)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                <p className="text-gray-900 dark:text-white">{displayValue(formData.rating)} / 5</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Services Offered</h3>
              {services.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {services.map((service, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No services listed.</p>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {displayValue(formData.notes)}
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendors')}
                className="flex-1"
              >
                Back to Vendors
              </Button>
              <Button
                type="button"
                onClick={() => navigate(`/vendors/${id}/edit`)}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
              >
                Edit Vendor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter vendor name"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger className="w-full" disabled={isView}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="vendor@example.com"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person
                </label>
                <Input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full"
                  disabled={isView}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Business St"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <Input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    State
                  </label>
                  <Input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zip Code
                  </label>
                  <Input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Services Offered</h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Enter service (e.g., Maintenance, Installation)"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
                  disabled={isView}
                />
                {!isView && (
                  <Button
                    type="button"
                    onClick={handleAddService}
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((service, idx) => (
                    <div
                      key={idx}
                      className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                    >
                      {service}
                      {!isView && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contract Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contract Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract Start Date
                  </label>
                  <Input
                    type="date"
                    name="contractStartDate"
                    value={formData.contractStartDate}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contract End Date
                  </label>
                  <Input
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate}
                    onChange={handleInputChange}
                    className="w-full"
                    disabled={isView}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Spend ($)
                  </label>
                  <Input
                    type="number"
                    name="monthlySpend"
                    value={formData.monthlySpend}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating (0-5)
                  </label>
                  <Input
                    type="number"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    min="0"
                    max="5"
                    step="0.5"
                    className="w-full"
                    disabled={isView}
                  />
                </div>
              </div>
            </div>

            {/* Status and Notes */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger className="w-full" disabled={isView}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about this vendor..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isView}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/vendors')}
                className="flex-1"
              >
                Cancel
              </Button>
              {isView ? (
                <Button
                  type="button"
                  onClick={() => navigate(`/vendors/${id}/edit`)}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                >
                  Edit Vendor
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white"
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Vendor' : 'Create Vendor'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default VendorForm;

