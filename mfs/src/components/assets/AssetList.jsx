import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getAssets,
  bulkImportAssets,
  deleteAsset,
  updateAsset,
  uploadAssetImage,
  getAssetByCode,
  bulkUpdateAssetStatus,
  downloadAssetImportTemplate,
} from '../../api/assets';
import { useActivity } from '../../contexts/ActivityContext';

import {
  AlertCircle,
  Plus,
  Upload,
  Grid3x3,
  List,
  CheckCircle,
  AlertTriangle,
  Clock,
  QrCode,
  Edit,
  Trash2,
  Search,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Modal from '../common/Modal';
import AssetQRScanner from './AssetQRScanner';
import AssetImage from './AssetImage';

/* =========================
   Constants
========================= */
const CATEGORIES = [
  'HVAC',
  'ELECTRICAL',
  'PLUMBING',
  'SECURITY',
  'FIRE_SAFETY',
  'ELEVATOR',
  'LIGHTING',
  'OTHER',
];

const LOCATIONS = [
  'BUILDING_A',
  'BUILDING_B',
  'BUILDING_C',
  'PARKING',
  'OUTDOOR',
];

const STATUSES = ['active', 'inactive', 'maintenance', 'retired'];

/* =========================
   Main Component
========================= */
export default function AssetList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addActivity } = useActivity();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const itemsPerPage = 12;

  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('active');
  const [bulkStatusSubmitting, setBulkStatusSubmitting] = useState(false);

  const [filters, setFilters] = useState({ search: '' });
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

  /* =========================
     Data Fetch
  ========================= */
  useEffect(() => {
    fetchAssets();
  }, [currentPage, filters]);

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setFilters(prev => ({ ...prev, search: searchParam }));
      setCurrentPage(1);
    }
  }, [searchParams]);

  async function fetchAssets() {
    try {
      setLoading(true);
      const res = await getAssets({
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
      });
      setAssets(res.data || []);
      setTotalAssets(res.total || 0);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Handlers
  ========================= */
  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteAsset) return;
    try {
      setDeleting(true);
      await deleteAsset(confirmDeleteAsset.id);
      setConfirmDeleteAsset(null);
      fetchAssets();
    } finally {
      setDeleting(false);
    }
  };

  const handleImportAssets = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      await bulkImportAssets(formData);
      fetchAssets();
      alert('Assets imported successfully!');
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import assets. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const handleExportAssets = () => {
    const csv = [
      ['ID', 'Name', 'Code', 'Category', 'Location', 'Manufacturer', 'Status', 'Warranty Status'].join(','),
      ...assets.map(a => [
        a.id,
        `"${a.name}"`,
        a.code || '',
        a.category || '',
        a.location || '',
        a.manufacturer || '',
        a.status || '',
        a.warrantyStatus || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleScanResult = async (scannedValue) => {
    try {
      const asset = await getAssetByCode(scannedValue);
      if (asset?.id) {
        setScannerOpen(false);
        navigate(`/assets/${asset.id}`);
        return;
      }
      alert('Asset not found in the system');
    } catch (err) {
      alert('Asset not found in the system');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadAssetImportTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download template.');
    }
  };

  const openBulkStatusModal = () => {
    setBulkStatusOpen(true);
  };

  const handleBulkStatusSubmit = async () => {
    if (!assets.length) {
      alert('No assets on the current page to update.');
      return;
    }
    try {
      setBulkStatusSubmitting(true);
      const ids = assets.map((asset) => asset.id);
      await bulkUpdateAssetStatus({ ids, status: bulkStatus });
      await fetchAssets();
      setBulkStatusOpen(false);
      addActivity({
        type: 'system',
        action: 'updated',
        title: 'Bulk Status Update',
        description: `Updated ${ids.length} assets to ${bulkStatus}`,
        user: 'Current User',
        status: 'completed',
      });
    } catch (error) {
      alert('Failed to update asset statuses.');
    } finally {
      setBulkStatusSubmitting(false);
    }
  };

  const totalPages = Math.ceil(totalAssets / itemsPerPage);

  /* =========================
     KPI
  ========================= */
  const kpi = {
    total: totalAssets,
    attention: assets.filter(a => a.status === 'NEEDS_ATTENTION').length,
    warranties: assets.filter(a => a.warrantyStatus === 'ACTIVE_WARRANTY').length,
    overdue: assets.filter(a => a.maintenanceStatus === 'OVERDUE').length,
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
            Assets Management
          </h1>
          <p className="text-indigo-700 dark:text-indigo-300 mt-1">
            Manage and monitor your facility assets across all locations
          </p>
        </div>

        {/* ================= STATS BAR ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Total Assets</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalAssets}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Active</p>
            <p className="text-3xl font-bold text-green-600">{assets.filter(a => a.status === 'active').length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Need Attention</p>
            <p className="text-3xl font-bold text-amber-600">{kpi.attention}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">Maintenance Due</p>
            <p className="text-3xl font-bold text-red-600">{kpi.overdue}</p>
          </div>
        </div>

        {/* ================= ACTIONS ================= */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/assets/new')} className="bg-blue-700 hover:bg-blue-800 text-white shadow-md">
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
          <Button 
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            variant="outline" 
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          >
            <Upload className="mr-2 h-4 w-4" /> 
            {importing ? 'Importing...' : 'Import Assets'}
          </Button>
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          >
            Download Template
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImportAssets}
            className="hidden"
          />
          <Button
            onClick={handleExportAssets}
            variant="outline"
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          >
            Export List
          </Button>
          <Button
            onClick={() => setScannerOpen(true)}
            variant="outline"
            className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
          >
            <QrCode className="mr-2 h-4 w-4" /> Scanner
          </Button>
        </div>

        {/* ================= FILTER CARD ================= */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>
              <button
                onClick={() => setFilters({ search: '' })}
                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  className="pl-10 w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search assets by name, code..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                />
              </div>

              <select className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Locations</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              
              <select className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Status</option>
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
        {/* ================= ASSET GRID ================= */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Skeleton className="h-48 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="text-slate-400 dark:text-slate-500 mb-4">
              <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {assets.map(asset => (
              <div
                key={asset.id}
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group cursor-pointer"
              >
                {/* Image */}
                <div className="h-40 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 relative">
                  <AssetImage
                    src={asset.imageUrl ? `${asset.imageUrl}?t=${asset.updatedAt || 0}` : undefined}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    imgProps={{ sizes: '(max-width: 640px) 100vw, 25vw' }}
                  />
                  
                  {/* Status Badge - Top Right */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      asset.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' :
                      asset.status === 'maintenance' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200' :
                      asset.status === 'inactive' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {asset.status ? asset.status.toUpperCase() : 'UNKNOWN'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Code */}
                  <p className="text-xs uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider">
                    #{asset.code || asset.id.slice(0, 8)}
                  </p>

                  {/* Name */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                    {asset.name}
                  </h3>

                  {/* Category & Manufacturer */}
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {asset.category || '—'} • {asset.manufacturer || '—'}
                  </p>

                  {/* Location */}
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {asset.location || '—'}
                  </p>

                  {/* Maintenance Dates */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Last Maintenance</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{asset.lastMaintenance || '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Next Service</p>
                      <p className={`font-semibold ${
                        asset.maintenanceStatus === 'OVERDUE' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {asset.nextService || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Warranty Badge */}
                  {asset.warrantyStatus && (
                    <div className="pt-2">
                      <span className={`inline-block px-2.5 py-1 text-xs rounded-full font-semibold ${
                        asset.warrantyStatus === 'ACTIVE_WARRANTY'
                          ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200'
                          : asset.warrantyStatus === 'EXPIRING_SOON'
                          ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {asset.warrantyStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span>–
            <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalAssets)}</span> of <span className="font-semibold">{totalAssets}</span>
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }).slice(
              Math.max(0, currentPage - 2),
              Math.min(totalPages, currentPage + 3)
            ).map((_, i) => {
              const page = Math.max(1, currentPage - 1) + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                    currentPage === page
                      ? 'bg-blue-700 text-white'
                      : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
        )}
      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              addActivity({
                type: 'system',
                action: 'opened',
                title: 'Bulk Operations Accessed',
                description: 'User opened bulk asset operations interface',
                user: 'Current User',
                status: 'in_progress',
              });
              openBulkStatusModal();
            }}
            className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center group cursor-pointer">
            <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100">📦</div>
            <p className="font-semibold text-slate-900 dark:text-white">Bulk Operations</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update multiple assets</p>
          </button>
          <button 
            onClick={() => {
              addActivity({
                type: 'pm_scheduled',
                action: 'navigated',
                title: 'PM Scheduling Opened',
                description: 'User accessed preventive maintenance scheduling',
                user: 'Current User',
                status: 'in_progress',
              });
              navigate('/preventive-maintenance');
            }}
            className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center group cursor-pointer">
            <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100">📅</div>
            <p className="font-semibold text-slate-900 dark:text-white">Schedule PM</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Preventive maintenance</p>
          </button>
          <button 
            onClick={() => {
              addActivity({
                type: 'system',
                action: 'opened',
                title: 'Bulk Status Update Accessed',
                description: 'User opened bulk status update interface',
                user: 'Current User',
                status: 'in_progress',
              });
              openBulkStatusModal();
            }}
            className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center group cursor-pointer">
            <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100">🔄</div>
            <p className="font-semibold text-slate-900 dark:text-white">Update Status</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bulk status changes</p>
          </button>
          <button 
            onClick={() => {
              addActivity({
                type: 'report_generated',
                action: 'navigated',
                title: 'Asset Report Accessed',
                description: 'User generated asset analytics report',
                user: 'Current User',
                status: 'active',
              });
              navigate('/reports?type=assets');
            }}
            className="p-6 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-center group cursor-pointer">
            <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100">📊</div>
            <p className="font-semibold text-slate-900 dark:text-white">Generate Report</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Asset analytics</p>
          </button>
        </div>
      </div>

      {/* ================= SCANNER MODAL ================= */}
      <AssetQRScanner 
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onAssetScanned={handleScanResult}
      />

      {bulkStatusOpen && (
        <Modal>
          <div style={{ maxWidth: 520, padding: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Bulk Update Status</h3>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              This will update the status of {assets.length} assets on the current page.
            </p>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">New Status</label>
            <select
              className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="outline" onClick={() => setBulkStatusOpen(false)} disabled={bulkStatusSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleBulkStatusSubmit} disabled={bulkStatusSubmitting}>
                {bulkStatusSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </Modal>
      )}



    </div>
  );
}

/* =========================
   Reusable Components
========================= */
function StatCard({ icon, label, value }) {
  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-600 dark:text-slate-400 tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          </div>
          {icon && <div className="text-slate-300 dark:text-slate-600">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/* =========================
   Image Upload (Drag & Drop)
========================= */
function AssetImageUploader({ preview, onSelect, progress }) {
  const inputRef = useRef(null);

  const handleFile = file => {
    if (!file) return;
    onSelect(file, URL.createObjectURL(file));
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-lg p-6 text-center cursor-pointer transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current.click()}
      >
        <div className="text-slate-400">
          <Upload className="mx-auto mb-3 h-8 w-8" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Upload Image</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag & drop or click</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-slate-600 dark:text-slate-400">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}


