import React, { useState, useEffect } from "react";
import {
  AppWindow,
  BarChart3,
  BadgeDollarSign,
  Boxes,
  CalendarClock,
  ClipboardList,
  Clock3,
  Grid3X3,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plane,
  Search,
  Settings,
  Shield,
  User,
  UserCog,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../../contexts/AuthContext";
import { getWorkOrders } from "../../../api/workOrders";
import { getAssets } from "../../../api/assets";
import { fetchVendors } from "../../../api/vendors";
import { getOrgSettings } from "../../../api/org";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProtectedImage from "@/components/common/ProtectedImage";

import NavigationMenu from "../Navigation/NavigationMenu";
import NotificationDropdown from "../Notifications/NotificationDropdown";

const APP_LAUNCHER_ITEMS = [
  { name: 'Dashboard', description: 'Operational overview and KPIs', path: '/dashboard', category: 'Operations', icon: LayoutDashboard, roles: ['admin', 'facility_manager'] },
  { name: 'Work Orders', description: 'Create, assign, and track work', path: '/work-orders', category: 'Operations', icon: ClipboardList },
  { name: 'Service Requests', description: 'Report and follow up on issues', path: '/service-requests', category: 'Operations', icon: LifeBuoy },
  { name: 'Preventive Maintenance', description: 'Schedules, inspections, and compliance', path: '/preventive-maintenance', category: 'Operations', icon: CalendarClock, roles: ['admin', 'facility_manager'] },
  { name: 'Assets', description: 'Asset register and maintenance history', path: '/assets', category: 'Resources', icon: Boxes, roles: ['admin', 'facility_manager', 'technician'] },
  { name: 'Inventory', description: 'Parts, stock, and reorder levels', path: '/inventory', category: 'Resources', icon: Package, roles: ['admin', 'facility_manager', 'technician'] },
  { name: 'Vendors', description: 'Suppliers, contracts, and performance', path: '/vendors', category: 'Resources', icon: UsersRound, roles: ['admin', 'facility_manager', 'procurement'] },
  { name: 'Staff Management', description: 'Teams, roles, and performance', path: '/staff-management', category: 'People', icon: UserCog, roles: ['admin', 'facility_manager'] },
  { name: 'Leave Centre', description: 'Leave requests and approvals', path: '/leave-center', category: 'People', icon: Plane, roles: ['admin', 'facility_manager', 'staff'] },
  { name: 'Technician Portal', description: 'Assignments and technician metrics', path: '/technician-portal', category: 'People', icon: Wrench, roles: ['admin', 'technician'] },
  { name: 'Staff Portal', description: 'Staff requests and activity', path: '/staff-portal', category: 'People', icon: AppWindow, roles: ['staff'] },
  { name: 'Vendor Portal', description: 'Assigned work and vendor activity', path: '/vendor-portal', category: 'People', icon: UsersRound, roles: ['vendor'] },
  { name: 'Finance', description: 'Expenses, funds, and approvals', path: '/finance-portal', category: 'Business', icon: BadgeDollarSign, roles: ['admin', 'facility_manager', 'finance'] },
  { name: 'Reports', description: 'Operational and financial insights', path: '/reports', category: 'Business', icon: BarChart3, roles: ['admin', 'facility_manager', 'finance'] },
  { name: 'Messages', description: 'Team communication', path: '/messages', category: 'Communication', icon: MessageSquare, roles: ['admin', 'facility_manager'] },
  { name: 'Technician Messages', description: 'Technician communication', path: '/technician-messages', category: 'Communication', icon: MessageSquare, roles: ['technician'] },
  { name: 'Settings', description: 'Organization and security controls', path: '/settings', category: 'Administration', icon: Settings, roles: ['admin', 'facility_manager'] },
  { name: 'Super Admin', description: 'Organizations, plans, and licensing', path: '/super-admin', category: 'Administration', icon: Shield, roles: ['super_admin'] },
  { name: 'Help Centre', description: 'Guides and product support', path: '/help', category: 'Support', icon: HelpCircle },
];

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState({
    workOrders: [],
    assets: [],
    vendors: []
  });
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("mp_sidebar_collapsed");
    return saved === "true";
  });
  const [sidebarHover, setSidebarHover] = useState(false);
  const hoverTimeoutRef = React.useRef(null);
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const navigate = useNavigate();

  /* =========================
     Prevent background scroll on mobile
  ========================= */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [mobileOpen]);

  useEffect(() => {
    localStorage.setItem("mp_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (isSuperAdmin) {
      setGlobalSearchResults({ workOrders: [], assets: [], vendors: [] });
      setGlobalSearchLoading(false);
      return;
    }
    const query = globalSearch.trim();
    if (!query) {
      setGlobalSearchResults({ workOrders: [], assets: [], vendors: [] });
      setGlobalSearchLoading(false);
      return;
    }
    let cancelled = false;
    setGlobalSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [woRes, assetRes, vendorRes] = await Promise.all([
          getWorkOrders({ search: query, limit: 5, page: 1 }),
          getAssets({ search: query, limit: 5, page: 1 }),
          fetchVendors()
        ]);
        if (cancelled) return;
        const workOrders = Array.isArray(woRes) ? woRes : (woRes?.workOrders || woRes?.data || []);
        const assets = Array.isArray(assetRes?.data) ? assetRes.data : (assetRes?.assets || assetRes?.data || []);
        const vendorsRaw = Array.isArray(vendorRes) ? vendorRes : (vendorRes?.vendors || []);
        const vendors = vendorsRaw.filter((v) => {
          const name = (v?.name || '').toLowerCase();
          const email = (v?.email || '').toLowerCase();
          return name.includes(query.toLowerCase()) || email.includes(query.toLowerCase());
        }).slice(0, 5);
        setGlobalSearchResults({
          workOrders: workOrders.slice(0, 5),
          assets: assets.slice(0, 5),
          vendors
        });
      } catch (err) {
        if (!cancelled) {
          setGlobalSearchResults({ workOrders: [], assets: [], vendors: [] });
        }
      } finally {
        if (!cancelled) setGlobalSearchLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [globalSearch, isSuperAdmin]);

  useEffect(() => {
    let isMounted = true;
    const loadTrial = async () => {
      if (!['admin', 'facility_manager'].includes(user?.role)) {
        if (isMounted) setTrialDaysRemaining(null);
        return;
      }
      try {
        const response = await getOrgSettings();
        const settings = response?.settings || response || {};
        const billing = settings?.billing || {};
        const trialEndsAt = billing?.trialEndsAt;
        const status = billing?.status || 'trialing';
        if (!trialEndsAt || status !== 'trialing') {
          if (isMounted) setTrialDaysRemaining(null);
          return;
        }
        const diffMs = new Date(trialEndsAt).getTime() - Date.now();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (days < 0) {
          if (isMounted) setTrialDaysRemaining(null);
          return;
        }
        if (isMounted) setTrialDaysRemaining(days);
      } catch (e) {
        if (isMounted) setTrialDaysRemaining(null);
      }
    };
    loadTrial();
    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  const getRoleDisplay = (role) => {
    const roles = {
      super_admin: "Super Admin",
      facility_manager: "Facility Manager",
      technician: "Maintenance Technician",
      vendor: "Vendor",
      staff: "Staff Member",
      finance: "Finance Officer",
      admin: "Administrator",
    };
    return roles[role] || role;
  };

  const runGlobalSearch = (path) => {
    const query = globalSearch.trim();
    if (!query) return;
    const params = new URLSearchParams({ search: query }).toString();
    navigate(`${path}?${params}`);
    setGlobalSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ================= HEADER ================= */}
      <header
        className={`
          mp-header
          sticky top-0 z-50 h-16
          flex items-center justify-between
          px-4 md:px-6
          border-b border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-950
          ${sidebarCollapsed && !sidebarHover ? "md:ml-20" : "md:ml-72"}
        `}
        style={{ fontFamily: '"Space Grotesk", "IBM Plex Sans", "Segoe UI", sans-serif' }}
      >

        {/* Left: Mobile menu + Brand */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-md flex items-center justify-center text-white"
                style={{ backgroundColor: "var(--mp-brand)" }}
              >
                <Wrench size={18} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-slate-900 dark:text-white">FacilityPro</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Management System</span>
              </div>
            </div>

          </div>
        </div>

        {/* Center: Global Search */}
        {!isSuperAdmin && (
        <div className="hidden lg:flex flex-1 justify-center px-6">
          <div
            className="relative w-full max-w-xl"
            onFocus={() => setGlobalSearchOpen(true)}
            onBlur={() => setTimeout(() => setGlobalSearchOpen(false), 120)}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runGlobalSearch("/work-orders");
              }}
            >
              <input
                type="search"
                placeholder="Search work orders, assets, vendors..."
                className="w-full h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 focus:border-slate-300 dark:focus:border-slate-600"
                aria-label="Global search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </form>

            {globalSearchOpen && globalSearch.trim() && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                  Global results for "{globalSearch}"
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runGlobalSearch("/work-orders")}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  Search Work Orders
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runGlobalSearch("/assets")}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  Search Assets
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runGlobalSearch("/vendors")}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  Search Vendors
                </button>

                <div className="border-t border-slate-200" />

                {globalSearchLoading ? (
                  <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    <SearchSection
                      title="Work Orders"
                      items={globalSearchResults.workOrders.map((wo) => ({
                        id: wo.id,
                        label: `${wo.woNumber || wo.id} • ${wo.title || wo.description || 'Work order'}`,
                        sub: wo.status || '—',
                        path: `/work-orders/${wo.id}`
                      }))}
                      onSelect={(path) => navigate(path)}
                    />
                    <SearchSection
                      title="Assets"
                      items={globalSearchResults.assets.map((asset) => ({
                        id: asset.id,
                        label: asset.name || asset.assetName || 'Asset',
                        sub: asset.category || asset.status || '—',
                        path: `/assets/${asset.id}`
                      }))}
                      onSelect={(path) => navigate(path)}
                    />
                    <SearchSection
                      title="Vendors"
                      items={globalSearchResults.vendors.map((vendor) => ({
                        id: vendor.id,
                        label: vendor.name || 'Vendor',
                        sub: vendor.email || vendor.phone || '—',
                        path: `/vendors/${vendor.id}`
                      }))}
                      onSelect={(path) => navigate(path)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        )}

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3 relative">
          {trialDaysRemaining !== null && (
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {trialDaysRemaining === 0
                ? 'Trial ends today'
                : `Trial: ${trialDaysRemaining} days left`}
            </div>
          )}
          <AppLauncher userRole={user?.role} navigate={navigate} />
          {/* Notifications */}
          <NotificationDropdown />

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px bg-slate-300" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-slate-100 transition text-slate-900"
              >
                <Avatar className="h-8 w-8 border-2 border-white bg-white shadow-sm overflow-hidden">
                  <ProtectedImage
                    src={user?.avatar}
                    alt={user?.name || "User avatar"}
                    cacheKey={user?.updatedAt || user?.avatarUpdatedAt || ''}
                    className="h-full w-full object-cover rounded-full"
                    fallback="/avatar-placeholder.svg"
                  />
                  <AvatarFallback className="bg-slate-200 font-semibold text-xs text-slate-700">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    {user?.name || "User"}
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {getRoleDisplay(user?.role)}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60"
              PaperProps={{
                className: "rounded-xl border border-slate-200 shadow-xl",
                sx: { mt: 1.25 }
              }}
            >
              {/* User Info */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200 bg-blue-50 overflow-hidden">
                    <ProtectedImage
                      src={user?.avatar}
                      alt={user?.name || "User avatar"}
                      cacheKey={user?.updatedAt || user?.avatarUpdatedAt || ''}
                      className="h-full w-full object-cover rounded-full"
                      fallback="/avatar-placeholder.svg"
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || getRoleDisplay(user?.role)}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="cursor-pointer gap-2 text-slate-700"
              >
                <User className="h-4 w-4 text-slate-500" />
                My Profile
              </DropdownMenuItem>

              {['admin', 'facility_manager'].includes(user?.role) && (
                <DropdownMenuItem
                  onClick={() => navigate("/settings")}
                  className="cursor-pointer gap-2 text-slate-700"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  Settings
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  logout();
                }}
                className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed left-0 top-0 z-40
          h-screen
          bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm
          overflow-y-auto
          transition-all duration-300
          ${sidebarCollapsed && !sidebarHover ? "w-20" : "w-[85%] sm:w-72"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        onMouseEnter={() => {
          if (!sidebarCollapsed) return;
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setSidebarHover(true);
        }}
        onMouseLeave={() => {
          if (!sidebarCollapsed) return;
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = setTimeout(() => {
            setSidebarHover(false);
            hoverTimeoutRef.current = null;
          }, 150);
        }}
      >
        <NavigationMenu
          onCloseMobile={() => setMobileOpen(false)}
          collapsed={sidebarCollapsed && !sidebarHover}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ================= MAIN ================= */}
      <main className={`p-4 md:p-6 ${sidebarCollapsed && !sidebarHover ? "md:ml-20" : "md:ml-72"}`}>
        <div className="mp-mobile-surface">
          {children}
        </div>
      </main>

    </div>
  );
};

export default MainLayout;

function AppLauncher({ userRole, navigate }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentPaths, setRecentPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mp_recent_apps') || '[]');
    } catch {
      return [];
    }
  });
  const launcherRef = React.useRef(null);

  const visibleApps = APP_LAUNCHER_ITEMS.filter((app) => !app.roles || app.roles.includes(userRole));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredApps = normalizedQuery
    ? visibleApps.filter((app) => `${app.name} ${app.description} ${app.category}`.toLowerCase().includes(normalizedQuery))
    : visibleApps;
  const categories = [...new Set(filteredApps.map((app) => app.category))];
  const recentApps = recentPaths
    .map((path) => visibleApps.find((app) => app.path === path))
    .filter(Boolean)
    .slice(0, 3);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!launcherRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const openApp = (app) => {
    const nextRecent = [app.path, ...recentPaths.filter((path) => path !== app.path)].slice(0, 5);
    setRecentPaths(nextRecent);
    localStorage.setItem('mp_recent_apps', JSON.stringify(nextRecent));
    setOpen(false);
    setQuery('');
    navigate(app.path);
  };

  return (
    <div className="relative" ref={launcherRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 ${open ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : ''}`}
        aria-label="Open app launcher"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Grid3X3 className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-slate-950/20 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="FacilityPro applications"
              className="fixed inset-x-3 bottom-3 top-20 z-[70] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:absolute md:inset-auto md:right-0 md:top-12 md:h-auto md:max-h-[76vh] md:w-[430px] md:rounded-2xl"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Applications</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your FacilityPro workspace</p>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setOpen(false)} aria-label="Close app launcher">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find an application..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-slate-600 dark:focus:ring-slate-700"
                  />
                </div>
              </div>

              <div className="app-launcher-scroll flex-1 overflow-y-auto p-4">
                {!normalizedQuery && recentApps.length > 0 && (
                  <section className="mb-5" aria-labelledby="recent-apps-heading">
                    <div id="recent-apps-heading" className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" /> Recent
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {recentApps.map((app) => (
                        <button key={app.path} type="button" onClick={() => openApp(app)} className="rounded-xl border border-slate-200 px-2 py-2.5 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800">
                          <app.icon className="mx-auto h-4 w-4 text-[var(--mp-brand)]" />
                          <span className="mt-1 block truncate text-xs font-semibold">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {filteredApps.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center text-center">
                    <Search className="h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold">No application found</p>
                    <p className="mt-1 text-xs text-slate-500">Try another module or category name.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {categories.map((category) => (
                      <section key={category} aria-labelledby={`launcher-${category}`}>
                        <h3 id={`launcher-${category}`} className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{category}</h3>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {filteredApps.filter((app) => app.category === category).map((app, index) => (
                            <motion.button
                              key={app.path}
                              type="button"
                              onClick={() => openApp(app)}
                              className="group flex min-w-0 items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:border-blue-300 focus-visible:bg-blue-50 focus-visible:outline-none dark:hover:border-slate-700 dark:hover:bg-slate-800"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(index * 0.025, 0.15) }}
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[var(--mp-brand)] transition-transform group-hover:scale-105 dark:bg-slate-800 dark:text-blue-300">
                                <app.icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{app.name}</span>
                                <span className="mt-0.5 block text-xs leading-4 text-slate-500 dark:text-slate-400">{app.description}</span>
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchSection({ title, items, onSelect }) {
  return (
    <div className="px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-slate-500">No results</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(item.path)}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-slate-50"
            >
              <div className="text-sm text-slate-900">{item.label}</div>
              <div className="text-xs text-slate-500">{item.sub}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


