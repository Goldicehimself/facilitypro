import React from 'react';
import { Edit2, Eye, MoreVertical, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const getStatusColor = (status) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
    case 'Expired':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100';
  }
};

const getCategoryColor = (category) => {
  const colors = {
    HVAC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    Electrical: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    Plumbing: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
    Cleaning: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    Security: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100',
    General: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  };
  return colors[category] || colors.General;
};

const getRatingColor = (rating) => {
  if (rating >= 4.7) return 'text-emerald-600 dark:text-emerald-400';
  if (rating >= 4.3) return 'text-blue-600 dark:text-blue-400';
  if (rating >= 4.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

const VendorList = ({
  vendors,
  onView,
  onEdit,
  canManage = false,
  page = 1,
  pageSize = 5,
  totalItems = vendors.length,
  totalPages = Math.max(1, Math.ceil(totalItems / pageSize)),
  onPageChange,
  onPageSizeChange,
}) => {
  if (!vendors.length) {
    return (
      <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-10 text-center text-zinc-500 dark:text-zinc-400">
        No vendors match the current filters.
      </div>
    );
  }

  return (
    <div className="border-0 shadow-md overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Contract Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Last Service
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {vendors.map((vendor) => (
              <tr
                key={vendor.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900 rounded-lg text-lg">
                      {vendor.avatar || vendor.name?.[0] || 'V'}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {vendor.name}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {vendor.email}
                      </p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        {vendor.phone}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={`${getCategoryColor(vendor.category)} border-0`}>
                    {vendor.category}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold ${getRatingColor(vendor.rating)}`}>
                      {vendor.rating}
                    </span>
                    <Star className="h-4 w-4 text-amber-500" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={`${getStatusColor(vendor.contractStatus)} border-0`}>
                    {vendor.contractStatus}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {vendor.lastService}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(vendor)}
                      className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {canManage && (
                      <button
                        onClick={() => onEdit(vendor)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="More"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {Math.min((page - 1) * pageSize + 1, totalItems)}-
          {Math.min(page * pageSize, totalItems)} of {totalItems} vendors
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            className="px-3 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-700 dark:text-zinc-300"
          >
            {[5, 10, 20].map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              className="px-3 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"
              disabled={page <= 1}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange?.(pageNumber)}
                  className={`px-3 py-1 rounded border text-sm font-medium ${
                    pageNumber === page
                      ? 'border-indigo-600 bg-blue-700 text-white'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 5 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">...</span>
            )}
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              className="px-3 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium disabled:opacity-50"
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorList;

