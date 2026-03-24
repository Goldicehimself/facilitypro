import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { fetchVendors, fetchVendorAnalytics } from '../../api/vendors';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PerformanceMetrics from '@/components/vendors/PerformanceMetrics';
import VendorList from '@/components/vendors/VendorList';
import { Skeleton } from '@/components/ui/skeleton';

const VendorsPage = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'facility_manager'].includes(user?.role);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data: vendorsResponse = [], isLoading } = useQuery('vendors', fetchVendors);
  const { data: vendorAnalytics } = useQuery(['vendor-analytics', 30], () => fetchVendorAnalytics(30));
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) setHasLoaded(true);
  }, [isLoading]);

  const vendors = useMemo(() => {
    const list = Array.isArray(vendorsResponse)
      ? vendorsResponse
      : Array.isArray(vendorsResponse?.vendors)
        ? vendorsResponse.vendors
        : [];
    const now = new Date();
    return list.map((vendor) => {
      const start = vendor.contractStartDate ? new Date(vendor.contractStartDate) : null;
      const end = vendor.contractEndDate ? new Date(vendor.contractEndDate) : null;
      let contractStatus = 'Active';
      if (start && start > now) contractStatus = 'Pending';
      if (end && end < now) contractStatus = 'Expired';
      if (!start && !end && vendor.status && vendor.status !== 'active') {
        contractStatus = 'Inactive';
      }
      const lastService = vendor.lastServiceDate
        ? new Date(vendor.lastServiceDate).toLocaleDateString()
        : '—';
      return {
        ...vendor,
        contractStatus,
        lastService,
        monthlySpend: typeof vendor.monthlySpend === 'number' ? vendor.monthlySpend : 0,
        rating: typeof vendor.rating === 'number' ? vendor.rating : 0
      };
    });
  }, [vendorsResponse]);

  // Categories from vendors data
  const categories = useMemo(() => {
    const cats = ['All Categories'];
    const uniqueCats = new Set(vendors.map((v) => v.category));
    return [...cats, ...Array.from(uniqueCats).sort()];
  }, [vendors]);

  // Filter and sort vendors
  const filteredVendors = useMemo(() => {
    let result = vendors;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(search) ||
          v.email.toLowerCase().includes(search) ||
          v.phone.includes(search)
      );
    }

    // Filter by category
    if (selectedCategory !== 'All Categories') {
      result = result.filter((v) => v.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'rating') {
      result = result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'spend') {
      result = result.sort((a, b) => b.monthlySpend - a.monthlySpend);
    } else {
      result = result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [vendors, searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, sortBy, pageSize, vendors.length]);

  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchTerm(searchParam);
      setPage(1);
    }
  }, [searchParams]);

  const totalItems = filteredVendors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedVendors = filteredVendors.slice(startIndex, startIndex + pageSize);

  // Calculate KPI stats
  const stats = useMemo(() => {
    const summary = vendorAnalytics?.summary;
    if (summary) {
      return summary;
    }
    return {
      totalVendors: vendors.length,
      activeContracts: vendors.reduce((sum, v) => sum + (v.contractStatus === 'Active' ? 1 : 0), 0),
      averageRating: vendors.length > 0 
        ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length)
        : 0,
      monthlySpend: vendors.reduce((sum, v) => sum + v.monthlySpend, 0),
      totalVendorsTrend: 0,
      activeContractsTrend: 0,
      averageRatingTrend: 0,
      monthlySpendTrend: 0
    };
  }, [vendors, vendorAnalytics]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
              Vendors Management
            </h1>
            <p className="text-indigo-700 dark:text-indigo-300 mt-1">
              Manage vendor directory, contracts, and performance metrics
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-200 dark:hover:bg-indigo-900/30"
                onClick={() => navigate('/vendors/import')}
              >
                Import
              </Button>
              <Button
                className="bg-blue-700 text-white hover:bg-blue-800"
                onClick={() => navigate('/vendors/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {isLoading && !hasLoaded ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="border-0 shadow-md">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <PerformanceMetrics stats={stats} />
      )}

      {/* Search and Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Category Filters */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-700 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="ml-auto px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="spend">Sort by Spend</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      {isLoading && !hasLoaded ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <VendorList
          vendors={paginatedVendors}
          page={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onView={(vendor) => navigate(`/vendors/${vendor.id}`)}
          onEdit={(vendor) => navigate(`/vendors/${vendor.id}/edit`)}
          canManage={canManage}
        />
      )}
    </div>
  );
};

export default VendorsPage;




