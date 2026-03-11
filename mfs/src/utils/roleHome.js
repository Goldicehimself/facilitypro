export const getHomeRoute = (role) => {
  switch (role) {
    case 'facility_manager':
    case 'admin':
      return '/dashboard';
    case 'technician':
      return '/technician-portal';
    case 'vendor':
      return '/vendor-portal';
    case 'finance':
      return '/finance-portal';
    case 'staff':
      return '/staff-portal';
    default:
      return '/dashboard';
  }
};
