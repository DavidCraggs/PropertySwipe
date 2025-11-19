import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { RoleSelectionScreen } from './pages/RoleSelectionScreen';
import { LoginPage } from './pages/LoginPage';
import { RenterOnboarding } from './pages/RenterOnboarding';
import { LandlordOnboarding } from './pages/LandlordOnboarding';
import { AgencyOnboarding } from './pages/AgencyOnboarding';
import { SwipePage } from './pages/SwipePage';
import { LandlordDashboard } from './pages/LandlordDashboard';
import { AgencyDashboard } from './pages/AgencyDashboard';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminModeIndicator } from './components/AdminModeIndicator';
import { BottomNav } from './components/organisms/BottomNav';
import { ToastContainer, useToastStore } from './components/organisms/Toast';
import { useAuthStore } from './hooks/useAuthStore';
import { useAppStore } from './hooks/useAppStore';
import type { UserType } from './types';

type Route = 'welcome' | 'role-select' | 'login' | 'renter-onboarding' | 'landlord-onboarding' | 'agency-onboarding' | 'admin-login' | 'admin-dashboard' | 'app';
type AppPage = 'swipe' | 'matches' | 'profile';

/**
 * Main App component with authentication and routing
 * Handles public routes (welcome, onboarding) and protected routes (app pages)
 */
function App() {
  const { isAuthenticated, userType, currentUser, isAdminMode, impersonatedRole } = useAuthStore();
  const { addToast } = useToastStore();
  const { loadProperties } = useAppStore();

  const [currentRoute, setCurrentRoute] = useState<Route>('welcome');
  const [currentPage, setCurrentPage] = useState<AppPage>('swipe');
  const [selectedRole, setSelectedRole] = useState<UserType | null>(null);

  // Initialize admin profile on first load
  useEffect(() => {
    const initAdmin = async () => {
      const { initializeAdminProfile } = await import('./lib/adminStorage');
      await initializeAdminProfile();
    };
    initAdmin();
  }, []);

  // Load properties from storage on app initialization
  useEffect(() => {
    console.log('[App] Initializing - loading properties...');
    loadProperties().then(() => {
      console.log('[App] Properties loaded');
    }).catch((err) => {
      console.error('[App] Failed to load properties:', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Check URL hash or query parameter for direct admin access
  useEffect(() => {
    // Check hash-based routing (e.g., #/admin-login)
    const hash = window.location.hash.slice(1); // Remove '#'
    if (hash === '/admin-login' && !isAuthenticated) {
      setCurrentRoute('admin-login');
      return;
    }

    // Check URL parameter (e.g., ?admin=true or ?admin=login)
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    if ((adminParam === 'true' || adminParam === 'login') && !isAuthenticated) {
      setCurrentRoute('admin-login');
      // Clean URL by removing the parameter after routing
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, [isAuthenticated]);

  // Handle initial routing based on auth state
  useEffect(() => {
    // Admin routing
    if (isAdminMode) {
      if (!impersonatedRole) {
        setCurrentRoute('admin-dashboard');
      } else {
        setCurrentRoute('app');
      }
      return;
    }

    // Don't override admin-login route if user is trying to access admin
    if (currentRoute === 'admin-login') {
      return;
    }

    // Normal user routing
    if (isAuthenticated && currentUser && 'onboardingComplete' in currentUser && currentUser.onboardingComplete) {
      setCurrentRoute('app');
    } else if (isAuthenticated && currentUser && 'onboardingComplete' in currentUser && !currentUser.onboardingComplete) {
      // Route to appropriate onboarding based on user type
      let route: Route = 'renter-onboarding';
      if (userType === 'renter') {
        route = 'renter-onboarding';
      } else if (userType === 'landlord') {
        route = 'landlord-onboarding';
      } else if (userType === 'estate_agent' || userType === 'management_agency') {
        route = 'agency-onboarding';
      }
      setCurrentRoute(route);
    } else {
      // Check if user has visited before
      const hasVisited = localStorage.getItem('get-on-has-visited');
      if (hasVisited) {
        setCurrentRoute('role-select');
      } else {
        setCurrentRoute('welcome');
      }
    }
  }, [isAuthenticated, currentUser, userType, isAdminMode, impersonatedRole, currentRoute]);

  const handleGetStarted = () => {
    localStorage.setItem('get-on-has-visited', 'true');
    setCurrentRoute('role-select');
  };

  const handleSelectRole = (role: UserType) => {
    setSelectedRole(role);
    // Route to appropriate onboarding
    let route: Route = 'renter-onboarding';
    if (role === 'renter') {
      route = 'renter-onboarding';
    } else if (role === 'landlord') {
      route = 'landlord-onboarding';
    } else if (role === 'estate_agent' || role === 'management_agency') {
      route = 'agency-onboarding';
    }
    setCurrentRoute(route);
  };

  const handleOnboardingComplete = () => {
    setCurrentRoute('app');

    // Show celebration toast
    const isRenter = selectedRole === 'renter';
    const isAgency = selectedRole === 'estate_agent' || selectedRole === 'management_agency';
    addToast({
      type: 'success',
      title: isRenter ? 'Welcome!' : 'Account Created!',
      message: isRenter
        ? 'Start swiping to find your perfect rental'
        : isAgency
          ? 'Your agency profile is ready - start managing properties'
          : 'You can now connect with interested renters',
      duration: 5000,
    });
  };

  const renderRoute = () => {
    switch (currentRoute) {
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} onLogin={() => setCurrentRoute('login')} />;

      case 'role-select':
        return (
          <RoleSelectionScreen
            onSelectRole={handleSelectRole}
            onLogin={() => setCurrentRoute('login')}
            onBack={() => setCurrentRoute('welcome')}
          />
        );

      case 'login':
        return (
          <LoginPage
            onBack={() => setCurrentRoute('role-select')}
            onLoginSuccess={() => setCurrentRoute('app')}
          />
        );

      case 'admin-login':
        return <AdminLoginPage />;

      case 'admin-dashboard':
        return <AdminDashboard />;

      case 'renter-onboarding':
        return <RenterOnboarding onComplete={handleOnboardingComplete} onLogin={() => setCurrentRoute('login')} />;

      case 'landlord-onboarding':
        return <LandlordOnboarding onComplete={handleOnboardingComplete} onLogin={() => setCurrentRoute('login')} />;

      case 'agency-onboarding':
        return (
          <AgencyOnboarding
            onComplete={handleOnboardingComplete}
            onLogin={() => setCurrentRoute('login')}
            initialAgencyType={
              selectedRole === 'estate_agent' ? 'estate_agent' : 'management_agency'
            }
          />
        );

      case 'app':
        return (
          <>
            {isAdminMode && <AdminModeIndicator />}
            <div className={isAdminMode ? 'pt-12' : ''}>
              <AnimatePresence mode="wait">
                {currentPage === 'swipe' && (
                  <motion.div
                    key="swipe"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {userType === 'renter' ? (
                      <SwipePage />
                    ) : userType === 'estate_agent' || userType === 'management_agency' ? (
                      <AgencyDashboard />
                    ) : (
                      <LandlordDashboard />
                    )}
                  </motion.div>
                )}
                {currentPage === 'matches' && (
                  <motion.div
                    key="matches"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <MatchesPage />
                  </motion.div>
                )}
                {currentPage === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ProfilePage />
                  </motion.div>
                )}
              </AnimatePresence>
              <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
            </div>
          </>
        );

      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} onLogin={() => setCurrentRoute('login')} />;
    }
  };

  return (
    <>
      {renderRoute()}
      <ToastContainer />
    </>
  );
}

export default App;
