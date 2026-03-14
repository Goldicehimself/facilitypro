import React, { useState, useEffect } from "react";
import { Menu, LogOut, Settings, User, Search, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

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

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("mp_sidebar_collapsed");
    return saved === "true";
  });
  const [sidebarHover, setSidebarHover] = useState(false);
  const hoverTimeoutRef = React.useRef(null);
  const { user, logout } = useAuth();
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

  const getRoleDisplay = (role) => {
    const roles = {
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
              <span className="font-semibold text-slate-900 dark:text-white">FacilityPro</span>
            </div>

          </div>
        </div>

        {/* Center: Global Search */}
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
                <div className="px-4 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                  TODO: global search across all modules
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-3 relative">
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


