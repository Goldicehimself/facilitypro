// components/InventoryDashboard.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Settings,
  MoreVertical,
  Edit,
  Eye
} from 'lucide-react';
import { getInventoryItems, getInventorySummary, updateInventoryItem } from '../../api/inventory';

const Inventory = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data } = useQuery(
    ['inventory', { currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, locationFilter }],
    () => getInventoryItems({
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      location: locationFilter === 'all' ? undefined : locationFilter,
    })
  );
  const { data: summaryData } = useQuery(['inventorySummary'], () => getInventorySummary());

  const inventoryItems = Array.isArray(data?.items) ? data.items : (data?.data || []);
  const pagination = data?.pagination || { total: inventoryItems.length, totalPages: 1 };
  const summary = summaryData?.summary || data?.summary || {};

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))];
    return uniqueCategories;
  }, [inventoryItems]);

  const locations = useMemo(() => {
    const uniqueLocations = [...new Set(inventoryItems.map(item => item.location).filter(Boolean))];
    return uniqueLocations;
  }, [inventoryItems]);

  const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, locationFilter, itemsPerPage]);

  const updateMutation = useMutation(({ id, payload }) => updateInventoryItem(id, payload), {
    onSuccess: () => {
      queryClient.invalidateQueries('inventory');
    }
  });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditForm({
      item: item.item,
      partNumber: item.partNumber,
      category: item.category,
      location: item.location,
      currentStock: item.currentStock,
      reorderPoint: item.reorderPoint,
      unitCost: item.unitCost,
    });
    setEditModalOpen(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    await updateMutation.mutateAsync({
      id: selectedItem.id,
      payload: {
        item: editForm.item || selectedItem.item,
        partNumber: editForm.partNumber || selectedItem.partNumber,
        category: editForm.category || selectedItem.category,
        location: editForm.location || selectedItem.location,
        currentStock: Number(editForm.currentStock) || 0,
        reorderPoint: Number(editForm.reorderPoint) || 0,
        unitCost: Number(editForm.unitCost) || 0,
      }
    });
    handleCloseModals();
  };

  const handleCloseModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setSelectedItem(null);
    setEditForm({});
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'low-stock':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'out-of-stock':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">Inventory Management</h1>
        <p className="text-indigo-700 dark:text-indigo-300 mt-1">Manage parts and supplies inventory with real-time stock tracking.</p>
      </div>

      <div className="space-y-6">
        {/* Dashboard Navigation */}
        <div className="flex flex-wrap gap-4 mb-8">
          {[
            { label: 'Work Orders', path: '/work-orders' },
            { label: 'Inventory', path: '/inventory' },
            { label: 'Assets', path: '/assets' },
            { label: 'Reports', path: '/reports' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg font-medium cursor-pointer transition-all duration-200 ${
                item.label === 'Inventory'
                  ? 'bg-blue-700 text-white shadow-md hover:bg-blue-800 hover:shadow-lg active:scale-95'
                  : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-300 hover:border-indigo-400 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:border-indigo-400 active:scale-95'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border dark:bg-zinc-900 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-zinc-400">Total Items</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{pagination.total || 0}</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border dark:bg-zinc-900 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-zinc-400">In Stock</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{summary['in-stock'] || 0}</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border dark:bg-zinc-900 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <span className="text-sm text-gray-500 dark:text-zinc-400">Low Stock</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{summary['low-stock'] || 0}</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border dark:bg-zinc-900 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-sm text-gray-500 dark:text-zinc-400">Out of Stock</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-zinc-100">{summary['out-of-stock'] || 0}</h3>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border dark:bg-zinc-900 dark:border-zinc-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="all">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <button className="p-2 border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-400 cursor-pointer transition-all duration-200 active:scale-95">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <p className="text-gray-600 dark:text-zinc-400 mb-2 sm:mb-0">
              Showing {pagination.total === 0 ? 0 : startIndex + 1}-{startIndex + inventoryItems.length} of {pagination.total} items
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-zinc-400">Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-zinc-900">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Item</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Current Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Reorder Point</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Usage (30d)</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-zinc-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="border-b dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-zinc-100">{item.item}</div>
                        <div className="text-sm text-gray-500 dark:text-zinc-400">Part #: {item.partNumber}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 dark:text-zinc-300">{item.location}</td>
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-zinc-100">{item.currentStock}</td>
                    <td className="py-4 px-4 text-gray-700 dark:text-zinc-300">{item.reorderPoint}</td>
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-zinc-100">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-gray-700 dark:text-zinc-300">
                      {typeof item.usage30d === 'number' ? `${item.usage30d} units` : (item.usage30d || 'â€”')}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded cursor-pointer transition-all duration-200 active:scale-95"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                        </button>
                        <button
                          onClick={() => handleView(item)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded cursor-pointer transition-all duration-200 active:scale-95"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t dark:border-zinc-700">
            <p className="text-gray-600 dark:text-zinc-400">Rows per page: {itemsPerPage} v</p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 active:scale-95"
              >
                &lt; Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 border rounded cursor-pointer transition-all duration-200 ${
                      currentPage === pageNum
                        ? 'bg-blue-700 text-white border-indigo-600'
                        : 'bg-white border-gray-300 dark:bg-zinc-900 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-400 active:scale-95'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`px-3 py-1 border rounded cursor-pointer transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'bg-blue-700 text-white border-indigo-600'
                        : 'bg-white border-gray-300 dark:bg-zinc-900 dark:border-zinc-700 text-gray-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-400 active:scale-95'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-indigo-50 dark:hover:bg-zinc-800 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 active:scale-95"
              >
                Next &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;



