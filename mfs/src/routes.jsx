import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { getHomeRoute } from './utils/roleHome';

// Layout Components
const MainLayout = lazy(() => import('./components/common/Layout/MainLayout'));
const AuthLayout = lazy(() => import('./components/common/Layout/AuthLayout'));

// Auth Pages
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const VerifyOrgEmail = lazy(() => import('./pages/Auth/VerifyOrgEmail'));
const VerifyUserEmail = lazy(() => import('./pages/Auth/VerifyUserEmail'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));

// Landing / Public pages
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const Pricing = lazy(() => import('./pages/Pricing/Pricing'));
const Demo = lazy(() => import('./pages/Demo/Demo'));

// Main Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Assets = lazy(() => import('./pages/Assets/Assets'));
const AssetDetail = lazy(() => import('./pages/Assets/AssetDetail'));
const AssetForm = lazy(() => import('./components/assets/AssetForm'));
const WorkOrders = lazy(() => import('./pages/WorkOrders/WorkOrders'));
const MyAssignments = lazy(() => import('./pages/WorkOrders/MyAssignments'));
const WorkOrderDetailView = lazy(() => import('./pages/WorkOrders/WorkOrderDetailView'));
const WorkOrderCreate = lazy(() => import('./pages/WorkOrders/WorkOrderCreate'));
const PreventiveMaintenance = lazy(() => import('./pages/PreventiveMaintenance/PreventiveMaintenance'));
const PMTaskCreate = lazy(() => import('./pages/PreventiveMaintenance/PMTaskCreate'));
const PMCompliance = lazy(() => import('./pages/PreventiveMaintenance/PMCompliance'));
const PMOverdue = lazy(() => import('./pages/PreventiveMaintenance/PMOverdue'));
const PMScheduleInspection = lazy(() => import('./pages/PreventiveMaintenance/PMScheduleInspection'));
const Vendors = lazy(() => import('./pages/Vendors/Vendors'));
const VendorForm = lazy(() => import('./pages/Vendors/VendorForm'));
const VendorImport = lazy(() => import('./pages/Vendors/VendorImport'));
const VendorPortal = lazy(() => import('./pages/Vendors/VendorPortal'));
const TechnicianPortal = lazy(() => import('./pages/Technicians/TechnicianPortal'));
const StaffPortal = lazy(() => import('./pages/Staff/StaffPortal'));
const StaffManagement = lazy(() => import('./pages/Staff/StaffManagement'));
const LeaveCenter = lazy(() => import('./pages/Staff/LeaveCenter'));
const FinancePortal = lazy(() => import('./pages/Finance/FinancePortal'));
const ServiceRequests = lazy(() => import('./pages/ServiceRequests/ServiceRequests'));
const ServiceRequestForm = lazy(() => import('./pages/ServiceRequests/ServiceRequestForm'));
const Inventory = lazy(() => import('./pages/Inventory/Inventory'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Profile = lazy(() => import('./pages/Settings/Profile'));
const Help = lazy(() => import('./pages/Help/Help'));
const PublicHelp = lazy(() => import('./pages/Help/PublicHelp'));
const Messages = lazy(() => import('./pages/Messages/Messages'));
const TechnicianMessages = lazy(() => import('./pages/Messages/TechnicianMessages'));

// Role-based route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

const UnauthorizedPage = () => {
  const { user } = useAuth();
  const homeRoute = getHomeRoute(user?.role);

  return (
    <AuthLayout>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>You don't have permission to access this page.</p>
        <button
          onClick={() => window.location.href = homeRoute}
          style={{ padding: '0.75rem 1.5rem', backgroundColor: '#4F46E5', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem', border: 'none' }}
        >
          Go to Home
        </button>
      </div>
    </AuthLayout>
  );
};

const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div>Loading...</div>
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
        <Route path="/verify-org-email" element={<VerifyOrgEmail />} />
        <Route path="/verify-user-email" element={<VerifyUserEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/help-center" element={<PublicHelp />} />

        {/* Protected Routes (dashboard accessible at /dashboard) */}
        
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
            <MainLayout><Dashboard /></MainLayout>
          </ProtectedRoute>
        } />
      
      <Route path="/assets" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "technician"]}>
          <MainLayout><Assets /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/assets/new" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><AssetForm /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/assets/:id/edit" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><AssetForm /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/assets/:id" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "technician"]}>
          <MainLayout><AssetDetail /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/work-orders" element={
        <ProtectedRoute>
          <MainLayout><WorkOrders /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/work-orders/new" element={
        <ProtectedRoute>
          <MainLayout><WorkOrderCreate /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/work-orders/my-assignments" element={
        <ProtectedRoute>
          <MainLayout><MyAssignments /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/work-orders/:id" element={
        <ProtectedRoute>
          <MainLayout><WorkOrderDetailView /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/preventive-maintenance" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><PreventiveMaintenance /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/preventive-maintenance/new" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><PMTaskCreate /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/preventive-maintenance/compliance" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><PMCompliance /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/preventive-maintenance/schedule" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><PMScheduleInspection /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/preventive-maintenance/overdue" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><PMOverdue /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendors" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "procurement"]}>
          <MainLayout><Vendors /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendors/new" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "procurement"]}>
          <MainLayout><VendorForm /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendors/:id/edit" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "procurement"]}>
          <MainLayout><VendorForm /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/vendors/:id" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "procurement"]}>
          <MainLayout><VendorForm /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendors/import" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "procurement"]}>
          <MainLayout><VendorImport /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/vendor-portal" element={
        <ProtectedRoute allowedRoles={["vendor"]}>
          <MainLayout><VendorPortal /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/technician-portal" element={
        <ProtectedRoute allowedRoles={["technician", "admin"]}>
          <MainLayout><TechnicianPortal /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/staff-portal" element={
        <ProtectedRoute allowedRoles={["staff"]}>
          <MainLayout><StaffPortal /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/staff-management" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><StaffManagement /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/leave-center" element={
        <ProtectedRoute allowedRoles={["staff", "facility_manager", "admin"]}>
          <MainLayout><LeaveCenter /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/finance-portal" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "finance"]}>
          <MainLayout><FinancePortal /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/service-requests" element={
        <ProtectedRoute>
          <MainLayout><ServiceRequests /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/service-requests/new" element={
        <ProtectedRoute>
          <MainLayout><ServiceRequestForm /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "technician"]}>
          <MainLayout><Inventory /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reports" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin", "finance"]}>
          <MainLayout><Reports /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><Settings /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout><Profile /></MainLayout>
        </ProtectedRoute>
      } />


      <Route path="/help" element={
        <ProtectedRoute>
          <MainLayout><Help /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/messages" element={
        <ProtectedRoute allowedRoles={["facility_manager", "admin"]}>
          <MainLayout><Messages /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/technician-messages" element={
        <ProtectedRoute allowedRoles={["technician"]}>
          <MainLayout><TechnicianMessages /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
