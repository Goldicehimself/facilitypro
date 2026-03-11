import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { InvitationProvider } from './contexts/InvitationContext';
import AppRoutes from './routes.jsx';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ActivityProvider>
          <InvitationProvider>
            <AppRoutes />
          </InvitationProvider>
        </ActivityProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;