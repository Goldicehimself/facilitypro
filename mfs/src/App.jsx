import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ActivityProvider } from './contexts/ActivityContext';
import { InvitationProvider } from './contexts/InvitationContext';
import AppRoutes from './routes.jsx';
import WorkspaceSplash from './components/common/Loading/WorkspaceSplash';

function AuthenticatedApp() {
  const { loading, workspacePreparing } = useAuth();
  const [initialSplashComplete, setInitialSplashComplete] = React.useState(false);

  React.useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => setInitialSplashComplete(true), 850);
    return () => clearTimeout(timer);
  }, [loading]);

  const showSplash = loading || workspacePreparing || !initialSplashComplete;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <WorkspaceSplash
            key="workspace-splash"
            message={workspacePreparing ? 'Preparing your workspace' : 'Loading FacilityPro'}
          />
        )}
      </AnimatePresence>
      {!showSplash && (
        <NotificationProvider>
          <ActivityProvider>
            <InvitationProvider>
              <AppRoutes />
            </InvitationProvider>
          </ActivityProvider>
        </NotificationProvider>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
