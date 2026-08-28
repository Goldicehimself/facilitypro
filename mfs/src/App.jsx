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
  const [initialRouteReady, setInitialRouteReady] = React.useState(false);

  React.useEffect(() => {
    if (loading) return undefined;
    const timer = setTimeout(() => setInitialSplashComplete(true), 850);
    return () => clearTimeout(timer);
  }, [loading]);

  const showSplash = loading || workspacePreparing || !initialSplashComplete || !initialRouteReady;

  return (
    <>
      {!loading && (
        <NotificationProvider>
          <ActivityProvider>
            <InvitationProvider>
              <AppRoutes
                initialRouteReady={initialRouteReady}
                onInitialRouteReady={() => setInitialRouteReady(true)}
              />
            </InvitationProvider>
          </ActivityProvider>
        </NotificationProvider>
      )}
      <AnimatePresence mode="wait">
        {showSplash && (
          <WorkspaceSplash
            key="workspace-splash"
            message={workspacePreparing ? 'Preparing your workspace' : 'Loading FacilityPro'}
          />
        )}
      </AnimatePresence>
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
